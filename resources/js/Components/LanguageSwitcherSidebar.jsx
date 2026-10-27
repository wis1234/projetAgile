import { useEffect, useRef, useState } from 'react';

const languages = [
  { code: 'fr', name: 'Français', flag: 'fr' },
  { code: 'en', name: 'English', flag: 'gb' },
  { code: 'fon', name: 'Fɔngbè', flag: 'bj' },
  { code: 'yo', name: 'Yorùbá', flag: 'ng' },
];

/**
 * Sélecteur de langue (version en-tête, à placer à côté de la cloche de notifications).
 * Mêmes langues, mêmes drapeaux et même logique que l'ancienne version du menu latéral ;
 * seuls le style (fond clair / mode sombre) et l'ouverture de la liste (flottante) changent.
 */
export default function LanguageSwitcherSidebar({ currentLanguage, isChangingLanguage, onChangeLanguage }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = languages.find(l => l.code === currentLanguage) || languages[0];

  // Ferme la liste au clic à l'extérieur ou avec Échap
  useEffect(() => {
    if (!open) return undefined;
    const onMouseDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        disabled={isChangingLanguage}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Langue : ${current.name}`}
        title={`Langue : ${current.name}`}
        className="flex h-10 items-center gap-2 rounded-xl px-2.5 text-gray-600 transition-all hover:bg-gray-100 active:scale-95 disabled:opacity-60 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        <span
          style={{
            backgroundImage: `url(https://flagcdn.com/24x18/${current.flag}.png)`,
            width: '20px', height: '15px',
            backgroundSize: 'cover', borderRadius: '2px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.15)', flexShrink: 0,
          }}
        />
        {/* Nom de la langue masqué sur petit écran pour garder la place dans l'en-tête */}
        <span className="hidden text-sm font-medium sm:inline">{current.name}</span>
        {isChangingLanguage ? (
          <svg className="h-4 w-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Choisir la langue"
          className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-gray-100 bg-white py-1 shadow-2xl dark:border-gray-700 dark:bg-gray-800"
        >
          {languages.map(lang => (
            <button
              key={lang.code}
              type="button"
              role="option"
              aria-selected={currentLanguage === lang.code}
              onClick={() => { onChangeLanguage(lang.code); setOpen(false); }}
              disabled={isChangingLanguage}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                currentLanguage === lang.code
                  ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'text-gray-700 hover:bg-blue-50 dark:text-gray-200 dark:hover:bg-blue-900/30'
              }`}
            >
              <span style={{
                backgroundImage: `url(https://flagcdn.com/24x18/${lang.flag}.png)`,
                width: '18px', height: '13px', backgroundSize: 'cover',
                borderRadius: '2px', flexShrink: 0,
              }} />
              {lang.name}
              {currentLanguage === lang.code && (
                <svg className="ml-auto h-3.5 w-3.5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
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