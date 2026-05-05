import React, { useEffect, useState } from 'react';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  sendTestNotification,
  getNotificationDeliveryLogs
} from '../services/campusOperationsApi';

const groups = [
  ['claimRequests', 'Claim requests'],
  ['claimOutcomes', 'Claim outcomes'],
  ['bcvResults', 'BCV results'],
  ['sosEvents', 'SOS events'],
  ['adminMessages', 'Admin messages'],
  ['savedSearchAlerts', 'Saved search alerts']
];

const defaultChannel = { inApp: true, email: false, push: false };

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState(null);
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState('');

  async function load() {
    const [prefRes, logRes] = await Promise.all([
      getNotificationPreferences(),
      getNotificationDeliveryLogs()
    ]);
    setPreferences(prefRes.data);
    setLogs(logRes.data || []);
  }

  useEffect(() => {
    load().catch(() => setMessage('Could not load notification preferences.'));
  }, []);

  function toggle(group, channel) {
    setPreferences(prev => ({
      ...prev,
      [group]: {
        ...(prev[group] || defaultChannel),
        [channel]: !(prev[group] || defaultChannel)[channel]
      }
    }));
  }

  async function save() {
    try {
      const res = await updateNotificationPreferences(preferences);
      setPreferences(res.data);
      setMessage('Notification preferences saved.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Save failed.');
    }
  }

  async function testNotification() {
    try {
      await sendTestNotification({ channels: ['inApp', 'email', 'push'] });
      setMessage('Test notification processed. Check logs below.');
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Test failed.');
    }
  }

  if (!preferences) return <div className="card">Loading notification preferences...</div>;

  return (
    <section className="notion-page">
      <h1 className="page-title">Notification Preferences</h1>
      <p className="card-desc">Choose how CampusBeacon should notify you for claim, SOS, BCV, admin, and saved-search events.</p>

      <div className="notion-list">
        {groups.map(([key, label]) => {
          const value = preferences[key] || defaultChannel;
          return (
            <div className="notion-card" key={key}>
              <h3>{label}</h3>
              <label><input type="checkbox" checked={value.inApp} onChange={() => toggle(key, 'inApp')} /> In-app</label>{' '}
              <label><input type="checkbox" checked={value.email} onChange={() => toggle(key, 'email')} /> Email</label>{' '}
              <label><input type="checkbox" checked={value.push} onChange={() => toggle(key, 'push')} /> Push</label>
            </div>
          );
        })}
      </div>

      <div className="card-actions" style={{ marginTop: '15px' }}>
        <button className="btn-primary" onClick={save}>Save Preferences</button>
        <button className="btn-outline" onClick={testNotification}>Send Test Notification</button>
      </div>
      {message && <p className="error-msg">{message}</p>}

      <div className="notion-card" style={{ marginTop: '20px' }}>
        <h3>Recent Delivery Logs</h3>
        {logs.length === 0 ? <p>No delivery attempts yet.</p> : logs.slice(0, 10).map(log => (
          <p key={log._id}>
            <strong>{log.channel}</strong> - {log.status} - {log.trigger} - {new Date(log.createdAt).toLocaleString()}
          </p>
        ))}
      </div>
    </section>
  );
}
