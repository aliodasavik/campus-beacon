import React, { useEffect, useState } from 'react';
import API from '../services/api';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error("Error loading notifications");
    }
  };

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 10 seconds (optional but helpful)
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const markRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      loadNotifications();
    } catch (err) {
      console.error("Error marking read", err);
    }
  };

  const handleClaimDecision = async (notif, decision) => {
    try {
      await API.put(`/claims/${notif.claimId}/status`, { status: decision });
      alert(`Claim ${decision}!`);
      markRead(notif._id);
      window.dispatchEvent(new Event('refreshFeed')); // Refresh the feed items
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing claim');
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (notifications.length === 0) return null;

  return (
    <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
      <h3>🔔 Notifications {unreadCount > 0 && <span style={{ color: 'red' }}>({unreadCount} Unread)</span>}</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {notifications.map(n => (
          <li key={n._id} style={{ 
            padding: '12px', 
            borderBottom: '1px solid #eee', 
            opacity: n.isRead ? 0.6 : 1,
            backgroundColor: '#fff',
            marginBottom: '8px',
            borderRadius: '4px'
          }}>
            {/* 
              CRITICAL CHANGE: whiteSpace: 'pre-wrap' allows the \n characters 
              sent from the backend controller to render as actual line breaks!
            */}
            <p style={{ 
              margin: '0 0 10px 0', 
              whiteSpace: 'pre-wrap', 
              lineHeight: '1.5' 
            }}>
              {n.message}
            </p>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              {!n.isRead && n.type === 'ClaimRequest' && (
                <>
                  <button 
                    className="btn-primary small" 
                    style={{ backgroundColor: '#28a745', borderColor: '#28a745' }} 
                    onClick={() => handleClaimDecision(n, 'Accepted')}
                  >
                    ✅ Accept Claim
                  </button>
                  <button 
                    className="btn-outline small" 
                    style={{ color: '#dc3545', borderColor: '#dc3545' }} 
                    onClick={() => handleClaimDecision(n, 'Rejected')}
                  >
                    ❌ Reject Claim
                  </button>
                </>
              )}
              {!n.isRead && (
                <button 
                  className="btn-outline small" 
                  onClick={() => markRead(n._id)}
                >
                  Mark as Read
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}