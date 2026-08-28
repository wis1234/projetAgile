import { useState } from 'react';

const languages = [
  { code: 'fr', name: 'Français', flag: 'fr' },
  { code: 'en', name: 'English', flag: 'gb' },
  { code: 'fon', name: 'Fɔngbè', flag: 'bj' },
  { code: 'yo', name: 'Yorùbá', flag: 'ng' },
];

export default function LanguageSwitcherSidebar({ currentLanguage, isChangingLanguage, onChangeLanguage, t }) {
  const [open, setOpen] = useState(false);
  const current = languages.find(l => l.code === currentLanguage) || languages[0];

  return (
    <div className="px-4 pb-2">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={isChangingLanguage}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/80 hover:bg-white/5 active:scale-95 transition-all"
      >
        <span
          style={{
            backgroundImage: `url(https://flagcdn.com/24x18/${current.flag}.png)`,
            width: '20px', height: '15px',
            backgroundSize: 'cover', borderRadius: '2px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.15)', flexShrink: 0,
          }}
        />
        <span className="text-sm font-medium flex-1 text-left">{current.name}</span>
        {isChangingLanguage ? (
          <svg className="animate-spin h-4 w-4 text-blue-300" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {open && (
        <div className="mt-1 space-y-0.5 pl-2">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => { onChangeLanguage(lang.code); setOpen(false); }}
              disabled={isChangingLanguage}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all active:scale-95 ${
                currentLanguage === lang.code
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-white/60 hover:bg-white/5 hover:text-white/90'
              }`}
            >
              <span style={{
                backgroundImage: `url(https://flagcdn.com/24x18/${lang.flag}.png)`,
                width: '18px', height: '13px', backgroundSize: 'cover',
                borderRadius: '2px', flexShrink: 0,
              }} />
              {lang.name}
              {currentLanguage === lang.code && (
                <svg className="w-3.5 h-3.5 ml-auto text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}