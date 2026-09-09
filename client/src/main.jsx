import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import ReportMap from './components/ReportMap.jsx';
import 'leaflet/dist/leaflet.css';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const STATUSES = ['reported', 'verified', 'resolved'];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const imageUrl = (url) => url || '';

function App() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [auth, setAuth] = useState({ name: '', email: '', password: '' });
  const [form, setForm] = useState({ lat: '', lng: '', address: '', description: '', image: null });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('safepath_user') || 'null'); } catch { return null; } });

  function handleUnauthorized() {
    localStorage.removeItem('safepath_token');
    localStorage.removeItem('safepath_user');
    setUser(null);
    setStats(null);
    setMessage('Your session has expired. Please sign in again.');
  }

  async function loadReports() {
    try { setLoading(true); setError(''); const response = await fetch(`${API}/reports`); if (!response.ok) throw new Error('Unable to load reports'); setReports(await response.json()); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  async function loadStats() {
    const token = localStorage.getItem('safepath_token');
    if (!token || user?.role !== 'authority') return;
    const response = await fetch(`${API}/reports/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } });
    if (response.status === 401) return handleUnauthorized();
    if (response.ok) setStats(await response.json());
  }
  useEffect(() => { loadReports(); }, []);
  useEffect(() => { loadStats(); }, [user]);

  function locate() {
    if (!navigator.geolocation) return setMessage('Geolocation is not supported by this browser.');
    navigator.geolocation.getCurrentPosition(({ coords }) => { setForm(f => ({ ...f, lat: coords.latitude.toFixed(6), lng: coords.longitude.toFixed(6) })); setMessage('Current location added.'); }, () => setMessage('Location permission was not granted.'));
  }
  async function submitAuth(e) {
    e.preventDefault(); setMessage('');
    try {
      const endpoint = authMode === 'login' ? 'login' : 'register';
      const response = await fetch(`${API}/auth/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(auth) });
      const body = await response.json(); if (!response.ok) return setMessage(body.message || 'Authentication failed.');
      localStorage.setItem('safepath_token', body.token); localStorage.setItem('safepath_user', JSON.stringify(body.user));
      setUser(body.user); setAuth({ name: '', email: '', password: '' }); setMessage(`Welcome, ${body.user.name}.`);
    } catch { setMessage('Could not reach the SafePath API.'); }
  }
  function logout() { localStorage.removeItem('safepath_token'); localStorage.removeItem('safepath_user'); setUser(null); setStats(null); setMessage('Signed out.'); }
  async function submit(e) {
    e.preventDefault(); setMessage(''); const token = localStorage.getItem('safepath_token');
    if (!token) return setMessage('Please sign in before submitting a report.'); if (!form.image) return setMessage('Please choose a road image.');
    if (form.image.size > MAX_IMAGE_BYTES) return setMessage('Image must be 8 MB or smaller.');
    if (!Number.isFinite(Number(form.lat)) || !Number.isFinite(Number(form.lng))) return setMessage('Please provide valid latitude and longitude.');
    const data = new FormData(); data.append('image', form.image); data.append('lat', form.lat); data.append('lng', form.lng); data.append('address', form.address); data.append('description', form.description);
    try {
      setSubmitting(true);
      const response = await fetch(`${API}/reports`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: data }); const body = await response.json();
      if (response.status === 401) return handleUnauthorized();
      if (!response.ok) return setMessage(body.message || 'Report failed.');
      setMessage(body.ai?.available ? `Report submitted. AI detected ${body.ai.detections?.length || 0} object(s).` : 'Report submitted. AI analysis is currently unavailable.');
      setForm({ lat: '', lng: '', address: '', description: '', image: null }); e.target.reset(); await loadReports(); await loadStats();
    } catch { setMessage('Could not reach the SafePath API.'); }
    finally { setSubmitting(false); }
  }
  async function changeStatus(id, status) {
    const token = localStorage.getItem('safepath_token');
    const response = await fetch(`${API}/reports/${id}/status`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (response.status === 401) return handleUnauthorized();
    const body = await response.json(); if (!response.ok) return setMessage(body.message || 'Status update failed.');
    setReports(items => items.map(item => item._id === id ? body : item)); setMessage(`Report marked ${status}.`); loadStats();
  }
  const filteredReports = useMemo(() => filter === 'all' ? reports : reports.filter(r => r.status === filter), [reports, filter]);

  return <main>
    <nav><div className="brand"><span>●</span> SafePath</div><div className="nav-actions"><a href="#report">Report Issue</a><a href="#map">Map</a>{user?.role === 'authority' && <a href="#authority">Authority</a>}{user ? <button className="text-button" onClick={logout}>Sign out</button> : <a href="#account">Sign in</a>}</div></nav>
    <section className="hero"><div><p className="eyebrow">AI • COMMUNITY • SAFETY</p><h1>Make every road<br/><em>safer.</em></h1><p className="lead">Report potholes with a photo and location. SafePath uses AI-assisted analysis to turn road observations into actionable reports.</p><a className="button" href="#report">Report a pothole →</a></div><div className="hero-card"><div className="radar">⌁</div><strong>Road intelligence</strong><span>Image + location → AI analysis → report</span></div></section>
    <section className="stats"><div><b>{reports.length}</b><span>Community reports</span></div><div><b>{reports.filter(r => r.status === 'resolved').length}</b><span>Resolved issues</span></div><div><b>AI</b><span>Image analysis</span></div></section>
    {!user && <section id="account" className="panel compact"><div><p className="eyebrow">ACCOUNT</p><h2>{authMode === 'login' ? 'Sign in to SafePath' : 'Create your account'}</h2><p className="muted">Authentication is required to submit road reports.</p></div><form onSubmit={submitAuth}>{authMode === 'register' && <label>Name<input required value={auth.name} onChange={e => setAuth(a => ({ ...a, name: e.target.value }))}/></label>}<label>Email<input required type="email" value={auth.email} onChange={e => setAuth(a => ({ ...a, email: e.target.value }))}/></label><label>Password<input required minLength="8" type="password" value={auth.password} onChange={e => setAuth(a => ({ ...a, password: e.target.value }))}/></label><button className="button" type="submit">{authMode === 'login' ? 'Sign in' : 'Create account'}</button><button type="button" className="secondary" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>{authMode === 'login' ? 'Need an account?' : 'Already have an account?'}</button></form></section>}
    <section id="report" className="panel"><div><p className="eyebrow">NEW REPORT</p><h2>Report a road issue</h2><p className="muted">Upload a clear road image and provide its location.</p>{user && <p className="signed">Signed in as {user.name}</p>}</div><form onSubmit={submit}><label>Road image<input type="file" accept="image/jpeg,image/png,image/webp" required onChange={e => { const file = e.target.files?.[0] || null; setForm(f => ({ ...f, image: file })); setMessage(file && file.size > MAX_IMAGE_BYTES ? 'Image must be 8 MB or smaller.' : ''); }}/></label><div className="grid"><label>Latitude<input required value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))}/></label><label>Longitude<input required value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))}/></label></div><button type="button" className="secondary" onClick={locate}>Use my current location</button><label>Address<input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Street / area" maxLength="300"/></label><label>Description<textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the road issue" maxLength="1000"/></label><button className="button" type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit report'}</button>{message && <p className="notice">{message}</p>}</form></section>
    <section id="map" className="map-section"><div className="section-head"><div><p className="eyebrow">ROAD MAP</p><h2>Community issues, mapped.</h2></div><div className="filters">{['all', ...STATUSES].map(value => <button key={value} className={filter === value ? 'filter active' : 'filter'} onClick={() => setFilter(value)}>{value}</button>)}</div></div><ReportMap reports={filteredReports}/></section>
    {user?.role === 'authority' && <section id="authority" className="authority"><div className="section-head"><div><p className="eyebrow">AUTHORITY CONSOLE</p><h2>Resolve road reports.</h2><p className="muted">Only authority accounts can change report status.</p></div></div><div className="authority-stats">{[['total','Total'],['reported','Reported'],['verified','Verified'],['resolved','Resolved']].map(([key,label]) => <div key={key}><b>{stats?.[key] ?? '—'}</b><span>{label}</span></div>)}</div></section>}
    <section className="reports"><div className="section-head"><div><p className="eyebrow">LIVE FEED</p><h2>Recent community reports</h2></div><span className="result-count">{filteredReports.length} shown</span></div>{loading ? <p>Loading…</p> : error ? <p className="notice">{error}</p> : filteredReports.length === 0 ? <p className="muted">No reports match this filter.</p> : <div className="report-grid">{filteredReports.slice(0, 12).map(r => <article key={r._id}><div className="card-top"><span className={`status-badge ${r.status}`}>{r.status}</span>{r.imageUrl && <a href={imageUrl(r.imageUrl)} target="_blank" rel="noreferrer">View image</a>}</div><h3>{r.location.address || `${r.location.lat}, ${r.location.lng}`}</h3><p>{r.description || 'Road condition report'}</p>{r.ai?.available && <small>AI: {r.ai.detected ? `${r.ai.detections?.length || 0} detection(s)` : 'No pothole detected'}{r.ai.confidence != null ? ` · ${(r.ai.confidence * 100).toFixed(0)}% confidence` : ''}</small>}<small>{new Date(r.createdAt).toLocaleString()}</small>{user?.role === 'authority' && <div className="status-actions">{STATUSES.map(status => <button key={status} disabled={r.status === status} onClick={() => changeStatus(r._id, status)}>{status}</button>)}</div>}</article>)}</div>}</section>
    <footer>SafePath · AI-Based Road Condition Analysis and Alert System</footer>
  </main>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
