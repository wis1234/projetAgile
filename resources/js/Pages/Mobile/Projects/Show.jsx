import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { FaTasks, FaCalendarAlt, FaEdit, FaVideo, FaQuestionCircle, FaFileAlt, FaComments, FaBolt, FaChevronRight, FaCheckCircle, FaPlus } from 'react-icons/fa';
import MobileLayout from '@/Layouts/MobileLayout';
import Avatar from '@/Components/Quiz/Avatar';
import { MHero, MCard, MPill, MStat, MSectionTitle, MSegmented, MEmpty, MButton, MFab, safeRoute, asList, listTotal } from '@/Components/Mobile/kit';

const TS = { todo: ['À faire', 'slate'], in_progress: ['En cours', 'amber'], done: ['Terminé', 'green'] };
const PR = { high: ['Haute', 'red'], medium: ['Moyenne', 'amber'], low: ['Basse', 'blue'] };
const d = (v) => (v ? new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—');

export default function MobileProjectShow({ project, tasks: tasksProp = [], sprints: sprintsProp = [], quizzes = [], stats = {} }) {
  const [tab, setTab] = useState('tasks');
  // tasks / sprints arrivent paginés ({ data: [...] }) : on travaille sur de vraies listes.
  const tasks = asList(tasksProp);
  const sprints = asList(sprintsProp);
  const tasksTotal = listTotal(tasksProp);
  const sprintsTotal = listTotal(sprintsProp);
  const total = stats.totalTasks ?? tasksTotal;
  const done = stats.doneTasksCount ?? tasks.filter((t) => t.status === 'done').length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const members = project.users || [];

  return (
    <MobileLayout title={project.name} backHref="/projects" headerRight={<a href={`/projects/${project.id}/edit`} aria-label="Modifier" className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 active:scale-90"><FaEdit /></a>}>
      <Head title={project.name} />
      <div className="space-y-4 py-4 pb-8">
        <MHero eyebrow="Projet" title={project.name} subtitle={project.description ? project.description.slice(0, 140) : undefined} tone="from-indigo-600 to-blue-700">
          <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-white/90"><span>Avancement</span><span>{pct}%</span></div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${pct}%` }} /></div>
        </MHero>

        <div className="grid grid-cols-4 gap-2">
          <MStat label="Tâches" value={total} tone="text-blue-600" />
          <MStat label="En cours" value={stats.inProgressTasksCount ?? 0} tone="text-amber-600" />
          <MStat label="Faites" value={done} tone="text-emerald-600" />
          <MStat label="Fichiers" value={stats.filesCount ?? 0} />
        </div>

        {members.length > 0 && (
          <div>
            <MSectionTitle>Équipe · {members.length}</MSectionTitle>
            <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-1" data-no-ptr>
              {members.map((m) => (
                <div key={m.id} className="flex w-16 flex-shrink-0 flex-col items-center gap-1 text-center">
                  <Avatar name={m.name} src={m.profile_photo_url} size="lg" ring="ring-2 ring-white dark:ring-slate-800" />
                  <span className="line-clamp-1 w-full text-[10px] font-semibold text-slate-600 dark:text-slate-300">{m.name?.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {project.meeting_link && <MButton href={project.meeting_link} tone="success" className="col-span-2"><FaVideo /> Rejoindre la réunion</MButton>}
          <MButton href={safeRoute('projects.quizzes.index', project.id, `/projects/${project.id}/quizzes`)} tone="soft"><FaQuestionCircle className="text-purple-500" /> Quiz {stats.quizzesCount ? `(${stats.quizzesCount})` : ''}</MButton>
          <MButton href={`/files?project_id=${project.id}`} tone="soft"><FaFileAlt className="text-sky-500" /> Fichiers</MButton>
        </div>

        <MSegmented value={tab} onChange={setTab} options={[{ value: 'tasks', label: 'Tâches', count: tasksTotal }, { value: 'sprints', label: 'Sprints', count: sprintsTotal }]} />

        {tab === 'tasks' ? (
          tasks.length === 0 ? <MEmpty icon={FaTasks} title="Aucune tâche" text="Ce projet n'a pas encore de tâche." /> : (
            <div className="space-y-2">
              {tasks.map((t) => {
                const [sl, st] = TS[t.status] || TS.todo; const pr = PR[t.priority];
                return (
                  <MCard key={t.id} href={`/tasks/${t.id}`} className="!p-3.5">
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${t.status === 'done' ? 'bg-emerald-500 text-white' : 'border-2 border-slate-300 text-transparent'}`}><FaCheckCircle className="text-xs" /></span>
                      <div className="min-w-0 flex-1">
                        <h4 className={`text-sm font-bold leading-snug ${t.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>{t.title}</h4>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5"><MPill tone={st}>{sl}</MPill>{pr && <MPill tone={pr[1]}>{pr[0]}</MPill>}{t.assigned_user?.name && <span className="text-[11px] text-slate-500">{t.assigned_user.name.split(' ')[0]}</span>}</div>
                      </div>
                      <FaChevronRight className="mt-1 text-xs text-slate-300" />
                    </div>
                  </MCard>
                );
              })}
              {tasksTotal > tasks.length && (
                <MButton href={`/tasks?project_id=${project.id}`} tone="soft" className="w-full">Voir les {tasksTotal} tâches</MButton>
              )}
            </div>
          )
        ) : sprints.length === 0 ? <MEmpty icon={FaBolt} title="Aucun sprint" /> : (
          <div className="space-y-2">
            {sprints.map((s) => (
              <MCard key={s.id} href={`/sprints/${s.id}`} className="!p-3.5">
                <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950"><FaBolt /></span>
                  <div className="min-w-0 flex-1"><h4 className="truncate text-sm font-bold text-slate-900 dark:text-white">{s.name}</h4><p className="text-xs text-slate-500"><FaCalendarAlt className="mr-1 inline text-[10px]" />{d(s.start_date)} → {d(s.end_date)}</p>{s.goal && <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">{s.goal}</p>}</div>
                  <FaChevronRight className="text-xs text-slate-300" /></div>
              </MCard>
            ))}
            {sprintsTotal > sprints.length && (
              <MButton href={`/sprints?project_id=${project.id}`} tone="soft" className="w-full">Voir les {sprintsTotal} sprints</MButton>
            )}
          </div>
        )}
      </div>
      <MFab href={`/tasks/create?project_id=${project.id}`} label="Nouvelle tâche"><FaPlus /> Tâche</MFab>
    </MobileLayout>
  );
}
