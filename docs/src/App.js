import React, { useState } from 'react';

function App() {
  const [links, setLinks] = useState('');
  const [folderName, setFolderName] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDownloading(true);
    setError('');
    setFiles([]);
    try {
      const formData = new FormData();
      formData.append('links', links);
      if (folderName.trim()) formData.append('folder_name', folderName);
      const response = await fetch('http://localhost:8000/download', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Download failed');
      const data = await response.json();
      setFiles(data.files.map(f => ({
        name: f,
        url: `/downloads/${data.batch_id}/${encodeURIComponent(f)}`
      })));
    } catch (err) {
      setError(err.message);
    }
    setDownloading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>YouTube to MP3 Downloader</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="links">Paste YouTube links (any format, with or without separators):</label><br />
        <textarea
          id="links"
          rows={8}
          style={{ width: '100%', margin: '10px 0' }}
          value={links}
          onChange={e => setLinks(e.target.value)}
          required
        /><br />
        <label htmlFor="folderName">Optional folder name:</label><br />
        <input
          id="folderName"
          type="text"
          style={{ width: '100%', margin: '10px 0', padding: '6px' }}
          value={folderName}
          onChange={e => setFolderName(e.target.value)}
          placeholder="Leave blank for random folder"
        /><br />
        <button type="submit" disabled={downloading} style={{ padding: '10px 20px', fontSize: 16 }}>
          {downloading ? 'Downloading...' : 'Download MP3s'}
        </button>
      </form>
      {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
      {files.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <h3>Downloaded Files</h3>
          <ul>
            {files.map(f => (
              <li key={f.name}><a href={f.url} download>{f.name}</a></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
