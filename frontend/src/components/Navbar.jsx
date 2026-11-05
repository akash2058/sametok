import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.svg';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        <img src={logo} alt="SameTok" style={{ height: 36, display: 'block' }} />
      </Link>
      <div className="nav-links">
        {user ? (
          <>
            <Link to="/upload">Upload</Link>
            <span>@{user.username}</span>
            <button onClick={() => { logout(); navigate('/'); }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}