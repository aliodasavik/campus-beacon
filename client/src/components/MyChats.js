import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function MyChats() {
  const [chats, setChats] = useState([]);
  const navigate = useNavigate();
  const currentUserEmail = localStorage.getItem('userEmail');

  const loadChats = async () => {
    try {
      const res = await API.get('/chats');
      setChats(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load chats.');
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  return (
    <section className="notion-page">
      <h1 className="page-title">My Chats</h1>

      <div className="notion-list">
        {chats.length === 0 ? (
          <p className="empty-state">No chats available.</p>
        ) : (
          chats.map(chat => (
            <div className="notion-card" key={chat._id}>
              <h3>{chat.finderEmail === currentUserEmail ? 'Chat with Claimer' : 'Chat with Finder'}</h3>
              <p><strong>Status:</strong> {chat.isLocked ? 'Locked' : 'Open'}</p>
              <p><strong>Messages:</strong> {chat.messages.length}</p>

              <div className="card-actions">
                <button
                  className="btn-primary small"
                  onClick={() => navigate(`/chat/${chat._id}`)}
                >
                  Open Chat
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}