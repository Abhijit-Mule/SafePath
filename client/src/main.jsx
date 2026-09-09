import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [auth, setAuth] = useState({ name: '', email: '', password: '' });
  const [form, setForm] = useState({ lat: '', lng: '', address: '', description: '', image: null });
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('safepath_user') || 'null'); } catch { return null; }
  });

  async function loadReports() {
    try {
      setLoading(true); setError('');
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

  async function submitAuth(e) {
    e.preventDefault(); setMessage('');
    const endpoint = authMode === 'login' ? 'login' : 'register';
    const response = await fetch(`${API}/auth/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(auth) });
    const body = await response.json();
    if (!response.ok) return setMessage(body.message || 'Authentication failed.');
    localStorage.setItem('safepath_token', body.token);
    localStorage.setItem('safepath_user', JSON.stringify(body.user));
    setUser(body.user); setAuth({ name: '', email: '', password: '' }); setMessage(`Welcome, ${body.user.name}.`);
  }

  function logout() {
    localStorage.removeItem('safepath_token'); localStorage.removeItem('safepath_user');
    setUser(null); setMessage('Signed out.');
  }

  async function submit(e) {
    e.preventDefault(); setMessage('');
    const token = localStorage.getItem('safepath_token');
    if (!token) return setMessage('Please sign in before submitting a report.');
    if (!form.image) return setMessage('Please choose a road image.');
    const data = new FormData();
    data.append('image', form.image); data.append('lat', form.lat); data.append('lng', form.lng);
    data.append('address', form.address); data.append('description', form.description);
    try {
      const response = await fetch(`${API}/reports`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: data });
      const body = await response.json();
      if (!response.ok) return setMessage(body.message || 'Report failed.');
      setMessage(body.ai?.available ? `Report submitted. AI detected ${body.ai.detections?.length || 0} object(s).` : 'Report submitted. AI analysis is unavailable until the model service is configured.');
      setForm({ lat: '', lng: '', address: '', description: '', image: null }); e.target.reset(); loadReports();
    } catch { setMessage('Could not reach the SafePath API.'); }
  }

  return <main>
    <nav><div className="brand"><span>●</span> SafePath</div><div className="nav-actions"><a href="#report">Report Issue</a>{user ? <button className="text-button" onClick={logout}>Sign out</button> : <a href="#account">Sign in</a>}</div></nav>
    <section className="hero"><div><p className="eyebrow">AI • COMMUNITY • SAFETY</p><h1>Make every road<br/><em>safer.</em></h1><p className="lead">Report potholes with a photo and location. SafePath uses AI-assisted analysis to turn road observations into actionable reports.</p><a className="button" href="#report">Report a pothole →</a></div><div className="hero-card"><div className="radar">⌁</div><strong>Road intelligence</strong><span>Image + location → AI analysis → report</span></div></section>
    <section className="stats"><div><b>{reports.length}</b><span>Community reports</span></div><div><b>AI</b><span>Image analysis</span></div><div><b>24/7</b><span>Digital reporting</span></div></section>
    {!user && <section id="account" className="panel compact"><div><p className="eyebrow">ACCOUNT</p><h2>{authMode === 'login' ? 'Sign in to SafePath' : 'Create your account'}</h2><p className="muted">Authentication is required to submit road reports.</p></div><form onSubmit={submitAuth}>{authMode === 'register' && <label>Name<input required value={auth.name} onChange={e => setAuth(a => ({...a,name:e.target.value}))}/></label>}<label>Email<input required type="email" value={auth.email} onChange={e => setAuth(a => ({...a,email:e.target.value}))}/></label><label>Password<input required minLength="8" type="password" value={auth.password} onChange={e => setAuth(a => ({...a,password:e.target.value}))}/></label><button className="button" type="submit">{authMode === 'login' ? 'Sign in' : 'Create account'}</button><button type="button" className="secondary" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>{authMode === 'login' ? 'Need an account?' : 'Already have an account?'}</button></form></section>}
    <section id="report" className="panel"><div><p className="eyebrow">NEW REPORT</p><h2>Report a road issue</h2><p className="muted">Upload a clear road image and provide its location.</p>{user && <p className="signed">Signed in as {user.name}</p>}</div><form onSubmit={submit}><label>Road image<input type="file" accept="image/jpeg,image/png,image/webp" required onChange={e => setForm(f => ({ ...f, image: e.target.files?.[0] || null }))}/></label><div className="grid"><label>Latitude<input required value={form.lat} onChange={e => setForm(f => ({...f,lat:e.target.value}))}/></label><label>Longitude<input required value={form.lng} onChange={e => setForm(f => ({...f,lng:e.target.value}))}/></label></div><button type="button" className="secondary" onClick={locate}>Use my current location</button><label>Address<input value={form.address} onChange={e => setForm(f => ({...f,address:e.target.value}))} placeholder="Street / area"/></label><label>Description<textarea value={form.description} onChange={e => setForm(f => ({...f,description:e.target.value}))} placeholder="Describe the road issue"/></label><button className="button" type="submit">Submit report</button>{message && <p className="notice">{message}</p>}</form></section>
    <section className="reports"><p className="eyebrow">LIVE FEED</p><h2>Recent community reports</h2>{loading ? <p>Loading…</p> : error ? <p className="notice">{error}</p> : reports.length === 0 ? <p className="muted">No reports yet. Be the first to report a road issue.</p> : <div className="report-grid">{reports.slice(0, 9).map(r => <article key={r._id}><span>{r.status}</span><h3>{r.location.address || `${r.location.lat}, ${r.location.lng}`}</h3><p>{r.description || 'Road condition report'}</p><small>{new Date(r.createdAt).toLocaleString()}</small></article>)}</div>}</section>
    <footer>SafePath · AI-Based Road Condition Analysis and Alert System</footer>
  </main>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
