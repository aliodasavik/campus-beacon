import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setUserEmailHeader } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (email.includes('@')) {
      localStorage.setItem('userEmail', email);
      setUserEmailHeader(email);
      navigate('/dashboard');
    } else {
      alert('Please enter a valid university email.');
    }
  };

  return (
    <div className="landing-page center-content">
      <div className="login-card">
        <h2>Student Login</h2>
        <form onSubmit={handleLogin}>
          <input 
            type="email" 
            placeholder="e.g., student@g.bracu.ac.bd" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            className="login-input"
          />
          <button type="submit" className="btn-primary large full-width">Continue to Dashboard</button>
        </form>
      </div>
    </div>
  );
}