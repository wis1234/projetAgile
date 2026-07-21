import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useTranslation } from 'react-i18next';
import AdminLayout from '@/Layouts/AdminLayout';
import { FaLock, FaTimes, FaEye, FaArrowRight, FaSearch } from 'react-icons/fa';

const PAGE_SIZE = 40; // nombre de cartes rendues par colonne avant "Charger plus"

const priorityBadgeClasses = (priority, t) => {
  if (priority === t('kanban.priority_high')) return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
  if (priority === t('kanban.priority_medium')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
  return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
};

// ─── Carte de tâche mémoïsée : évite de recalculer/re-rendre chaque carte
// quand seul un état non lié (recherche, colonne voisine...) change. ───────
const TaskCard = React.memo(function TaskCard({ task, idx, canManage, dragLocked, t }) {
  const isDragDisabled = task.is_locked || !canManage || dragLocked;

  const handleOpen = (e) => {
    e.stopPropagation();
    router.visit(`/tasks/${task.id}`);
  };

  return (
    <Draggable draggableId={String(task.id)} index={idx} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => router.visit(`/tasks/${task.id}`)}
          className={`group relative bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700/50 flex flex-col gap-3 transition-all duration-200 cursor-pointer ${
            snapshot.isDragging ? 'ring-2 ring-blue-400 shadow-lg z-10' : 'hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800/50'
          } ${task.is_locked ? 'opacity-75 bg-gray-50/30 grayscale-[0.2]' : ''}`}
        >
          {/* En-tête avec titre, badges de statut et priorité */}
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm leading-tight line-clamp-2 flex items-center gap-1.5">
                {task.is_locked && (
                  <FaLock className="text-amber-500 text-[10px] flex-shrink-0" title={t('kanban.sprint_ended', 'Sprint terminé')} />
                )}
                {!task.is_locked && !canManage && (
                  <FaEye className="text-gray-400 text-[10px] flex-shrink-0" title={t('kanban.read_only', "Lecture seule : vous n'êtes pas gestionnaire de ce projet")} />
                )}
                {task.title}
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${priorityBadgeClasses(task.priority, t)}`}>
                {task.priority || '—'}
              </span>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Pied de carte avec date, assignés et bouton d'ouverture */}
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50 flex justify-between items-center">
            {task.due_date ? (
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <svg className="w-3.5 h-3.5 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="whitespace-nowrap">{task.due_date}</span>
              </div>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {task.assignees?.slice(0, 3).map((assignee, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium text-white shadow-sm"
                    title={assignee.name || t('kanban.not_assigned')}
                  >
                    {assignee.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                ))}
                {task.assignees?.length > 3 && (
                  <div
                    className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300 shadow-sm"
                    title={t('kanban.more_assignees', { count: task.assignees.length - 3 })}
                  >
                    +{task.assignees.length - 3}
                  </div>
                )}
              </div>

              {/* Bouton dédié pour ouvrir la fiche de la tâche */}
              <button
                type="button"
                onClick={handleOpen}
                title={t('kanban.open_task', 'Ouvrir la tâche')}
                aria-label={t('kanban.open_task', 'Ouvrir la tâche')}
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              >
                <FaArrowRight size={10} />
              </button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}, (prev, next) =>
  prev.task === next.task &&
  prev.idx === next.idx &&
  prev.canManage === next.canManage &&
  prev.dragLocked === next.dragLocked
);

const Kanban = ({ tasks }) => {
  const { t } = useTranslation();
  const { auth } = usePage().props;
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);

  // ─── Droits : admin OU manager du projet concerné par CHAQUE tâche ────
  const currentUser = auth?.user;
  const userRoles = currentUser?.roles || [];
  const isAdmin =
    (currentUser?.role === 'admin' || currentUser?.is_admin) ||
    (Array.isArray(userRoles) && userRoles.some(role => role?.name === 'admin'));

  const canManageTask = useCallback((task) => {
    if (isAdmin) return true;
    if (!currentUser) return false;
    const managers = task?.project?.managers;
    if (Array.isArray(managers) && managers.some(m => m?.id === currentUser.id)) return true;
    // Compatibilité avec une API qui exposerait un manager unique
    if (task?.project?.manager_id && task.project.manager_id === currentUser.id) return true;
    return false;
  }, [isAdmin, currentUser]);

  const STATUS_COLUMNS = [
    {
      key: 'todo',
      label: t('status.todo'),
      color: 'bg-gray-50 dark:bg-gray-800/60',
      borderColor: 'border-gray-200 dark:border-gray-700/50',
      textColor: 'text-gray-700 dark:text-gray-200',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      key: 'in_progress',
      label: t('status.in_progress'),
      color: 'bg-blue-50/80 dark:bg-blue-900/30',
      borderColor: 'border-blue-200 dark:border-blue-800/50',
      textColor: 'text-blue-700 dark:text-blue-300',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )
    },
    {
      key: 'done',
      label: t('status.done'),
      color: 'bg-green-50/80 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800/50',
      textColor: 'text-green-700 dark:text-green-300',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    },
  ];

  // Convert tasks object to array for DnD (état "source de vérité")
  const [columns, setColumns] = useState(() => {
    const cols = {};
    STATUS_COLUMNS.forEach(col => {
      cols[col.key] = tasks[col.key] ? [...tasks[col.key]] : [];
    });
    return cols;
  });

  // Check for locked tasks to show alert
  const allTasksArray = useMemo(() => Object.values(columns).flat(), [columns]);
  const lockedTask = useMemo(() => allTasksArray.find(t => t.is_locked), [allTasksArray]);
  const totalTasksCount = allTasksArray.length;

  // ─── Recherche (avec debounce) : indispensable dès que le volume est grand ──
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchTerm.trim().toLowerCase()), 250);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  const filteredColumns = useMemo(() => {
    if (!debouncedSearch) return columns;
    const result = {};
    STATUS_COLUMNS.forEach(col => {
      result[col.key] = (columns[col.key] || []).filter(task => {
        const haystack = `${task.title || ''} ${task.description || ''} ${(task.assignees || []).map(a => a.name).join(' ')}`.toLowerCase();
        return haystack.includes(debouncedSearch);
      });
    });
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, debouncedSearch]);

  // ─── Pagination client : on ne rend jamais toute la colonne d'un coup ──
  // Avec des centaines de milliers de tâches, tout charger ferait planter
  // l'onglet ; on n'affiche qu'un lot à la fois et on "Charge plus" au besoin.
  const [visibleCounts, setVisibleCounts] = useState(() => {
    const obj = {};
    STATUS_COLUMNS.forEach(c => { obj[c.key] = PAGE_SIZE; });
    return obj;
  });

  useEffect(() => {
    // Recommencer la pagination à zéro à chaque nouvelle recherche
    const obj = {};
    STATUS_COLUMNS.forEach(c => { obj[c.key] = PAGE_SIZE; });
    setVisibleCounts(obj);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const loadMore = useCallback((colKey) => {
    setVisibleCounts(prev => ({ ...prev, [colKey]: (prev[colKey] || PAGE_SIZE) + PAGE_SIZE }));
  }, []);

  // Le drag est désactivé pendant une recherche : la liste affichée n'est
  // alors plus un préfixe de la colonne réelle, donc l'index de dépose ne
  // correspondrait plus à la bonne position dans les données.
  const isSearchActive = !!debouncedSearch;

  const onDragEnd = useCallback((result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceKey = source.droppableId;
    const destKey = destination.droppableId;
    const sourceArr = columns[sourceKey] || [];
    const taskIndex = sourceArr.findIndex(tk => String(tk.id) === String(draggableId));
    if (taskIndex === -1) return;
    const movedTask = sourceArr[taskIndex];

    if (movedTask.is_locked) {
      alert(t('kanban.task_locked_alert', "Cette tâche est verrouillée car son sprint est terminé."));
      return;
    }
    if (!canManageTask(movedTask)) {
      alert(t('kanban.not_authorized_alert', "Vous n'êtes pas autorisé à déplacer cette tâche : vous devez être administrateur ou gestionnaire de ce projet."));
      return;
    }

    const newSourceArr = [...sourceArr];
    newSourceArr.splice(taskIndex, 1);
    const newDestArr = sourceKey === destKey ? newSourceArr : [...(columns[destKey] || [])];
    const updatedTask = { ...movedTask, status: destKey };
    const insertAt = Math.min(destination.index, newDestArr.length);
    newDestArr.splice(insertAt, 0, updatedTask);

    setColumns(prev => ({
      ...prev,
      [sourceKey]: newSourceArr,
      [destKey]: newDestArr,
    }));

    router.put(`/tasks/${draggableId}`, { status: destKey }, { preserveState: true });
  }, [columns, canManageTask, t]);

  return (
    <div className="flex flex-col w-full h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <main className="flex-1 flex flex-col w-full overflow-hidden" style={{ height: 'calc(100vh - 4rem)' }}>
        <div className="flex flex-col h-full w-full max-w-7xl mx-auto bg-white dark:bg-gray-900">
          {/* En-tête amélioré */}
          <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 lg:px-8 pt-4 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" className="stroke-current" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" className="stroke-current" />
                    <rect x="14" y="14" width="7" height="7" rx="1.5" className="stroke-current" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" className="stroke-current" />
                  </svg>
                </span>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t('kanban.page_title')}</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {t('kanban.page_subtitle')} · {totalTasksCount} {t('kanban.tasks_total', 'tâches')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/tasks"
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-150"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  {t('kanban.list_view')}
                </Link>
                <Link
                  href="/tasks/create"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg shadow-sm transition-all duration-150 hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {t('kanban.new_task')}
                </Link>
              </div>
            </div>

            {/* Barre de recherche : essentielle pour naviguer dans un très grand volume de tâches */}
            <div className="mt-4 relative max-w-md">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={t('kanban.search_placeholder', 'Rechercher une tâche, une description, un assigné…')}
                className="w-full pl-9 pr-9 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  title={t('kanban.clear_search', 'Effacer la recherche')}
                >
                  <FaTimes size={12} />
                </button>
              )}
            </div>
            {isSearchActive && (
              <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                {t('kanban.drag_disabled_while_searching', "Le glisser-déposer est désactivé pendant une recherche. Effacez la recherche pour réorganiser les tâches.")}
              </p>
            )}

            {/* Locked tasks alert */}
            {lockedTask && !isAlertDismissed && (
                <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-3 rounded-r-xl shadow-sm relative animate-[fadeIn_0.3s_ease-out]">
                    <div className="flex items-start">
                        <FaLock className="mt-0.5 h-4 w-4 text-amber-500 flex-shrink-0" />
                        <div className="ml-3 pr-8 text-xs sm:text-sm text-amber-800 dark:text-amber-200">
                            <span className="font-bold">Attention: </span>
                            Si le sprint d'une tâche est terminé, celle-ci sera bloquée (lecture seule).
                            Pour la modifier, le sprint doit être prolongé par un gestionnaire.
                            {lockedTask.sprint && (
                                <Link
                                    href={`/sprints/${lockedTask.sprint.id}`}
                                    className="ml-2 font-bold underline text-amber-600 hover:text-amber-800 transition-colors"
                                >
                                    Voir le sprint concerné →
                                </Link>
                            )}
                        </div>
                        <button
                            onClick={() => setIsAlertDismissed(true)}
                            className="absolute top-3 right-3 text-amber-500 hover:text-amber-700 transition-colors"
                        >
                            <FaTimes size={12} />
                        </button>
                    </div>
                </div>
            )}
          </div>
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {STATUS_COLUMNS.map(col => {
                const colTasks = filteredColumns[col.key] || [];
                const visibleCount = visibleCounts[col.key] || PAGE_SIZE;
                const visibleTasks = colTasks.slice(0, visibleCount);
                const remaining = colTasks.length - visibleTasks.length;

                return (
                <Droppable droppableId={col.key} key={col.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`relative flex flex-col h-full rounded-xl border ${col.borderColor} ${snapshot.isDraggingOver ? 'ring-2 ring-blue-400' : ''} transition-all duration-200 overflow-hidden`}
                    >
                      <div className={`flex items-center justify-between p-4 ${col.color} border-b ${col.borderColor}`}>
                        <div className="flex items-center gap-2">
                          <span className={`${col.textColor}`}>
                            {col.icon}
                          </span>
                          <h2 className="text-sm font-semibold tracking-wide uppercase">{col.label}</h2>
                        </div>
                        <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 text-xs font-medium rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200">
                          {isSearchActive ? `${colTasks.length}/${(columns[col.key] || []).length}` : colTasks.length}
                        </span>
                      </div>
                      <div className="flex-1 p-3 overflow-y-auto bg-gray-50/50 dark:bg-gray-800/30">
                        {colTasks.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-40 text-gray-400 dark:text-gray-500 text-center p-4 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 transition-colors duration-200 hover:border-blue-300 dark:hover:border-blue-800">
                            <svg className="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-sm font-medium">
                              {isSearchActive ? t('kanban.no_search_results', 'Aucun résultat') : t('kanban.no_tasks', 'Aucune tâche')}
                            </p>
                            {!isSearchActive && (
                              <p className="text-xs mt-1">Glissez une tâche ici ou créez-en une nouvelle</p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {visibleTasks.map((task, idx) => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                idx={idx}
                                canManage={canManageTask(task)}
                                dragLocked={isSearchActive}
                                t={t}
                              />
                            ))}
                            {provided.placeholder}

                            {remaining > 0 && (
                              <button
                                type="button"
                                onClick={() => loadMore(col.key)}
                                className="w-full text-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 py-2.5 rounded-lg border border-dashed border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              >
                                {t('kanban.load_more', 'Charger plus')} ({remaining} {t('kanban.remaining', 'restantes')})
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Droppable>
                );
              })}
              </div>
            </div>
          </DragDropContext>
        </div>
      </main>

      {/* Bouton flottant pour mobile */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <Link
          href="/tasks/create"
          className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-transform hover:scale-105"
          title={t('kanban.new_task')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

Kanban.layout = page => <AdminLayout children={page} />;
export default Kanban;