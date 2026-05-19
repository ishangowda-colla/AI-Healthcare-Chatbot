// src/pages/ChatPage.js
import React, { useState, useEffect, useRef } from 'react';
import { chatAPI, imageAPI } from '../services/api';
import { useLang } from '../context/LangContext';

const QUICK = {
  en:[['🌡️ Fever & Headache','I have fever and headache'],['🤧 Cough & Cold','I have cough and sore throat'],
      ['💓 Chest Pain','I have chest pain and dizziness'],['🤢 Stomach Pain','I have stomach pain and nausea'],
      ['✨ Skin Rash','I have itching and skin rash'],['😴 Fatigue','I feel very tired and weak'],
      ['🫁 Breathlessness','I have shortness of breath and wheezing'],['🤕 Migraine','I have severe one-sided headache']],
  hi:[['🌡️ बुखार','मुझे बुखार और सिरदर्द है'],['🤧 खांसी-जुकाम','मुझे खांसी और जुकाम है'],
      ['💓 सीने में दर्द','मुझे सीने में दर्द है'],['🤢 पेट दर्द','मुझे पेट में दर्द और उल्टी है'],
      ['✨ दाने-खुजली','मुझे खुजली और दाने हैं'],['😴 थकान-कमज़ोरी','मैं बहुत थका हुआ और कमज़ोर हूं'],
      ['🫁 सांस की तकलीफ','मुझे सांस लेने में दिक्कत है'],['🤕 सिरदर्द','मुझे तेज सिरदर्द है']],
  kn:[['🌡️ ಜ್ವರ','ನನಗೆ ಜ್ವರ ಮತ್ತು ತಲೆನೋವು ಇದೆ'],['🤧 ಶೀತ-ಕೆಮ್ಮು','ನನಗೆ ಶೀತ ಮತ್ತು ಕೆಮ್ಮು ಇದೆ'],
      ['💓 ಎದೆ ನೋವು','ನನಗೆ ಎದೆ ನೋವು ಮತ್ತು ತಲೆ ತಿರುಗುವಿಕೆ ಇದೆ'],['🤢 ಹೊಟ್ಟೆ ನೋವು','ನನಗೆ ಹೊಟ್ಟೆ ನೋವು ಮತ್ತು ವಾಂತಿ ಇದೆ'],
      ['✨ ತುರಿಕೆ-ದದ್ದು','ನನಗೆ ತುರಿಕೆ ಮತ್ತು ದದ್ದು ಇದೆ'],['😴 ಆಯಾಸ','ನಾನು ತುಂಬಾ ದಣಿದಿದ್ದೇನೆ'],
      ['🫁 ಉಸಿರಾಟ','ನನಗೆ ಉಸಿರಾಟ ಕಷ್ಟ ಆಗುತ್ತಿದೆ'],['🤕 ತಲೆ ನೋವು','ನನಗೆ ತೀವ್ರ ತಲೆ ನೋವು ಇದೆ']],
};

