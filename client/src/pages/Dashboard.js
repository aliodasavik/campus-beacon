import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Feed from '../components/Feed';
import CreatePost from '../components/CreatePost';
import Notifications from '../components/Notifications'; // Fixed: ../ instead of ./
import { setUserEmailHeader } from '../services/api';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('feed');
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail');

  useEffect(() => {
    if (!userEmail) navigate('/login');
    else setUserEmailHeader(userEmail);
  }, [navigate, userEmail]);

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
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
        </nav>

        <div className="sidebar-footer">
          <button className="nav-btn logout" onClick={handleLogout}>🚪 Logout</button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="notion-main">
        <div className="notion-content">
          {/* Notifications appear at the top of the main screen */}
          <Notifications />
          
          {/* Show the selected tab */}
          {activeTab === 'feed' && <Feed />}
          {activeTab === 'create' && <CreatePost onSuccess={() => setActiveTab('feed')} />}
        </div>
      </main>
    </div>
  );
}