import React, { useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Head } from '@inertiajs/react';
import { FaPlus, FaCalendarAlt, FaArrowRight, FaCheck, FaCircle, FaSpinner, FaExternalLinkAlt } from 'react-icons/fa';
import MobileLayout from '@/Layouts/MobileLayout';
import Avatar from '@/Components/Quiz/Avatar';
import toast from '@/lib/toast';
import { MSheet, MButton, MPill, MFab } from '@/Components/Mobile/kit';

const COLS = [
  { id: 'todo', title: 'À faire', dot: 'bg-slate-400', head: 'from-slate-500 to-slate-600' },
  { id: 'in_progress', title: 'En cours', dot: 'bg-amber-500', head: 'from-amber-500 to-orange-500' },
  { id: 'done', title: 'Terminé', dot: 'bg-emerald-500', head: 'from-emerald-500 to-teal-500' },
];
const PR = { high: ['Haute', 'red'], medium: ['Moyenne', 'amber'], low: ['Basse', 'blue'] };
const d = (v) => (v ? new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : null);

export default function MobileKanban({ tasks: initial = [] }) {
  const [tasks, setTasks] = useState(initial);
  const [active, setActive] = useState('todo');
  const [sel, setSel] = useState(null);
  const [moving, setMoving] = useState(false);
  const scroller = useRef(null);
  const byCol = useMemo(() => Object.fromEntries(COLS.map((c) => [c.id, tasks.filter((t) => t.status === c.id).sort((a, b) => (a.position || 0) - (b.position || 0))])), [tasks]);

  const goCol = (id) => { setActive(id); const i = COLS.findIndex((c) => c.id === id); const el = scroller.current; if (el) el.scrollTo({ left: i * el.clientWidth * 0.86, behavior: 'smooth' }); };
  const onScroll = (e) => { const el = e.currentTarget; const i = Math.round(el.scrollLeft / (el.clientWidth * 0.86)); const c = COLS[Math.min(i, COLS.length - 1)]; if (c && c.id !== active) setActive(c.id); };

  const move = async (task, status) => {
    if (task.status === status) { setSel(null); return; }
    const previous = tasks;
    const position = (byCol[status].reduce((m, t) => Math.max(m, t.position || 0), 0)) + 1;
    setTasks((all) => all.map((t) => (t.id === task.id ? { ...t, status, position } : t)));
    setMoving(true);
    try {
      await axios.put(route('kanban.updateOrder'), { tasks: [{ id: Number(task.id), status, position }] });
      toast.success(`« ${task.title} » déplacée vers ${COLS.find((c) => c.id === status).title}.`, { title: 'Tâche mise à jour' });
      setSel(null);
    } catch (e) {
      setTasks(previous);
      toast.error(e.response?.data?.message || 'Impossible de déplacer la tâche. Réessayez.', { title: 'Échec du déplacement' });
    } finally { setMoving(false); }
  };

  return (
    <MobileLayout title="Suivi des tâches" fullBleed>
      <Head title="Suivi des tâches" />
      <div className="px-4 pt-3">
        <div className="flex gap-1 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          {COLS.map((c) => (
            <button key={c.id} type="button" onClick={() => goCol(c.id)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-extrabold transition ${active === c.id ? `bg-gradient-to-r ${c.head} text-white shadow` : 'text-slate-500'}`}>
              {c.title}<span className={`rounded-full px-1.5 text-[10px] ${active === c.id ? 'bg-white/25' : 'bg-slate-100 dark:bg-slate-800'}`}>{byCol[c.id].length}</span>
            </button>
          ))}
        </div>
      </div>

      <div ref={scroller} onScroll={onScroll} data-no-ptr className="scrollbar-hide flex flex-1 snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-32 pt-4">
        {COLS.map((c) => (
          <section key={c.id} className="w-[86%] max-w-sm flex-shrink-0 snap-center space-y-2.5">
            {byCol[c.id].length === 0 && <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-400 dark:border-slate-800">Aucune tâche</div>}
            {byCol[c.id].map((t) => {
              const pr = PR[t.priority]; const due = d(t.due_date); const late = t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date();
              return (
                <button key={t.id} type="button" onClick={() => setSel(t)} className="block w-full rounded-2xl bg-white p-3.5 text-left shadow-sm ring-1 ring-slate-200 transition active:scale-[.98] dark:bg-slate-900 dark:ring-slate-800">
                  <div className="flex items-start gap-2"><span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${c.dot}`} /><h4 className="flex-1 text-sm font-bold leading-snug text-slate-900 dark:text-white">{t.title}</h4></div>
                  {t.project?.name && <p className="mt-1 truncate pl-4 text-[11px] text-slate-400">{t.project.name}</p>}
                  <div className="mt-2.5 flex items-center justify-between gap-2 pl-4">
                    <div className="flex flex-wrap items-center gap-1.5">{pr && <MPill tone={pr[1]}>{pr[0]}</MPill>}{due && <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${late ? 'text-rose-600' : 'text-slate-500'}`}><FaCalendarAlt className="text-[9px]" />{due}</span>}</div>
                    {t.assigned_user?.name && <Avatar name={t.assigned_user.name} src={t.assigned_user.profile_photo_url} size="xs" />}
                  </div>
                </button>
              );
            })}
          </section>
        ))}
      </div>

      <MSheet open={!!sel} onClose={() => !moving && setSel(null)} title={sel?.title}
        footer={sel && <MButton href={`/tasks/${sel.id}`} tone="soft" className="w-full"><FaExternalLinkAlt className="text-xs" /> Ouvrir la tâche</MButton>}>
        {sel && (
          <div className="space-y-3 pb-3">
            {sel.description && <p className="line-clamp-4 text-sm text-slate-600 dark:text-slate-300">{sel.description}</p>}
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Déplacer vers</p>
            {sel.can_update === false ? <p className="rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800">Vous ne pouvez pas modifier cette tâche.</p> : (
              <div className="space-y-2">
                {COLS.map((c) => (
                  <button key={c.id} type="button" disabled={moving} onClick={() => move(sel, c.id)} className={`flex h-14 w-full items-center gap-3 rounded-2xl px-4 text-left font-bold transition active:scale-[.98] ${sel.status === c.id ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-500 dark:bg-blue-950/40 dark:text-blue-300' : 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
                    <span className={`h-3 w-3 rounded-full ${c.dot}`} /><span className="flex-1">{c.title}</span>{sel.status === c.id ? <FaCheck /> : moving ? <FaSpinner className="animate-spin text-slate-400" /> : <FaArrowRight className="text-xs text-slate-300" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </MSheet>
      <MFab href="/tasks/create" label="Nouvelle tâche"><FaPlus /> Tâche</MFab>
    </MobileLayout>
  );
}
