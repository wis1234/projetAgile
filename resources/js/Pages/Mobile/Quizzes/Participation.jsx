import React, { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { FaStar, FaPlus, FaMinus, FaTrash, FaSpinner, FaHistory, FaInfoCircle, FaTrophy } from 'react-icons/fa';
import MobileLayout from '@/Layouts/MobileLayout';
import Avatar from '@/Components/Quiz/Avatar';
import { fmtNumber } from '@/Components/Quiz/ScoreBadge';
import { MHero, MCard, MSearch, MSegmented, MSheet, MButton, MEmpty, MSectionTitle } from '@/Components/Mobile/kit';

const REASONS = ['Question pertinente', 'Bonne intervention', 'Aide apportée aux autres', 'Exposé / démonstration', 'Implication remarquée'];
const signed = (n) => `${n > 0 ? '+' : ''}${fmtNumber(n)}`;
const day = (d) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '');

export default function MobileParticipation({ project, members = [], history = [], cap, stepMax }) {
  const [tab, setTab] = useState('members');
  const [q, setQ] = useState('');
  const [target, setTarget] = useState(null);
  const [form, setForm] = useState({ points: 1, reason: '', awarded_on: new Date().toISOString().slice(0, 10) });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [quickBusy, setQuickBusy] = useState(null);

  const list = useMemo(() => members.filter((m) => m.name.toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)), [members, q]);
  const quick = (m, points) => { setQuickBusy(`${m.id}:${points}`); router.post(route('projects.participation.store', project.id), { user_id: m.id, points }, { preserveScroll: true, onFinish: () => setQuickBusy(null) }); };
  const submit = () => router.post(route('projects.participation.store', project.id), { user_id: target.id, ...form }, { preserveScroll: true, onStart: () => setBusy(true), onSuccess: () => setTarget(null), onError: setErrors, onFinish: () => setBusy(false) });
  const remove = (h) => window.confirm(`Supprimer l'attribution de ${signed(h.points)} pt à ${h.user_name} ?`) && router.delete(route('projects.participation.destroy', [project.id, h.id]), { preserveScroll: true });

  return (
    <MobileLayout title="Bonus de participation" backHref={route('projects.quizzes.index', project.id)}>
      <Head title="Bonus de participation" />
      <div className="space-y-4 py-4">
        <MHero eyebrow="Formations" title="Récompensez l'implication" subtitle={`Plafond ${cap} pts, ajoutés à la note finale (100 % max).`} tone="from-amber-500 to-orange-500" />
        <MSegmented value={tab} onChange={setTab} options={[{ value: 'members', label: 'Membres', count: members.length }, { value: 'history', label: 'Historique', count: history.length }]} />

        {tab === 'members' ? (<>
          <MSearch value={q} onChange={setQ} placeholder="Rechercher un membre" />
          {members.length === 0 && <MEmpty icon={FaStar} title="Aucun membre à récompenser" />}
          <div className="space-y-3">
            {list.map((m, i) => (
              <MCard key={m.id} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative"><Avatar name={m.name} src={m.photo} size="lg" />{i < 3 && m.total > 0 && <span className="absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-amber-400 text-[10px] text-amber-900"><FaTrophy /></span>}</div>
                  <div className="min-w-0 flex-1"><p className="truncate font-bold text-slate-900 dark:text-white">{m.name}</p><p className="truncate text-xs text-slate-500">{m.email}</p></div>
                  <div className="text-right leading-none"><div className="text-2xl font-black text-amber-600">{fmtNumber(m.effective)}</div><div className="text-[10px] font-bold uppercase text-slate-400">/ {cap} pts</div></div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${Math.min(100, (m.effective / cap) * 100)}%` }} /></div>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 5].map((p) => <MButton key={p} onClick={() => quick(m, p)} tone="amber" size="sm" disabled={quickBusy !== null} className="!px-0 !text-xs">{quickBusy === `${m.id}:${p}` ? <FaSpinner className="animate-spin" /> : <FaPlus className="text-[8px]" />}{p}</MButton>)}
                  <MButton onClick={() => quick(m, -1)} tone="soft" size="sm" disabled={quickBusy !== null} className="!px-0 !text-xs"><FaMinus className="text-[8px]" />1</MButton>
                  <MButton onClick={() => { setTarget(m); setErrors({}); setForm({ points: 1, reason: '', awarded_on: new Date().toISOString().slice(0, 10) }); }} tone="outline" size="sm" className="!px-0 !text-xs">…</MButton>
                </div>
              </MCard>
            ))}
          </div>
        </>) : (
          <div className="space-y-2">
            {history.length === 0 && <MEmpty icon={FaHistory} title="Aucune attribution" />}
            {history.map((h) => (
              <MCard key={h.id} className="!p-3"><div className="flex items-start gap-3">
                <Avatar name={h.user_name || '?'} src={h.user_photo} size="sm" />
                <div className="min-w-0 flex-1"><p className="text-sm text-slate-900 dark:text-white"><b>{h.user_name}</b> <b className={h.points > 0 ? 'text-emerald-600' : 'text-rose-600'}>{signed(h.points)} pt</b></p>{h.reason && <p className="text-xs text-slate-600 dark:text-slate-400">{h.reason}</p>}<p className="text-[11px] text-slate-400">{day(h.awarded_on)}{h.awarded_by && ` · ${h.awarded_by}`}</p></div>
                <button onClick={() => remove(h)} aria-label="Supprimer" className="p-2 text-slate-300 active:text-rose-500"><FaTrash className="text-xs" /></button>
              </div></MCard>
            ))}
          </div>
        )}
        <p className="flex items-start gap-2 px-1 text-[11px] text-slate-400"><FaInfoCircle className="mt-0.5 flex-shrink-0" /> Le bonus est compté une seule fois, y compris dans les cumuls de quiz.</p>
      </div>

      <MSheet open={!!target} onClose={() => setTarget(null)} closeable={!busy} title={target ? `Points pour ${target.name.split(' ')[0]}` : ''}
        footer={<div className="flex gap-2"><MButton tone="soft" onClick={() => setTarget(null)} disabled={busy} className="flex-1">Annuler</MButton><MButton tone="amber" onClick={submit} disabled={busy} className="flex-[2]">{busy ? <FaSpinner className="animate-spin" /> : <FaStar />} Enregistrer</MButton></div>}>
        <div className="space-y-3 pb-3">
          <div className="grid grid-cols-2 gap-3">
            <div><MSectionTitle>Points (± {stepMax})</MSectionTitle><input type="number" step="0.5" inputMode="decimal" min={-stepMax} max={stepMax} value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} className="h-14 w-full rounded-2xl border-slate-200 text-center text-xl font-black dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></div>
            <div><MSectionTitle>Date</MSectionTitle><input type="date" value={form.awarded_on} onChange={(e) => setForm({ ...form, awarded_on: e.target.value })} className="h-14 w-full rounded-2xl border-slate-200 text-[15px] dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></div>
          </div>
          {(errors.points || errors.awarded_on || errors.user_id) && <p className="text-xs font-semibold text-rose-500">{errors.points || errors.awarded_on || errors.user_id}</p>}
          <input value={form.reason} maxLength={255} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Motif (facultatif)" className="h-12 w-full rounded-2xl border-slate-200 text-[16px] dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          <div className="flex flex-wrap gap-1.5">{REASONS.map((r) => <button key={r} type="button" onClick={() => setForm({ ...form, reason: r })} className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600 active:scale-95 dark:bg-slate-800 dark:text-slate-300">{r}</button>)}</div>
        </div>
      </MSheet>
    </MobileLayout>
  );
}
