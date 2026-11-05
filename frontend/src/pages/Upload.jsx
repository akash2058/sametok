import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const MAX_MB = 100;

export default function Upload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const submit = async e => {
    e.preventDefault();
    setError('');
    if (!file) return setError('Choose a video file');
    if (file.size > MAX_MB * 1024 * 1024) return setError(`File must be under ${MAX_MB} MB`);

    try {
      setStatus('Requesting upload URL...');
      const { data } = await api.post('/videos/upload-url', {
        caption,
        contentType: file.type,
      });

      setStatus('Uploading video...');
      const res = await fetch(data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!res.ok) throw new Error('Upload to storage failed');

      setStatus('Finishing...');
      await api.post(`/videos/${data.videoId}/complete`);
      navigate('/');
    } catch (err) {
      setStatus('');
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <form className="form" onSubmit={submit}>
      <h2>Upload video</h2>
      {error && <p className="error">{error}</p>}
      {status && <p>{status}</p>}
      <input
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        onChange={e => setFile(e.target.files[0])}
      />
      <input
        placeholder="Caption"
        maxLength={300}
        value={caption}
        onChange={e => setCaption(e.target.value)}
      />
      <button type="submit">Upload</button>
    </form>
  );
}