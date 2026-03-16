import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="nav-brand">
        Campus Beacon
      </div>
      <ul className="nav-links">
        <li><a href="#home">Home</a></li>
        <li><a href="#how-it-works">How It Works</a></li>
        <li><a href="#about">About Us</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
      <button className="btn-primary" onClick={() => navigate('/login')}>
        Get Started
      </button>
    </nav>
  );
}