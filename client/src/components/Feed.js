import React, { useEffect, useState } from 'react';
import API from '../services/api';

const categories = ['', 'Electronics', 'ID Cards', 'Keys', 'Clothing', 'Bags', 'Documents', 'Others'];
const statuses = ['', 'Lost', 'Found', 'Claimed', 'Resolved'];

export default function Feed() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState({ q: '', category: '', status: '', sort: 'newest' });
  const [matches, setMatches] = useState({});
  const currentUserEmail = API.defaults.headers.common['x-user-email'];

  async function load() {
    try {
      const params = {};
      if (filter.q) params.q = filter.q;
      if (filter.category) params.category = filter.category;
      if (filter.status) params.status = filter.status;
      if (filter.sort) params.sort = filter.sort;

      const res = await API.get('/items', { params });
      
      // Filter out hidden items
      const visibleItems = res.data.filter(item => !item.isHidden);
      setItems(visibleItems);
    } catch (err) {
      console.error('Error loading items:', err);
    }
  }

  useEffect(() => {
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

    if (item.sensitivity === 'High' && item.bcvQuestion) {
      const answer = window.prompt(
        `This item requires verification.\nPlease answer the following question for the finder to review:\n\nQuestion: ${item.bcvQuestion}`
      );

      if (!answer) {
        alert('Claim cancelled. An answer is required to proceed.');
        return;
      }
      payload.answer = answer;
    }

    try {
      await API.post('/claims', payload);
      alert('Your claim has been sent to the finder for review!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting claim.');
    }
  };

  const handleReport = async (item) => {
    const reason = window.prompt(
      `Why are you reporting "${item.title}" as suspicious?\n\nExample: fake claim, misleading description, spam`
    );

    if (reason === null) return;

    try {
      await API.post(`/reports/${item._id}`, { reason });
      alert('Report submitted successfully.');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Error reporting item.');
    }
  };

  const handleSOS = async (item) => {
    const confirmed = window.confirm(
      `Send SOS broadcast for "${item.title}"?\n\nThis should only be used for urgent lost items.`
    );
    if (!confirmed) return;

    try {
      await API.put(`/items/${item._id}/sos`);
      alert('SOS broadcast sent successfully.');
      window.dispatchEvent(new Event('refreshFeed'));
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Error sending SOS.');
    }
  };

  const handleFindMatches = async (itemId) => {
    try {
      const res = await API.get(`/items/${itemId}/matches`);
      setMatches(prev => ({
        ...prev,
        [itemId]: res.data
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Error finding matches.');
    }
  };

  return (
    <section className="notion-page">
      <h1 className="page-title">Item Feed</h1>

      <div className="search-and-filter-panel">
        <div className="google-search-container">
          <input
            className="google-search-input"
            placeholder="🔍 Search for lost or found items..."
            value={filter.q}
            onChange={e => setFilter({ ...filter, q: e.target.value })}
          />
        </div>

        <div className="filter-controls">
          <select className="notion-input" value={filter.category} onChange={e => setFilter({ ...filter, category: e.target.value })}>
            {categories.map(c => <option key={c} value={c}>{c || 'All Categories'}</option>)}
          </select>
          <select className="notion-input" value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
            {statuses.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
          <select className="notion-input" value={filter.sort} onChange={e => setFilter({ ...filter, sort: e.target.value })}>
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
                {item.sensitivity === 'High' && (
                  <span className="pill" style={{ background: 'red', color: 'white' }}>
                    🔒 Highly Sensitive
                  </span>
                )}
                {item.isSOS && (
                  <span className="pill" style={{ background: '#dc2626', color: 'white' }}>
                    🚨 SOS
                  </span>
                )}
                {item.flagCount > 0 && (
                  <span className="pill" style={{ background: '#f59e0b', color: 'white' }}>
                    🚩 {item.flagCount} Report{item.flagCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            <p className="card-desc">{item.description || 'No description provided.'}</p>

            <div className="card-meta">
              <span>📍 {item.zone || 'Unknown Location'}</span>
              <span>👤 {item.postedByEmail}</span>
            </div>

            {item.category === 'ID Cards' && (
              <div className="card-meta">
                <span>🪪 {item.cardType || 'Unknown Card Type'}</span>
                <span>👤 {item.holderName || 'Unknown Name'}</span>
                <span>🆔 {item.idNumber || 'Unknown ID'}</span>
              </div>
            )}

            <div className="card-actions">
              {item.postedByEmail === currentUserEmail ? (
                <>
                  {item.status !== 'Claimed' && item.status !== 'Resolved' && (
                    <button className="btn-outline small" onClick={() => updateStatus(item._id, item.status === 'Found' ? 'Claimed' : 'Found')}>
                      Toggle Found/Claimed
                    </button>
                  )}
                  {item.status !== 'Resolved' && (
                    <button className="btn-outline small" onClick={() => updateStatus(item._id, 'Resolved')}>
                      Mark Resolved
                    </button>
                  )}
                  {item.status === 'Lost' && !item.isSOS && (
                    <button className="btn-primary small" onClick={() => handleSOS(item)}>
                      🚨 Send SOS
                    </button>
                  )}
                </>
              ) : (
                <>
                  {item.status === 'Found' && (
                    <button className="btn-primary small" onClick={() => handleClaimRequest(item)}>
                      🖐️ Claim Item
                    </button>
                  )}
                  <button className="btn-outline small" onClick={() => handleReport(item)}>
                    🚩 Report Suspicious
                  </button>
                </>
              )}

              {item.category === 'ID Cards' && (
                <button className="btn-outline small" onClick={() => handleFindMatches(item._id)}>
                  🪪 Find Match
                </button>
              )}
            </div>

            {matches[item._id] && (
              <div className="notion-card" style={{ marginTop: '12px', background: '#f8fafc' }}>
                <h4>Possible Matches</h4>
                {matches[item._id].length === 0 ? (
                  <p>No likely matches found.</p>
                ) : (
                  matches[item._id].map(match => (
                    <div key={match._id} style={{ marginBottom: '10px' }}>
                      <p><strong>{match.title}</strong> ({match.status})</p>
                      <p>Name: {match.holderName || 'N/A'}</p>
                      <p>ID: {match.idNumber || 'N/A'}</p>
                      <p>Type: {match.cardType || 'N/A'}</p>
                      <p>Score: {match.matchScore}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="empty-state">No items found matching your filters.</p>}
      </div>
    </section>
  );
}