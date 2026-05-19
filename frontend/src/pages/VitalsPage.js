// src/pages/VitalsPage.js
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { vitalsAPI } from '../services/api';

const FIELDS = [
  { key:'temperature',   label:'Temperature (°F)', icon:'🌡️', normal:'98.6',  unit:'°F',  color:'#ff7675' },
  { key:'heart_rate',    label:'Heart Rate (bpm)',  icon:'💓', normal:'60-100', unit:'bpm', color:'#fd79a8' },
  { key:'bp_systolic',   label:'Systolic BP',       icon:'🩺', normal:'120',   unit:'mmHg',color:'#74b9ff' },
  { key:'bp_diastolic',  label:'Diastolic BP',      icon:'🩺', normal:'80',    unit:'mmHg',color:'#a29bfe' },
  { key:'spo2',          label:'SpO2 (%)',           icon:'💨', normal:'>95',   unit:'%',   color:'#00cec9' },
  { key:'blood_sugar',   label:'Blood Sugar (mg/dL)',icon:'🍭', normal:'70-100',unit:'mg/dL',color:'#fdcb6e' },
];

export default function VitalsPage() {
  const [form, setForm]       = useState({});
  const [latest, setLatest]   = useState(null);
  const [history, setHistory] = useState([]);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  const load = () => {
    vitalsAPI.get()
      .then(r => { setLatest(r.data.latest); setHistory(r.data.history.reverse()); })
      .catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (Object.values(form).every(v => !v)) return;
    setSaving(true);
    try {
      await vitalsAPI.log(form);
      setSaved(true); setForm({});
      load();
      setTimeout(() => setSaved(false), 2000);
    } catch { alert('Failed to save vitals.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fade-in">
      <h2 style={{ fontSize:20, fontWeight:800, color:'var(--white)', marginBottom:4 }}>📈 Health Vitals</h2>
      <p style={{ fontSize:12, color:'var(--muted)', marginBottom:24 }}>Log and track your health metrics over time</p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* Log Form */}
        <div className="card">
          <div className="card-title">📝 Log New Vitals</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {FIELDS.map(({ key, label, icon, unit, normal }) => (
              <div className="input-group" key={key}>
                <div className="input-label">{icon} {label.toUpperCase()}</div>
                <input className="input" type="number" step="0.1"
                  placeholder={`Normal: ${normal} ${unit}`}
                  value={form[key] || ''}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={save}
            disabled={saving} style={{ width:'100%', marginTop:8, padding:12 }}>
            {saving ? 'Saving…' : saved ? '✅ Saved!' : 'Save Vitals'}
          </button>
        </div>

        {/* Latest Vitals */}
        <div className="card">
          <div className="card-title">⚡ Latest Reading</div>
          {latest ? (
            <>
              <div style={{ fontSize:11, color:'var(--muted)', marginBottom:12 }}>
                Recorded: {new Date(latest.recorded_at).toLocaleString()}
              </div>
              {FIELDS.map(({ key, label, icon, unit, color, normal }) => {
                const val = latest[key];
                if (!val) return null;
                return (
                  <div key={key} style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'center', padding:'8px 0',
                    borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                    <span style={{ fontSize:13, color:'var(--muted)' }}>{icon} {label}</span>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:14, fontWeight:700, color }}>{val} {unit}</div>
                      <div style={{ fontSize:10, color:'var(--muted)' }}>Normal: {normal}</div>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div style={{ padding:'32px', textAlign:'center', color:'var(--muted)' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📈</div>
              No vitals recorded yet. Log your first entry!
            </div>
          )}
        </div>
      </div>

      {/* Trend Chart */}
      {history.length > 1 && (
        <div className="card" style={{ marginTop:20 }}>
          <div className="card-title">📊 Vitals Trend</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={history}>
              <XAxis dataKey="recorded_at" hide />
              <YAxis hide />
              <Tooltip contentStyle={{ background:'var(--card)', border:'1px solid var(--border)',
                                       borderRadius:8, fontSize:11 }}
                labelStyle={{ color:'var(--muted)' }} />
              <Legend wrapperStyle={{ fontSize:12 }} />
              {FIELDS.filter(f => history.some(h => h[f.key])).slice(0,4).map(f => (
                <Line key={f.key} type="monotone" dataKey={f.key} stroke={f.color}
                  strokeWidth={2} dot={{ r:3 }} name={f.label} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Normal Ranges Reference */}
      <div className="card" style={{ marginTop:20 }}>
        <div className="card-title">📋 Normal Reference Ranges</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
          {FIELDS.map(({ key, label, icon, normal, unit, color }) => (
            <div key={key} style={{ padding:12, borderRadius:10,
              background:`${color}10`, border:`1px solid ${color}30` }}>
              <div style={{ fontSize:18, marginBottom:4 }}>{icon}</div>
              <div style={{ fontSize:12, color:'var(--muted)', marginBottom:4 }}>{label}</div>
              <div style={{ fontSize:16, fontWeight:700, color }}>{normal}</div>
              <div style={{ fontSize:11, color:'var(--muted)' }}>{unit}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
