import React, { useEffect, useState } from 'react';
import API, { setAuthHeaders } from '../services/api'; 
import AuditHistory from '../components/AuditHistory';

export default function AdminDashboard() {
  const [data, setData] = useState({
    stats: {
      totalItems: 0,
      hiddenItems: 0,
      flaggedItems: 0,
      totalReports: 0
    },
    reportedItems: [],
    reports: []
  });

  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      const email = localStorage.getItem('userEmail');
      const token = localStorage.getItem('token');
      if (email && token) {
        setAuthHeaders(email, token);
      }

      const res = await API.get('/admin/dashboard');
      setData(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load admin dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const hideItem = async (itemId) => {
    try {
      await API.put(`/admin/items/${itemId}/hide`);
      loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to hide item.');
    }
  };

  const unhideItem = async (itemId) => {
    try {
      await API.put(`/admin/items/${itemId}/unhide`);
      loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to unhide item.');
    }
  };

  const deleteItem = async (itemId) => {
    const confirmed = window.confirm('Are you sure you want to delete this item?');
    if (!confirmed) return;

    try {
      await API.delete(`/admin/items/${itemId}`);
      loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete item.');
    }
  };

  if (loading) {
    return <section className="notion-page"><h1 className="page-title">Loading admin dashboard...</h1></section>;
  }

  return (
    <section className="notion-page">
      <h1 className="page-title">🛡️ Admin Control Center</h1>

      {/* SYSTEM STATS */}
      <div className="notion-list" style={{ marginBottom: '24px' }}>
        <div className="notion-card">
          <h3>System Stats</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
            <p><strong>Total Items:</strong> {data.stats.totalItems}</p>
            <p><strong>Hidden Items:</strong> {data.stats.hiddenItems}</p>
            <p><strong>Flagged Items:</strong> {data.stats.flaggedItems}</p>
            <p><strong>Total Reports:</strong> {data.stats.totalReports}</p>
          </div>
        </div>
      </div>

      {/* REPORTED ITEMS */}
      <h2 style={{ marginBottom: '12px' }}>Reported Items</h2>
      <div className="notion-list">
        {data.reportedItems.length === 0 ? (
          <p className="empty-state">No reported items found.</p>
        ) : (
          data.reportedItems.map(item => (
            <div className="notion-card" key={item._id}>
              <div className="card-header">
                <h3>{item.title}</h3>
                <div className="tags">
                  <span className={`pill status-${item.status.toLowerCase()}`}>{item.status}</span>
                  <span className="pill" style={{ background: '#f59e0b', color: 'white' }}>
                    🚩 {item.flagCount} Reports
                  </span>
                  {item.isHidden && <span className="pill" style={{ background: '#111827', color: 'white' }}>Hidden</span>}
                </div>
              </div>
              <p className="card-desc">{item.description}</p>
              <div className="card-meta">
                <span>👤 {item.postedByEmail}</span>
              </div>
              <div className="card-actions">
                {!item.isHidden ? (
                  <button className="btn-outline small" onClick={() => hideItem(item._id)}>Hide</button>
                ) : (
                  <button className="btn-outline small" onClick={() => unhideItem(item._id)}>Unhide</button>
                )}
                <button className="btn-outline small delete" onClick={() => deleteItem(item._id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
        {/* RECENT REPORTS COLUMN */}
        <div>
          <h2 style={{ marginBottom: '12px' }}>Recent Reports</h2>
          <div className="notion-list">
            {data.reports.length === 0 ? (
              <p className="empty-state">No reports found.</p>
            ) : (
              data.reports.map(report => (
                <div className="notion-card" key={report._id}>
                  <h3>{report.item?.title || 'Deleted Item'}</h3>
                  <p><small>By: {report.reportedByEmail}</small></p>
                  <p><strong>Reason:</strong> {report.reason}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. SYSTEM ACTIVITY LOGS COLUMN */}
        <div>
          <h2 style={{ marginBottom: '12px' }}>System Audit Trail</h2>
          <AuditHistory adminView={true} />
        </div>
      </div>
    </section>
  );
}