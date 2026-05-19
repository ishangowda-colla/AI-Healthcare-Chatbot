// src/pages/BMIPage.js
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { bmiAPI } from '../services/api';
import { useLang } from '../context/LangContext';

export default function BMIPage() {
  const { lang }          = useLang();
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    bmiAPI.history().then(r => setHistory(r.data.history.reverse())).catch(()=>{});
  }, []);

  const calculate = async () => {
    if (!weight || !height) return;
    setLoading(true);
    try {
      const r = await bmiAPI.calculate(parseFloat(weight), parseFloat(height), lang);
      setResult(r.data);
      bmiAPI.history().then(r2 => setHistory(r2.data.history.reverse())).catch(()=>{});
    } catch { alert('Calculation failed.'); }
    finally { setLoading(false); }
  };

  const BMI_RANGES = [
    { label:'Underweight', range:'< 18.5', color:'#74B9FF', min:0,   max:18.5 },
    { label:'Normal',      range:'18.5–24.9', color:'#00B894', min:18.5, max:25 },
    { label:'Overweight',  range:'25–29.9', color:'#FDCB6E', min:25,  max:30 },
    { label:'Obese',       range:'≥ 30',   color:'#E17055', min:30,  max:50 },
  ];

  return (
    <div className="fade-in">
      <h2 style={{ fontSize:20, fontWeight:800, color:'var(--white)', marginBottom:4 }}>⚖️ BMI Calculator</h2>
      <p style={{ fontSize:12, color:'var(--muted)', marginBottom:24 }}>Body Mass Index — track your weight status over time</p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* Calculator */}
        <div>
          <div className="card" style={{ marginBottom:16 }}>
            <div className="card-title">📏 Calculate BMI</div>
            <div className="input-group">
              <div className="input-label">WEIGHT (kg)</div>
              <input className="input" type="number" placeholder="e.g. 65"
                value={weight} onChange={e => setWeight(e.target.value)} min="1" max="300" />
            </div>
            <div className="input-group">
              <div className="input-label">HEIGHT (cm)</div>
              <input className="input" type="number" placeholder="e.g. 170"
                value={height} onChange={e => setHeight(e.target.value)} min="50" max="250" />
            </div>
            <button className="btn btn-primary" onClick={calculate}
              disabled={loading || !weight || !height} style={{ width:'100%', padding:12 }}>
              {loading ? 'Calculating…' : 'Calculate BMI'}
            </button>

            {result && (
              <div style={{ marginTop:16, padding:16, borderRadius:12,
                            background:'rgba(0,212,255,.06)', border:'1px solid rgba(0,212,255,.2)',
                            textAlign:'center', animation:'fadeIn .4s ease' }}>
                <div style={{ fontSize:52, fontWeight:800, color:result.color }}>{result.bmi}</div>
                <div style={{ fontSize:16, fontWeight:600, color:'var(--white)', marginTop:4 }}>{result.category}</div>
                <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>
                  Weight: {result.weight}kg · Height: {result.height}cm
                </div>
                {/* BMI bar */}
                <div style={{ marginTop:14, height:8, background:'var(--border)', borderRadius:4, overflow:'hidden', position:'relative' }}>
                  <div style={{ position:'absolute', left:0, top:0, height:'100%', width:'37%', background:'#74B9FF', opacity:.6 }}/>
                  <div style={{ position:'absolute', left:'37%', top:0, height:'100%', width:'25%', background:'#00B894', opacity:.6 }}/>
                  <div style={{ position:'absolute', left:'62%', top:0, height:'100%', width:'15%', background:'#FDCB6E', opacity:.6 }}/>
                  <div style={{ position:'absolute', left:'77%', top:0, height:'100%', width:'23%', background:'#E17055', opacity:.6 }}/>
                  <div style={{
                    position:'absolute', top:-2, height:12, width:4, borderRadius:2,
                    background:'white', transition:'left .5s',
                    left:`${Math.min(98, Math.max(0, ((result.bmi-10)/30)*100))}%`,
                  }}/>
                </div>
              </div>
            )}
          </div>

          {/* Ranges */}
          <div className="card">
            <div className="card-title">📊 BMI Ranges</div>
            {BMI_RANGES.map(({label,range,color}) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between',
                                        padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:10, height:10, borderRadius:2, background:color }}/>
                  <span style={{ fontSize:13, color:'var(--text)' }}>{label}</span>
                </div>
                <span style={{ fontSize:13, color, fontWeight:600 }}>{range}</span>
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        <div className="card">
          <div className="card-title">📈 BMI History</div>
          {history.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="bmiG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="recorded_at" hide />
                <YAxis domain={[10,40]} hide />
                <Tooltip contentStyle={{ background:'var(--card)', border:'1px solid var(--border)',
                                         borderRadius:8, fontSize:12 }}
                  labelStyle={{ color:'var(--muted)' }} itemStyle={{ color:'var(--accent)' }}
                  formatter={(v) => [v, 'BMI']} />
                <ReferenceLine y={18.5} stroke="#74B9FF" strokeDasharray="3 3" />
                <ReferenceLine y={25} stroke="#00B894" strokeDasharray="3 3" />
                <ReferenceLine y={30} stroke="#FDCB6E" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="bmi" stroke="#00d4ff" fill="url(#bmiG)" strokeWidth={2}
                  dot={{ fill:'#00d4ff', r:4 }} activeDot={{ r:6 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:220, display:'flex', alignItems:'center', justifyContent:'center',
                          flexDirection:'column', gap:8, color:'var(--muted)' }}>
              <span style={{ fontSize:36 }}>⚖️</span>
              <span style={{ fontSize:13 }}>Calculate BMI to see history</span>
            </div>
          )}

          {history.length > 0 && (
            <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:6 }}>
              {history.slice(-5).reverse().map((h,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between',
                                      padding:'6px 10px', borderRadius:8,
                                      background:'rgba(255,255,255,.03)', fontSize:12 }}>
                  <span style={{ color:'var(--muted)' }}>{new Date(h.recorded_at).toLocaleDateString()}</span>
                  <span style={{ fontWeight:600, color:'var(--accent)' }}>BMI: {h.bmi}</span>
                  <span style={{ color:'var(--muted)' }}>{h.category}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
