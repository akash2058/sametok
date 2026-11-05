import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async e => {
    e.preventDefault();
    try {
      await register(username, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <form className="form" onSubmit={submit}>
      <h2>Register</h2>
      {error && <p className="error">{error}</p>}
      <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
      <input type="password" placeholder="Password (min 6)" value={password} onChange={e => setPassword(e.target.value)} required />
      <button type="submit">Create account</button>
      <p>Have an account? <Link to="/login">Login</Link></p>
    </form>
  );
}