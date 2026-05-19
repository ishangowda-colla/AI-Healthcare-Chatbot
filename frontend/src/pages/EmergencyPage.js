// src/pages/EmergencyPage.js
import React from 'react';

const CONTACTS = [
  { name:'🚑 Ambulance',        number:'108',          desc:'Free ambulance service across India' },
  { name:'🆘 National Emergency', number:'112',        desc:'Police, Fire, Medical — all in one' },
  { name:'👮 Police',            number:'100',          desc:'Law enforcement emergency' },
  { name:'🔥 Fire Brigade',      number:'101',          desc:'Fire & rescue emergency' },
  { name:'👩‍⚕️ Women Helpline',   number:'181',          desc:'Women in distress' },
  { name:'🧠 Mental Health',     number:'iCall: 9152987821', desc:'Free mental health counselling' },
  { name:'☠️ Poison Control',    number:'1800-11-6117', desc:'National Poison Information Centre' },
  { name:'🏥 Health Helpline',   number:'104',          desc:'Health information & advice' },
];

const FIRST_AID = [
  { title:'Heart Attack', icon:'💔', color:'#ff4757',
    steps:['Call 108 immediately','Keep person calm and still',
           'Loosen tight clothing','Give aspirin if not allergic (300mg)',
           'Begin CPR if unconscious and not breathing'] },
  { title:'Stroke (FAST)', icon:'🧠', color:'#a29bfe',
    steps:['F — Face drooping? Ask to smile',
           'A — Arm weakness? Raise both arms',
           'S — Speech slurred? Repeat a sentence',
           'T — Time to call 108 immediately!',
           'Note the time symptoms started'] },
  { title:'Severe Bleeding', icon:'🩹', color:'#e17055',
    steps:['Apply direct pressure with clean cloth',
           'Do not remove cloth — add more on top',
           'Elevate the injured part above heart level',
           'Call 108 if bleeding doesn\'t stop in 10 min',
           'Do not remove embedded objects'] },
  { title:'Choking', icon:'🫁', color:'#fdcb6e',
    steps:['Ask "Are you choking?"',
           'Give 5 firm back blows between shoulder blades',
           'Give 5 abdominal thrusts (Heimlich maneuver)',
           'Alternate back blows and abdominal thrusts',
           'Call 108 if object not dislodged'] },
  { title:'Seizure', icon:'⚡', color:'#74b9ff',
    steps:['Do not restrain the person',
           'Clear the area of sharp objects',
           'Place in recovery position after convulsions stop',
           'Time the seizure duration',
           'Call 108 if > 5 minutes or person doesn\'t wake up'] },
  { title:'Burns', icon:'🔥', color:'#fd79a8',
    steps:['Cool burn under running water for 20 min',
           'Do NOT use ice, butter, or toothpaste',
           'Cover with clean non-fluffy material',
           'Remove jewelry near burn area',
           'Seek medical help for large or deep burns'] },
];

export default function EmergencyPage() {
  return (
    <div className="fade-in">
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
        <h2 style={{ fontSize:20, fontWeight:800, color:'#ff4757' }}>🚨 Emergency Guide</h2>
        <span style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700,
                       background:'rgba(255,71,87,.15)', color:'#ff4757',
                       border:'1px solid rgba(255,71,87,.3)', letterSpacing:'1px' }}>CRITICAL</span>
      </div>
      <p style={{ fontSize:12, color:'var(--muted)', marginBottom:24 }}>
        Emergency contacts and first-aid procedures for life-threatening situations
      </p>

      {/* Emergency Banner */}
      <div style={{ padding:'16px 20px', borderRadius:'var(--r)', marginBottom:24,
                    background:'rgba(255,71,87,.1)', border:'2px solid rgba(255,71,87,.4)',
                    display:'flex', alignItems:'center', gap:12,
                    animation:'emergencyGlow 2s ease infinite' }}>
        <span style={{ fontSize:28 }}>⚠️</span>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:'#ff4757' }}>In a life-threatening emergency</div>
          <div style={{ fontSize:13, color:'var(--text)' }}>
            Call <strong style={{color:'#ff4757'}}>112</strong> (National Emergency) or{' '}
            <strong style={{color:'#ff4757'}}>108</strong> (Ambulance) immediately. Do NOT delay.
          </div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:10 }}>
          <a href="tel:112" style={{ padding:'10px 20px', borderRadius:10,
            background:'var(--red)', color:'white', fontWeight:700, textDecoration:'none',
            fontSize:16, border:'none', cursor:'pointer' }}>📞 112</a>
          <a href="tel:108" style={{ padding:'10px 20px', borderRadius:10,
            background:'rgba(255,71,87,.2)', color:'var(--red)', fontWeight:700, textDecoration:'none',
            fontSize:16, border:'1px solid rgba(255,71,87,.4)', cursor:'pointer' }}>🚑 108</a>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="card" style={{ marginBottom:24, border:'1px solid rgba(255,71,87,.2)' }}>
        <div className="card-title" style={{ color:'#ff4757' }}>📞 Emergency Contacts — India</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:10 }}>
          {CONTACTS.map(({ name, number, desc }) => (
            <div key={name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'12px 14px', borderRadius:10, background:'rgba(255,71,87,.05)',
              border:'1px solid rgba(255,71,87,.15)', gap:12 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{name}</div>
                <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{desc}</div>
              </div>
              <a href={`tel:${number.replace(/[^0-9]/g,'')}`}
                style={{ fontSize:15, fontWeight:800, color:'#ff4757',
                         textDecoration:'none', whiteSpace:'nowrap',
                         padding:'6px 12px', borderRadius:8,
                         background:'rgba(255,71,87,.1)',
                         border:'1px solid rgba(255,71,87,.2)' }}>
                {number}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* First Aid */}
      <div className="card-title" style={{ marginBottom:12 }}>🩹 First Aid Procedures</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16 }}>
        {FIRST_AID.map(({ title, icon, color, steps }) => (
          <div key={title} style={{ padding:'18px', borderRadius:'var(--r)',
            background:'var(--card)', border:`1px solid ${color}25` }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ fontSize:28 }}>{icon}</div>
              <h3 style={{ fontSize:15, fontWeight:700, color:'var(--white)' }}>{title}</h3>
            </div>
            <ol style={{ paddingLeft:18 }}>
              {steps.map((step, i) => (
                <li key={i} style={{ fontSize:13, color:'var(--text)', marginBottom:6, lineHeight:1.5 }}>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div style={{ marginTop:20, padding:'14px 18px', borderRadius:'var(--r)',
                    background:'rgba(253,203,110,.06)', border:'1px solid rgba(253,203,110,.2)' }}>
        <p style={{ fontSize:12, color:'var(--muted)', lineHeight:1.7 }}>
          ⚠️ <strong style={{color:'var(--yellow)'}}>Disclaimer:</strong> This information is for general guidance only.
          MediBot is NOT a substitute for professional emergency medical care.
          Always call emergency services immediately in a life-threatening situation.
        </p>
      </div>

      <style>{`@keyframes emergencyGlow { 0%,100%{border-color:rgba(255,71,87,.4)} 50%{border-color:rgba(255,71,87,.8)} }`}</style>
    </div>
  );
}
