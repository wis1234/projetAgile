import React, { useState, useRef, useEffect, useMemo } from 'react';
import { router, usePage, Link } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';

/* ---------- Constantes & helpers ---------- */
const NC = 26, NR = 60, RH = 21;
const colName = i => String.fromCharCode(65 + i);
const keyOf = (r, c) => colName(c) + (r + 1);
const parseKey = k => { const m = /^([A-Z])(\d+)$/.exec(k); return m ? [+m[2] - 1, m[1].charCodeAt(0) - 65] : null; };
const colW = c => (c === 0 ? 210 : c === 1 ? 320 : 100);
const inv = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [v, k]));
const L = {
  type: { individual: 'Individuel', group: 'Groupe' },
  status: { todo: 'À faire', in_progress: 'En cours', done: 'Terminé' },
  priority: { low: 'Faible', medium: 'Moyenne', high: 'Élevée' },
  pay: { unpaid: 'Non payé', pending: 'En attente', paid: 'Payé', failed: 'Échoué' },
  reason: { '': '', volunteer: 'Bénévolat', academic: 'Projet académique', other: 'Autre raison' },
};
const FIELDS = ['Titre', 'Description', 'Type', 'Projet', 'Sprint', 'Assigné(s) (séparés par une virgule)', 'Statut', 'Priorité', "Échéance (AAAA-MM-JJ HH:mm)", 'Rémunérée', 'Montant (FCFA)', 'Statut du paiement', 'Raison de la non-rémunération'];

