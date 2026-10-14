import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { HiSparkles } from 'react-icons/hi2';
import {
  FaCheckCircle, FaChevronDown, FaChevronUp, FaExclamationTriangle, FaSpinner, FaStop, FaTimes, FaMagic, FaRedo, FaBolt,
} from 'react-icons/fa';

export const STRICTNESS = [
  ['indulgent', 'Indulgent', 'Valorise les efforts et les idées justes.'],
  ['equilibre', 'Équilibré', 'Exigence raisonnable (recommandé).'],
  ['strict', 'Strict', 'Précision et complétude exigées.'],
];

const PREF_KEY = 'proja:quiz-ai-prefs';
const loadPrefs = () => { try { return { strictness: 'equilibre', instructions: '', ...(JSON.parse(localStorage.getItem(PREF_KEY) || '{}')) }; } catch { return { strictness: 'equilibre', instructions: '' }; } };
const savePrefs = (p) => { try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch { /* noop */ } };

const errorOf = (e) => e.response?.data?.message || (e.response?.status === 419 ? 'Session expirée : rechargez la page.' : e.message) || "La correction par l'IA a échoué.";

/** Réglages communs : sévérité + consignes libres (mémorisés sur ce navigateur). */
export function AiOptions({ value, onChange, compact = false }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Sévérité de la correction</p>
        <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
          {STRICTNESS.map(([id, label, hint]) => (
            <button key={id} type="button" title={hint} onClick={() => onChange({ ...value, strictness: id })}
              className={`rounded-lg px-2 py-2 text-xs font-bold transition ${value.strictness === id ? 'bg-white text-purple-700 shadow dark:bg-gray-700 dark:text-purple-300' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>{label}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Consignes pour l’IA (facultatif)</label>
        <textarea rows={compact ? 2 : 3} maxLength={1000} value={value.instructions} onChange={(e) => onChange({ ...value, instructions: e.target.value })}
          placeholder="Ex. : Ne pas pénaliser l’orthographe. 2 points pour un exemple concret. Accepter les réponses en anglais."
          className="w-full rounded-xl border-gray-300 text-sm focus:border-purple-500 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
      </div>
    </div>
  );
}

/** Badge « IA » affiché sur chaque question d'une copie corrigée par l'IA. */
export function AiBadge({ ai }) {
  if (!ai) return null;
  const review = ai.review;
  return (
    <div className={`mt-1 flex flex-wrap items-center gap-2 text-[11px] ${review ? 'text-amber-700 dark:text-amber-300' : 'text-purple-600 dark:text-purple-300'}`}>
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold ${review ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
        <HiSparkles /> Note IA{ai.confidence != null ? ` · confiance ${ai.confidence} %` : ''}
      </span>
      {review && <span className="inline-flex items-center gap-1 font-semibold"><FaExclamationTriangle /> À relire</span>}
      {ai.note && <span className="w-full rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">Remarque pour le correcteur : {ai.note}</span>}
    </div>
  );
}

/**
 * Bandeau « Corriger avec l'IA » placé en tête de la copie.
 *  - bouton principal : l'IA corrige ET enregistre la copie (puis on passe à la suivante) ;
 *  - « Proposer sans enregistrer » : remplit les notes dans le formulaire pour relecture.
 */
export function AiGradeBar({ ai, project, quiz, current, maxScore, onPropose, onApplied }) {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState(loadPrefs);
  const [busy, setBusy] = useState(null); // 'apply' | 'propose'
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [remaining, setRemaining] = useState(ai.remaining);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => { savePrefs(prefs); }, [prefs]);
  useEffect(() => {
    if (!busy) { setElapsed(0); return undefined; }
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [busy]);

  const run = async (apply) => {
    if (busy) return;
    if (apply && current.already_graded && !window.confirm("Cette copie est déjà corrigée : l'IA va remplacer les notes et commentaires existants. Continuer ?")) return;
    setBusy(apply ? 'apply' : 'propose');
    setError(''); setNotice(null);
    try {
      const { data } = await axios.post(route('projects.quizzes.grading.ai', [project.id, quiz.id, current.id]), { ...prefs, apply });
      setRemaining(data.remaining);
      if (apply) { onApplied(data); } else { onPropose(data); setNotice({ review: data.summary.review_count, total: data.summary.total, max: data.summary.max }); }
    } catch (e) {
      setError(errorOf(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 via-white to-indigo-50 shadow-sm dark:border-purple-900/50 dark:from-purple-950/30 dark:via-gray-800 dark:to-indigo-950/20">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-xl text-white shadow-md"><HiSparkles /></span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Correction par l’IA</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Note chaque question sur {maxScore} avec un commentaire personnalisé. Vous gardez la main : toute note reste modifiable.
            {remaining != null && <span className="ml-1 font-medium">· {remaining} copie(s) restante(s) aujourd’hui</span>}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button type="button" onClick={() => run(true)} disabled={!!busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-purple-700 hover:to-indigo-700 active:scale-[0.98] disabled:opacity-60">
            {busy === 'apply' ? <><FaSpinner className="animate-spin" /> Correction… {elapsed}s</> : <><FaMagic /> Corriger avec l’IA</>}
          </button>
          <button type="button" onClick={() => run(false)} disabled={!!busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-300 bg-white px-4 py-2.5 text-sm font-semibold text-purple-700 transition hover:bg-purple-50 disabled:opacity-60 dark:border-purple-700 dark:bg-gray-800 dark:text-purple-300">
            {busy === 'propose' ? <FaSpinner className="animate-spin" /> : null} Proposer sans enregistrer
          </button>
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Réglages de la correction IA"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-600 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-gray-700">
            Réglages {open ? <FaChevronUp className="text-[9px]" /> : <FaChevronDown className="text-[9px]" />}
          </button>
        </div>
      </div>

      {open && <div className="border-t border-purple-100 bg-white/60 p-4 dark:border-purple-900/40 dark:bg-gray-900/30 sm:p-5"><AiOptions value={prefs} onChange={setPrefs} /></div>}

      {notice && (
        <div className="border-t border-purple-100 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800 dark:border-purple-900/40 dark:bg-emerald-900/20 dark:text-emerald-200 sm:px-5">
          <FaCheckCircle className="mr-1.5 inline" /> Notes proposées : {notice.total}/{notice.max}. Relisez-les ci-dessous puis enregistrez.
          {notice.review > 0 && <span className="ml-1 font-bold text-amber-700 dark:text-amber-300">{notice.review} question(s) signalée(s) « à relire ».</span>}
        </div>
      )}
      {error && (
        <div role="alert" className="flex items-start gap-2 border-t border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 sm:px-5">
          <FaExclamationTriangle className="mt-0.5 shrink-0" /> <span className="flex-1">{error}</span>
          <button type="button" onClick={() => run(true)} className="inline-flex items-center gap-1 font-bold underline"><FaRedo className="text-[10px]" /> Réessayer</button>
        </div>
      )}
    </div>
  );
}

/**
 * Correction de TOUTES les copies restantes, une par une (chaque copie = une requête : pas de délai d'attente,
 * progression en direct, arrêt possible). Les copies réservées par un autre correcteur sont laissées de côté.
 */
export function AiBatchModal({ open, onClose, ai, project, quiz, copies, onDone }) {
  const [prefs, setPrefs] = useState(loadPrefs);
  const [includeGraded, setIncludeGraded] = useState(false);
  const [phase, setPhase] = useState('setup'); // setup | running | done
  const [items, setItems] = useState([]);       // { id, reference, name, state, message?, total?, max?, review? }
  const stopRef = useRef(false);

  useEffect(() => { if (open) { setPhase('setup'); setItems([]); stopRef.current = false; } }, [open]);
  useEffect(() => { savePrefs(prefs); }, [prefs]);

  const targets = useMemo(() => copies.filter((c) => c.status !== 'locked' && (includeGraded || c.status !== 'graded')), [copies, includeGraded]);
  const lockedCount = copies.filter((c) => c.status === 'locked').length;
  const done = items.filter((i) => ['ok', 'skipped', 'failed'].includes(i.state)).length;
  const ok = items.filter((i) => i.state === 'ok');
  const flagged = ok.filter((i) => i.review > 0);
  const failed = items.filter((i) => i.state === 'failed');
  const tooMany = ai.remaining != null && targets.length > ai.remaining;

  const patch = (id, p) => setItems((list) => list.map((i) => (i.id === id ? { ...i, ...p } : i)));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const start = useCallback(async () => {
    const queue = targets.slice(0, ai.remaining != null ? ai.remaining : targets.length);
    setItems(queue.map((c) => ({ id: c.id, reference: c.reference, name: c.name, state: 'wait' })));
    setPhase('running');
    stopRef.current = false;

    for (const c of queue) {
      if (stopRef.current) { patch(c.id, { state: 'skipped', message: 'Arrêtée.' }); continue; }
      patch(c.id, { state: 'run' });
      let attempt = 0;
      // Trois essais par copie : une saturation passagère d'un fournisseur d'IA ne doit pas faire échouer tout le lot
      while (true) {
        try {
          const { data } = await axios.post(route('projects.quizzes.grading.ai', [project.id, quiz.id, c.id]), { ...prefs, apply: true });
          patch(c.id, { state: 'ok', total: data.summary.total, max: data.summary.max, review: data.summary.review_count });
          break;
        } catch (e) {
          const status = e.response?.status;
          const msg = errorOf(e);
          if (status === 429 && e.response?.data?.code === 'quota') { patch(c.id, { state: 'failed', message: msg }); stopRef.current = true; break; }
          if (status === 409) { patch(c.id, { state: 'skipped', message: 'Copie en cours de correction par un autre correcteur.' }); break; }
          if (status === 423 || status === 403) { patch(c.id, { state: 'failed', message: msg }); stopRef.current = true; break; }
          attempt += 1;
          if (attempt >= 3 || stopRef.current) { patch(c.id, { state: 'failed', message: msg }); break; }
          await sleep(attempt * 8000);
        }
      }
    }
    setPhase('done');
    onDone?.();
  }, [targets, ai.remaining, prefs, project.id, quiz.id, onDone]);

  if (!open) return null;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-gray-900 sm:rounded-3xl">
        <header className="flex items-start gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-4 text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-xl"><HiSparkles /></span>
          <div className="min-w-0 flex-1"><h2 className="text-base font-extrabold">Corriger toutes les copies avec l’IA</h2><p className="text-xs text-purple-100 truncate">{quiz.title}</p></div>
          <button type="button" onClick={onClose} disabled={phase === 'running'} aria-label="Fermer" className="rounded-full p-2 hover:bg-white/15 disabled:opacity-40"><FaTimes /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {phase === 'setup' && (
            <div className="space-y-5">
              <div className="rounded-2xl bg-purple-50 p-4 text-sm text-purple-900 dark:bg-purple-900/20 dark:text-purple-100">
                <p><strong>{targets.length}</strong> copie(s) à corriger{lockedCount > 0 && <> · {lockedCount} réservée(s) par un autre correcteur (ignorée(s))</>}.</p>
                <p className="mt-1 text-xs opacity-80">Chaque copie est notée question par question, avec un commentaire personnalisé, sur la base d’un barème commun généré une seule fois pour garantir une notation homogène. Les copies à faible confiance sont signalées pour relecture.</p>
              </div>
              <AiOptions value={prefs} onChange={setPrefs} />
              <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                <input type="checkbox" checked={includeGraded} onChange={(e) => setIncludeGraded(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                Inclure aussi les copies déjà corrigées <span className="text-xs text-red-600">(leurs notes seront remplacées)</span>
              </label>
              {tooMany && <p className="rounded-xl bg-amber-50 p-3 text-xs font-medium text-amber-800 dark:bg-amber-900/20 dark:text-amber-200"><FaExclamationTriangle className="mr-1 inline" />Votre quota du jour permet {ai.remaining} copie(s) : les {ai.remaining} premières seront corrigées.</p>}
            </div>
          )}

          {phase !== 'setup' && (
            <div className="space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-300"><span>{done} / {items.length} copie(s) traitée(s)</span><span>{pct} %</span></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"><div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500" style={{ width: `${pct}%` }} /></div>
              </div>
              {phase === 'done' && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/20"><p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{ok.length}</p><p className="text-[11px] font-semibold text-emerald-700/80">corrigée(s)</p></div>
                  <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-900/20"><p className="text-2xl font-black text-amber-700 dark:text-amber-300">{flagged.length}</p><p className="text-[11px] font-semibold text-amber-700/80">à relire</p></div>
                  <div className="rounded-xl bg-red-50 p-3 dark:bg-red-900/20"><p className="text-2xl font-black text-red-700 dark:text-red-300">{failed.length}</p><p className="text-[11px] font-semibold text-red-700/80">en échec</p></div>
                </div>
              )}
              <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-100 dark:divide-gray-800 dark:border-gray-800">
                {items.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <span className="w-5 shrink-0 text-center">
                      {i.state === 'run' ? <FaSpinner className="animate-spin text-purple-600" /> : i.state === 'ok' ? <FaCheckCircle className="text-emerald-500" /> : i.state === 'failed' ? <FaExclamationTriangle className="text-red-500" /> : i.state === 'skipped' ? <FaStop className="text-gray-400" /> : <span className="text-gray-300">•</span>}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium text-gray-800 dark:text-gray-100">{i.name} <span className="text-xs text-gray-400">{i.reference}</span></span>
                    {i.state === 'ok' && <span className="shrink-0 text-xs font-bold tabular-nums text-gray-700 dark:text-gray-200">{i.total}/{i.max}{i.review > 0 && <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800">à relire</span>}</span>}
                    {(i.state === 'failed' || i.state === 'skipped') && <span className="max-w-[45%] truncate text-xs text-red-600 dark:text-red-300" title={i.message}>{i.message}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3 dark:border-gray-800 dark:bg-gray-900/60">
          {phase === 'setup' && (<>
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">Annuler</button>
            <button type="button" onClick={start} disabled={targets.length === 0 || ai.remaining === 0} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-50"><FaBolt /> Lancer la correction ({Math.min(targets.length, ai.remaining ?? targets.length)})</button>
          </>)}
          {phase === 'running' && <button type="button" onClick={() => { stopRef.current = true; }} className="inline-flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"><FaStop /> Arrêter après la copie en cours</button>}
          {phase === 'done' && <button type="button" onClick={onClose} className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-purple-700">Terminer</button>}
        </footer>
      </div>
    </div>
  );
}
