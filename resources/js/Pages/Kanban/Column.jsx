import React from 'react';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';

export function Column({ column, tasks }) {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: { type: 'Column', column },
  });

  return (
    <div ref={setNodeRef} className="bg-gray-100 rounded-lg p-4 flex-shrink-0 w-80">
      <h2 className="text-lg font-bold mb-4">{column.title}</h2>
      <SortableContext items={tasks.map(t => t.id)}>
        <div className="space-y-4">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}