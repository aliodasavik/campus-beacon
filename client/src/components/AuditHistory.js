import React, { useEffect, useState } from 'react';
import { getAuditLogs, getClaimAuditTrail, getItemAuditTrail } from '../services/campusOperationsApi';

export default function AuditHistory({ itemId, claimId, adminView = false }) {
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState('');

  async function load() {
    try {
      let res;
      if (itemId) res = await getItemAuditTrail(itemId);
      else if (claimId) res = await getClaimAuditTrail(claimId);
      else if (adminView) res = await getAuditLogs({ limit: 100 });
      else return;
      setLogs(res.data || []);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not load activity history.');
    }
  }

  useEffect(() => {
    load();
  }, [itemId, claimId, adminView]);

  return (
    <div className="notion-card">
      <h3>Activity History</h3>
      {message && <p className="error-msg">{message}</p>}
      {logs.length === 0 ? <p>No audit events recorded yet.</p> : logs.map(log => (
        <div key={log._id} style={{ borderBottom: '1px solid #eee', padding: '8px 0' }}>
          <p><strong>{log.eventType}</strong> by {log.actorEmail}</p>
          {log.message && <p>{log.message}</p>}
          <small>{new Date(log.createdAt).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
}
