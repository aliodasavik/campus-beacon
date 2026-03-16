import React, { useState } from 'react';
import API from '../services/api';

const categories = ['Electronics','ID Cards','Keys','Clothing','Bags','Documents','Others'];
const statuses = ['Lost','Found'];

export default function CreatePost({ onSuccess }) {
  const [form, setForm] = useState({ title:'', description:'', category:'Electronics', status:'Lost', zone:'', sensitivity:'Low' });
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/items', form);
      setForm({ title:'', description:'', category:'Electronics', status:'Lost', zone:'', sensitivity:'Low' });
      window.dispatchEvent(new Event('refreshFeed'));
      if(onSuccess) onSuccess(); // Switch back to feed after posting
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error');
    }
  };

  return (
    <section className="notion-page">
      <h1 className="page-title">Report an Item</h1>
      <p className="page-subtitle">Fill out the details below so the campus community can help.</p>
      
      <form onSubmit={submit} className="notion-form">
        <input className="notion-input title-input" required placeholder="Item Title (e.g., Blue Backpack)" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} />
        <textarea className="notion-input" rows="4" placeholder="Detailed description..." value={form.description} onChange={e=>setForm({...form, description: e.target.value})} />
        
        <div className="form-row">
          <div className="input-group">
            <label>Category</label>
            <select className="notion-input" value={form.category} onChange={e=>setForm({...form, category: e.target.value})}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label>Status</label>
            <select className="notion-input" value={form.status} onChange={e=>setForm({...form, status: e.target.value})}>
              {statuses.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="input-group">
            <label>Zone / Location</label>
            <input className="notion-input" placeholder="e.g., Library 2nd Floor" value={form.zone} onChange={e=>setForm({...form, zone: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Sensitivity</label>
            <select className="notion-input" value={form.sensitivity} onChange={e=>setForm({...form, sensitivity: e.target.value})}>
              <option>Low</option><option>Medium</option><option>High</option>
            </select>
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{marginTop: '20px'}}>Submit Post</button>
      </form>
      {msg && <p className="error-msg">{msg}</p>}
    </section>
  );
}