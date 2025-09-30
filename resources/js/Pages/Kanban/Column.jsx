import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import { PlusIcon } from '@heroicons/react/24/outline';

export function Column({ 
  id, 
  title, 
  tasks = [], 
  color = 'bg-gray-50', 
  borderColor = 'border-gray-200',
  headerBg = 'from-gray-500 to-gray-600',
  onAddTask 
}) {
  const tasksIds = useMemo(() => tasks.map(task => task.id), [tasks]);
  
  const { 
    setNodeRef, 
    attributes, 
    listeners, 
    isDragging,
    transform,
    transition,
  } = useSortable({
    id,
    data: { 
      type: 'Column',
      column: { id, title }
    },
  });

  const style = {
    transition,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : 'none',
    opacity: isDragging ? 0.5 : 1,
  };

  const { t } = useTranslation();

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`flex flex-col flex-shrink-0 w-80 rounded-lg overflow-hidden shadow-sm border ${borderColor} ${color}`}
    >
      {/* En-tête de la colonne avec dégradé */}
      <div 
        className={`p-4 bg-white border-b ${borderColor}`}
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs font-medium">
            {tasks.length}
          </span>
        </div>
      </div>
      
      {/* Corps de la colonne */}
      <div className="p-3 flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
        <SortableContext items={tasksIds}>
          <div className="space-y-3">
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </SortableContext>
        
        {/* Bouton pour ajouter une tâche */}
        {onAddTask && (
          <button
            onClick={() => onAddTask(id)}
            className="mt-3 w-full flex items-center justify-center p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-white hover:border-gray-400 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            <span>{t('kanban.add_task')}</span>
          </button>
        )}
      </div>
    </div>
  );
}