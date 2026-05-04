import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../services/api';

export default function ChatPage() {
  const { chatId } = useParams();
  const [chat, setChat] = useState(null);
  const [text, setText] = useState('');

  const currentUserEmail = localStorage.getItem('userEmail');

  const loadChat = async () => {
    try {
      const res = await API.get(`/chats/${chatId}`);
      setChat(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load chat.');
    }
  };

  useEffect(() => {
    loadChat();
  }, [chatId]);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!text.trim()) return;

    try {
      await API.post(`/chats/${chatId}/messages`, { text });
      setText('');
      loadChat();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send message.');
    }
  };

  if (!chat) {
    return (
      <section className="notion-page">
        <h1 className="page-title">Loading chat...</h1>
      </section>
    );
  }

  return (
    <section className="notion-page">
      <h1 className="page-title">Anonymous Chat</h1>

      <div className="notion-card" style={{ marginBottom: '16px' }}>
        <p>
          <strong>Participants:</strong> Finder and Claimer
        </p>
        <p>
          <strong>Status:</strong> {chat.isLocked ? 'Locked' : 'Open'}
        </p>
      </div>

      <div className="notion-list" style={{ marginBottom: '16px' }}>
        {chat.messages.length === 0 ? (
          <p className="empty-state">No messages yet.</p>
        ) : (
          chat.messages.map((msg, index) => (
            <div className="notion-card" key={index}>
              <p>
                <strong>
                  {msg.senderEmail === currentUserEmail ? 'You' : 'Other User'}:
                </strong>{' '}
                {msg.text}
              </p>
            </div>
          ))
        )}
      </div>

      {!chat.isLocked && (
        <form onSubmit={sendMessage} className="notion-card">
          <textarea
            className="notion-input"
            rows="4"
            placeholder="Type your message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit" className="btn-primary" style={{ marginTop: '12px' }}>
            Send Message
          </button>
        </form>
      )}
    </section>
  );
}