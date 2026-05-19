// src/pages/DashboardPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { miscAPI, bmiAPI, waterAPI, tabletsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ icon, label, value, sub, color, onClick }) => (
  <div className="card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default',
    transition:'all .2s', borderColor: color ? `${color}30` : 'var(--border)' }}
    onMouseEnter={e => { if(onClick) e.currentTarget.style.transform='translateY(-2px)'; }}
    onMouseLeave={e => e.currentTarget.style.transform='none'}>
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
      <div>
        <div style={{ fontSize:11, color:'var(--muted)', letterSpacing:'1px', marginBottom:8 }}>{label}</div>
        <div style={{ fontSize:28, fontWeight:800, color: color || 'var(--white)' }}>{value}</div>
        {sub && <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>{sub}</div>}
      </div>
      <div style={{ fontSize:28 }}>{icon}</div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { user }        = useAuth();
  const navigate        = useNavigate();
  const [dash, setDash] = useState(null);
  const [bmiH, setBmiH] = useState([]);
  const [tips, setTips] = useState([]);
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => {
    miscAPI.dashboard().then(r => setDash(r.data)).catch(()=>{});
    bmiAPI.history().then(r => setBmiH(r.data.history.slice(0,7).reverse())).catch(()=>{});
    miscAPI.tips('en').then(r => setTips(r.data.tips)).catch(()=>{});
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTipIdx(i => (i+1) % (tips.length || 1)), 6000);
    return () => clearInterval(id);
  }, [tips]);

  const QUICK = [
    { icon:'🩺', label:'AI Chat',   desc:'Describe symptoms',   to:'/chat',     color:'#00d4ff' },
    { icon:'💊', label:'Tablets',   desc:'Medicine reminders',  to:'/tablets',  color:'#7c3aed' },
    { icon:'💧', label:'Water',     desc:'Track hydration',     to:'/water',    color:'#00b894' },
    { icon:'⚖️', label:'BMI Check', desc:'Calculate your BMI',  to:'/bmi',      color:'#fdcb6e' },
    { icon:'📈', label:'Vitals',    desc:'Log health metrics',  to:'/vitals',   color:'#fd79a8' },
    { icon:'🔬', label:'Diseases',  desc:'Knowledge base',      to:'/diseases', color:'#a29bfe' },
  ];

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:24, fontWeight:800, color:'var(--white)' }}>
          Good {new Date().getHours()<12?'Morning':new Date().getHours()<17?'Afternoon':'Evening'}, {user?.username} 👋
        </h1>
        <p style={{ fontSize:13, color:'var(--muted)', marginTop:4 }}>
          Here's your health overview for {new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
        </p>
      </div>

      {/* Tip Banner */}
      {tips.length > 0 && (
        <div style={{ marginBottom:24, padding:'14px 20px', borderRadius:'var(--r)',
                      background:'linear-gradient(135deg,rgba(0,212,255,.08),rgba(0,255,157,.04))',
                      border:'1px solid rgba(0,212,255,.2)', fontSize:13, color:'var(--text)',
                      display:'flex', alignItems:'center', gap:12 }}>
          <span style={{fontSize:20}}>💡</span>
          <span style={{ flex:1 }}>{tips[tipIdx]}</span>
        </div>
      )}

      {/* Stats Row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:24 }}>
        <StatCard icon="💧" label="WATER TODAY"
          value={`${dash?.water?.glasses ?? '—'}/8`}
          sub="glasses consumed"
          color={dash?.water?.glasses >= 8 ? '#00b894' : '#00d4ff'}
          onClick={() => navigate('/water')} />
        <StatCard icon="💊" label="TABLETS TODAY"
          value={`${dash?.tablets?.taken ?? '—'}/${dash?.tablets?.total ?? '—'}`}
          sub="doses taken"
          color="#7c3aed"
          onClick={() => navigate('/tablets')} />
        <StatCard icon="⚖️" label="LATEST BMI"
          value={dash?.latest_bmi?.bmi ?? '—'}
          sub={dash?.latest_bmi?.category ?? 'Not measured yet'}
          color="#fdcb6e"
          onClick={() => navigate('/bmi')} />
        <StatCard icon="💬" label="CHAT SESSIONS"
          value={dash?.chat_sessions ?? '—'}
          sub="total conversations"
          color="#a29bfe"
          onClick={() => navigate('/chat')} />
      </div>

      {/* BMI Chart + Vitals */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
        <div className="card">
          <div className="card-title">📊 BMI Trend</div>
          {bmiH.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={bmiH}>
                <defs>
                  <linearGradient id="bmiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="recorded_at" hide />
                <YAxis domain={['auto','auto']} hide />
                <Tooltip contentStyle={{ background:'var(--card)', border:'1px solid var(--border)',
                                         borderRadius:8, fontSize:12 }}
                  labelStyle={{ color:'var(--muted)' }} itemStyle={{ color:'var(--accent)' }} />
                <Area type="monotone" dataKey="bmi" stroke="#00d4ff" fill="url(#bmiGrad)" strokeWidth={2} dot={{ fill:'#00d4ff', r:4 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:180, display:'flex', alignItems:'center', justifyContent:'center',
                          color:'var(--muted)', fontSize:13 }}>
              No BMI data yet. <button className="btn btn-ghost" onClick={() => navigate('/bmi')}
                style={{ marginLeft:8, padding:'4px 10px', fontSize:12 }}>Calculate →</button>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">📈 Latest Vitals</div>
          {dash?.latest_vitals ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { label:'🌡️ Temperature', val:`${dash.latest_vitals.temperature || '—'}°F`, norm:'98.6°F' },
                { label:'💓 Heart Rate', val:`${dash.latest_vitals.heart_rate || '—'} bpm`, norm:'60-100' },
                { label:'🩺 Blood Pressure', val:`${dash.latest_vitals.bp_systolic||'—'}/${dash.latest_vitals.bp_diastolic||'—'}`, norm:'120/80' },
                { label:'💨 SpO2', val:`${dash.latest_vitals.spo2 || '—'}%`, norm:'>95%' },
              ].map(({label,val,norm}) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between',
                                          padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                  <span style={{ fontSize:12, color:'var(--muted)' }}>{label}</span>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--accent2)' }}>{val}</div>
                    <div style={{ fontSize:10, color:'var(--muted)' }}>Normal: {norm}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
                          color:'var(--muted)', fontSize:13, flexDirection:'column', gap:12, padding:'20px 0' }}>
              <span style={{ fontSize:36 }}>📈</span>
              No vitals recorded yet
              <button className="btn btn-ghost" onClick={() => navigate('/vitals')}
                style={{ padding:'6px 14px', fontSize:12 }}>Log Vitals →</button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Nav */}
      <div className="card-title" style={{ marginBottom:12 }}>⚡ Quick Access</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12 }}>
        {QUICK.map(({ icon, label, desc, to, color }) => (
          <div key={to} onClick={() => navigate(to)} style={{
            padding:'16px', borderRadius:'var(--r)', cursor:'pointer',
            background:'var(--card)', border:`1px solid ${color}25`,
            transition:'all .2s',
          }}
            onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.borderColor=`${color}60`; }}
            onMouseLeave={e=>{ e.currentTarget.style.transform='none'; e.currentTarget.style.borderColor=`${color}25`; }}>
            <div style={{ fontSize:28, marginBottom:8 }}>{icon}</div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--white)', marginBottom:3 }}>{label}</div>
            <div style={{ fontSize:11, color:'var(--muted)' }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
