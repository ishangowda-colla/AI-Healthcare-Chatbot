// src/pages/RegisterPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]     = useState({ username:'', email:'', password:'', confirm:'' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6)       { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center',
                  justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:420 }} className="fade-in">
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:64, height:64, borderRadius:18, margin:'0 auto 16px',
                        background:'linear-gradient(135deg,var(--accent),var(--accent2))',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:30, boxShadow:'0 0 32px rgba(0,212,255,.4)' }}>🏥</div>
          <h1 style={{ fontSize:26, fontWeight:800, color:'var(--white)' }}>Create Account</h1>
          <p style={{ fontSize:13, color:'var(--muted)', marginTop:4 }}>Join MediBot — Your AI Health Assistant</p>
        </div>

        <div className="card">
          {error && (
            <div style={{ padding:'10px 14px', borderRadius:8, marginBottom:16,
                          background:'rgba(255,71,87,.1)', border:'1px solid rgba(255,71,87,.3)',
                          color:'#ff4757', fontSize:13 }}>⚠️ {error}</div>
          )}
          <form onSubmit={submit}>
            {[
              {key:'username', label:'USERNAME', type:'text', ph:'Choose a username'},
              {key:'email',    label:'EMAIL',    type:'email', ph:'your@email.com'},
              {key:'password', label:'PASSWORD', type:'password', ph:'Min 6 characters'},
              {key:'confirm',  label:'CONFIRM PASSWORD', type:'password', ph:'Repeat password'},
            ].map(({key,label,type,ph}) => (
              <div className="input-group" key={key}>
                <div className="input-label">{label}</div>
                <input className="input" type={type} placeholder={ph}
                  value={form[key]} onChange={e => setForm(f=>({...f,[key]:e.target.value}))} required />
              </div>
            ))}
            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width:'100%', padding:'12px', fontSize:14, marginTop:4 }}>
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>
          <p style={{ textAlign:'center', marginTop:16, fontSize:13, color:'var(--muted)' }}>
            Already have an account? <Link to="/login" style={{color:'var(--accent)',textDecoration:'none',fontWeight:600}}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
