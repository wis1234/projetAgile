import React from 'react';
import { Head } from '@inertiajs/react';
import { FaCalendarAlt, FaEdit, FaFolderOpen, FaBolt, FaPaperclip, FaComments, FaClock, FaMoneyBillWave, FaChevronRight, FaUser } from 'react-icons/fa';
import MobileLayout from '@/Layouts/MobileLayout';
import Avatar from '@/Components/Quiz/Avatar';
import { MHero, MCard, MPill, MSectionTitle, MButton, MActionBar, fmtDate } from '@/Components/Mobile/kit';

const TS = { todo: ['À faire', 'from-slate-500 to-slate-700'], in_progress: ['En cours', 'from-amber-500 to-orange-600'], done: ['Terminée', 'from-emerald-500 to-teal-600'] };
const PR = { high: ['Haute', 'red'], medium: ['Moyenne', 'amber'], low: ['Basse', 'blue'] };

const Info = ({ icon: Icon, label, children }) => (
  <div className="flex items-center gap-3 py-3">
    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800"><Icon className="text-sm" /></span>
    <div className="min-w-0 flex-1"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p><div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{children}</div></div>
  </div>
);

export default function MobileTaskShow({ task, projectMembers = [], payments }) {
  const [label, grad] = TS[task.status] || TS.todo;
  const pr = PR[task.priority];
  const assignees = task.assigned_users?.length ? task.assigned_users : task.assigned_user ? [task.assigned_user] : [];
  const overdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date();

  return (
    <MobileLayout title="Tâche" backHref={task.project_id ? `/projects/${task.project_id}` : '/tasks'} hideBottomNav>
      <Head title={task.title} />
      <div className="space-y-4 py-4 pb-28">
        <MHero eyebrow={task.project?.name || 'Tâche'} title={task.title} tone={grad}>
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-extrabold">{label}</span>
            {pr && <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-extrabold">Priorité {pr[0].toLowerCase()}</span>}
            {overdue && <span className="rounded-full bg-rose-500 px-3 py-1 text-[11px] font-extrabold">En retard</span>}
          </div>
        </MHero>

        {task.description && (
          <MCard><MSectionTitle>Description</MSectionTitle><p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">{task.description}</p></MCard>
        )}

        <MCard className="divide-y divide-slate-100 !py-1 dark:divide-slate-800">
          <Info icon={FaCalendarAlt} label="Échéance"><span className={overdue ? 'text-rose-600' : ''}>{task.due_date ? fmtDate(task.due_date, { dateStyle: 'long' }) : 'Non définie'}</span></Info>
          {task.project && <Info icon={FaFolderOpen} label="Projet"><a href={`/projects/${task.project.id}`} className="text-blue-600">{task.project.name}</a></Info>}
          {task.sprint && <Info icon={FaBolt} label="Sprint"><a href={`/sprints/${task.sprint.id}`} className="text-blue-600">{task.sprint.name}</a></Info>}
          <Info icon={FaClock} label="Créée le">{fmtDate(task.created_at, { dateStyle: 'medium' })}</Info>
          {task.amount != null && Number(task.amount) > 0 && <Info icon={FaMoneyBillWave} label="Rémunération">{Number(task.amount).toLocaleString('fr-FR')} {task.is_paid ? <MPill tone="green" className="ml-1">Payée</MPill> : <MPill tone="amber" className="ml-1">À payer</MPill>}</Info>}
        </MCard>

        <div>
          <MSectionTitle>Assigné à</MSectionTitle>
          {assignees.length === 0 ? <p className="px-1 text-sm text-slate-400"><FaUser className="mr-1 inline" /> Personne pour le moment</p> : (
            <div className="space-y-2">{assignees.map((u) => (
              <MCard key={u.id} className="!p-3"><div className="flex items-center gap-3"><Avatar name={u.name} src={u.profile_photo_url} size="md" /><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900 dark:text-white">{u.name}</p>{u.email && <p className="truncate text-xs text-slate-500">{u.email}</p>}</div></div></MCard>
            ))}</div>
          )}
        </div>

        {task.files?.length > 0 && (
          <div>
            <MSectionTitle>Fichiers · {task.files.length}</MSectionTitle>
            <div className="space-y-2">{task.files.map((f) => (
              <MCard key={f.id} href={`/files/${f.id}`} className="!p-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-950"><FaPaperclip /></span><span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800 dark:text-slate-100">{f.name}</span><FaChevronRight className="text-xs text-slate-300" /></div></MCard>
            ))}</div>
          </div>
        )}
      </div>
      <MActionBar>
        <MButton href={`/tasks/${task.id}/discussion`} tone="soft" size="lg" className="!px-5"><FaComments /></MButton>
        <MButton href={`/tasks/${task.id}/edit`} size="lg" className="flex-1"><FaEdit /> Modifier la tâche</MButton>
      </MActionBar>
    </MobileLayout>
  );
}
