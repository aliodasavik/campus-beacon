import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <Navbar />
      
      {/* --- HOME SECTION --- */}
      <main id="home" className="hero-section">
        <h1 className="hero-title">
          Lost something on campus?<br />
          <span className="serif-text">Find it again.</span>
        </h1>
        
        <p className="hero-subtitle">
          A simple platform where students report lost items<br />
          and help return them to their owners.
        </p>
        
        <div className="hero-buttons">
          <button className="btn-primary large" onClick={() => navigate('/login')}>
            Report Lost Item
          </button>
          <button className="btn-outline large" onClick={() => navigate('/login')}>
            View Found Items
          </button>
        </div>

        <div className="hero-illustration">
          <img src="/hero-image.png" alt="Students exchanging lost item" />
        </div>
      </main>

      {/* --- HOW IT WORKS SECTION --- */}
      <section id="how-it-works" className="content-section alternate-bg">
        <h2 className="section-title">How It <span className="serif-text">Works</span></h2>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Lose or Find an Item</h3>
            <p>Whether you dropped your ID card or found a stray laptop, start by logging into the campus portal.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Create a Post</h3>
            <p>Fill out a quick form with the item's details, category, and where it was last seen on campus.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Connect & Return</h3>
            <p>Use the feed to match lost and found items. Meet up on campus and return the item securely!</p>
          </div>
        </div>
      </section>

      {/* --- ABOUT US SECTION --- */}
      <section id="about" className="content-section">
        <div className="about-content">
          <h2 className="section-title">About <span className="serif-text">Us</span></h2>
          <p className="section-text">
            Campus Beacon was built by students, for students. Every semester, hundreds of items are lost in lecture halls, cafeterias, and libraries. Our goal is to create a centralized, safe, and efficient way to reunite students with their belongings.
          </p>
          <p className="section-text">
            By strictly using university email authentication, we ensure our community remains a safe space for everyone on campus.
          </p>
        </div>
      </section>

      {/* --- CONTACT SECTION --- */}
      <section id="contact" className="content-section alternate-bg">
        <h2 className="section-title">Get in <span className="serif-text">Touch</span></h2>
        <p className="section-text text-center">Have a suggestion or need help? Reach out to our support team.</p>
        
        <form className="contact-form" onSubmit={(e) => { e.preventDefault(); alert('Message sent!'); }}>
          <input type="text" placeholder="Your Name" className="contact-input" required />
          <input type="email" placeholder="University Email" className="contact-input" required />
          <textarea placeholder="How can we help?" rows="5" className="contact-input" required></textarea>
          <button type="submit" className="btn-primary full-width large">Send Message</button>
        </form>
      </section>

      {/* --- FOOTER --- */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} Campus Beacon. All rights reserved.</p>
      </footer>
    </div>
  );
}