// src/pages/WaterPage.js
import React, { useState, useEffect } from 'react';
import { waterAPI } from '../services/api';

export default function WaterPage() {
  const [glasses, setGlasses] = useState(0);
  const GOAL = 8;

  useEffect(() => {
    waterAPI.get().then(r => setGlasses(r.data.glasses)).catch(()=>{});
  }, []);

  const update = async (n) => {
    const g = Math.max(0, Math.min(n, 12));
    setGlasses(g);
    await waterAPI.update(g).catch(()=>{});
  };

  const pct = Math.min((glasses/GOAL)*100, 100);

  return (
    <div className="fade-in">
      <h2 style={{ fontSize:20, fontWeight:800, color:'var(--white)', marginBottom:4 }}>💧 Water Intake Tracker</h2>
      <p style={{ fontSize:12, color:'var(--muted)', marginBottom:24 }}>Stay hydrated — goal: 8 glasses per day</p>

      <div className="card" style={{ textAlign:'center', marginBottom:20, padding:'32px 24px' }}>
        <div style={{ fontSize:72, fontWeight:800, color: glasses>=GOAL ? 'var(--accent2)' : 'var(--accent)',
                      lineHeight:1, marginBottom:8 }}>{glasses}</div>
        <div style={{ fontSize:16, color:'var(--muted)', marginBottom:4 }}>glasses out of {GOAL} today</div>
        {glasses >= GOAL && (
          <div style={{ fontSize:14, color:'var(--accent2)', fontWeight:600, marginBottom:12 }}>
            🎉 Daily goal achieved! Excellent hydration!
          </div>
        )}
        <div style={{ height:12, background:'var(--border)', borderRadius:6, overflow:'hidden',
                      margin:'20px 0', maxWidth:400, marginLeft:'auto', marginRight:'auto' }}>
          <div style={{ height:'100%', borderRadius:6, transition:'width .5s',
                        width:`${pct}%`,
                        background:'linear-gradient(90deg,#00d4ff,#00ff9d)' }}/>
        </div>

        {/* Glass grid */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:10, justifyContent:'center', marginBottom:24 }}>
          {Array.from({length:GOAL}).map((_,i) => (
            <button key={i} onClick={() => update(i+1)} style={{
              width:52, height:64, borderRadius:8, border:`2px solid ${i<glasses?'var(--accent)':'rgba(0,212,255,.25)'}`,
              background: i<glasses ? 'rgba(0,212,255,.3)' : 'rgba(0,212,255,.05)',
              fontSize:22, cursor:'pointer', transition:'all .2s', display:'flex',
              alignItems:'center', justifyContent:'center',
            }}>
              {i < glasses ? '💧' : ''}
            </button>
          ))}
        </div>

        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button className="btn btn-primary" onClick={() => update(glasses+1)} disabled={glasses>=12}>
            + Add Glass
          </button>
          <button className="btn btn-ghost" onClick={() => update(glasses-1)} disabled={glasses<=0}>
            - Remove
          </button>
          <button className="btn btn-ghost" onClick={() => update(0)}>↺ Reset</button>
        </div>
      </div>

      {/* Benefits */}
      <div className="card">
        <div className="card-title">🌊 Why Hydration Matters</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {[
            ['🧠','Brain Function','Dehydration reduces concentration & mood'],
            ['💪','Physical Performance','Even 2% dehydration impairs exercise'],
            ['🫀','Heart Health','Proper hydration keeps blood viscosity healthy'],
            ['🌡️','Temperature','Water regulates body temperature via sweat'],
            ['🦷','Kidney Health','Flushes toxins, prevents kidney stones'],
            ['✨','Skin Glow','Keeps skin moisturized and elastic'],
          ].map(([icon,title,desc]) => (
            <div key={title} style={{ padding:12, borderRadius:10, background:'rgba(0,212,255,.04)',
                                      border:'1px solid rgba(0,212,255,.12)' }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--white)', marginBottom:2 }}>{title}</div>
              <div style={{ fontSize:11, color:'var(--muted)' }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
