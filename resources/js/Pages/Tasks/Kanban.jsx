import React from 'react';
import { Link, router } from '@inertiajs/react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import AdminLayout from '@/Layouts/AdminLayout';

const STATUS_COLUMNS = [
  { key: 'todo', label: 'À faire', color: 'bg-gray-100' },
  { key: 'in_progress', label: 'En cours', color: 'bg-blue-100' },
  { key: 'done', label: 'Terminé', color: 'bg-green-100' },
];

function Kanban({ tasks }) {
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
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Kanban des tâches</h1>
        <div className="flex gap-2">
          <Link href="/tasks/create" className="btn">Créer une tâche</Link>
          <Link href="/tasks" className="btn btn-secondary">Retour à la liste</Link>
        </div>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STATUS_COLUMNS.map(col => (
            <Droppable droppableId={col.key} key={col.key}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`rounded-lg p-4 shadow ${col.color} min-h-[300px] transition-all ${snapshot.isDraggingOver ? 'ring-2 ring-blue-400' : ''}`}
                >
                  <h2 className="text-xl font-semibold mb-4 text-center">{col.label}</h2>
                  <div className="space-y-3">
                    {columns[col.key].length === 0 && <div className="text-gray-400 text-center">Aucune tâche</div>}
                    {columns[col.key].map((task, idx) => (
                      <Draggable draggableId={String(task.id)} index={idx} key={task.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white rounded shadow p-3 border flex flex-col gap-1 transition-all ${snapshot.isDragging ? 'ring-2 ring-blue-400' : ''}`}
                          >
                            <div className="font-medium text-lg">{task.title}</div>
                            <div className="text-sm text-gray-500">{task.description}</div>
                            <div className="flex justify-between text-xs mt-2">
                              <span className="px-2 py-0.5 rounded bg-gray-200">{task.priority || '—'}</span>
                              <span>{task.due_date ? `Échéance : ${task.due_date}` : ''}</span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

Kanban.layout = page => <AdminLayout children={page} />;
export default Kanban; 