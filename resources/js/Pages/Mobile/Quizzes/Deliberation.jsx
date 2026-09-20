import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { FaGavel, FaCheck, FaClock, FaShieldAlt, FaKey, FaEye, FaEyeSlash, FaSpinner, FaFileExcel, FaFilePdf, FaUndo, FaExclamationTriangle, FaPenFancy, FaStar } from 'react-icons/fa';
import MobileLayout from '@/Layouts/MobileLayout';
import Avatar from '@/Components/Quiz/Avatar';
import ScoreBadge, { fmtNumber } from '@/Components/Quiz/ScoreBadge';
import { MHero, MCard, MPill, MStat, MSectionTitle, MSheet, MActionBar, MButton, MDownload, fmtDate } from '@/Components/Mobile/kit';

const STATUS = { none: ['Non ouverte', 'slate'], open: ['En cours', 'blue'], validated: ['Validée', 'green'] };

export default function MobileDeliberation({ project, quiz, deliberation: d, rankings = [], stats = {}, passMark, canReopen }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [label, tone] = STATUS[d.status] || STATUS.none;
  const percent = d.deciders_count ? Math.round((d.approved_count / d.deciders_count) * 100) : 0;
  const stale = d.deciders.filter((p) => p.stale).length;

  const close = () => { setOpen(false); setPassword(''); setError(null); setReveal(false); };
  const openDelib = () => router.post(route('projects.quizzes.deliberation.open', [project.id, quiz.id]), {}, { preserveScroll: true, onStart: () => setBusy(true), onFinish: () => setBusy(false) });
  const approve = (e) => {
    e?.preventDefault();
    if (!password) { setError('Saisissez votre mot de passe pour donner votre aval.'); return; }
    router.post(route('projects.quizzes.deliberation.approve', [project.id, quiz.id]), { password }, {
      preserveScroll: true,
      onStart: () => { setBusy(true); setError(null); },
      onSuccess: close,
      onError: (errs) => { setError(errs.password || Object.values(errs)[0] || "Impossible d'enregistrer votre aval."); setPassword(''); },
      onFinish: () => setBusy(false),
    });
  };
  const reopen = () => window.confirm('Rouvrir la délibération ? Les avals seront annulés.') && router.post(route('projects.quizzes.deliberation.reopen', [project.id, quiz.id]), {}, { preserveScroll: true });

  return (
    <MobileLayout title="Délibération" backHref={route('projects.quizzes.show', [project.id, quiz.id])} hideBottomNav={d.can_approve}>
      <Head title={`Délibération – ${quiz.title}`} />
      <div className={`space-y-4 py-4 ${d.can_approve ? 'pb-28' : ''}`}>
        <MHero eyebrow="Délibération" title={quiz.title} tone="from-indigo-600 to-purple-700" right={<MPill tone={tone} className="!bg-white/90">{label}</MPill>} />

        {d.status === 'none' && (
          <MCard className="space-y-3 text-center">
            {d.can_open ? (<>
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-2xl text-indigo-600 dark:bg-indigo-950"><FaGavel /></span>
              <h3 className="font-extrabold text-slate-900 dark:text-white">Toutes les copies sont corrigées</h3>
              <p className="text-sm text-slate-500">Chaque responsable confirmera les résultats avec son mot de passe ProJA. Une fois tous les avals donnés, les résultats deviennent officiels.</p>
              <MButton onClick={openDelib} disabled={busy} size="lg" className="w-full !bg-indigo-600">{busy ? <FaSpinner className="animate-spin" /> : <FaGavel />} Ouvrir la délibération</MButton>
            </>) : (<>
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl text-amber-600 dark:bg-amber-950"><FaClock /></span>
              <h3 className="font-extrabold text-slate-900 dark:text-white">Délibération impossible pour le moment</h3>
              <p className="text-sm text-slate-500">{d.results_count === 0 ? "Aucun candidat n'a encore composé ce quiz." : `${d.pending_copies} copie(s) restent à corriger.`}</p>
              {d.pending_copies > 0 && <MButton href={route('projects.quizzes.grading', [project.id, quiz.id])} tone="purple" className="w-full"><FaPenFancy /> Espace de correction</MButton>}
            </>)}
          </MCard>
        )}

        {d.status !== 'none' && (
          <div>
            <MSectionTitle right={<span className="text-[11px] font-bold text-slate-500">{d.approved_count}/{d.deciders_count}</span>}>Avals des responsables</MSectionTitle>
            <div className="mb-3 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all" style={{ width: `${percent}%` }} /></div>
            {stale > 0 && d.status !== 'validated' && <p className="mb-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800 dark:bg-amber-950/30"><FaExclamationTriangle className="mt-0.5 flex-shrink-0" /> Des notes ont changé : {stale} aval(s) à renouveler.</p>}
            <div className="space-y-2">
              {d.deciders.map((p) => (
                <MCard key={p.id} className={`!p-3 ${p.approved ? '!border-emerald-300 !bg-emerald-50/60 dark:!bg-emerald-950/20' : p.stale ? '!border-amber-300' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="relative"><Avatar name={p.name} src={p.photo} size="lg" ring={p.approved ? 'ring-4 ring-emerald-400' : ''} />{p.approved && <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-[9px] text-white"><FaCheck /></span>}</div>
                    <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900 dark:text-white">{p.name}</p>
                      <p className={`text-[11px] font-semibold ${p.approved ? 'text-emerald-700' : p.stale ? 'text-amber-700' : 'text-slate-500'}`}>{p.approved ? `Aval donné · ${fmtDate(p.approved_at)}` : p.stale ? 'Aval à renouveler' : 'En attente'}</p></div>
                  </div>
                </MCard>
              ))}
            </div>
            {d.status === 'validated' && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <MDownload href={route('projects.quizzes.export', [project.id, quiz.id, 'xlsx'])} tone="success"><FaFileExcel /> Excel</MDownload>
                <MDownload href={route('projects.quizzes.export', [project.id, quiz.id, 'pdf'])} tone="danger"><FaFilePdf /> PDF</MDownload>
              </div>
            )}
            {d.status === 'open' && !d.can_approve && (d.viewer_approved
              ? <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-700"><FaCheck /> Vous avez donné votre aval.</p>
              : !d.is_decider && <p className="mt-3 text-sm text-slate-500">Seuls les responsables du projet donnent leur aval.</p>)}
            {canReopen && d.status !== 'none' && <button onClick={reopen} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 active:text-rose-600"><FaUndo /> {d.status === 'validated' ? 'Rouvrir (annule les avals)' : 'Réinitialiser les avals'}</button>}
          </div>
        )}

        <div>
          <MSectionTitle>Résultats soumis · admission ≥ {passMark}%</MSectionTitle>
          <div className="mb-3 grid grid-cols-2 gap-2"><MStat label="Moyenne" value={stats.average != null ? `${fmtNumber(stats.average)}%` : '—'} tone="text-blue-600" /><MStat label="Réussite" value={stats.pass_rate != null ? `${fmtNumber(stats.pass_rate, 0)}%` : '—'} tone="text-emerald-600" /></div>
          <div className="space-y-2">
            {rankings.map((r) => (
              <MCard key={r.key} className="!p-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-xs font-black text-slate-400">{r.rank ?? '—'}</span>
                  <Avatar name={r.name} src={r.photo} size="sm" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900 dark:text-white">{r.name}</p>
                    <p className="text-[11px] text-slate-500">Quiz <ScoreBadge score={r.score} pending={r.is_pending} size="sm" />{r.bonus > 0 && <span className="ml-1.5 font-bold text-amber-600"><FaStar className="mr-0.5 inline text-[9px]" />+{fmtNumber(r.bonus)}</span>}</p></div>
                  <div className="text-right"><ScoreBadge score={r.final} pending={r.is_pending} size="md" /><p className={`text-[10px] font-extrabold ${r.is_pending ? 'text-amber-600' : r.passed ? 'text-emerald-600' : 'text-rose-600'}`}>{r.is_pending ? 'En attente' : r.passed ? 'Admis(e)' : 'Ajourné(e)'}</p></div>
                </div>
              </MCard>
            ))}
          </div>
        </div>
      </div>

      {d.can_approve && <MActionBar><MButton onClick={() => setOpen(true)} tone="success" size="lg" className="flex-1"><FaShieldAlt /> Donner mon aval</MButton></MActionBar>}

      <MSheet open={open} onClose={close} closeable={!busy} title="Donner mon aval"
        footer={<div className="flex gap-2"><MButton onClick={close} tone="soft" disabled={busy} className="flex-1">Annuler</MButton><MButton onClick={approve} tone="success" disabled={busy} className="flex-[2]">{busy ? <FaSpinner className="animate-spin" /> : <FaCheck />} Confirmer</MButton></div>}>
        <form onSubmit={approve} className="space-y-4 pb-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">En saisissant votre mot de passe ProJA, vous certifiez avoir pris connaissance des résultats de « {quiz.title} » et les approuvez.</p>
          <div className="relative">
            <FaKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type={reveal ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} autoComplete="current-password" placeholder="Mot de passe ProJA"
              className={`h-14 w-full rounded-2xl pl-11 pr-12 text-[16px] dark:bg-slate-800 dark:text-white ${error ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'}`} />
            <button type="button" onClick={() => setReveal((r) => !r)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{reveal ? <FaEyeSlash /> : <FaEye />}</button>
          </div>
          {error && <p className="text-xs font-semibold text-rose-500">{error}</p>}
        </form>
      </MSheet>
    </MobileLayout>
  );
}
