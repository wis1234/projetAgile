import React, { useState, createContext, useContext } from 'react';
import enTranslations from '@/locales/en.json';
import frTranslations from '@/locales/fr.json';

const translations = {
  en: enTranslations,
  fr: frTranslations
};

export const LanguageContext = createContext(null);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    try {
      const saved = localStorage.getItem('language');
      return saved && ['en', 'fr'].includes(saved) ? saved : 'en';
    } catch (err) {
      return 'en';
    }
  });

  const setLanguage = (lang) => {
    if (['en', 'fr'].includes(lang)) {
      setCurrentLanguage(lang);
      try {
        localStorage.setItem('language', lang);
      } catch (err) {}
    }
  };

  const t = (key, params = {}) => {
    const currentTranslations = translations[currentLanguage] || translations['en'];
    let text = currentTranslations[key] || translations['en'][key] || key;
    
    if (text && typeof text === 'string') {
      Object.keys(params).forEach(param => {
        text = text.replace(`{${param}}`, params[param]);
      });
    }
    
    return text;
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t, translations }}>
      {children}
    </LanguageContext.Provider>
  );
};