const PHRASE_BOOK = {
  en:[
    {symptom:'Fever',phrase:'I have fever'},
    {symptom:'Headache',phrase:'I have headache'},
    {symptom:'Cough',phrase:'I have cough'},
    {symptom:'Stomach pain',phrase:'I have stomach pain'},
    {symptom:'Chest pain',phrase:'I have chest pain'},
    {symptom:'Breathlessness',phrase:'I have shortness of breath'},
    {symptom:'Joint pain',phrase:'I have joint pain'},
    {symptom:'Dizziness',phrase:'I feel dizzy'},
    {symptom:'Vomiting',phrase:'I have vomiting and nausea'},
    {symptom:'Fatigue',phrase:'I feel very tired and weak'},
    {symptom:'Skin rash',phrase:'I have itching and skin rash'},
    {symptom:'Frequent urination',phrase:'I have frequent urination and burning sensation'},
  ],
  hi:[
    {symptom:'बुखार',phrase:'मुझे बुखार है'},
    {symptom:'सिरदर्द',phrase:'मुझे सिरदर्द है'},
    {symptom:'खांसी',phrase:'मुझे खांसी है'},
    {symptom:'पेट दर्द',phrase:'मुझे पेट में दर्द है'},
    {symptom:'सीने में दर्द',phrase:'मुझे सीने में दर्द है'},
    {symptom:'सांस की तकलीफ',phrase:'मुझे सांस लेने में दिक्कत है'},
    {symptom:'जोड़ों में दर्द',phrase:'मुझे जोड़ों में दर्द है'},
    {symptom:'चक्कर आना',phrase:'मुझे चक्कर आ रहे हैं'},
    {symptom:'उल्टी',phrase:'मुझे उल्टी और जी मिचलाना है'},
    {symptom:'थकान-कमज़ोरी',phrase:'मैं बहुत थका हुआ और कमज़ोर हूं'},
    {symptom:'खुजली-दाने',phrase:'मुझे खुजली और दाने हैं'},
    {symptom:'पेशाब में जलन',phrase:'मुझे बार-बार पेशाब और जलन है'},
  ],
  kn:[
    {symptom:'ಜ್ವರ',phrase:'ನನಗೆ ಜ್ವರ ಇದೆ'},
    {symptom:'ತಲೆನೋವು',phrase:'ನನಗೆ ತಲೆನೋವು ಇದೆ'},
    {symptom:'ಕೆಮ್ಮು',phrase:'ನನಗೆ ಕೆಮ್ಮು ಇದೆ'},
    {symptom:'ಹೊಟ್ಟೆ ನೋವು',phrase:'ನನಗೆ ಹೊಟ್ಟೆ ನೋವು ಇದೆ'},
    {symptom:'ಎದೆ ನೋವು',phrase:'ನನಗೆ ಎದೆ ನೋವು ಇದೆ'},
    {symptom:'ಉಸಿರಾಟ ತೊಂದರೆ',phrase:'ನನಗೆ ಉಸಿರಾಟ ತೊಂದರೆ ಇದೆ'},
    {symptom:'ಕೀಲು ನೋವು',phrase:'ನನಗೆ ಕೀಲು ನೋವು ಇದೆ'},
    {symptom:'ತಲೆ ತಿರುಗುವಿಕೆ',phrase:'ನನಗೆ ತಲೆ ತಿರುಗುತ್ತಿದೆ'},
    {symptom:'ವಾಂತಿ',phrase:'ನನಗೆ ವಾಂತಿ ಆಗುತ್ತಿದೆ'},
    {symptom:'ಆಯಾಸ-ದೌರ್ಬಲ್ಯ',phrase:'ನಾನು ತುಂಬಾ ದಣಿದು ದುರ್ಬಲನಾಗಿದ್ದೇನೆ'},
    {symptom:'ತುರಿಕೆ-ದದ್ದು',phrase:'ನನಗೆ ತುರಿಕೆ ಮತ್ತು ದದ್ದು ಇದೆ'},
    {symptom:'ಮೂತ್ರ ಉರಿ',phrase:'ನನಗೆ ಮೂತ್ರ ಉರಿ ಮತ್ತು ಆಗಿಂದಾಗ ಮೂತ್ರ ಆಗುತ್ತಿದೆ'},
  ],
};

