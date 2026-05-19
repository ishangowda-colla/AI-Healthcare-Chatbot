// src/context/LangContext.js
import React, { createContext, useContext, useState } from 'react';

const LangContext = createContext('en');

export function LangProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('medibot_lang') || 'en');
  const changeLang = (l) => { setLang(l); localStorage.setItem('medibot_lang', l); };
  return (
    <LangContext.Provider value={{ lang, changeLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
