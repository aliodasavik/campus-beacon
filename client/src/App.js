import React, { useEffect } from 'react';
import './styles.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import ChatPage from './pages/ChatPage';
import { setAuthHeaders } from './services/api'; // 1. Import your header function

function App() {
  // 2. Add this useEffect so React remembers you are logged in!
  useEffect(() => {
    // Make sure these match the keys you use in localStorage during Login
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('userEmail');
    
    if (token && email) {
      setAuthHeaders(email, token);
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/chat/:chatId" element={<ChatPage />} />
      </Routes>
    </Router>
  );
}

export default App;