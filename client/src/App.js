// Client/src/app.js
import React from 'react';
import './styles.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup'; // <-- Import Signup
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/ChatPage';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} /> {/* <-- Add Route */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat/:chatId" element={<ChatPage />} />
      </Routes>
    </Router>
  );
}

export default App;