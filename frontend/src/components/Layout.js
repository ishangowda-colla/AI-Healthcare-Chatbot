// src/components/Layout.js
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';

const NAV = [
  { to: '/',          icon: '📊', label: 'Dashboard'  },
  { to: '/chat',      icon: '🩺', label: 'AI Chat'    },
  { to: '/tablets',   icon: '💊', label: 'Tablets'    },
  { to: '/water',     icon: '💧', label: 'Water'      },
  { to: '/bmi',       icon: '⚖️', label: 'BMI'        },
  { to: '/vitals',    icon: '📈', label: 'Vitals'     },
  { to: '/diseases',  icon: '🔬', label: 'Diseases'   },
  { to: '/emergency', icon: '🚨', label: 'Emergency'  },
];

export default function Layout() {
  const { user, logout }    = useAuth();
  const { lang, changeLang} = useLang();
  const navigate            = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display:'flex', minHeight:'100vh', position:'relative', zIndex:1 }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: collapsed ? 64 : 'var(--sidebar)',
        minHeight: '100vh',
        background: 'rgba(10,22,40,0.95)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        transition: 'width .3s ease',
        position: 'sticky', top: 0, alignSelf: 'flex-start',
        height: '100vh', overflow: 'hidden',
        backdropFilter: 'blur(20px)',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)',
                      display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:12, flexShrink:0,
                        background:'linear-gradient(135deg,var(--accent),var(--accent2))',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:18, boxShadow:'0 0 16px rgba(0,212,255,.35)' }}>🏥</div>
          {!collapsed && (
            <div>
              <div style={{ fontSize:18, fontWeight:800, color:'var(--white)' }}>
                Medi<span style={{color:'var(--accent)'}}>Bot</span>
              </div>
              <div style={{ fontSize:10, color:'var(--muted)', letterSpacing:'1px' }}>AI HEALTH · RIT HASSAN</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'12px 8px', overflowY:'auto' }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to==='/'} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 10, marginBottom: 4,
              textDecoration: 'none', fontSize: 13, fontWeight: 500,
              transition: 'all .2s',
              background: isActive ? 'rgba(0,212,255,.12)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--muted)',
              borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
            })}>
              <span style={{ fontSize:18, flexShrink:0 }}>{icon}</span>
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        {/* Lang switcher */}
        {!collapsed && (
          <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)' }}>
            <div style={{ fontSize:10, color:'var(--muted)', marginBottom:6, letterSpacing:'1px' }}>LANGUAGE</div>
            <div style={{ display:'flex', gap:4 }}>
              {['en','hi','kn'].map(l => (
                <button key={l} onClick={() => changeLang(l)} style={{
                  flex:1, padding:'6px 4px', borderRadius:8, border:'none',
                  background: lang===l ? 'var(--accent)' : 'var(--surface)',
                  color: lang===l ? '#000' : 'var(--muted)',
                  fontFamily:'var(--font)', fontSize:11, fontWeight:600,
                  cursor:'pointer', transition:'all .2s',
                }}>
                  {l==='en'?'EN':l==='hi'?'हिं':'ಕನ್ನ'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* User + logout */}
        <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)',
                      display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:10, flexShrink:0,
                        background:'linear-gradient(135deg,var(--accent3),#9f7aea)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:14 }}>👤</div>
          {!collapsed && (
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--white)',
                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {user?.username}
              </div>
              <div style={{ fontSize:11, color:'var(--muted)' }}>Patient</div>
            </div>
          )}
          <button onClick={handleLogout} title="Logout" style={{
            background:'transparent', border:'none', cursor:'pointer',
            color:'var(--muted)', fontSize:16, padding:4,
            transition:'color .2s', flexShrink:0,
          }}>⏻</button>
        </div>

        {/* Collapse toggle */}
        <button onClick={() => setCollapsed(c=>!c)} style={{
          position:'absolute', top:24, right:-12, width:24, height:24,
          borderRadius:'50%', background:'var(--card)', border:'1px solid var(--border)',
          color:'var(--muted)', cursor:'pointer', fontSize:10, display:'flex',
          alignItems:'center', justifyContent:'center', zIndex:10,
        }}>
          {collapsed ? '▶' : '◀'}
        </button>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex:1, display:'flex', flexDirection:'column',
                     minHeight:'100vh', overflow:'hidden' }}>
        {/* Top header */}
        <header style={{
          height: 'var(--header)', padding:'0 28px',
          borderBottom:'1px solid var(--border)',
          background:'rgba(5,13,26,.95)', backdropFilter:'blur(20px)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          position:'sticky', top:0, zIndex:40,
        }}>
          <div style={{ fontSize:13, color:'var(--muted)' }}>
            Welcome back, <span style={{ color:'var(--white)', fontWeight:600 }}>{user?.username}</span> 👋
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6,
                          fontSize:11, color:'var(--accent2)', letterSpacing:'1px' }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--accent2)',
                            animation:'livePulse 1.5s ease-in-out infinite' }}/>
              LIVE
            </div>
            <div style={{ fontSize:12, color:'var(--muted)', background:'var(--card)',
                          padding:'6px 12px', borderRadius:8,
                          border:'1px solid var(--border)' }}>
              CS&E FYP · RIT Hassan · 2024-25
            </div>
          </div>
        </header>

        {/* Page outlet */}
        <div style={{ flex:1, overflow:'auto', padding:'24px 28px' }}>
          <Outlet />
        </div>
      </main>

      <style>{`
        @keyframes livePulse { 0%,100%{opacity:1;} 50%{opacity:.4;} }
      `}</style>
    </div>
  );
}
