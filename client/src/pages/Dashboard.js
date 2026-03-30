import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Feed from '../components/Feed';
import CreatePost from '../components/CreatePost';
import Notifications from '../components/Notifications';
import Settings from '../components/Settings'; // <-- 1. Import Settings
import { setAuthHeaders } from '../services/api';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('feed');
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail');
  const token = localStorage.getItem('token'); 

  useEffect(() => {
    if (!userEmail || !token) {
      navigate('/login');
    } else {
      setAuthHeaders(userEmail, token);
    }
  }, [navigate, userEmail, token]);

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('token'); 
    navigate('/');
  };

  return (
    <div className="notion-layout">
      {/* Notion-style Sidebar */}
      <aside className="notion-sidebar">
        <div className="sidebar-profile">
          <div className="avatar">{userEmail?.charAt(0).toUpperCase()}</div>
          <div className="profile-info">
            <strong>CampusBeacon</strong>
            <span>{userEmail}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-label">Menu</p>
          <button 
            className={`nav-btn ${activeTab === 'feed' ? 'active' : ''}`} 
            onClick={() => setActiveTab('feed')}
          >
            📄 Item Feed
          </button>
          <button 
            className={`nav-btn ${activeTab === 'create' ? 'active' : ''}`} 
            onClick={() => setActiveTab('create')}
          >
            ✍️ Report an Item
          </button>
          {/* 2. Added Settings Button */}
          <button 
            className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`} 
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-btn logout" onClick={handleLogout}>🚪 Logout</button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="notion-main">
        <div className="notion-content">
          <Notifications />
          
          {/* 3. Show Tabs */}
          {activeTab === 'feed' && <Feed />}
          {activeTab === 'create' && <CreatePost onSuccess={() => setActiveTab('feed')} />}
          {activeTab === 'settings' && <Settings onLogout={handleLogout} />} {/* Added Settings */}
        </div>
      </main>
    </div>
  );
}