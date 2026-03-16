import React, { useEffect, useState } from 'react';
import API from '../services/api';

const categories = ['', 'Electronics','ID Cards','Keys','Clothing','Bags','Documents','Others'];
const statuses = ['', 'Lost','Found','Claimed','Resolved'];

export default function Feed(){
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState({ q:'', category:'', status:'' });

  async function load() {
    const params = {};
    if (filter.q) params.q = filter.q;
    if (filter.category) params.category = filter.category;
    if (filter.status) params.status = filter.status;
    const res = await API.get('/items', { params });
    setItems(res.data);
  }

  useEffect(()=> {
    load();
    const handler = () => load();
    window.addEventListener('refreshFeed', handler);
    return () => window.removeEventListener('refreshFeed', handler);
  }, [filter.q, filter.category, filter.status]);

  const updateStatus = async (id, newStatus) => {
    try {
      await API.put(`/items/${id}/status`, { status: newStatus });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed. You can only edit your own posts.');
    }
  };

  return (
    <section className="notion-page">
      <h1 className="page-title">Item Feed</h1>
      
      <div className="notion-filters">
        <input className="notion-input search-bar" placeholder="🔍 Search items..." value={filter.q} onChange={e=>setFilter({...filter,q:e.target.value})} />
        <select className="notion-input" value={filter.category} onChange={e=>setFilter({...filter,category:e.target.value})}>
          {categories.map(c => <option key={c} value={c}>{c || 'All Categories'}</option>)}
        </select>
        <select className="notion-input" value={filter.status} onChange={e=>setFilter({...filter,status:e.target.value})}>
          {statuses.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
      </div>

      <div className="notion-list">
        {items.map(item => (
          <div className="notion-card" key={item._id}>
            <div className="card-header">
              <h3>{item.title}</h3>
              <div className="tags">
                <span className={`pill status-${item.status.toLowerCase()}`}>{item.status}</span>
                <span className="pill category">{item.category}</span>
              </div>
            </div>
            <p className="card-desc">{item.description || 'No description provided.'}</p>
            <div className="card-meta">
              <span>📍 {item.zone || 'Unknown Location'}</span>
              <span>👤 {item.postedByEmail}</span>
            </div>
            
            <div className="card-actions">
              {item.status !== 'Claimed' && item.status !== 'Resolved' && (
                <button className="btn-outline small" onClick={()=>updateStatus(item._id, item.status === 'Found' ? 'Claimed' : 'Found')}>
                  Toggle Found/Claimed
                </button>
              )}
              {item.status !== 'Resolved' && (
                <button className="btn-outline small" onClick={()=>updateStatus(item._id, 'Resolved')}>Mark Resolved</button>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="empty-state">No items found matching your filters.</p>}
      </div>
    </section>
  );
}