import React, { useState, useEffect, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { FaSearch, FaTasks, FaProjectDiagram, FaFileUpload, FaUser, FaTimes } from 'react-icons/fa';

const CATEGORY_CONFIG = {
  tasks: { label: 'Tâches', icon: FaTasks, color: 'text-blue-500' },
  projects: { label: 'Projets', icon: FaProjectDiagram, color: 'text-purple-500' },
  files: { label: 'Fichiers', icon: FaFileUpload, color: 'text-amber-500' },
  users: { label: 'Membres', icon: FaUser, color: 'text-emerald-500' },
};

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ tasks: [], projects: [], files: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Raccourci clavier Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
    else {
      setQuery('');
      setResults({ tasks: [], projects: [], files: [], users: [] });
    }
  }, [isOpen]);

  const flatResults = Object.entries(results).flatMap(([type, items]) => items);

  const runSearch = useCallback((q) => {
    clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setResults({ tasks: [], projects: [], files: [], users: [] });
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
        });
        const data = await res.json();
        setResults(data);
        setActiveIndex(0);
      } catch (err) {
        console.error('Erreur recherche:', err);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    runSearch(val);
  };

  const goTo = (item) => {
    setIsOpen(false);
    router.visit(item.url);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && flatResults[activeIndex]) {
      e.preventDefault();
      goTo(flatResults[activeIndex]);
    }
  };

  let runningIndex = -1;

  return (
    <>
      {/* Bouton déclencheur, à placer dans le header du layout */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm w-full sm:w-64"
      >
        <FaSearch className="w-3.5 h-3.5" />
        <span className="flex-1 text-left">Rechercher...</span>
        <kbd className="hidden sm:inline text-[10px] font-mono bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">
          ⌘K
        </kbd>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <FaSearch className="text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Rechercher une tâche, un projet, un fichier, une personne..."
                className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-gray-100"
              />
              {loading && (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              )}
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                <FaTimes className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {query.trim().length < 2 ? (
                <p className="text-center text-sm text-gray-400 py-10 italic">
                  Tapez au moins 2 caractères...
                </p>
              ) : flatResults.length === 0 && !loading ? (
                <p className="text-center text-sm text-gray-400 py-10 italic">
                  Aucun résultat pour « {query} »
                </p>
              ) : (
                Object.entries(results).map(([type, items]) => {
                  if (items.length === 0) return null;
                  const config = CATEGORY_CONFIG[type];
                  const Icon = config.icon;
                  return (
                    <div key={type} className="py-2">
                      <p className="px-4 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                        {config.label}
                      </p>
                      {items.map(item => {
                        runningIndex++;
                        const isActive = runningIndex === activeIndex;
                        return (
                          <button
                            key={`${item.type}-${item.id}`}
                            onClick={() => goTo(item)}
                            onMouseEnter={() => setActiveIndex(runningIndex)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                              isActive ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                          >
                            <Icon className={`${config.color} w-4 h-4 flex-shrink-0`} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                                {item.title}
                              </p>
                              {item.subtitle && (
                                <p className="text-xs text-gray-400 truncate">{item.subtitle}</p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}