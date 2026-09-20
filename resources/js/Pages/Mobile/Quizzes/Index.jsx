import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { FaPlus, FaLayerGroup, FaStar, FaEllipsisH, FaClock, FaQuestionCircle, FaUsers, FaFileExcel, FaFilePdf, FaShieldAlt, FaPenFancy, FaEdit, FaChartBar, FaTrash, FaArrowRight } from 'react-icons/fa';
import MobileLayout from '@/Layouts/MobileLayout';
import ScoreBadge from '@/Components/Quiz/ScoreBadge';
import { MHero, MCard, MPill, MEmpty, MSheet, MButton, MSectionTitle, MDownload } from '@/Components/Mobile/kit';

export default function MobileQuizIndex({ project, quizzes = [], cumuls = [], canManage }) {
  const [menu, setMenu] = useState(null); // quiz dont le menu d'actions est ouvert

  const remove = (quiz) => {
    if (window.confirm(`Supprimer le quiz « ${quiz.title} » ? Cette action est définitive.`)) {
      router.delete(route('projects.quizzes.destroy', [project.id, quiz.id]), { preserveScroll: true, onFinish: () => setMenu(null) });
    }
  };

  return (
    <MobileLayout title="Quiz du projet" backHref={route('projects.show', project.id)}>
      <Head title={`Quiz – ${project.name}`} />
      <div className="space-y-4 py-4">
        <MHero eyebrow="Projet" title={project.name} subtitle={`${quizzes.length} quiz${canManage && cumuls.length ? ` · ${cumuls.length} cumul(s)` : ''}`} tone="from-blue-600 to-cyan-600" />

        {canManage && (
          <div className="grid grid-cols-3 gap-2">
            <MButton href={route('projects.quizzes.create', project.id)} size="lg" className="flex-col !gap-1 !px-1 text-xs"><FaPlus /> Créer</MButton>
            <MButton href={route('projects.quiz-cumuls.create', project.id)} tone="soft" size="lg" className="flex-col !gap-1 !px-1 text-xs"><FaLayerGroup /> Cumuler</MButton>
            <MButton href={route('projects.participation.index', project.id)} tone="amber" size="lg" className="flex-col !gap-1 !px-1 text-xs"><FaStar /> Bonus</MButton>
          </div>
        )}

        {canManage && cumuls.length > 0 && (
          <div>
            <MSectionTitle>Quiz cumulés</MSectionTitle>
            <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2" data-no-ptr>
              {cumuls.map((c) => (
                <div key={c.id} className="w-[82%] max-w-xs flex-shrink-0 snap-center">
                  <MCard className="!p-0 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200"><FaLayerGroup className="mr-1 inline" />Cumul</p>
                      <h4 className="mt-0.5 text-base font-extrabold leading-tight line-clamp-2">{c.title}</h4>
                      <p className="mt-1 text-xs text-indigo-100"><FaUsers className="mr-1 inline" />{c.candidates_count} candidat(s) · {c.quizzes.length} quiz</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 p-3">
                      {c.quizzes.slice(0, 4).map((q) => (
                        <div key={q.id} className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60">
                          <p className="line-clamp-2 text-[11px] font-semibold text-slate-700 dark:text-slate-200">{q.title}</p>
                          <p className="mt-0.5 text-[10px] font-bold text-indigo-600">coef. {q.coefficient}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 p-3 pt-0">
                      <MButton href={route('projects.quiz-cumuls.show', [project.id, c.id])} size="sm" className="flex-1 !text-xs">Résultats <FaArrowRight /></MButton>
                      <MDownload href={route('projects.quiz-cumuls.export', [project.id, c.id, 'xlsx'])}><FaFileExcel /></MDownload>
                      <MDownload href={route('projects.quiz-cumuls.export', [project.id, c.id, 'pdf'])}><FaFilePdf /></MDownload>
                    </div>
                  </MCard>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          {canManage && cumuls.length > 0 && <MSectionTitle>Quiz</MSectionTitle>}
          {quizzes.length === 0 ? (
            <MEmpty icon={FaQuestionCircle} title="Aucun quiz" text="Il n'y a pas encore de quiz pour ce projet." action={canManage && <MButton href={route('projects.quizzes.create', project.id)}><FaPlus /> Créer le premier quiz</MButton>} />
          ) : (
            <div className="space-y-3">
              {quizzes.map((quiz) => (
                <MCard key={quiz.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap gap-1.5">
                        {quiz.is_draft && <MPill tone="amber">Brouillon</MPill>}
                        {!quiz.is_draft && !quiz.is_active && <MPill>Inactif</MPill>}
                        {quiz.deliberation_status === 'validated' && <MPill tone="green"><FaShieldAlt /> Validé</MPill>}
                        {canManage && quiz.pending_copies_count > 0 && <MPill tone="amber"><FaPenFancy /> {quiz.pending_copies_count} à corriger</MPill>}
                      </div>
                      <h3 className="text-[15px] font-extrabold leading-snug text-slate-900 dark:text-white">{quiz.title}</h3>
                      {quiz.description && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{quiz.description}</p>}
                    </div>
                    {canManage && (
                      <button type="button" onClick={() => setMenu(quiz)} aria-label="Actions" className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 active:scale-90 dark:bg-slate-800"><FaEllipsisH /></button>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-center text-[11px] font-semibold text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                    <div><FaClock className="mx-auto mb-1 text-blue-500" />{quiz.duration_minutes} min</div>
                    <div><FaQuestionCircle className="mx-auto mb-1 text-purple-500" />{quiz.questions_count} quest.</div>
                    <div><FaUsers className="mx-auto mb-1 text-emerald-500" />{quiz.attempts_count}</div>
                  </div>
                  {quiz.user_has_completed && (
                    <div className="mt-3 flex items-center justify-between text-sm"><span className="text-slate-500">Mon score</span><ScoreBadge score={quiz.user_latest_score} pending={quiz.user_latest_pending} /></div>
                  )}
                  <div className="mt-3">
                    {quiz.is_draft
                      ? <MButton href={route('projects.quizzes.edit', [project.id, quiz.id])} tone="amber" className="w-full"><FaEdit /> Continuer l'édition</MButton>
                      : <MButton href={route('projects.quizzes.show', [project.id, quiz.id])} className="w-full">Ouvrir le quiz <FaArrowRight /></MButton>}
                  </div>
                </MCard>
              ))}
            </div>
          )}
        </div>
      </div>

      <MSheet open={!!menu} onClose={() => setMenu(null)} title={menu?.title}>
        {menu && (
          <div className="space-y-2 pb-3">
            <MButton href={route('projects.quizzes.show', [project.id, menu.id])} tone="soft" className="w-full justify-start"><FaArrowRight /> Détails du quiz</MButton>
            <MButton href={route('projects.quizzes.ranking', [project.id, menu.id])} tone="soft" className="w-full justify-start"><FaChartBar /> Classement / Correction</MButton>
            <MButton href={route('projects.quizzes.edit', [project.id, menu.id])} tone="soft" className="w-full justify-start"><FaEdit /> Modifier</MButton>
            <MButton onClick={() => remove(menu)} tone="danger" className="w-full justify-start"><FaTrash /> Supprimer</MButton>
          </div>
        )}
      </MSheet>
    </MobileLayout>
  );
}
