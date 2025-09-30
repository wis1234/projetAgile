import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AdminLayout from '@/Layouts/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PlusIcon, ArrowPathIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

function Kanban({ tasks: initialTasks, auth }) {
  const { t } = useTranslation();
  const { props } = usePage();
  
  const STATUS_COLUMNS = [
    { 
      id: 'todo', 
      title: t('status.todo'), 
      color: 'bg-slate-50',
      headerBg: 'bg-blue-600',
      accentColor: 'border-l-blue-500'
    },
    { 
      id: 'in_progress', 
      title: t('status.in_progress'), 
      color: 'bg-slate-50',
      headerBg: 'bg-amber-600',
      accentColor: 'border-l-amber-500'
    },
    { 
      id: 'done', 
      title: t('status.done'), 
      color: 'bg-slate-50',
      headerBg: 'bg-emerald-600',
      accentColor: 'border-l-emerald-500'
    },
  ];

  const [tasks, setTasks] = useState(initialTasks || []);
  const [activeTask, setActiveTask] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const canModifyTasks = auth?.user?.is_admin || auth?.user?.is_manager;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (props.flash?.success) {
      toast.success(props.flash.success);
    }
    if (props.flash?.error) {
      toast.error(props.flash.error);
    }
  }, [props.flash]);

  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(route('kanban.api.tasks'));
      setTasks(response.data.data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des tâches:', err);
      setError('Impossible de charger les tâches. Veuillez réessayer.');
      toast.error('Erreur lors du chargement des tâches');
    } finally {
      setIsLoading(false);
    }
  };

  const tasksByStatus = useMemo(() => {
    const grouped = {};
    STATUS_COLUMNS.forEach(column => {
      grouped[column.id] = tasks
        .filter(task => task.status === column.id)
        .sort((a, b) => a.position - b.position);
    });
    return grouped;
  }, [tasks]);

  const handleDragStart = (event) => {
    if (!canModifyTasks) {
      toast.error("Seuls les administrateurs et les managers peuvent déplacer les tâches");
      event.preventDefault();
      return;
    }
    
    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task);
    }
  };

  const handleDragEnd = async (event) => {
    setActiveTask(null);
    const { active, over } = event;

    if (!over || isLoading || !canModifyTasks) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === 'Task';
    const isOverATask = over.data.current?.type === 'Task';
    const isOverAColumn = over.data.current?.type === 'Column';

    if (!isActiveATask) return;

    const originalTasks = [...tasks];
    
    try {
      setIsLoading(true);
      
      let newTasks = [...tasks];
      const activeIndex = newTasks.findIndex(t => t.id === activeId);
      const activeTask = newTasks[activeIndex];
      
      if (isOverATask) {
        const overIndex = newTasks.findIndex(t => t.id === overId);
        const overTask = newTasks[overIndex];
        
        if (activeTask.status !== overTask.status) {
          activeTask.status = overTask.status;
        }
        
        newTasks = arrayMove(newTasks, activeIndex, overIndex);
      } else if (isOverAColumn) {
        activeTask.status = overId;
        
        const columnTasks = newTasks.filter(t => t.status === overId && t.id !== activeId);
        const newPosition = columnTasks.length > 0 ? Math.min(...columnTasks.map(t => t.position)) - 1 : 0;
        activeTask.position = newPosition;
      }
      
      setTasks(newTasks);

      const updatedTasks = newTasks.map((task) => ({
        id: parseInt(task.id),
        status: task.status,
        position: task.position || 0,
      }));

      try {
        const response = await axios.put(route('kanban.updateOrder'), {
          tasks: updatedTasks
        }, {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
          },
          validateStatus: status => status < 500
        });
        
        if (response.status === 200) {
          toast.success(response.data?.message || 'Tableau mis à jour avec succès');
          await fetchTasks();
        } else if (response.status === 422) {
          const errorMessages = [];
          if (response.data.errors) {
            Object.values(response.data.errors).forEach(messages => {
              errorMessages.push(...messages);
            });
          }
          throw new Error(`Erreur de validation: ${errorMessages.join(', ') || 'Données invalides'}`);
        } else {
          throw new Error(response.data?.message || `Erreur serveur (${response.status})`);
        }
      } catch (error) {
        console.error('Erreur détaillée:', error);
        if (error.response) {
          if (error.response.status === 422 && error.response.data.errors) {
            const errorMessages = [];
            Object.values(error.response.data.errors).forEach(messages => {
              errorMessages.push(...messages);
            });
            throw new Error(`Erreur de validation: ${errorMessages.join(', ')}`);
          }
          
          throw new Error(error.response.data?.message || `Erreur serveur (${error.response.status})`);
        } else if (error.request) {
          throw new Error('Aucune réponse du serveur. Vérifiez votre connexion.');
        } else {
          throw new Error(`Erreur de configuration: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour du tableau:', error);
      setTasks(originalTasks);
      toast.error(error.message || 'Erreur lors de la mise à jour du tableau');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddTask = (status) => {
    router.visit(route('tasks.create', { status }));
  };

  if (isLoading && tasks.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Erreur de chargement</h3>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              onClick={fetchTasks}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5" />
              Réessayer
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{t('kanban.title')}</h1>
              <p className="mt-1 text-sm text-gray-600">{t('kanban.description')}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={fetchTasks}
                disabled={isLoading}
                className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <ArrowPathIcon className={`-ml-1 mr-2 h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                {t('kanban.refresh')}
              </button>
              <button
                onClick={() => handleAddTask('todo')}
                disabled={isLoading}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                {t('kanban.new_task')}
              </button>
            </div>
          </div>
        </div>

        {/* Loading Banner */}
        {isLoading && tasks.length > 0 && (
          <div className="flex-shrink-0 mx-6 mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg flex items-center shadow-sm">
            <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
            <span className="text-sm font-medium">{t('kanban.refreshing')}</span>
          </div>
        )}

        {/* Kanban Board */}
        <div className={`flex-1 overflow-auto px-0 py-4 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
          <DndContext 
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 h-full w-max min-w-full px-6">
              {STATUS_COLUMNS.map((column) => {
                const columnTasks = tasks.filter((task) => task.status === column.id);
                return (
                  <Column
                    key={column.id}
                    id={column.id}
                    title={column.title}
                    tasks={columnTasks}
                    color={column.color}
                    headerBg={column.headerBg}
                    accentColor={column.accentColor}
                    onAddTask={canModifyTasks ? handleAddTask : null}
                    isLoading={isLoading}
                    canModify={canModifyTasks}
                  />
                );
              })}
            </div>

            <DragOverlay>
              {activeTask ? (
                <div className="w-80 rotate-3">
                  <TaskCard 
                    task={activeTask} 
                    isDragging={true}
                    accentColor={STATUS_COLUMNS.find(column => column.id === activeTask.status).accentColor}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </AdminLayout>
  );
}

export default Kanban;

const Column = ({ id, title, tasks, color, headerBg, accentColor, onAddTask, isLoading, canModify = true }) => {
  const { setNodeRef } = useSortable({
    id: id,
    data: {
      type: 'Column',
      column: { id, title }
    }
  });

  return (
    <div 
      ref={setNodeRef} 
      className="flex flex-col w-80 flex-shrink-0 h-full bg-slate-100 rounded-xl mx-0"
    >
      {/* Column Header */}
      <div className={`${headerBg} px-4 py-3 rounded-t-xl`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-semibold text-sm">{title}</h3>
            <span className="bg-white bg-opacity-25 text-white px-2 py-0.5 rounded-full text-xs font-bold">
              {tasks.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {onAddTask && (
              <button 
                onClick={() => onAddTask(id)}
                disabled={isLoading || !canModify}
                className="p-1.5 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all disabled:opacity-50"
                title={!canModify ? "Action non autorisée" : "Ajouter une tâche"}
              >
                <PlusIcon className="h-4 w-4 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tasks Container */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent -mr-3 pr-1">
        <SortableContext items={canModify ? tasks.map(t => t.id) : []}>
          {tasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task}
              accentColor={accentColor}
              canModify={canModify}
            />
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-400">
            <svg className="mx-auto h-12 w-12 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>Aucune tâche</p>
          </div>
        )}
      </div>
    </div>
  );
};

const TaskCard = ({ task, isDragging, accentColor, canModify = true }) => {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging: dndIsDragging } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
    disabled: !canModify,
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const formattedDate = new Date(task.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  });

  const priorityConfig = {
    high: { bg: 'bg-red-100', text: 'text-red-700', label: 'Élevée', dot: 'bg-red-500' },
    medium: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Moyenne', dot: 'bg-amber-500' },
    low: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Basse', dot: 'bg-emerald-500' },
  };

  const priority = priorityConfig[task.priority] || { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Normale', dot: 'bg-gray-500' };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border-l-4 ${accentColor} ${
        canModify ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed opacity-70'
      } ${dndIsDragging || isDragging ? 'opacity-50 shadow-xl rotate-2' : ''}`}
      title={!canModify ? "Seuls les administrateurs et les managers peuvent déplacer les tâches" : ""}
    >
      <div className="p-4">
        {/* Header avec titre et menu */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-semibold text-gray-900 text-sm leading-snug flex-1">
            {task.title || task.name || 'Sans titre'}
          </h4>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded">
            <EllipsisVerticalIcon className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Tags/Priority */}
        {task.priority && (
          <div className="mb-3">
            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md font-medium ${priority.bg} ${priority.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`}></span>
              {priority.label}
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center text-xs text-gray-500">
            <svg className="h-3.5 w-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formattedDate}
          </div>

          {/* Avatar */}
          {(task.assigned_user || task.user) && (
            <div className="flex items-center gap-1.5">
              {((task.assigned_user || task.user).photo_url || (task.assigned_user || task.user).profile_photo_url) ? (
                <img 
                  src={(task.assigned_user || task.user).photo_url || (task.assigned_user || task.user).profile_photo_url} 
                  alt={(task.assigned_user || task.user).name}
                  className="w-6 h-6 rounded-full object-cover border-2 border-white shadow-sm"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const initialDiv = e.target.nextElementSibling;
                    if (initialDiv) initialDiv.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-sm"
                style={{ display: ((task.assigned_user || task.user).photo_url || (task.assigned_user || task.user).profile_photo_url) ? 'none' : 'flex' }}
              >
                {((task.assigned_user || task.user).name || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};