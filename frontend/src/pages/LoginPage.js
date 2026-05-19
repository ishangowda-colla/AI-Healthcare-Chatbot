// src/pages/LoginPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login }     = useAuth();
  const navigate      = useNavigate();
  const [form, setForm]     = useState({ username:'', password:'' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center',
                  justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:400 }} className="fade-in">

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:64, height:64, borderRadius:18, margin:'0 auto 16px',
                        background:'linear-gradient(135deg,var(--accent),var(--accent2))',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:30, boxShadow:'0 0 32px rgba(0,212,255,.4)' }}>🏥</div>
          <h1 style={{ fontSize:28, fontWeight:800, color:'var(--white)' }}>
            Medi<span style={{color:'var(--accent)'}}>Bot</span>
          </h1>
          <p style={{ fontSize:13, color:'var(--muted)', marginTop:4 }}>
            AI Healthcare Assistant · Final Year Project
          </p>
        </div>

        <div className="card">
          <h2 style={{ fontSize:18, fontWeight:700, color:'var(--white)', marginBottom:20 }}>
            Sign In
          </h2>

          {error && (
            <div style={{ padding:'10px 14px', borderRadius:8, marginBottom:16,
                          background:'rgba(255,71,87,.1)', border:'1px solid rgba(255,71,87,.3)',
                          color:'#ff4757', fontSize:13 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={submit}>
            <div className="input-group">
              <div className="input-label">USERNAME</div>
              <input className="input" placeholder="Enter username"
                value={form.username} onChange={e => setForm(f=>({...f,username:e.target.value}))} required />
            </div>
            <div className="input-group">
              <div className="input-label">PASSWORD</div>
              <input className="input" type="password" placeholder="Enter password"
                value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width:'100%', padding:'12px', fontSize:14, marginTop:4 }}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <p style={{ textAlign:'center', marginTop:16, fontSize:13, color:'var(--muted)' }}>
            No account? <Link to="/register" style={{color:'var(--accent)',textDecoration:'none',fontWeight:600}}>Register here</Link>
          </p>
        </div>

        <p style={{ textAlign:'center', marginTop:20, fontSize:11, color:'var(--muted)', lineHeight:1.6 }}>
          ⚠️ MediBot provides health guidance only — not medical diagnosis.<br/>
          Always consult a qualified doctor for treatment.
        </p>
      </div>
    </div>
  );
}
