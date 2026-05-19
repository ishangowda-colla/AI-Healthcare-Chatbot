// src/pages/DiseasesPage.js
import React, { useState, useEffect } from 'react';
import { miscAPI } from '../services/api';
import { useLang } from '../context/LangContext';

export default function DiseasesPage() {
  const { lang }              = useLang();
  const [diseases, setDiseases] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail]   = useState(null);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    miscAPI.diseases().then(r => setDiseases(r.data.diseases)).catch(() => {});
  }, []);

  const openDisease = async (name) => {
    setSelected(name); setDetail(null); setLoading(true);
    try {
      const r = await miscAPI.disease(name, lang);
      setDetail(r.data);
    } catch { setDetail(null); }
    finally { setLoading(false); }
  };

  const filtered = diseases.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || d.severity === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="fade-in">
      <h2 style={{ fontSize:20, fontWeight:800, color:'var(--white)', marginBottom:4 }}>🔬 Disease Encyclopedia</h2>
      <p style={{ fontSize:12, color:'var(--muted)', marginBottom:20 }}>
        {diseases.length} diseases in knowledge base · Click any card to see full details
      </p>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <input className="input" placeholder="🔍 Search diseases…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth:280, padding:'9px 14px' }} />
        {['all','high','medium','low'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`btn ${filter===f?'btn-primary':'btn-ghost'}`}
            style={{ padding:'8px 16px', fontSize:12, textTransform:'capitalize' }}>
            {f === 'all' ? 'All' : f === 'high' ? '🔴 High Risk' : f === 'medium' ? '🟡 Medium' : '🟢 Low Risk'}
          </button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns: detail ? '1fr 1fr' : 'repeat(auto-fill,minmax(200px,1fr))', gap:16 }}>
        {/* Disease cards */}
        <div style={{ display:'grid', gridTemplateColumns: detail ? '1fr' : 'subgrid', gap:12,
                      gridColumn: detail ? '1' : '1/-1',
                      ...(detail ? { display:'flex', flexDirection:'column', gap:10 } : {}) }}>
          {filtered.map(d => (
            <div key={d.name} onClick={() => openDisease(d.name)} style={{
              padding: detail ? '10px 14px' : '16px',
              borderRadius:'var(--r)', cursor:'pointer',
              background: selected===d.name ? `${d.color}15` : 'var(--card)',
              border:`1px solid ${selected===d.name ? d.color : 'var(--border)'}`,
              transition:'all .2s',
              display:'flex', alignItems: detail ? 'center' : 'flex-start',
              gap:10, flexDirection: detail ? 'row' : 'column',
            }}
              onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.borderColor=d.color; }}
              onMouseLeave={e=>{ if(selected!==d.name){ e.currentTarget.style.transform='none'; e.currentTarget.style.borderColor='var(--border)'; } }}>
              <div style={{ fontSize: detail ? 22 : 32, flexShrink:0 }}>{d.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize: detail ? 13 : 15, fontWeight:700, color:'var(--white)',
                              textTransform:'capitalize', marginBottom: detail ? 0 : 4 }}>{d.name}</div>
                {!detail && (
                  <div style={{ fontSize:11, color:'var(--muted)' }}>{d.symptom_count} symptoms tracked</div>
                )}
              </div>
              <span className={`badge badge-${d.severity}`}>{d.severity}</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding:32, textAlign:'center', color:'var(--muted)', gridColumn:'1/-1' }}>
              No diseases found for "{search}"
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {detail && (
          <div className="card fade-in" style={{ border:`1px solid ${detail.color}30`, alignSelf:'start' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
              <span style={{ fontSize:40 }}>{detail.icon}</span>
              <div>
                <h3 style={{ fontSize:20, fontWeight:800, color:'var(--white)', textTransform:'capitalize' }}>
                  {detail.name}
                </h3>
                <span className={`badge badge-${detail.severity}`}>{detail.severity} risk</span>
              </div>
              <button onClick={() => { setSelected(null); setDetail(null); }}
                style={{ marginLeft:'auto', background:'none', border:'none',
                         color:'var(--muted)', cursor:'pointer', fontSize:20 }}>✕</button>
            </div>

            {loading ? (
              <div style={{ textAlign:'center', padding:32 }}><div className="spinner" style={{ margin:'0 auto' }}/></div>
            ) : (
              <>
                <div style={{ marginBottom:16 }}>
                  <div className="section-title">💬 Medical Advice</div>
                  <p style={{ fontSize:13, lineHeight:1.7, color:'var(--text)' }}>{detail.advice}</p>
                </div>

                <div style={{ marginBottom:16 }}>
                  <div className="section-title">🔍 Symptoms</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {detail.symptoms.map(s => (
                      <span key={s} style={{ padding:'3px 10px', borderRadius:20, fontSize:11,
                        background:`${detail.color}15`, border:`1px solid ${detail.color}30`,
                        color:'var(--text)' }}>{s}</span>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom:16 }}>
                  <div className="section-title">🛡️ Precautions</div>
                  {detail.precautions.map((p,i) => (
                    <div key={i} style={{ display:'flex', gap:8, marginBottom:6, fontSize:13 }}>
                      <span style={{ color:'var(--accent2)', fontWeight:700 }}>•</span>{p}
                    </div>
                  ))}
                </div>

                <div>
                  <div className="section-title">💊 Common Medicines</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {detail.common_meds.map(m => (
                      <span key={m} style={{ padding:'4px 10px', borderRadius:20, fontSize:12,
                        background:'rgba(0,212,255,.1)', border:'1px solid rgba(0,212,255,.2)',
                        color:'var(--accent)' }}>{m}</span>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop:16, padding:'12px 14px', borderRadius:10,
                              background: detail.severity === 'high'
                                ? 'rgba(255,71,87,.08)'
                                : detail.severity === 'medium'
                                ? 'rgba(253,203,110,.06)'
                                : 'rgba(0,184,148,.06)',
                              border: detail.severity === 'high'
                                ? '1px solid rgba(255,71,87,.35)'
                                : detail.severity === 'medium'
                                ? '1px solid rgba(253,203,110,.25)'
                                : '1px solid rgba(0,184,148,.25)',
                              display:'flex', alignItems:'flex-start', gap:10 }}>
                  <span style={{ fontSize:20, flexShrink:0 }}>
                    {detail.severity === 'high' ? '🚨' : detail.severity === 'medium' ? '⚠️' : 'ℹ️'}
                  </span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:700, marginBottom:4,
                      color: detail.severity === 'high' ? '#ff4757'
                           : detail.severity === 'medium' ? 'var(--accent2)'
                           : 'var(--accent)' }}>
                      {detail.severity === 'high'
                        ? '🏥 Urgent — Consult Doctor Immediately'
                        : detail.severity === 'medium'
                        ? '👨‍⚕️ See a Doctor if Symptoms Persist'
                        : '💊 Self-Care with Doctor Checkup'}
                    </div>
                    <div style={{ fontSize:12, color:'var(--text)', lineHeight:1.6 }}>
                      {detail.severity === 'high'
                        ? 'This is a HIGH RISK condition. Please visit a doctor or hospital without delay. Do NOT self-medicate with prescription drugs.'
                        : detail.severity === 'medium'
                        ? 'Monitor your symptoms. If they persist for more than 2 days or worsen, consult a doctor for proper diagnosis and treatment.'
                        : 'This condition can often be managed with self-care. However, if you are unsure, a doctor visit is always recommended.'}
                    </div>
                    {detail.severity === 'high' && (
                      <div style={{ display:'flex', gap:8, marginTop:10 }}>
                        <a href="tel:108" style={{ padding:'6px 14px', borderRadius:8,
                          background:'rgba(255,71,87,.15)', color:'#ff4757', fontWeight:700,
                          fontSize:12, textDecoration:'none', border:'1px solid rgba(255,71,87,.3)' }}>
                          📞 Call 108 (Ambulance)
                        </a>
                        <a href="tel:104" style={{ padding:'6px 14px', borderRadius:8,
                          background:'rgba(255,71,87,.08)', color:'#ff4757',
                          fontSize:12, textDecoration:'none', border:'1px solid rgba(255,71,87,.2)' }}>
                          📞 104 (Health Helpline)
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop:12, padding:'10px 12px', borderRadius:8,
                              background:'rgba(253,203,110,.06)', border:'1px solid rgba(253,203,110,.2)',
                              fontSize:11, color:'var(--muted)' }}>
                  ⚠️ Always consult a qualified doctor before taking any medication.
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
