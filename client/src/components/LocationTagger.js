import React, { useEffect, useState } from 'react';
import { getCampusZones, getItemLocation, updateItemLocation } from '../services/campusOperationsApi';

export default function LocationTagger({ itemId, defaultZone = '', onSaved }) {
  const [zones, setZones] = useState([]);
  const [form, setForm] = useState({
    zone: defaultZone,
    building: '',
    floor: '',
    description: '',
    lat: '',
    lng: '',
    precision: 'zone'
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    getCampusZones().then(res => setZones(res.data || [])).catch(() => setZones([]));
    if (itemId) {
      getItemLocation(itemId)
        .then(res => {
          const location = res.data;
          setForm({
            zone: location.zone || defaultZone,
            building: location.building || '',
            floor: location.floor || '',
            description: location.description || '',
            lat: location.coordinates?.lat || '',
            lng: location.coordinates?.lng || '',
            precision: location.precision || 'zone'
          });
        })
        .catch(() => {});
    }
  }, [itemId, defaultZone]);

  async function submit(e) {
    e.preventDefault();
    try {
      const res = await updateItemLocation(itemId, form);
      setMessage('Location saved.');
      if (onSaved) onSaved(res.data);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Location save failed.');
    }
  }

  return (
    <form className="notion-form" onSubmit={submit}>
      <h3>Campus Zone and Coordinates</h3>
      <div className="form-row">
        <div className="input-group">
          <label>Zone</label>
          <input className="notion-input" list="campus-zones" value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} required />
          <datalist id="campus-zones">
            {zones.map(zone => <option key={zone._id} value={zone.name} />)}
          </datalist>
        </div>
        <div className="input-group">
          <label>Precision</label>
          <select className="notion-input" value={form.precision} onChange={e => setForm({ ...form, precision: e.target.value })}>
            <option value="zone">Zone</option>
            <option value="building">Building</option>
            <option value="floor">Floor</option>
            <option value="exact">Exact</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <input className="notion-input" placeholder="Building" value={form.building} onChange={e => setForm({ ...form, building: e.target.value })} />
        <input className="notion-input" placeholder="Floor" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} />
      </div>
      <div className="form-row">
        <input className="notion-input" placeholder="Latitude (optional)" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} />
        <input className="notion-input" placeholder="Longitude (optional)" value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} />
      </div>
      <textarea className="notion-input" placeholder="Extra location notes" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      <button className="btn-primary" type="submit">Save Location</button>
      {message && <p className="error-msg">{message}</p>}
    </form>
  );
}
