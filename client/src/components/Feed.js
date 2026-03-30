import React, { useEffect, useState } from 'react';
import API from '../services/api';

const categories = ['', 'Electronics','ID Cards','Keys','Clothing','Bags','Documents','Others'];
const statuses = ['', 'Lost','Found','Claimed','Resolved'];

export default function Feed(){
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState({ q:'', category:'', status:'', sort: 'newest' });
  const currentUserEmail = API.defaults.headers.common['x-user-email']; // Get active user email

  async function load() {
    try {
      const params = {};
      if (filter.q) params.q = filter.q;
      if (filter.category) params.category = filter.category;
      if (filter.status) params.status = filter.status;
      if (filter.sort) params.sort = filter.sort;
      
      const res = await API.get('/items', { params });
      setItems(res.data);
    } catch (err) {
      console.error("Error loading items:", err);
    }
  }

  useEffect(()=> {
    load();
    const handler = () => load();
    window.addEventListener('refreshFeed', handler);
    return () => window.removeEventListener('refreshFeed', handler);
  }, [filter.q, filter.category, filter.status, filter.sort]);

  const updateStatus = async (id, newStatus) => {
    try {
      await API.put(`/items/${id}/status`, { status: newStatus });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed.');
    }
  };

  const handleClaimRequest = async (item) => {
    let payload = { itemId: item._id };
    
    // If it's a high-sensitivity item, prompt for the answer
    if (item.sensitivity === 'High' && item.bcvQuestion) {
      const answer = window.prompt(
        `This item requires verification.\nPlease answer the following question for the finder to review:\n\nQuestion: ${item.bcvQuestion}`
      );
      
      if (!answer) {
        alert("Claim cancelled. An answer is required to proceed.");
        return; // Stop the process if the user cancels
      }
      // Add the answer to our API request payload
      payload.answer = answer;
    }
    
    try {
      // Send the request. The payload will include the answer if it was provided.
      await API.post('/claims', payload);
      alert('Your claim has been sent to the finder for review!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting claim.');
    }
  };

  return (
    <section className="notion-page">
      <h1 className="page-title">Item Feed</h1>
      
      {/* New, Improved Search and Filter Area */}
      <div className="search-and-filter-panel">
        
        {/* FR7: Prominent Google-style Search Bar */}
        <div className="google-search-container">
          <input 
            className="google-search-input" 
            placeholder="🔍 Search for lost or found items..." 
            value={filter.q} 
            onChange={e => setFilter({...filter, q: e.target.value})} 
          />
        </div>

        {/* FR6: Filter and Sort Controls below the search bar */}
        <div className="filter-controls">
          <select className="notion-input" value={filter.category} onChange={e=>setFilter({...filter,category:e.target.value})}>
            {categories.map(c => <option key={c} value={c}>{c || 'All Categories'}</option>)}
          </select>
          <select className="notion-input" value={filter.status} onChange={e=>setFilter({...filter,status:e.target.value})}>
            {statuses.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
          <select className="notion-input" value={filter.sort} onChange={e=>setFilter({...filter,sort:e.target.value})}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

      </div>

      <div className="notion-list">
        {items.map(item => (
          <div className="notion-card" key={item._id}>
            <div className="card-header">
              <h3>{item.title}</h3>
              <div className="tags">
                <span className={`pill status-${item.status.toLowerCase()}`}>{item.status}</span>
                <span className="pill category">{item.category}</span>
                {item.sensitivity === 'High' && <span className="pill" style={{background: 'red', color: 'white'}}>🔒 Highly Sensitive</span>}
              </div>
            </div>
            <p className="card-desc">{item.description || 'No description provided.'}</p>
            <div className="card-meta">
              <span>📍 {item.zone || 'Unknown Location'}</span>
              <span>👤 {item.postedByEmail}</span>
            </div>
            
            <div className="card-actions">
              {item.postedByEmail === currentUserEmail ? (
                <>
                  {item.status !== 'Claimed' && item.status !== 'Resolved' && (
                    <button className="btn-outline small" onClick={()=>updateStatus(item._id, item.status === 'Found' ? 'Claimed' : 'Found')}>
                      Toggle Found/Claimed
                    </button>
                  )}
                  {item.status !== 'Resolved' && (
                    <button className="btn-outline small" onClick={()=>updateStatus(item._id, 'Resolved')}>Mark Resolved</button>
                  )}
                </>
              ) : (
                item.status === 'Found' && (
                  <button className="btn-primary small" onClick={() => handleClaimRequest(item)}>
                    🖐️ Claim Item
                  </button>
                )
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="empty-state">No items found matching your filters.</p>}
      </div>
    </section>
  );
}