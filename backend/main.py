from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os
import yt_dlp
import uuid
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DOWNLOADS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../downloads'))
os.makedirs(DOWNLOADS_DIR, exist_ok=True)
app.mount("/downloads", StaticFiles(directory=DOWNLOADS_DIR), name="downloads")

@app.post("/download")
async def download_youtube_links(
    links: str = Form(...),
    folder_name: str = Form(None)
):
    # Extract all YouTube links from the input using regex
    link_list = re.findall(
        r'(https?://(?:www\.)?(?:youtube\.com|youtu\.be)[^\s,]*)',
        links
    )
    # Use user-provided folder name or generate a UUID
    if folder_name and folder_name.strip():
        safe_folder = re.sub(r'[^\w\- ]', '', folder_name.strip())
        batch_id = safe_folder or str(uuid.uuid4())
    else:
        batch_id = str(uuid.uuid4())
    batch_folder = os.path.join(DOWNLOADS_DIR, batch_id)
    os.makedirs(batch_folder, exist_ok=True)

    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': os.path.join(batch_folder, '%(title)s.%(ext)s'),
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'quiet': True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        for link in link_list:
            try:
                ydl.download([link])
            except Exception as e:
                print(f"Error downloading {link}: {e}")

    files = os.listdir(batch_folder)
    return JSONResponse({"batch_id": batch_id, "files": files}) 