const fmtLocal = s => {
  const d = s ? new Date(s) : null;
  if (!d || isNaN(d)) return '';
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

/* ---------- Moteur de formules ---------- */
const nums = a => a.flat(Infinity).filter(x => typeof x === 'number');
const FN = {
  SUM: (...a) => nums(a).reduce((x, y) => x + y, 0),
  AVERAGE: (...a) => { const n = nums(a); return n.length ? FN.SUM(n) / n.length : 0; },
  MIN: (...a) => Math.min(...nums(a)), MAX: (...a) => Math.max(...nums(a)),
  COUNT: (...a) => nums(a).length, COUNTA: (...a) => a.flat(Infinity).filter(x => x !== '' && x != null).length,
  IF: (c, a, b = '') => (c ? a : b), ROUND: (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d,
  ABS: Math.abs, SQRT: Math.sqrt, AND: (...a) => a.flat().every(Boolean), OR: (...a) => a.flat().some(Boolean),
  CONCAT: (...a) => a.flat().join(''), UPPER: s => String(s).toUpperCase(), LOWER: s => String(s).toLowerCase(),
  LEN: s => String(s).length, TODAY: () => new Date().toLocaleDateString('fr-FR'), NOW: () => new Date().toLocaleString('fr-FR'),
};
const FN_NAMES = Object.keys(FN);

function makeEvaluator(cells) {
  const cache = {};
  const ev = (k, depth = 0) => {
    if (k in cache) return cache[k];
    if (depth > 50) return '#REF!';
    const raw = cells[k]?.v ?? '';
    let out = raw;
    if (typeof raw === 'string' && raw.startsWith('=')) {
      try {
        const code = raw.slice(1).split(/("[^"]*")/).map((p, i) => i % 2 ? p : p
          .replace(/\$/g, '')
          .replace(/\b([A-Z]\d+)(?::([A-Z]\d+))?\b/g, (_, a, b) => (b ? `R("${a}","${b}")` : `C("${a}")`))
          .replace(/\^/g, '**').replace(/<>/g, '!=').replace(/(?<![<>=!])=(?!=)/g, '==')).join('');
        const C = a => { const v = ev(a, depth + 1); return v === '' ? 0 : v; };
        const R = (a, b) => {
          const [r1, c1] = parseKey(a), [r2, c2] = parseKey(b), o = [];
          for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) o.push(ev(keyOf(r, c), depth + 1));
          return o;
        };
        out = new Function('C', 'R', ...FN_NAMES, `return (${code})`)(C, R, ...FN_NAMES.map(n => FN[n]));
        if (typeof out === 'number' && !isFinite(out)) out = '#DIV/0!';
      } catch (e) { out = '#ERREUR!'; }
    } else if (raw !== '' && !isNaN(Number(raw)) && !/^\s*$/.test(raw)) out = Number(raw);
    return (cache[k] = out);
  };
  return ev;
}

const show = (v, fmt) => {
  if (typeof v !== 'number') return v === true ? 'VRAI' : v === false ? 'FAUX' : String(v ?? '');
  if (fmt === 'fcfa') return v.toLocaleString('fr-FR') + ' FCFA';
  if (fmt === 'num') return v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (fmt === 'pct') return (v * 100).toFixed(2) + ' %';
  return String(Math.round(v * 1e10) / 1e10);
};

/* ---------- Composant ---------- */
function Edit({ task, projects = [], sprints = [], users = [] }) {
  const { errors = {}, flash = {} } = usePage().props;
  const proj0 = projects.find(p => p.id == task.project_id);
  const assigned = (task.assigned_users?.length ? task.assigned_users : users.filter(u => u.id == task.assigned_to)).map(u => u.name).join(', ');

  const initial = useMemo(() => {
    const vals = [task.title || '', task.description || '', L.type[task.type || 'individual'], proj0?.name || '',
      sprints.find(s => s.id == task.sprint_id)?.name || '', assigned, L.status[task.status || 'todo'], L.priority[task.priority || 'medium'],
      fmtLocal(task.due_date), task.is_paid ? 'Oui' : 'Non', task.amount ?? '', L.pay[task.payment_status || 'unpaid'], L.reason[task.payment_reason || '']];
    const c = { A1: { v: 'Champ', s: { b: 1, bg: '#e8f0fe' } }, B1: { v: 'Valeur', s: { b: 1, bg: '#e8f0fe' } } };
    FIELDS.forEach((f, i) => { c['A' + (i + 2)] = { v: f, s: { b: 1 } }; c['B' + (i + 2)] = { v: String(vals[i]), s: i === 10 ? { fmt: 'fcfa' } : {} }; });
    return c;
  }, []);

  const [cells, setCells] = useState(initial);
  const past = useRef([]), future = useRef([]);
  const [act, setAct] = useState([1, 1]);          // cellule active [r,c]
  const [anchor, setAnchor] = useState([1, 1]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState(flash.success || flash.error || '');
  const [zoom, setZoom] = useState(100);
  const grid = useRef(null);

  const ev = useMemo(() => makeEvaluator(cells), [cells]);
  const sel = { r1: Math.min(act[0], anchor[0]), r2: Math.max(act[0], anchor[0]), c1: Math.min(act[1], anchor[1]), c2: Math.max(act[1], anchor[1]) };
  const aKey = keyOf(...act), aCell = cells[aKey] || {}, aS = aCell.s || {};

  const options = r => {
    const m = { 2: Object.values(L.type), 3: projects.map(p => p.name), 4: sprints.map(s => s.name), 6: Object.values(L.status), 7: Object.values(L.priority), 9: ['Oui', 'Non'], 11: Object.values(L.pay), 12: Object.values(L.reason) };
    return act[1] === 1 || true ? m[r - 1] : null;
  };

  const commit = next => { past.current.push(cells); future.current = []; setCells(next); };
  const undo = () => { if (past.current.length) { future.current.push(cells); setCells(past.current.pop()); } };
  const redo = () => { if (future.current.length) { past.current.push(cells); setCells(future.current.pop()); } };

  const setValue = (k, v) => commit({ ...cells, [k]: { ...cells[k], v } });
  const eachSel = fn => { const n = { ...cells }; for (let r = sel.r1; r <= sel.r2; r++) for (let c = sel.c1; c <= sel.c2; c++) fn(n, keyOf(r, c)); return n; };
  const style = patch => commit(eachSel((n, k) => { n[k] = { ...n[k], s: { ...n[k]?.s, ...patch } }; }));
  const toggle = p => style({ [p]: aS[p] ? 0 : 1 });
  const clear = () => commit(eachSel((n, k) => { if (n[k]) n[k] = { ...n[k], v: '' }; }));

  const move = (dr, dc, extend) => {
    const n = [Math.max(0, Math.min(NR - 1, act[0] + dr)), Math.max(0, Math.min(NC - 1, act[1] + dc))];
    setAct(n); if (!extend) setAnchor(n);
  };
  const startEdit = (text) => { setDraft(text ?? cells[aKey]?.v ?? ''); setEditing(true); };
  const endEdit = (save, dr = 0, dc = 0) => {
    if (save) setValue(aKey, draft);
    setEditing(false); move(dr, dc); setTimeout(() => grid.current?.focus(), 0);
  };

  const onKeyDown = e => {
    if (editing) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod) {
      const k = e.key.toLowerCase();
      if (k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (k === 'y') { e.preventDefault(); redo(); }
      else if (k === 'b') { e.preventDefault(); toggle('b'); }
      else if (k === 'i') { e.preventDefault(); toggle('i'); }
      else if (k === 'a') { e.preventDefault(); setAnchor([0, 0]); setAct([NR - 1, NC - 1]); }
      return;
    }
    const arrows = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (arrows[e.key]) { e.preventDefault(); move(...arrows[e.key], e.shiftKey); }
    else if (e.key === 'Enter') { e.preventDefault(); e.shiftKey ? move(-1, 0) : startEdit(); }
    else if (e.key === 'Tab') { e.preventDefault(); move(0, e.shiftKey ? -1 : 1); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); clear(); }
    else if (e.key === 'F2') startEdit();
    else if (e.key.length === 1) { e.preventDefault(); startEdit(e.key); }
  };

  const onCopy = (e, cut) => {
    if (editing) return;
    const rows = [];
    for (let r = sel.r1; r <= sel.r2; r++) { const row = []; for (let c = sel.c1; c <= sel.c2; c++) row.push(cells[keyOf(r, c)]?.v ?? ''); rows.push(row.join('\t')); }
    e.clipboardData.setData('text/plain', rows.join('\n')); e.preventDefault();
    if (cut) clear();
  };
  const onPaste = e => {
    if (editing) return;
    e.preventDefault();
    const n = { ...cells };
    e.clipboardData.getData('text/plain').replace(/\r/g, '').split('\n').forEach((line, i) => line.split('\t').forEach((v, j) => {
      const r = sel.r1 + i, c = sel.c1 + j; if (r < NR && c < NC) n[keyOf(r, c)] = { ...n[keyOf(r, c)], v };
    }));
    commit(n);
  };

  useEffect(() => { const up = () => setDrag(false); window.addEventListener('mouseup', up); return () => window.removeEventListener('mouseup', up); }, []);

  /* ---------- Enregistrement ---------- */
  const save = () => {
    const g = i => { const v = ev('B' + (i + 2)); return v === '' || v == null ? '' : String(v).trim(); };
    const project = projects.find(p => p.name === g(3));
    const names = g(5).split(',').map(s => s.trim()).filter(Boolean);
    const ids = (project?.users || users).filter(u => names.includes(u.name)).map(u => u.id);
    const type = inv(L.type)[g(2)] || 'individual';
    const paid = g(9) === 'Oui';
    const due = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2})?$/.test(g(8)) ? `${g(8)}${g(8).length === 10 ? ' 12:00' : ''}:00` : null;
    setLoading(true);
    router.put(`/tasks/${task.id}`, {
      title: g(0), description: g(1), type, status: inv(L.status)[g(6)] || 'todo', priority: inv(L.priority)[g(7)] || 'medium',
      due_date: due, project_id: project?.id || task.project_id, sprint_id: sprints.find(s => s.name === g(4))?.id || task.sprint_id,
      assigned_to: ids[0] || null, assigned_user_ids: type === 'group' ? ids : ids.slice(0, 1),
      is_paid: paid, amount: paid ? g(10) : '', payment_status: inv(L.pay)[g(11)] || 'unpaid', payment_reason: paid ? '' : inv(L.reason)[g(12)] || '',
    }, {
      onSuccess: () => { setNote('Tâche mise à jour avec succès'); setLoading(false); setTimeout(() => router.visit('/tasks'), 1200); },
      onError: () => { setNote('Erreur lors de la mise à jour'); setLoading(false); },
    });
  };

  /* ---------- Statistiques de la sélection ---------- */
  const selNums = [];
  for (let r = sel.r1; r <= sel.r2; r++) for (let c = sel.c1; c <= sel.c2; c++) { const v = ev(keyOf(r, c)); if (typeof v === 'number') selNums.push(v); }
  const stat = selNums.length > 1 ? `Somme : ${selNums.reduce((a, b) => a + b, 0).toLocaleString('fr-FR')}   Moyenne : ${(selNums.reduce((a, b) => a + b, 0) / selNums.length).toLocaleString('fr-FR')}   Nb : ${selNums.length}` : '';

  /* ---------- UI ---------- */
  const font = '"Google Sans","Roboto",Arial,sans-serif';
  const Btn = ({ onClick, active, title, children, w }) => (
    <button type="button" title={title} onMouseDown={e => e.preventDefault()} onClick={onClick}
      style={{ minWidth: w || 28, height: 28, borderRadius: 4, background: active ? '#d3e3fd' : 'transparent', fontSize: 14, color: '#444746' }}
      className="px-1.5 hover:bg-gray-200 flex items-center justify-center">{children}</button>
  );
  const Sep = () => <div style={{ width: 1, height: 20, background: '#c7c7c7', margin: '0 6px' }} />;
  const inSel = (r, c) => r >= sel.r1 && r <= sel.r2 && c >= sel.c1 && c <= sel.c2;
  const opts = editing && act[1] === 1 ? options(act[0] + 1) : null;

  return (
    <div style={{ fontFamily: font, background: '#f9fbfd', height: '100vh' }} className="flex flex-col w-full select-none">
      {/* Titre + menus */}
      <div className="flex items-center gap-3 px-3 pt-2">
        <Link href="/tasks" title="Retour" style={{ color: '#0f9d58', fontSize: 30, lineHeight: 1 }}>▤</Link>
        <div>
          <div style={{ fontSize: 18, color: '#1f1f1f' }}>{cells.B2?.v || 'Tâche sans titre'} <span style={{ color: '#5f6368', fontSize: 14 }}>☆</span></div>
          <div className="flex gap-3" style={{ fontSize: 13, color: '#444746' }}>
            {['Fichier', 'Modifier', 'Affichage', 'Insertion', 'Format', 'Données', 'Outils', 'Extensions', 'Aide'].map(m => <span key={m} className="px-1.5 py-0.5 rounded hover:bg-gray-200 cursor-default">{m}</span>)}
          </div>
        </div>
        <div className="flex-1" />
        {note && <span style={{ fontSize: 13, color: /succès/.test(note) ? '#188038' : '#d93025' }}>{note}</span>}
        {Object.values(errors).slice(0, 1).map(m => <span key={m} style={{ fontSize: 13, color: '#d93025' }}>{m}</span>)}
        <button onClick={save} disabled={loading} style={{ background: '#0b57d0', color: '#fff', borderRadius: 20, padding: '8px 22px', fontSize: 14 }} className="hover:opacity-90 disabled:opacity-50">
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>

      {/* Barre d'outils */}
      <div className="flex items-center mx-3 mt-2 px-2 flex-wrap" style={{ background: '#edf2fa', borderRadius: 24, height: 38 }}>
        <Btn title="Annuler (Ctrl+Z)" onClick={undo}>↶</Btn><Btn title="Rétablir (Ctrl+Y)" onClick={redo}>↷</Btn><Sep />
        <select value={zoom} onChange={e => setZoom(+e.target.value)} style={{ background: 'transparent', fontSize: 13 }}>
          {[50, 75, 100, 125, 150].map(z => <option key={z} value={z}>{z} %</option>)}
        </select><Sep />
        <select value={aS.fmt || ''} onChange={e => style({ fmt: e.target.value })} style={{ background: 'transparent', fontSize: 13 }} title="Format des nombres">
          <option value="">Automatique</option><option value="num">Nombre</option><option value="pct">Pourcentage</option><option value="fcfa">FCFA</option>
        </select><Sep />
        <select value={aS.size || 10} onChange={e => style({ size: +e.target.value })} style={{ background: 'transparent', fontSize: 13 }}>
          {[8, 9, 10, 11, 12, 14, 18, 24].map(s => <option key={s} value={s}>{s}</option>)}
        </select><Sep />
        <Btn title="Gras (Ctrl+B)" active={aS.b} onClick={() => toggle('b')}><b>B</b></Btn>
        <Btn title="Italique (Ctrl+I)" active={aS.i} onClick={() => toggle('i')}><i>I</i></Btn>
        <Btn title="Barré" active={aS.s} onClick={() => toggle('s')}><s>S</s></Btn>
        <label title="Couleur du texte" className="relative"><Btn><span style={{ borderBottom: `3px solid ${aS.color || '#000'}`, lineHeight: 1 }}>A</span></Btn>
          <input type="color" value={aS.color || '#000000'} onChange={e => style({ color: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer" /></label>
        <label title="Couleur de remplissage" className="relative"><Btn><span style={{ background: aS.bg || '#ffff00', width: 14, height: 14, border: '1px solid #999', display: 'inline-block' }} /></Btn>
          <input type="color" value={aS.bg || '#ffff00'} onChange={e => style({ bg: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer" /></label>
        <Btn title="Effacer la mise en forme" onClick={() => style({ b: 0, i: 0, s: 0, color: '', bg: '', fmt: '', align: '', size: 10 })}>Tx</Btn><Sep />
        <Btn title="Aligner à gauche" active={aS.align === 'left'} onClick={() => style({ align: 'left' })}>≡</Btn>
        <Btn title="Centrer" active={aS.align === 'center'} onClick={() => style({ align: 'center' })}>☰</Btn>
        <Btn title="Aligner à droite" active={aS.align === 'right'} onClick={() => style({ align: 'right' })}>≣</Btn>
        <Btn title="Renvoyer à la ligne" active={aS.wrap} onClick={() => toggle('wrap')}>↵</Btn>
      </div>

      {/* Barre de formule */}
      <div className="flex items-center mt-2 mx-3" style={{ height: 28, borderTop: '1px solid #e1e3e1', borderBottom: '1px solid #e1e3e1', background: '#fff' }}>
        <div style={{ width: 90, fontSize: 13, textAlign: 'center', borderRight: '1px solid #e1e3e1' }}>
          {sel.r1 === sel.r2 && sel.c1 === sel.c2 ? aKey : `${keyOf(sel.r1, sel.c1)}:${keyOf(sel.r2, sel.c2)}`}
        </div>
        <span style={{ color: '#5f6368', fontStyle: 'italic', padding: '0 10px', fontFamily: 'serif' }}>fx</span>
        <input value={editing ? draft : cells[aKey]?.v ?? ''} className="flex-1 outline-none h-full px-1" style={{ fontSize: 13 }}
          onFocus={() => !editing && startEdit()} onChange={e => { if (!editing) setEditing(true); setDraft(e.target.value); }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); endEdit(true, 1, 0); } else if (e.key === 'Escape') endEdit(false); }} />
      </div>

      {/* Grille */}
      <div className="flex-1 overflow-auto mx-3 bg-white" style={{ border: '1px solid #e1e3e1' }}>
        <div ref={grid} tabIndex={0} onKeyDown={onKeyDown} onCopy={e => onCopy(e, false)} onCut={e => onCopy(e, true)} onPaste={onPaste}
          className="outline-none" style={{ zoom: zoom / 100, width: 46 + Array.from({ length: NC }, (_, c) => colW(c)).reduce((a, b) => a + b, 0) }}>
          <div className="flex sticky top-0 z-20" style={{ height: RH }}>
            <div style={{ width: 46, background: '#f8f9fa', borderRight: '1px solid #c0c0c0', borderBottom: '1px solid #c0c0c0' }} className="sticky left-0 z-30" onClick={() => { setAnchor([0, 0]); setAct([NR - 1, NC - 1]); }} />
            {Array.from({ length: NC }, (_, c) => (
              <div key={c} onClick={() => { setAnchor([0, c]); setAct([NR - 1, c]); }}
                style={{ width: colW(c), fontSize: 12, background: c >= sel.c1 && c <= sel.c2 ? '#d3e3fd' : '#f8f9fa', borderRight: '1px solid #c0c0c0', borderBottom: '1px solid #c0c0c0', fontWeight: c >= sel.c1 && c <= sel.c2 ? 600 : 400 }}
                className="flex items-center justify-center text-gray-700 flex-shrink-0 cursor-pointer">{colName(c)}</div>
            ))}
          </div>
          {Array.from({ length: NR }, (_, r) => (
            <div key={r} className="flex" style={{ height: RH }}>
              <div onClick={() => { setAnchor([r, 0]); setAct([r, NC - 1]); }} className="sticky left-0 z-10 flex items-center justify-center flex-shrink-0 cursor-pointer"
                style={{ width: 46, fontSize: 12, background: r >= sel.r1 && r <= sel.r2 ? '#d3e3fd' : '#f8f9fa', borderRight: '1px solid #c0c0c0', borderBottom: '1px solid #c0c0c0', color: '#444' }}>{r + 1}</div>
              {Array.from({ length: NC }, (_, c) => {
                const k = keyOf(r, c), cell = cells[k], s = cell?.s || {}, v = ev(k), isAct = r === act[0] && c === act[1];
                const num = typeof v === 'number';
                const err = typeof v === 'string' && v.startsWith('#');
                return (
                  <div key={c} className="flex-shrink-0 relative"
                    onMouseDown={e => { if (e.shiftKey) setAct([r, c]); else { setAct([r, c]); setAnchor([r, c]); } setDrag(true); if (editing) endEdit(true); grid.current?.focus(); }}
                    onMouseEnter={() => drag && setAct([r, c])} onDoubleClick={() => startEdit()}
                    style={{
                      width: colW(c), height: RH, borderRight: '1px solid #e2e3e3', borderBottom: '1px solid #e2e3e3', background: inSel(r, c) && !isAct ? (s.bg ? s.bg : '#e8f0fe') : s.bg || '#fff',
                      boxShadow: inSel(r, c) && !isAct ? 'inset 0 0 0 100px rgba(11,87,208,.08)' : 'none', outline: isAct ? '2px solid #0b57d0' : 'none', outlineOffset: -1, zIndex: isAct ? 5 : 0,
                      fontSize: (s.size || 10) + 3, fontWeight: s.b ? 700 : 400, fontStyle: s.i ? 'italic' : 'normal', textDecoration: s.s ? 'line-through' : 'none',
                      color: err ? '#d93025' : s.color || '#000', textAlign: s.align || (num ? 'right' : 'left'), padding: '0 3px', lineHeight: `${RH - 1}px`,
                      whiteSpace: s.wrap ? 'normal' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                    {isAct && editing ? (
                      opts ? (
                        <select autoFocus value={draft} onChange={e => setDraft(e.target.value)} onBlur={() => endEdit(true)} className="w-full h-full text-xs outline-none bg-white absolute inset-0 z-10">
                          <option value="" />{opts.filter(Boolean).map(o => <option key={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
                          onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); endEdit(true, 1, 0); } else if (e.key === 'Tab') { e.preventDefault(); endEdit(true, 0, e.shiftKey ? -1 : 1); } else if (e.key === 'Escape') endEdit(false); }}
                          onFocus={e => e.target.setSelectionRange(draft.length, draft.length)}
                          className="absolute inset-0 w-full h-full outline-none bg-white z-10 px-1" style={{ fontSize: (s.size || 10) + 3, boxShadow: '0 2px 6px rgba(0,0,0,.3)' }} />
                      )
                    ) : show(v, s.fmt)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Onglets + barre d'état */}
      <div className="flex items-center mx-3 mb-1 px-2" style={{ height: 36, background: '#f9fbfd' }}>
        <button type="button" style={{ fontSize: 22, color: '#444', marginRight: 10 }} title="Ajouter une feuille">＋</button>
        <div style={{ background: '#e1e9f7', color: '#0b57d0', fontWeight: 600, fontSize: 13, padding: '6px 16px', borderBottom: '3px solid #0b57d0' }}>Tâche #{task.id}</div>
        <div className="flex-1" />
        <span style={{ fontSize: 12, color: '#444746', whiteSpace: 'pre' }}>{stat}</span>
      </div>
    </div>
  );
}

Edit.layout = page => <AdminLayout children={page} />;
export default Edit;