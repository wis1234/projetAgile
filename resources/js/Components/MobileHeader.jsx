import React from 'react';

export default function MobileHeader({ title, subtitle, onBack, headerRight }) {
  return (
    <header
      className="fixed left-0 right-0 top-0 z-40 flex items-center gap-2 border-b border-gray-200 bg-white/95 px-2 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/95"
      style={{
        height: 'calc(3.5rem + var(--safe-top))',
        paddingTop: 'var(--safe-top)',
      }}
    >
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-gray-600 transition-all active:scale-90 active:bg-gray-100 dark:text-gray-300 dark:active:bg-gray-800"
          aria-label="Retour"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      ) : <div className="h-10 w-10 flex-shrink-0" />}

      <div className="min-w-0 flex-1">
        {title && <h1 className="truncate text-base font-bold leading-tight text-gray-900 dark:text-white">{title}</h1>}
        {subtitle && <p className="truncate text-xs leading-tight text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
      {headerRight && <div className="flex-shrink-0 pr-1">{headerRight}</div>}
    </header>
  );
}
