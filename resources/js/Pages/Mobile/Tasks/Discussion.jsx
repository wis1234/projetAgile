import React from 'react';
import { Link } from '@inertiajs/react';
import MobileLayout from '@/Layouts/MobileLayout';
import TaskDiscussionPanel from '@/Components/TaskDiscussionPanel';
import { FaInfoCircle } from 'react-icons/fa';

export default function MobileTaskDiscussion({ task, projectMembers = [] }) {
  return (
    <MobileLayout
      title={task.title}
      subtitle={task.project?.name}
      backHref="/discussions"
      hideBottomNav
      fullBleed
      headerRight={
        <Link
          href={`/tasks/${task.id}`}
          className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-300 active:scale-90 active:bg-gray-100 dark:active:bg-gray-800 transition-all"
          title="Détails de la tâche"
        >
          <FaInfoCircle className="w-4.5 h-4.5" />
        </Link>
      }
    >
      <TaskDiscussionPanel
        task={task}
        projectMembers={projectMembers}
        showHeader={false}
        fullHeight
      />
    </MobileLayout>
  );
}