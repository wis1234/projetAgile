import React, { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { FaTrophy, FaMedal, FaAward, FaClock, FaStar, FaFileExcel, FaFilePdf, FaSlidersH, FaSpinner, FaChevronDown, FaChevronUp, FaExclamationTriangle, FaShieldAlt, FaCheck } from 'react-icons/fa';
import MobileLayout from '@/Layouts/MobileLayout';
import Avatar from '@/Components/Quiz/Avatar';
import ScoreBadge, { fmtNumber } from '@/Components/Quiz/ScoreBadge';
import { MHero, MCard, MStat, MSearch, MSheet, MButton, MDownload, MSectionTitle } from '@/Components/Mobile/kit';

const Rank = ({ rank }) => rank === 1 ? <FaTrophy className="text-xl text-amber-400" /> : rank === 2 ? <FaMedal className="text-xl text-slate-400" /> : rank === 3 ? <FaAward className="text-xl text-amber-600" /> : !rank ? <FaClock className="text-amber-500" /> : <span className="text-sm font-black text-slate-400">#{rank}</span>;

export default function MobileCumulShow({ project, cumul, quizzes = [], rows = [], stats = {}, method, blocking = [] }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState({});
  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(null);
  const list = useMemo(() => rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase())), [rows, q]);
  const notValidated = quizzes.filter((x) => !x.validated).length;

  const openEdit = () => { setForm({ title: cumul.title, description: cumul.description || '', missing_policy: cumul.missing_policy, include_bonus: !!cumul.include_bonus, coefs: Object.fromEntries(quizzes.map((x) => [x.id, String(x.coefficient)])) }); setErrors({}); setEdit(true); };
  const save = () => router.put(route('projects.quiz-cumuls.update', [project.id, cumul.id]),
    { title: form.title, description: form.description, missing_policy: form.missing_policy, include_bonus: form.include_bonus, items: quizzes.map((x) => ({ quiz_id: x.id, coefficient: Number(form.coefs[x.id]) })) },
    { preserveScroll: true, onStart: () => setBusy(true), onSuccess: () => setEdit(false), onError: setErrors, onFinish: () => setBusy(false) });

  return (
    <MobileLayout title="Résultats cumulés" backHref={route('projects.quizzes.index', project.id)}>
      <Head title={cumul.title} />
      <div className="space-y-4 py-4">
        <MHero eyebrow="Quiz cumulé" title={cumul.title} subtitle={cumul.description || undefined} tone="from-indigo-600 to-purple-700">
          <div className="flex flex-wrap gap-1.5">{quizzes.map((x) => <span key={x.id} className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">{x.validated && <FaShieldAlt className="text-emerald-300" />}{x.title} <b className="rounded bg-white/20 px-1">×{x.coefficient}</b></span>)}</div>
        </MHero>

        <div className="grid grid-cols-3 gap-2">
          <MButton onClick={openEdit} tone="soft" size="lg" className="flex-col !gap-1 !px-1 text-[11px]"><FaSlidersH /> Coefs</MButton>
          <MDownload href={route('projects.quiz-cumuls.export', [project.id, cumul.id, 'xlsx'])}><FaFileExcel className="text-emerald-600" /> Excel</MDownload>
          <MDownload href={route('projects.quiz-cumuls.export', [project.id, cumul.id, 'pdf'])}><FaFilePdf className="text-rose-600" /> PDF</MDownload>
        </div>

        {(notValidated > 0 || blocking.length > 0) && <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800 dark:bg-amber-950/30"><FaExclamationTriangle className="mt-0.5 flex-shrink-0" />{blocking.length > 0 && <>Copies à corriger dans : {blocking.join(', ')}. </>}{notValidated > 0 && <>{notValidated} quiz non validé(s) : résultats provisoires.</>}</p>}

        <div className="grid grid-cols-3 gap-2">
          <MStat label="Candidats" value={stats.total ?? 0} />
          <MStat label="Moyenne" value={stats.average != null ? `${fmtNumber(stats.average, 1)}%` : '—'} tone="text-indigo-600" />
          <MStat label="Réussite" value={stats.pass_rate != null ? `${fmtNumber(stats.pass_rate, 0)}%` : '—'} tone="text-emerald-600" />
        </div>

        <MSearch value={q} onChange={setQ} placeholder="Rechercher un candidat" />

        <div className="space-y-2">
          {list.map((r) => (
            <MCard key={r.key} className="!p-3">
              <button type="button" onClick={() => setOpen((o) => ({ ...o, [r.key]: !o[r.key] }))} className="flex w-full items-center gap-3 text-left">
                <div className="flex w-8 justify-center"><Rank rank={r.rank} /></div>
                <Avatar name={r.name} src={r.photo} size="md" />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900 dark:text-white">{r.name}</p><p className="text-[11px] text-slate-500">Moyenne {r.average != null ? fmtNumber(r.average) : '—'}{method.include_bonus && r.bonus > 0 && <span className="ml-1 font-bold text-amber-600"><FaStar className="mr-0.5 inline text-[9px]" />+{fmtNumber(r.bonus)}</span>}</p></div>
                <ScoreBadge score={r.final} pending={r.is_pending} size="md" />
                {open[r.key] ? <FaChevronUp className="text-xs text-slate-300" /> : <FaChevronDown className="text-xs text-slate-300" />}
              </button>
              {open[r.key] && (
                <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                  {quizzes.map((x) => { const n = r.notes[x.id]; return (
                    <div key={x.id} className="flex items-center justify-between text-xs"><span className="truncate pr-2 text-slate-600 dark:text-slate-300">{x.title} <b className="text-indigo-500">×{x.coefficient}</b></span>{n !== undefined ? <b className={n >= 50 ? 'text-slate-800 dark:text-slate-100' : 'text-rose-600'}>{fmtNumber(n)}</b> : <i className="text-slate-400">{r.is_pending ? 'En attente' : 'Absent'}</i>}</div>); })}
                  <p className="rounded-lg bg-indigo-50 p-2 font-mono text-[11px] text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200">{r.calculation}</p>
                </div>
              )}
            </MCard>
          ))}
        </div>
        <p className="px-1 text-[11px] text-slate-400">Moyenne = Σ(note × coef.) ÷ Σ coef. · absent : {method.missing_policy === 'ignore' ? 'ignoré' : 'compté 0'}{method.include_bonus && ` · bonus plafonné à ${method.bonus_cap} pts`} · admission ≥ {method.pass_mark}%.</p>
      </div>

      <MSheet open={edit} onClose={() => setEdit(false)} closeable={!busy} title="Coefficients & règles"
        footer={<div className="flex gap-2"><MButton tone="soft" onClick={() => setEdit(false)} disabled={busy} className="flex-1">Annuler</MButton><MButton onClick={save} disabled={busy} className="flex-[2]">{busy && <FaSpinner className="animate-spin" />} Enregistrer</MButton></div>}>
        {form && (
          <div className="space-y-4 pb-3">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-12 w-full rounded-2xl border-slate-200 text-[16px] dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            {errors.title && <p className="text-xs text-rose-500">{errors.title}</p>}
            <MSectionTitle>Coefficient de chaque quiz (libre)</MSectionTitle>
            {quizzes.map((x) => (
              <div key={x.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-2.5 dark:border-slate-700">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{x.title}</span>
                <input type="number" min="0" max="100" step="any" inputMode="decimal" value={form.coefs[x.id]} onChange={(e) => setForm({ ...form, coefs: { ...form.coefs, [x.id]: e.target.value } })} className="h-11 w-24 rounded-xl border-indigo-200 text-center text-[16px] font-bold dark:border-indigo-800 dark:bg-slate-800 dark:text-white" />
              </div>
            ))}
            {Object.entries(errors).filter(([k]) => k.startsWith('items')).slice(0, 1).map(([k, v]) => <p key={k} className="text-xs text-rose-500">{v}</p>)}
            <div className="flex gap-1 rounded-2xl bg-slate-100 p-1 text-xs font-bold dark:bg-slate-800">
              {[['zero', 'Absent = 0'], ['ignore', 'Absent ignoré']].map(([v, l]) => <button key={v} type="button" onClick={() => setForm({ ...form, missing_policy: v })} className={`flex-1 rounded-xl py-2.5 ${form.missing_policy === v ? 'bg-white text-indigo-700 shadow dark:bg-slate-700' : 'text-slate-500'}`}>{l}</button>)}
            </div>
            <label className="flex items-center gap-3 rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><input type="checkbox" checked={form.include_bonus} onChange={(e) => setForm({ ...form, include_bonus: e.target.checked })} className="h-5 w-5 rounded border-slate-300 text-amber-600" /> Inclure le bonus de participation</label>
          </div>
        )}
      </MSheet>
    </MobileLayout>
  );
}
