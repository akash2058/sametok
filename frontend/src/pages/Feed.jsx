import { useEffect, useState, useRef } from 'react';
import api from '../api/client';
import VideoCard from '../components/VideoCard';

export default function Feed() {
  const [videos, setVideos] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const started = useRef(false);

  const load = async nextCursor => {
    if (loading || done) return;
    setLoading(true);
    try {
      const { data } = await api.get('/videos/feed', {
        params: nextCursor ? { cursor: nextCursor } : {},
      });
      setVideos(prev => [...prev, ...data.videos]);
      setCursor(data.nextCursor);
      if (!data.nextCursor) setDone(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    load(null);
  }, []);

  // Infinite scroll: load the next page when near the bottom
  const onScroll = e => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200 && cursor) load(cursor);
  };

  return (
    <div className="feed" onScroll={onScroll}>
      {videos.map(v => <VideoCard key={v._id} video={v} />)}
      {!loading && videos.length === 0 && (
        <p className="empty">No videos yet. Upload the first one!</p>
      )}
      {loading && <p className="empty">Loading...</p>}
    </div>
  );
}