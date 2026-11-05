import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function VideoCard({ video }) {
  const ref = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [likes, setLikes] = useState(video.likeCount);
  const [liked, setLiked] = useState(user ? video.likes?.includes(user.id) : false);

  // Play when more than 60% visible, pause otherwise
  useEffect(() => {
    const el = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const toggleLike = async () => {
    if (!user) return navigate('/login');
    const { data } = await api.post(`/videos/${video._id}/like`);
    setLiked(data.liked);
    setLikes(data.likeCount);
  };

  return (
    <div className="card">
      <video ref={ref} src={video.videoUrl} loop muted playsInline controls />
      <div className="overlay">
        <strong>@{video.owner?.username}</strong>
        <p>{video.caption}</p>
      </div>
      <button className="like" onClick={toggleLike}>
        {liked ? '❤️' : '🤍'} {likes}
      </button>
    </div>
  );
}