const VOICE_TIPS = {
  en:[
    'Speak clearly in English',
    'Example: "I have fever and headache"',
    'Use Chrome browser for best results',
    'If voice fails, use the Quick Chips or Phrase Helper above',
  ],
  hi:[
    '🔑 हिंदी बोलने के लिए पहले बाईं ओर "हिं" भाषा चुनें',
    '📱 Chrome ब्राउज़र + इंटरनेट कनेक्शन ज़रूरी है',
    '💡 उदाहरण: "मुझे बुखार है" या "पेट में दर्द है"',
    '✍️ काम न करे तो नीचे Quick Chips या Phrase Helper उपयोग करें',
    '⌨️ हिंदी टाइप करने के लिए Gboard कीबोर्ड install करें',
  ],
  kn:[
    '🔑 ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಲು ಮೊದಲು "ಕನ್ನ" ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ',
    '📱 Chrome ಬ್ರೌಸರ್ + ಇಂಟರ್ನೆಟ್ ಅಗತ್ಯ',
    '💡 ಉದಾ: "ನನಗೆ ಜ್ವರ ಇದೆ" ಅಥವಾ "ಹೊಟ್ಟೆ ನೋವು ಇದೆ"',
    '✍️ ಕಾರ್ಯ ನಿರ್ವಹಿಸದಿದ್ದರೆ Quick Chips ಅಥವಾ Phrase Helper ಬಳಸಿ',
    '⌨️ ಕನ್ನಡ ಟೈಪ್ ಮಾಡಲು Gboard ಕೀಬೋರ್ಡ್ install ಮಾಡಿ',
  ],
};

