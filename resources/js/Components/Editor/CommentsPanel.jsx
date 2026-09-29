import React, { useState } from 'react';
import { FaCommentMedical, FaCheck, FaTrash, FaReply, FaUndo, FaTimes } from 'react-icons/fa';

const fmt = (ts) => (ts
  ? new Date(ts).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  : '');

const COLORS = ['#1a73e8', '#7c3aed', '#16a34a', '#d97706', '#e11d48', '#0891b2'];

const Initial = ({ name, id }) => (
  <div
    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0"
    style={{ background: COLORS[Math.abs(Number(id) || 0) % COLORS.length] }}
  >
    {(name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
  </div>
);

const Composer = ({ placeholder, onSubmit, onCancel, submitLabel = 'Commenter', autoFocus = true }) => {
  const [text, setText] = useState('');
  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onSubmit(t);
    setText('');
  };
  return (
    <div>
      <textarea
        autoFocus={autoFocus}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); }
          if (e.key === 'Escape') onCancel?.();
        }}
        rows={2}
        placeholder={placeholder}
        className="w-full text-[13px] border border-slate-300 rounded-lg px-2.5 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/40 focus:border-[#1a73e8]"
      />
      <div className="flex justify-end gap-2 mt-1.5">
        {onCancel && <button type="button" onClick={onCancel} className="px-3 h-7 text-[12px] rounded-full text-slate-600 hover:bg-slate-100">Annuler</button>}
        <button type="button" onClick={submit} disabled={!text.trim()} className="px-3 h-7 text-[12px] rounded-full bg-[#1a73e8] text-white hover:bg-[#1765cc] disabled:opacity-40">{submitLabel}</button>
      </div>
    </div>
  );
};

const CommentsPanel = ({
  comments = [],
  activeId,
  onSelect,
  pendingQuote,
  onAdd,
  onCancelPending,
  onReply,
  onResolve,
  onDelete,
  currentUserId,
  canModerate = false,
  canComment = true,
  onClose,
}) => {
  const [filter, setFilter] = useState('open');

  const threads = comments
    .filter((c) => c.kind === 'comment')
    .filter((c) => (filter === 'open' ? !c.resolved : c.resolved))
    .sort((a, b) => a.createdAt - b.createdAt);

  const repliesOf = (id) => comments.filter((c) => c.kind === 'reply' && c.parentId === id).sort((a, b) => a.createdAt - b.createdAt);
  const openCount = comments.filter((c) => c.kind === 'comment' && !c.resolved).length;
  const doneCount = comments.filter((c) => c.kind === 'comment' && c.resolved).length;
  const canDelete = (c) => canModerate || String(c.userId) === String(currentUserId);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <span className="text-[13px] font-semibold text-slate-800 flex items-center gap-2"><FaCommentMedical className="text-[#1a73e8]" /> Commentaires</span>
        <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-400"><FaTimes className="text-xs" /></button>
      </div>

      <div className="flex gap-1 px-3 pt-2">
        {[['open', `Ouverts (${openCount})`], ['resolved', `Résolus (${doneCount})`]].map(([k, label]) => (
          <button key={k} type="button" onClick={() => setFilter(k)}
            className={`px-3 h-7 rounded-full text-[12px] font-medium transition-colors ${filter === k ? 'bg-[#e8f0fe] text-[#1a73e8]' : 'text-slate-500 hover:bg-slate-100'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {pendingQuote != null && (
          <div className="rounded-xl border-2 border-[#1a73e8] bg-white p-3 shadow-md">
            <p className="text-[12px] italic text-slate-500 border-l-2 border-amber-400 pl-2 mb-2 line-clamp-3">« {pendingQuote} »</p>
            <Composer placeholder="Ajouter un commentaire… (Ctrl+Entrée pour envoyer)" onSubmit={onAdd} onCancel={onCancelPending} />
          </div>
        )}

        {threads.length === 0 && pendingQuote == null && (
          <div className="text-center text-[12.5px] text-slate-400 py-10 px-4">
            {filter === 'open'
              ? (canComment ? 'Sélectionnez du texte puis cliquez sur « Commenter » pour lancer une discussion.' : 'Aucun commentaire.')
              : 'Aucun commentaire résolu.'}
          </div>
        )}

        {threads.map((c) => {
          const active = c.id === activeId;
          const replies = repliesOf(c.id);
          return (
            <div key={c.id} onClick={() => onSelect?.(c.id)}
              className={`rounded-xl border p-3 cursor-pointer transition-shadow ${active ? 'border-[#1a73e8] shadow-md bg-[#f8fbff]' : 'border-slate-200 hover:shadow-sm bg-white'}`}>
              <div className="flex items-start gap-2">
                <Initial name={c.userName} id={c.userId} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12.5px] font-semibold text-slate-800 truncate">{c.userName}</span>
                    <span className="text-[10.5px] text-slate-400 flex-shrink-0">{fmt(c.createdAt)}</span>
                  </div>
                  {c.quote && <p className="text-[11.5px] italic text-slate-500 border-l-2 border-amber-400 pl-2 my-1.5 line-clamp-2">« {c.quote} »</p>}
                  <p className="text-[13px] text-slate-700 whitespace-pre-wrap break-words">{c.text}</p>
                </div>
              </div>

              {replies.map((r) => (
                <div key={r.id} className="flex items-start gap-2 mt-3 pl-4">
                  <Initial name={r.userName} id={r.userId} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-semibold text-slate-800 truncate">{r.userName}</span>
                      <span className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10.5px] text-slate-400">{fmt(r.createdAt)}</span>
                        {canDelete(r) && <button type="button" title="Supprimer la réponse" onClick={(e) => { e.stopPropagation(); onDelete?.(r.id); }} className="text-slate-300 hover:text-red-500"><FaTrash className="text-[9px]" /></button>}
                      </span>
                    </div>
                    <p className="text-[12.5px] text-slate-700 whitespace-pre-wrap break-words">{r.text}</p>
                  </div>
                </div>
              ))}

              {active && canComment && !c.resolved && (
                <div className="mt-3 pl-4" onClick={(e) => e.stopPropagation()}>
                  <Composer autoFocus={false} placeholder="Répondre…" submitLabel="Répondre" onSubmit={(t) => onReply?.(c.id, t)} />
                </div>
              )}

              <div className="flex items-center justify-end gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                {canComment && (
                  <button type="button" onClick={() => onResolve?.(c.id)} title={c.resolved ? 'Rouvrir' : 'Résoudre'}
                    className="flex items-center gap-1 px-2 h-6 rounded-full text-[11px] text-slate-500 hover:bg-slate-100">
                    {c.resolved ? <><FaUndo className="text-[9px]" /> Rouvrir</> : <><FaCheck className="text-[9px] text-emerald-600" /> Résoudre</>}
                  </button>
                )}
                {!active && !c.resolved && canComment && (
                  <button type="button" onClick={() => onSelect?.(c.id)} className="flex items-center gap-1 px-2 h-6 rounded-full text-[11px] text-slate-500 hover:bg-slate-100">
                    <FaReply className="text-[9px]" /> Répondre
                  </button>
                )}
                {canDelete(c) && (
                  <button type="button" onClick={() => onDelete?.(c.id)} title="Supprimer le fil" className="flex items-center gap-1 px-2 h-6 rounded-full text-[11px] text-slate-400 hover:bg-red-50 hover:text-red-600">
                    <FaTrash className="text-[9px]" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommentsPanel;
