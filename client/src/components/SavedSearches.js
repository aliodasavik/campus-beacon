import React, { useEffect, useState } from 'react';
import {
  listSavedSearches,
  createSavedSearch,
  deleteSavedSearch,
  previewSavedSearchMatches,
  runSavedSearchAlertScan
} from '../services/campusOperationsApi';

const categories = ['', 'Electronics', 'ID Cards', 'Keys', 'Clothing', 'Bags', 'Documents', 'Others'];
const statuses = ['', 'Lost', 'Found', 'Claimed', 'Resolved'];

export default function SavedSearches() {
  const [searches, setSearches] = useState([]);
  const [matches, setMatches] = useState({});
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    name: '',
    q: '',
    category: '',
    status: '',
    zone: '',
    alertsEnabled: true
  });

  async function load() {
    const res = await listSavedSearches();
    setSearches(res.data || []);
  }

  useEffect(() => {
    load().catch(() => setMessage('Could not load saved searches.'));
  }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      await createSavedSearch({
        name: form.name || 'Saved search',
        alertsEnabled: form.alertsEnabled,
        filters: {
          q: form.q,
          category: form.category,
          status: form.status,
          zone: form.zone
        }
      });
      setForm({ name: '', q: '', category: '', status: '', zone: '', alertsEnabled: true });
      setMessage('Saved search created.');
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not save search.');
    }
  }

  async function preview(id) {
    try {
      const res = await previewSavedSearchMatches(id);
      setMatches(prev => ({ ...prev, [id]: res.data || [] }));
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not preview matches.');
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this saved search?')) return;
    await deleteSavedSearch(id);
    load();
  }

  async function scanAlerts() {
    await runSavedSearchAlertScan();
    setMessage('Alert scan completed. Matching saved searches will receive notifications.');
  }

  return (
    <section className="notion-page">
      <h1 className="page-title">Saved Searches and Alerts</h1>
      <form className="notion-form" onSubmit={submit}>
        <input className="notion-input" placeholder="Search name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input className="notion-input" placeholder="Keywords" value={form.q} onChange={e => setForm({ ...form, q: e.target.value })} />
        <div className="form-row">
          <select className="notion-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            {categories.map(c => <option key={c} value={c}>{c || 'All Categories'}</option>)}
          </select>
          <select className="notion-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            {statuses.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
        </div>
        <input className="notion-input" placeholder="Zone" value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} />
        <label><input type="checkbox" checked={form.alertsEnabled} onChange={e => setForm({ ...form, alertsEnabled: e.target.checked })} /> Enable alerts</label>
        <button className="btn-primary" type="submit">Save Search</button>
      </form>

      <button className="btn-outline" onClick={scanAlerts} style={{ marginTop: '15px' }}>Run Alert Scan</button>
      {message && <p className="error-msg">{message}</p>}

      <div className="notion-list">
        {searches.map(search => (
          <div className="notion-card" key={search._id}>
            <h3>{search.name}</h3>
            <p>{search.filters?.q || 'No keywords'} - {search.filters?.category || 'Any category'} - {search.filters?.status || 'Any status'} - {search.filters?.zone || 'Any zone'}</p>
            <p>Alerts: {search.alertsEnabled ? 'On' : 'Off'}</p>
            <div className="card-actions">
              <button className="btn-outline small" onClick={() => preview(search._id)}>Preview Matches</button>
              <button className="btn-outline small" onClick={() => remove(search._id)}>Delete</button>
            </div>
            {matches[search._id] && matches[search._id].map(item => <p key={item._id}>{item.title} ({item.status})</p>)}
          </div>
        ))}
      </div>
    </section>
  );
}
