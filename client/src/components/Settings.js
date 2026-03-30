import React, { useState } from 'react';
import { updateProfile, deleteAccount } from '../services/api';

export default function Settings({ onLogout }) {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    try {
      const res = await updateProfile({ newUsername, newPassword });
      setMessage(res.data.message);
      setNewUsername('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleDelete = async () => {
    const isConfirmed = window.confirm("Are you sure you want to delete your account? This cannot be undone.");
    
    if (isConfirmed) {
      try {
        await deleteAccount();
        alert("Your account has been deleted.");
        onLogout(); // This clears local storage and sends you to the Landing page
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete account');
      }
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '20px auto', padding: '20px' }}>
      <h2>⚙️ Profile Settings</h2>
      
      {message && <p style={{ color: 'green', fontWeight: 'bold' }}>{message}</p>}
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
      
      {/* UPDATE FORM */}
      <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
        <div>
          <label>New Username</label>
          <input 
            type="text" 
            placeholder="Leave blank to keep current" 
            value={newUsername} 
            onChange={e => setNewUsername(e.target.value)} 
            className="login-input"
            style={{ width: '100%', marginTop: '5px' }}
          />
        </div>
        
        <div>
          <label>New Password</label>
          <input 
            type="password" 
            placeholder="Leave blank to keep current" 
            value={newPassword} 
            onChange={e => setNewPassword(e.target.value)} 
            className="login-input"
            style={{ width: '100%', marginTop: '5px' }}
          />
        </div>
        
        <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>Save Changes</button>
      </form>

      <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #ddd' }} />

      {/* DANGER ZONE - DELETE ACCOUNT */}
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ color: '#d9534f', margin: '0 0 10px 0' }}>Danger Zone</h3>
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button 
          onClick={handleDelete} 
          style={{
            backgroundColor: '#d9534f',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            width: '100%'
          }}
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}