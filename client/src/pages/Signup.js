// Client/src/pages/signup.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signupUser, verifyOtp } from '../services/api';

export default function Signup() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await signupUser(formData);
      setMessage(res.data.message);
      setStep(2); // Move to OTP step
    } catch (err) {
      setMessage(err.response?.data?.message || 'Signup failed');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const res = await verifyOtp({ email: formData.email, otp });
      setMessage(res.data.message);
      setTimeout(() => navigate('/login'), 2000); // Send to login after 2 seconds
    } catch (err) {
      setMessage(err.response?.data?.message || 'Invalid OTP');
    }
  };

  return (
    <div className="landing-page center-content">
      <div className="login-card">
        <h2>Student Signup</h2>
        {message && <p style={{ color: step === 2 ? 'green' : 'red' }}>{message}</p>}
        
        {step === 1 ? (
          <form onSubmit={handleSignup}>
            <input 
              type="text" 
              placeholder="Username" 
              required 
              className="login-input"
              onChange={e => setFormData({...formData, username: e.target.value})} 
            />
            <input 
              type="email" 
              placeholder="University Email (e.g. @g.bracu.ac.bd)" 
              required 
              className="login-input"
              onChange={e => setFormData({...formData, email: e.target.value})} 
            />
            <input 
              type="password" 
              placeholder="Password" 
              required 
              className="login-input"
              onChange={e => setFormData({...formData, password: e.target.value})} 
            />
            <button type="submit" className="btn-primary large full-width">Sign Up</button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <input 
                type="text" // You can also use "number" or "tel"
                inputMode="numeric" // This brings up the number pad on mobile phones!
                placeholder="Enter 6-digit OTP" 
                required 
                className="login-input"
                value={otp}
                onChange={e => setOtp(e.target.value)} 
                maxLength="6" // Prevents user from typing more than 6 digits
                autoComplete="one-time-code" // This is the main fix! It tells the browser this is an OTP field.
            />
            <button type="submit" className="btn-primary large full-width">Verify OTP</button>
          </form>
        )}

        {step === 1 && (
          <p style={{ marginTop: '15px', textAlign: 'center' }}>
            Already have an account? <Link to="/login">login.</Link>
          </p>
        )}
      </div>
    </div>
  );
}