function BotBubble({ msg }) {
  const isEmergency = msg.type === 'emergency';
  const speak = (text) => {
    window.speechSynthesis?.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = { en:'en-IN', hi:'hi-IN', kn:'kn-IN' }[msg.lang] || 'en-IN';
    window.speechSynthesis?.speak(u);
  };
  return (
    <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
      <div style={{ width:36, height:36, borderRadius:12, flexShrink:0, fontSize:16,
                    background:'linear-gradient(135deg,var(--accent),var(--accent2))',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow:'0 0 12px rgba(0,212,255,.3)' }}>🤖</div>
      <div style={{
        maxWidth:'75%', padding:'14px 18px', borderRadius:'18px 18px 18px 4px',
        background: isEmergency ? 'rgba(255,71,87,.12)' : 'var(--card)',
        border: isEmergency ? '2px solid rgba(255,71,87,.6)' : '1px solid var(--border)',
        fontSize:14, lineHeight:1.65, color:'var(--text)',
        animation: isEmergency ? 'emergencyPulse 1s ease infinite' : 'none',
      }}>
        <p style={{ marginBottom: msg.top_disease ? 12 : 0 }}>{msg.message}</p>

        {msg.top_disease && (
          <div style={{ padding:12, background:'rgba(0,0,0,.2)', borderRadius:10,
                        borderLeft:`3px solid ${msg.color||'var(--accent)'}`, marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
              <span style={{ fontSize:20 }}>{msg.icon}</span>
              <span style={{ fontSize:15, fontWeight:700, color:'var(--white)', textTransform:'capitalize' }}>
                {msg.top_disease}</span>
              <span className={`badge badge-${msg.severity}`}>{msg.severity} risk</span>
            </div>
            {msg.precautions?.length > 0 && (
              <div style={{ marginTop:8 }}>
                <div style={{ fontSize:11, color:'var(--muted)', letterSpacing:'1px', marginBottom:4 }}>PRECAUTIONS</div>
                {msg.precautions.map((p,i) => (
                  <div key={i} style={{ fontSize:12, color:'var(--text)', display:'flex', gap:6, marginBottom:3 }}>
                    <span style={{color:'var(--accent2)'}}>•</span>{p}
                  </div>
                ))}
              </div>
            )}
            {msg.common_meds?.length > 0 && (
              <div style={{ marginTop:8 }}>
                <div style={{ fontSize:11, color:'var(--muted)', letterSpacing:'1px', marginBottom:4 }}>COMMON MEDICINES</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {msg.common_meds.map((m,i) => (
                    <span key={i} style={{ padding:'2px 8px', borderRadius:20, fontSize:11,
                                          background:'rgba(0,212,255,.1)', border:'1px solid rgba(0,212,255,.2)',
                                          color:'var(--accent)' }}>{m}</span>
                  ))}
                </div>
              </div>
            )}
            {msg.matches?.length > 1 && (
              <div style={{ marginTop:8 }}>
                <div style={{ fontSize:11, color:'var(--muted)', letterSpacing:'1px', marginBottom:4 }}>OTHER POSSIBILITIES</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {msg.matches.slice(1).map((m,i) => (
                    <span key={i} style={{ padding:'2px 8px', borderRadius:20, fontSize:11,
                                          background:'rgba(255,255,255,.05)', border:'1px solid var(--border)',
                                          color:'var(--muted)' }}>{m.icon} {m.disease}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Doctor contact banner */}
        {msg.doctor_advice && (
          <div style={{
            marginTop:10, padding:'10px 14px', borderRadius:10,
            background: msg.severity === 'high'
              ? 'rgba(255,71,87,.1)'
              : 'rgba(253,203,110,.08)',
            border: msg.severity === 'high'
              ? '1px solid rgba(255,71,87,.4)'
              : '1px solid rgba(253,203,110,.3)',
            display:'flex', alignItems:'center', gap:10,
          }}>
            <span style={{ fontSize:20, flexShrink:0 }}>
              {msg.severity === 'high' ? '🚨' : '⚠️'}
            </span>
            <div style={{ flex:1 }}>
              <div style={{
                fontSize:12, fontWeight:700, marginBottom:4,
                color: msg.severity === 'high' ? '#ff4757' : 'var(--accent2)',
              }}>
                {msg.severity === 'high' ? 'URGENT — See Doctor' : 'Medical Advice'}
              </div>
              <div style={{ fontSize:12, color:'var(--text)', lineHeight:1.5 }}>
                {msg.doctor_advice}
              </div>
            </div>
            {msg.severity === 'high' && (
              <a href="tel:108" style={{
                flexShrink:0, padding:'6px 12px', borderRadius:8,
                background:'rgba(255,71,87,.2)', color:'#ff4757',
                fontWeight:700, fontSize:12, textDecoration:'none',
                border:'1px solid rgba(255,71,87,.4)',
              }}>📞 108</a>
            )}
          </div>
        )}

        <button onClick={() => speak(msg.message)} style={{
          marginTop:8, padding:'4px 10px', borderRadius:6, border:'1px solid var(--border)',
          background:'transparent', color:'var(--muted)', fontFamily:'var(--font)',
          fontSize:11, cursor:'pointer', transition:'all .2s',
        }}>🔊 Listen</button>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { lang }          = useLang();
  const [msgs, setMsgs]   = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [recording, setRecording] = useState(false);
  const [showTranslator, setShowTranslator] = useState(false);
  const [showVoiceTips, setShowVoiceTips]   = useState(false);
  const bottomRef = useRef(null);
  const recogRef  = useRef(null);

  useEffect(() => {
    chatAPI.history(30).then(r => {
      const hist = r.data.history.map(h => ({
        role: h.role, message: h.message, lang: h.lang, type: 'history'
      }));
      setMsgs(hist);
    }).catch(()=>{});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [msgs, loading]);

  const send = async (text = input) => {
    if (!text.trim() && !image) return;
    const userMsg = image ? `📸 ${image.name}${text ? '\n'+text : ''}` : text;
    setMsgs(m => [...m, { role:'user', message:userMsg }]);
    setInput(''); setLoading(true);
    try {
      if (image) {
        const fd = new FormData();
        fd.append('image', image); fd.append('lang', lang);
        const r = await imageAPI.analyze(fd);
        setMsgs(m => [...m, { role:'bot', ...r.data, message: r.data.advice, type:'image' }]);
        setImage(null);
        if (text.trim()) {
          const cr = await chatAPI.send(text, lang);
          setMsgs(m => [...m, { role:'bot', ...cr.data }]);
        }
      } else {
        const r = await chatAPI.send(text, lang);
        setMsgs(m => [...m, { role:'bot', ...r.data }]);
      }
    } catch { setMsgs(m => [...m, { role:'bot', message:'Connection error. Please try again.', type:'error' }]); }
    finally { setLoading(false); }
  };

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert('Voice not supported. Please use Chrome browser for voice input.');
      return;
    }
    recogRef.current = new SR();
    recogRef.current.lang = { en:'en-IN', hi:'hi-IN', kn:'kn-IN' }[lang] || 'en-IN';
    recogRef.current.continuous = false;
    recogRef.current.interimResults = false;
    recogRef.current.maxAlternatives = 1;
    recogRef.current.onresult = e => {
      const transcript = e.results[0][0].transcript;
      send(transcript);
    };
    recogRef.current.onerror = (e) => {
      setRecording(false);
      if (e.error === 'no-speech') {
        alert(lang === 'hi' ? 'आवाज़ नहीं सुनाई दी। दोबारा कोशिश करें।'
            : lang === 'kn' ? 'ಧ್ವನಿ ಕೇಳಿಸಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'
            : 'No speech detected. Please try again.');
      } else if (e.error === 'language-not-supported') {
        alert(lang === 'hi'
          ? 'हिंदी वॉइस के लिए Chrome ब्राउज़र और इंटरनेट जरूरी है। Phrase Helper उपयोग करें।'
          : lang === 'kn'
          ? 'ಕನ್ನಡ ಧ್ವನಿಗೆ Chrome + ಇಂಟರ್ನೆಟ್ ಅಗತ್ಯ. Phrase Helper ಬಳಸಿ.'
          : 'Language not supported. Try Phrase Helper instead.');
      }
    };
    recogRef.current.onend = () => setRecording(false);
    recogRef.current.start();
    setRecording(true);
  };

  const clearHistory = async () => {
    await chatAPI.clearHistory();
    setMsgs([]);
  };

  const chips = QUICK[lang] || QUICK.en;
  const phrases = PHRASE_BOOK[lang] || PHRASE_BOOK.en;
  const voiceTips = VOICE_TIPS[lang] || VOICE_TIPS.en;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - var(--header) - 48px)' }}>
      {/* Title */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, flexWrap:'wrap', gap:8 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:800, color:'var(--white)' }}>🩺 AI Symptom Chat</h2>
          <p style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>Describe symptoms · Voice & Image supported · EN / हिं / ಕನ್ನ</p>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          <button className="btn btn-ghost" onClick={() => { setShowTranslator(t=>!t); setShowVoiceTips(false); }}
            style={{ fontSize:11, padding:'6px 12px' }}>
            {showTranslator ? '✕ Close' : '🌐 Phrase Helper'}
          </button>
          <button className="btn btn-ghost" onClick={() => { setShowVoiceTips(v=>!v); setShowTranslator(false); }}
            style={{ fontSize:11, padding:'6px 12px' }}>
            {showVoiceTips ? '✕ Close' : '🎤 Voice Tips'}
          </button>
          <button className="btn btn-ghost" onClick={clearHistory} style={{ fontSize:11, padding:'6px 12px' }}>
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* ── PHRASE HELPER PANEL ── */}
      {showTranslator && (
        <div className="fade-in" style={{ marginBottom:12, padding:14, borderRadius:12,
          background:'rgba(0,212,255,.05)', border:'1px solid rgba(0,212,255,.25)' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--accent)', marginBottom:8 }}>
            🌐 Phrase Helper — Click any symptom to send it instantly
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {phrases.map(({ symptom, phrase }) => (
              <button key={phrase} onClick={() => { send(phrase); setShowTranslator(false); }}
                style={{ padding:'6px 14px', borderRadius:20, border:'1px solid rgba(0,212,255,.3)',
                         background:'rgba(0,212,255,.08)', color:'var(--white)', cursor:'pointer',
                         fontFamily:'var(--font)', fontSize:12, transition:'all .2s' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(0,212,255,.2)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(0,212,255,.08)'}>
                {symptom}
              </button>
            ))}
          </div>
          <div style={{ marginTop:10, fontSize:11, color:'var(--muted)' }}>
            {lang === 'kn'
              ? '⌨️ ಕನ್ನಡ ಟೈಪ್ ಮಾಡಲು: Settings → Keyboard → Gboard → ಕನ್ನಡ ಸೇರಿಸಿ'
              : lang === 'hi'
              ? '⌨️ हिंदी टाइप करने के लिए Gboard या Google Hindi Input install करें'
              : '⌨️ You can also type symptoms in Hindi or Kannada directly in the text box'}
          </div>
        </div>
      )}

      {/* ── VOICE TIPS PANEL ── */}
      {showVoiceTips && (
        <div className="fade-in" style={{ marginBottom:12, padding:14, borderRadius:12,
          background:'rgba(253,203,110,.05)', border:'1px solid rgba(253,203,110,.25)' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--accent2)', marginBottom:8 }}>
            🎤 Voice Tips — {lang === 'hi' ? 'हिंदी' : lang === 'kn' ? 'ಕನ್ನಡ' : 'English'}
          </div>
          {voiceTips.map((tip, i) => (
            <div key={i} style={{ fontSize:12, color:'var(--text)', marginBottom:6, display:'flex', gap:8 }}>
              <span style={{ color:'var(--accent2)', flexShrink:0 }}>•</span>{tip}
            </div>
          ))}
        </div>
      )}

      {/* Quick chips */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
        {chips.map(([label, text]) => (
          <button key={label} onClick={() => send(text)} className="btn btn-ghost"
            style={{ fontSize:12, padding:'5px 12px' }}>{label}</button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column',
                    gap:14, paddingRight:4, paddingBottom:4 }}>
        {msgs.length === 0 && (
          <div style={{ textAlign:'center', padding:'48px 24px', color:'var(--muted)' }}>
            <div style={{ fontSize:56, marginBottom:16 }}>🩺</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'var(--white)', marginBottom:8 }}>
              Your AI Health Assistant
            </h3>
            <p style={{ fontSize:13, maxWidth:380, margin:'0 auto', lineHeight:1.8 }}>
              Describe your symptoms in <strong style={{color:'var(--accent)'}}>English</strong>,{' '}
              <strong style={{color:'var(--accent)'}}>हिंदी</strong>, or{' '}
              <strong style={{color:'var(--accent)'}}>ಕನ್ನಡ</strong>.<br/>
              Use <strong>🌐 Phrase Helper</strong> if voice/typing is difficult.
            </p>
          </div>
        )}
        {msgs.map((msg, i) => (
          <div key={i} className="fade-in">
            {msg.role === 'user' ? (
              <div style={{ display:'flex', gap:10, flexDirection:'row-reverse', alignItems:'flex-start' }}>
                <div style={{ width:36, height:36, borderRadius:12, flexShrink:0, fontSize:16,
                              background:'linear-gradient(135deg,var(--accent3),#9f7aea)',
                              display:'flex', alignItems:'center', justifyContent:'center' }}>👤</div>
                <div style={{ maxWidth:'72%', padding:'12px 16px', borderRadius:'18px 18px 4px 18px',
                              background:'linear-gradient(135deg,rgba(124,58,237,.3),rgba(0,212,255,.2))',
                              border:'1px solid rgba(124,58,237,.3)', fontSize:14,
                              color:'var(--white)', whiteSpace:'pre-wrap' }}>
                  {msg.message}
                </div>
              </div>
            ) : (
              <BotBubble msg={msg} />
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
            <div style={{ width:36, height:36, borderRadius:12,
                          background:'linear-gradient(135deg,var(--accent),var(--accent2))',
                          display:'flex', alignItems:'center', justifyContent:'center' }}>🤖</div>
            <div style={{ padding:'14px 18px', background:'var(--card)', border:'1px solid var(--border)',
                          borderRadius:'18px 18px 18px 4px', display:'flex', gap:5 }}>
              {[0,.15,.3].map(d => (
                <div key={d} style={{ width:7, height:7, borderRadius:'50%', background:'var(--accent)',
                                      animation:`typing .8s ${d}s ease infinite` }}/>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ marginTop:14, padding:'14px 0 0' }}>
        {image && (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px',
                        background:'rgba(0,255,157,.06)', border:'1px solid rgba(0,255,157,.2)',
                        borderRadius:10, marginBottom:10, fontSize:13 }}>
            <span>📸 {image.name}</span>
            <button onClick={() => setImage(null)} style={{ marginLeft:'auto', background:'none',
              border:'none', color:'var(--muted)', cursor:'pointer', fontSize:16 }}>✕</button>
          </div>
        )}
        <div style={{ display:'flex', gap:10 }}>
          <label style={{ display:'flex', alignItems:'center', justifyContent:'center', width:44, height:44,
                          borderRadius:12, background:'var(--card)', border:'1px solid var(--border)',
                          cursor:'pointer', fontSize:18, flexShrink:0, transition:'all .2s' }}
            title="Upload image">
            📸 <input type="file" accept="image/*" style={{ display:'none' }}
              onChange={e => setImage(e.target.files?.[0] || null)} />
          </label>
          <div style={{ flex:1, position:'relative' }}>
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); send(); }}}
              placeholder={
                lang === 'hi'
                  ? 'लक्षण बताएं जैसे: मुझे बुखार है, पेट दर्द है…'
                  : lang === 'kn'
                  ? 'ರೋಗಲಕ್ಷಣ ಹೇಳಿ ಉದಾ: ನನಗೆ ಜ್ವರ ಇದೆ, ಹೊಟ್ಟೆ ನೋವು…'
                  : 'Describe your symptoms… e.g. I have fever and headache'
              }
              rows={1}
              style={{ width:'100%', padding:'12px 48px 12px 16px', background:'var(--card)',
                       border:'1.5px solid var(--border)', borderRadius:14, color:'var(--white)',
                       fontFamily:'var(--font)', fontSize:14, outline:'none', resize:'none',
                       lineHeight:1.5, minHeight:48, maxHeight:120, transition:'border-color .2s',
                       boxSizing:'border-box' }}
              onFocus={e => e.target.style.borderColor='var(--accent)'}
              onBlur={e => e.target.style.borderColor='var(--border)'} />
            <button
              onClick={recording ? () => { recogRef.current?.stop(); setRecording(false); } : startVoice}
              title={recording ? 'Stop' : `Voice (${lang === 'hi' ? 'हिं' : lang === 'kn' ? 'ಕನ್ನ' : 'EN'})`}
              style={{ position:'absolute', right:12, bottom:12, background:'none', border:'none',
                       cursor:'pointer', fontSize:18, color: recording ? '#ff4757' : 'var(--muted)',
                       animation: recording ? 'recordPulse .7s ease infinite' : 'none' }}>🎤</button>
          </div>
          <button onClick={() => send()} disabled={loading || (!input.trim() && !image)}
            className="btn btn-primary"
            style={{ width:48, height:48, borderRadius:14, fontSize:20, padding:0, flexShrink:0 }}>
            ➤
          </button>
        </div>
        {recording && (
          <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#ff4757' }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#ff4757',
              animation:'recordPulse .7s ease infinite' }}/>
            {lang === 'hi' ? 'सुन रहा हूं… बोलें' : lang === 'kn' ? 'ಆಲಿಸುತ್ತಿದ್ದೇನೆ… ಮಾತನಾಡಿ' : 'Listening… speak now'}
          </div>
        )}
      </div>
      <style>{`
        @keyframes typing { 0%,80%,100%{transform:scale(.6);opacity:.4} 40%{transform:scale(1);opacity:1} }
        @keyframes recordPulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes emergencyPulse { 0%,100%{border-color:rgba(255,71,87,.5)} 50%{border-color:rgba(255,71,87,1)} }
      `}</style>
    </div>
  );
}
