// Client/src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, setAuthHeaders } from '../services/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await loginUser({ username, password });
      
      // Save data like you were doing before + the new token
      localStorage.setItem('userEmail', res.data.email);
      localStorage.setItem('token', res.data.token);
      setAuthHeaders(res.data.email, res.data.token);
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="landing-page center-content">
      <div className="login-card">
        <h2>Student Login</h2>
        {error && <p style={{color: 'red'}}>{error}</p>}
        <form onSubmit={handleLogin}>
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            required 
            className="login-input"
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            className="login-input"
          />
          <button type="submit" className="btn-primary large full-width">Login</button>
        </form>
        
        {/* The link you requested */}
        <p style={{ marginTop: '15px', textAlign: 'center' }}>
          New here? <Link to="/signup">signup.</Link>
        </p>
      </div>
    </div>
  );
}