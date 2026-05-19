// src/pages/TabletsPage.js
import React, { useState, useEffect } from 'react';
import { tabletsAPI } from '../services/api';

export default function TabletsPage() {
  const [tablets, setTablets] = useState([]);
  const [name, setName]       = useState('');
  const [time, setTime]       = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => tabletsAPI.getAll().then(r => setTablets(r.data.tablets)).catch(()=>{});
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await tabletsAPI.add(name, time).catch(()=>{});
    setName(''); setTime(''); load(); setLoading(false);
  };

  const toggle = async (id, taken) => {
    await tabletsAPI.update(id, !taken).catch(()=>{});
    load();
  };

  const remove = async (id) => {
    await tabletsAPI.remove(id).catch(()=>{});
    load();
  };

  const taken = tablets.filter(t => t.taken).length;

  return (
    <div className="fade-in">
      <h2 style={{ fontSize:20, fontWeight:800, color:'var(--white)', marginBottom:4 }}>💊 Tablet Reminders</h2>
      <p style={{ fontSize:12, color:'var(--muted)', marginBottom:24 }}>Track your daily medication schedule</p>

      {/* Progress */}
      <div className="card" style={{ marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
          <span style={{ fontSize:14, color:'var(--white)', fontWeight:600 }}>Today's Progress</span>
          <span style={{ fontSize:14, fontWeight:700, color: taken===tablets.length && tablets.length>0 ? 'var(--accent2)' : 'var(--accent)' }}>
            {taken}/{tablets.length} taken
          </span>
        </div>
        <div style={{ height:8, background:'var(--border)', borderRadius:4, overflow:'hidden' }}>
          <div style={{ height:'100%', borderRadius:4, transition:'width .5s',
                        width: tablets.length ? `${(taken/tablets.length)*100}%` : '0%',
                        background:'linear-gradient(90deg,var(--accent3),var(--accent))' }}/>
        </div>
      </div>

      {/* Add form */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-title">➕ Add Medicine</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:10 }}>
          <input className="input" placeholder="Medicine name (e.g. Paracetamol 500mg)"
            value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key==='Enter' && add()} />
          <input className="input" type="time" value={time}
            onChange={e => setTime(e.target.value)} style={{ width:130 }} />
          <button className="btn btn-primary" onClick={add} disabled={loading || !name.trim()}>
            {loading ? '…' : 'Add'}
          </button>
        </div>
      </div>

      {/* Tablet list */}
      <div className="card">
        <div className="card-title">📋 Today's Medicines</div>
        {tablets.length === 0 ? (
          <div style={{ textAlign:'center', padding:'32px', color:'var(--muted)' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>💊</div>
            No medicines added for today
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {tablets.map(t => (
              <div key={t.id} style={{
                display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
                borderRadius:10, background: t.taken ? 'rgba(0,255,157,.06)' : 'rgba(255,255,255,.03)',
                border: `1px solid ${t.taken ? 'rgba(0,255,157,.2)' : 'var(--border)'}`,
                transition:'all .2s',
              }}>
                <button onClick={() => toggle(t.id, t.taken)} style={{
                  width:28, height:28, borderRadius:8, border:'none',
                  background: t.taken ? 'var(--accent2)' : 'var(--border)',
                  color: t.taken ? '#000' : 'var(--muted)', fontSize:14,
                  cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0, transition:'all .2s',
                }}>
                  {t.taken ? '✓' : ''}
                </button>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color: t.taken ? 'var(--muted)' : 'var(--white)',
                                textDecoration: t.taken ? 'line-through' : 'none' }}>
                    💊 {t.name}
                  </div>
                  {t.time && <div style={{ fontSize:12, color:'var(--accent3)', marginTop:2 }}>🕐 {t.time}</div>}
                </div>
                <span style={{ fontSize:12, fontWeight:600, color: t.taken ? 'var(--accent2)' : 'var(--muted)' }}>
                  {t.taken ? 'TAKEN' : 'PENDING'}
                </span>
                <button onClick={() => remove(t.id)} style={{ background:'none', border:'none',
                  color:'var(--muted)', cursor:'pointer', fontSize:16, padding:4,
                  transition:'color .2s' }}
                  onMouseEnter={e=>e.target.style.color='var(--red)'}
                  onMouseLeave={e=>e.target.style.color='var(--muted)'}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rules */}
      <div className="card" style={{ marginTop:20, background:'linear-gradient(135deg,rgba(124,58,237,.08),rgba(0,212,255,.04))',
                                     border:'1px solid rgba(124,58,237,.2)' }}>
        <div className="card-title">📖 Tablet Usage Rules</div>
        {['Take medicines at the same time daily for best effectiveness.',
          'Swallow with a full glass of water — never crush without doctor advice.',
          'Never skip doses. If missed, take ASAP unless near next dose.',
          'Always complete full antibiotic course even if feeling better.',
          'Store in cool, dry place away from sunlight.',
          'Avoid alcohol with most medications.'].map((r,i) => (
          <div key={i} style={{ display:'flex', gap:10, marginBottom:8, fontSize:13, lineHeight:1.5 }}>
            <span style={{ color:'var(--accent3)', fontWeight:700 }}>{i+1}.</span>
            <span>{r}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
