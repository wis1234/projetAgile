import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaSearch, FaChevronUp, FaChevronDown, FaTimes } from 'react-icons/fa';
import { searchKey, findMatches } from './extensions/search-highlight';

const FindReplaceBar = ({ editor, open, onClose, readOnly = false }) => {
  const [term, setTerm] = useState('');
  const [replaceWith, setReplaceWith] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const inputRef = useRef(null);

  const push = useCallback((meta) => {
    if (!editor || editor.isDestroyed) return;
    editor.view.dispatch(editor.state.tr.setMeta(searchKey, meta));
  }, [editor]);

  const recount = useCallback(() => {
    if (!editor || editor.isDestroyed) return [];
    const m = findMatches(editor.state.doc, term, caseSensitive);
    setCount(m.length);
    return m;
  }, [editor, term, caseSensitive]);

  const select = useCallback((matches, idx) => {
    const m = matches[idx];
    if (!m) return;
    editor.chain().setTextSelection({ from: m.from, to: m.to }).scrollIntoView().run();
  }, [editor]);

  // Nouveau terme : surligner et aller à la première occurrence
  useEffect(() => {
    if (!open || !editor) return;
    push({ term, caseSensitive, current: 0 });
    setCurrent(0);
    const m = recount();
    if (term && m.length) select(m, 0);
  }, [term, caseSensitive, open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mise à jour du compteur quand le document change
  useEffect(() => {
    if (!open || !editor) return undefined;
    const fn = () => recount();
    editor.on('update', fn);
    return () => editor.off('update', fn);
  }, [open, editor, recount]);

  useEffect(() => {
    if (open) setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 30);
    else if (editor && !editor.isDestroyed) push({ term: '', current: 0 });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (delta) => {
    const m = findMatches(editor.state.doc, term, caseSensitive);
    if (!m.length) return;
    const idx = (current + delta + m.length) % m.length;
    setCurrent(idx);
    push({ current: idx });
    select(m, idx);
  };

  const replaceOne = () => {
    if (readOnly) return;
    const m = findMatches(editor.state.doc, term, caseSensitive);
    const hit = m[Math.min(current, m.length - 1)];
    if (!hit) return;
    editor.view.dispatch(editor.state.tr.insertText(replaceWith, hit.from, hit.to));
    const after = recount();
    if (after.length) { const idx = Math.min(current, after.length - 1); setCurrent(idx); push({ current: idx }); select(after, idx); }
  };

  const replaceAll = () => {
    if (readOnly) return;
    const m = findMatches(editor.state.doc, term, caseSensitive);
    if (!m.length) return;
    const tr = editor.state.tr;
    [...m].reverse().forEach((hit) => tr.insertText(replaceWith, hit.from, hit.to));
    editor.view.dispatch(tr);
    recount();
  };

  if (!open) return null;

  return (
    <div className="fixed top-36 right-4 sm:right-8 z-[900] w-[340px] max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-2xl p-3 text-slate-700">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-2 text-[13px] font-semibold"><FaSearch className="text-[11px] text-[#1a73e8]" /> Rechercher et remplacer</span>
        <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-400" title="Fermer (Échap)"><FaTimes className="text-xs" /></button>
      </div>

      <div className="flex items-center gap-1.5 mb-2">
        <input
          ref={inputRef}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') go(e.shiftKey ? -1 : 1); if (e.key === 'Escape') onClose(); }}
          placeholder="Rechercher"
          className="flex-1 min-w-0 h-8 px-2 text-[13px] border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/40 focus:border-[#1a73e8]"
        />
        <span className="text-[11px] text-slate-500 w-12 text-center tabular-nums">{term ? (count ? `${current + 1}/${count}` : '0/0') : ''}</span>
        <button type="button" onClick={() => go(-1)} className="p-1.5 rounded hover:bg-slate-100" title="Précédent (Maj+Entrée)"><FaChevronUp className="text-[10px]" /></button>
        <button type="button" onClick={() => go(1)} className="p-1.5 rounded hover:bg-slate-100" title="Suivant (Entrée)"><FaChevronDown className="text-[10px]" /></button>
      </div>

      {!readOnly && (
        <>
          <input
            value={replaceWith}
            onChange={(e) => setReplaceWith(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') replaceOne(); if (e.key === 'Escape') onClose(); }}
            placeholder="Remplacer par"
            className="w-full h-8 px-2 mb-2 text-[13px] border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/40 focus:border-[#1a73e8]"
          />
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-1.5 text-[12px] text-slate-600 cursor-pointer select-none">
              <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} className="rounded" />
              Respecter la casse
            </label>
            <div className="flex gap-1.5">
              <button type="button" onClick={replaceOne} disabled={!count} className="px-2.5 h-7 text-[12px] rounded-md border border-slate-300 hover:bg-slate-50 disabled:opacity-40">Remplacer</button>
              <button type="button" onClick={replaceAll} disabled={!count} className="px-2.5 h-7 text-[12px] rounded-md bg-[#1a73e8] text-white hover:bg-[#1765cc] disabled:opacity-40">Tout remplacer</button>
            </div>
          </div>
        </>
      )}
      {readOnly && (
        <label className="flex items-center gap-1.5 text-[12px] text-slate-600 cursor-pointer select-none">
          <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} className="rounded" />
          Respecter la casse
        </label>
      )}
    </div>
  );
};

export default FindReplaceBar;
