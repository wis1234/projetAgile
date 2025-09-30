import React from 'react';
import { Link, router } from '@inertiajs/react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useTranslation } from 'react-i18next';
import AdminLayout from '@/Layouts/AdminLayout';

const Kanban = ({ tasks }) => {
  const { t } = useTranslation();

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

  // Convert tasks object to array for DnD
  const [columns, setColumns] = React.useState(() => {
    const cols = {};
    STATUS_COLUMNS.forEach(col => {
      cols[col.key] = tasks[col.key] ? [...tasks[col.key]] : [];
    });
    return cols;
  });

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const sourceCol = columns[source.droppableId];
    const destCol = columns[destination.droppableId];
    const [moved] = sourceCol.splice(source.index, 1);
    moved.status = destination.droppableId;
    destCol.splice(destination.index, 0, moved);
    setColumns({ ...columns, [source.droppableId]: sourceCol, [destination.droppableId]: destCol });
    // Appel backend pour MAJ statut
    router.put(`/tasks/${draggableId}`, { status: destination.droppableId }, { preserveState: true });
  };

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
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('kanban.page_subtitle')}</p>
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
          </div>
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {STATUS_COLUMNS.map(col => (
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
                        <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200">
                          {columns[col.key].length}
                        </span>
                      </div>
                      <div className="flex-1 p-3 overflow-y-auto bg-gray-50/50 dark:bg-gray-800/30">
                        {columns[col.key].length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-40 text-gray-400 dark:text-gray-500 text-center p-4 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 transition-colors duration-200 hover:border-blue-300 dark:hover:border-blue-800">
                            <svg className="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-sm font-medium">Aucune tâche</p>
                            <p className="text-xs mt-1">Glissez une tâche ici ou créez-en une nouvelle</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                        {columns[col.key].map((task, idx) => (
                          <Draggable draggableId={String(task.id)} index={idx} key={task.id}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`group relative bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700/50 flex flex-col gap-3 transition-all duration-200 ${snapshot.isDragging ? 'ring-2 ring-blue-400 scale-100 shadow-lg z-10' : 'hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800/50'}`}
                              >
                                {/* En-tête avec priorité et menu d'actions */}
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex-1">
                                    <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm leading-tight line-clamp-2">
                                      {task.title}
                                    </h3>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                      task.priority === t('kanban.priority_high') ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200' :
                                      task.priority === t('kanban.priority_medium') ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' :
                                      'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                                    }`}>
                                      {task.priority || '—'}
                                    </span>
                                    <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-opacity">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                                
                                {/* Description */}
                                {task.description && (
                                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                                    {task.description}
                                  </p>
                                )}
                                
                                {/* Pied de carte avec date et assignés */}
                                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50 flex justify-between items-center">
                                  {task.due_date ? (
                                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                      <svg className="w-3.5 h-3.5 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <span className="whitespace-nowrap">{task.due_date}</span>
                                    </div>
                                  ) : (
                                    <div></div>
                                  )}
                                  <div className="flex -space-x-1.5">
                                    {task.assignees?.slice(0, 3).map((assignee, idx) => (
                                      <div 
                                        key={idx} 
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
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
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