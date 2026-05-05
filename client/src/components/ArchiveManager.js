import React, { useEffect, useState } from 'react';
import { archiveItem, extendItemRetention, listArchives, runArchiveJob } from '../services/campusOperationsApi';

export default function ArchiveManager() {
  const [archives, setArchives] = useState([]);
  const [itemId, setItemId] = useState('');
  const [days, setDays] = useState(30);
  const [message, setMessage] = useState('');

  async function load() {
    const res = await listArchives();
    setArchives(res.data || []);
  }

  useEffect(() => {
    load().catch(() => setMessage('Could not load archive records.'));
  }, []);

  async function runJob() {
    try {
      const res = await runArchiveJob({ limit: 100 });
      setMessage(`Archive job completed. Archived ${res.data.archivedCount} item(s).`);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Archive job failed.');
    }
  }

  async function archiveNow() {
    try {
      await archiveItem(itemId, { reason: 'manual_admin_archive' });
      setMessage('Item archived.');
      setItemId('');
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Manual archive failed.');
    }
  }

  async function extend() {
    try {
      await extendItemRetention(itemId, { days: Number(days), reason: 'admin_extension' });
      setMessage('Retention extended.');
      setItemId('');
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Retention extension failed.');
    }
  }

  return (
    <section className="notion-page">
      <h1 className="page-title">Post Expiry and Archive Manager</h1>
      <div className="notion-card">
        <button className="btn-primary" onClick={runJob}>Run 90-Day Archive Job</button>
        <div className="form-row" style={{ marginTop: '15px' }}>
          <input className="notion-input" placeholder="Item ID" value={itemId} onChange={e => setItemId(e.target.value)} />
          <input className="notion-input" type="number" placeholder="Days" value={days} onChange={e => setDays(e.target.value)} />
        </div>
        <div className="card-actions">
          <button className="btn-outline" onClick={archiveNow} disabled={!itemId}>Archive Item</button>
          <button className="btn-outline" onClick={extend} disabled={!itemId}>Extend Retention</button>
        </div>
        {message && <p className="error-msg">{message}</p>}
      </div>

      <div className="notion-list">
        {archives.map(record => (
          <div className="notion-card" key={record._id}>
            <h3>{record.itemId?.title || record.itemId}</h3>
            <p>Archived: {record.isArchived ? 'Yes' : 'No'} - Read only: {record.readOnly ? 'Yes' : 'No'}</p>
            <p>Retention until: {record.retentionUntil ? new Date(record.retentionUntil).toLocaleDateString() : 'Default policy'}</p>
            {record.archivedAt && <p>Archived at: {new Date(record.archivedAt).toLocaleString()}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
