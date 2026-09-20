import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Head, router } from '@inertiajs/react';
import { FaCheck, FaClock, FaSpinner, FaShieldAlt, FaUsers, FaQuestionCircle, FaStar, FaCalculator, FaExclamationTriangle } from 'react-icons/fa';
import MobileLayout from '@/Layouts/MobileLayout';
import Avatar from '@/Components/Quiz/Avatar';
import ScoreBadge, { fmtNumber } from '@/Components/Quiz/ScoreBadge';
import { MHero, MCard, MPill, MSheet, MActionBar, MButton, MSectionTitle, MStat } from '@/Components/Mobile/kit';

const TYPE = { qcm: ['QCM', 'blue'], written: ['Écrit', 'purple'], mixed: ['Mixte', 'amber'] };

export default function MobileCumulCreate({ project, quizzes = [], cap }) {
  const [selected, setSelected] = useState({});
  const [title, setTitle] = useState('');
  const [missing, setMissing] = useState('zero');
  const [bonus, setBonus] = useState(true);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [sheet, setSheet] = useState(false);
  const req = useRef(0);

  const items = useMemo(() => Object.entries(selected).map(([id, c]) => ({ quiz_id: Number(id), coefficient: Number(c) > 0 ? Number(c) : 1 })), [selected]);
  const toggle = (q) => q.selectable && setSelected((s) => { const n = { ...s }; if (n[q.id] !== undefined) delete n[q.id]; else n[q.id] = 1; return n; });

  useEffect(() => {
    if (items.length < 2) { setPreview(null); return undefined; }
    const id = ++req.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try { const { data } = await axios.post(route('projects.quiz-cumuls.preview', project.id), { items, missing_policy: missing, include_bonus: bonus }); if (id === req.current) setPreview(data); }
      catch { if (id === req.current) setPreview(null); }
      finally { if (id === req.current) setLoading(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [items, missing, bonus, project.id]);

  const blocked = preview && Object.keys(preview.blocking || {}).length > 0;
  const canSubmit = items.length >= 2 && title.trim() && !saving && !blocked;
  const submit = () => router.post(route('projects.quiz-cumuls.store', project.id), { title, items, missing_policy: missing, include_bonus: bonus }, { onStart: () => setSaving(true), onError: (e) => { setErrors(e); if (e.title) window.scrollTo?.(0, 0); }, onFinish: () => setSaving(false) });

  return (
    <MobileLayout title="Cumuler des quiz" backHref={route('projects.quizzes.index', project.id)} hideBottomNav refreshable={false}>
      <Head title="Cumuler des quiz" />
      <div className="space-y-4 py-4 pb-28">
        <MHero eyebrow="Sélection finale" title="Moyenne sur plusieurs quiz" subtitle="Choisissez les quiz : la moyenne de chaque candidat est calculée automatiquement." tone="from-indigo-600 to-purple-700" />

        <div>
          <MSectionTitle right={<span className="text-[11px] font-bold text-indigo-600">{items.length} choisi(s)</span>}>1 · Quiz à cumuler</MSectionTitle>
          <div className="space-y-2">
            {quizzes.map((q) => {
              const on = selected[q.id] !== undefined; const [tl, tt] = TYPE[q.quiz_type] || TYPE.qcm;
              return (
                <div key={q.id} className={`rounded-2xl border-2 p-3.5 transition ${!q.selectable ? 'border-slate-200 opacity-60 dark:border-slate-800' : on ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}>
                  <button type="button" disabled={!q.selectable} onClick={() => toggle(q)} className="flex w-full items-start gap-3 text-left">
                    <span className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs ${on ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 text-transparent'}`}><FaCheck /></span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap gap-1.5"><MPill tone={tt}>{tl}</MPill>{q.validated && <MPill tone="green"><FaShieldAlt /> Validé</MPill>}</div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{q.title}</h4>
                      <p className="mt-1 flex gap-3 text-[11px] text-slate-500"><span><FaQuestionCircle className="mr-1 inline" />{q.questions_count}</span><span><FaUsers className="mr-1 inline" />{q.participants_count}</span></p>
                      {!q.selectable && <p className="mt-1 text-[11px] font-semibold text-amber-700"><FaClock className="mr-1 inline" />{q.pending_count > 0 ? `${q.pending_count} copie(s) à corriger` : 'Aucun résultat'}</p>}
                    </div>
                  </button>
                  {on && (
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-white p-2 dark:bg-slate-800">
                      <span className="text-xs font-extrabold uppercase text-indigo-700 dark:text-indigo-300">Coefficient</span>
                      <input type="number" min="0" max="100" step="any" inputMode="decimal" value={selected[q.id]} onChange={(e) => setSelected((s) => ({ ...s, [q.id]: e.target.value }))} className="h-11 w-24 rounded-xl border-indigo-200 text-center text-[16px] font-bold dark:border-indigo-800 dark:bg-slate-900 dark:text-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {errors.items && <p className="mt-2 text-xs font-semibold text-rose-500">{errors.items}</p>}
        </div>

        <div className="space-y-3">
          <MSectionTitle>2 · Paramètres</MSectionTitle>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nom du quiz cumulé *" className="h-14 w-full rounded-2xl border-slate-200 text-[16px] dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
          {errors.title && <p className="text-xs text-rose-500">{errors.title}</p>}
          <div className="flex gap-1 rounded-2xl bg-slate-100 p-1 text-xs font-bold dark:bg-slate-800">
            {[['zero', 'Absent = 0'], ['ignore', 'Absent ignoré']].map(([v, l]) => <button key={v} type="button" onClick={() => setMissing(v)} className={`flex-1 rounded-xl py-3 ${missing === v ? 'bg-white text-indigo-700 shadow dark:bg-slate-700' : 'text-slate-500'}`}>{l}</button>)}
          </div>
          <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 dark:border-amber-800 dark:bg-amber-950/20"><input type="checkbox" checked={bonus} onChange={(e) => setBonus(e.target.checked)} className="mt-0.5 h-5 w-5 rounded border-slate-300 text-amber-600" /><span className="text-xs text-amber-900 dark:text-amber-200"><b className="flex items-center gap-1"><FaStar /> Ajouter le bonus de participation</b>Plafonné à {cap} points, ajouté une seule fois.</span></label>
        </div>
      </div>

      <MActionBar>
        <MButton onClick={() => setSheet(true)} tone="soft" size="lg" disabled={items.length < 2} className="!px-4">{loading ? <FaSpinner className="animate-spin" /> : <FaCalculator />}</MButton>
        <MButton onClick={submit} size="lg" disabled={!canSubmit} className="flex-1 !bg-indigo-600">{saving ? <FaSpinner className="animate-spin" /> : <FaCheck />} Valider le cumul</MButton>
      </MActionBar>

      <MSheet open={sheet} onClose={() => setSheet(false)} title="Aperçu du calcul">
        {!preview ? <p className="py-8 text-center text-sm text-slate-400">{loading ? 'Calcul en cours…' : 'Aperçu indisponible.'}</p> : (
          <div className="space-y-3 pb-3">
            {blocked && <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800"><FaExclamationTriangle className="mt-0.5" /> Des copies restent à corriger : validation impossible.</p>}
            <div className="grid grid-cols-3 gap-2"><MStat label="Candidats" value={preview.stats.total} /><MStat label="Moyenne" value={preview.stats.average != null ? `${fmtNumber(preview.stats.average, 1)}%` : '—'} tone="text-indigo-600" /><MStat label="Réussite" value={preview.stats.pass_rate != null ? `${fmtNumber(preview.stats.pass_rate, 0)}%` : '—'} tone="text-emerald-600" /></div>
            {preview.rows.map((r) => (
              <div key={r.key} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <span className="w-5 text-center text-xs font-black text-slate-400">{r.rank ?? '—'}</span><Avatar name={r.name} src={r.photo} size="sm" />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900 dark:text-white">{r.name}</p><p className="truncate text-[10px] text-slate-500">{r.calculation}</p></div>
                <ScoreBadge score={r.final} pending={r.is_pending} size="md" />
              </div>
            ))}
          </div>
        )}
      </MSheet>
    </MobileLayout>
  );
}
