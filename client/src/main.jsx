import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ lat: '', lng: '', address: '', description: '', image: null });
  const [message, setMessage] = useState('');

  async function loadReports() {
    try {
      setLoading(true);
      const response = await fetch(`${API}/reports`);
      if (!response.ok) throw new Error('Unable to load reports');
      setReports(await response.json());
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  useEffect(() => { loadReports(); }, []);

  function locate() {
    if (!navigator.geolocation) return setMessage('Geolocation is not supported by this browser.');
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setForm(f => ({ ...f, lat: coords.latitude.toFixed(6), lng: coords.longitude.toFixed(6) }));
      setMessage('Current location added.');
    }, () => setMessage('Location permission was not granted.'));
  }

  async function submit(e) {
    e.preventDefault();
    setMessage('');
    const token = localStorage.getItem('safepath_token');
    if (!token) return setMessage('Please log in through the API before submitting a report.');
    const data = new FormData();
    data.append('image', form.image);
    data.append('lat', form.lat); data.append('lng', form.lng);
    data.append('address', form.address); data.append('description', form.description);
    const response = await fetch(`${API}/reports`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: data });
    const body = await response.json();
    if (!response.ok) return setMessage(body.message || 'Report failed.');
    setMessage(body.ai?.available ? `Report submitted. AI detected: ${body.ai.detected ? 'pothole candidate' : 'no pothole detected'}.` : 'Report submitted. AI service is currently unavailable.');
    setForm({ lat: '', lng: '', address: '', description: '', image: null });
    e.target.reset();
    loadReports();
  }

  return <main>
    <nav><div className="brand"><span>●</span> SafePath</div><a href="#report">Report Road Issue</a></nav>
    <section className="hero"><div><p className="eyebrow">AI • COMMUNITY • SAFETY</p><h1>Make every road<br/><em>safer.</em></h1><p className="lead">Report potholes with a photo and location. SafePath uses AI-assisted analysis to turn road observations into actionable reports.</p><a className="button" href="#report">Report a pothole →</a></div><div className="hero-card"><div className="radar">⌁</div><strong>Road intelligence</strong><span>Image + location → AI analysis → report</span></div></section>
    <section className="stats"><div><b>{reports.length}</b><span>Community reports</span></div><div><b>AI</b><span>Image analysis</span></div><div><b>24/7</b><span>Digital reporting</span></div></section>
    <section id="report" className="panel"><div><p className="eyebrow">NEW REPORT</p><h2>Report a road issue</h2><p className="muted">Upload a clear road image and provide its location. Sign in to submit.</p></div><form onSubmit={submit}>
      <label>Road image<input type="file" accept="image/jpeg,image/png,image/webp" required onChange={e => setForm(f => ({ ...f, image: e.target.files[0] }))}/></label>
      <div className="grid"><label>Latitude<input required value={form.lat} onChange={e => setForm(f => ({...f,lat:e.target.value}))}/></label><label>Longitude<input required value={form.lng} onChange={e => setForm(f => ({...f,lng:e.target.value}))}/></label></div>
      <button type="button" className="secondary" onClick={locate}>Use my current location</button>
      <label>Address<input value={form.address} onChange={e => setForm(f => ({...f,address:e.target.value}))} placeholder="Street / area"/></label>
      <label>Description<textarea value={form.description} onChange={e => setForm(f => ({...f,description:e.target.value}))} placeholder="Describe the road issue"/></label>
      <button className="button" type="submit">Submit report</button>
      {message && <p className="notice">{message}</p>}
    </form></section>
    <section className="reports"><p className="eyebrow">LIVE FEED</p><h2>Recent community reports</h2>{loading ? <p>Loading…</p> : error ? <p className="notice">{error}</p> : reports.length === 0 ? <p className="muted">No reports yet. Be the first to report a road issue.</p> : <div className="report-grid">{reports.slice(0, 9).map(r => <article key={r._id}><span>{r.status}</span><h3>{r.location.address || `${r.location.lat}, ${r.location.lng}`}</h3><p>{r.description || 'Road condition report'}</p><small>{new Date(r.createdAt).toLocaleString()}</small></article>)}</div>}</section>
    <footer>SafePath · AI-Based Road Condition Analysis and Alert System</footer>
  </main>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
