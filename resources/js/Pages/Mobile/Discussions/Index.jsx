import React, { useCallback, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { FaTasks, FaEnvelope } from 'react-icons/fa';
import MobileLayout from '@/Layouts/MobileLayout';
import TaskDiscussionList from '@/Components/Inbox/TaskDiscussionList';
import InboxList from '@/Components/Inbox/InboxList';
import { readTabFromUrl, writeTabToUrl } from '@/lib/inbox';

/** Discussions (mobile) : bascule Tâches / Messages privés, listes à chargement progressif. */
export default function MobileDiscussionsIndex() {
  const [tab, setTab] = useState(readTabFromUrl);
  const [mounted, setMounted] = useState(() => new Set([readTabFromUrl()]));
  const [taskUnread, setTaskUnread] = useState(0);
  const [inboxUnread, setInboxUnread] = useState(0);

  const select = (t) => {
    setTab(t);
    setMounted((m) => (m.has(t) ? m : new Set(m).add(t)));
    writeTabToUrl(t);
  };
  const onTaskUnread = useCallback((n) => setTaskUnread(n), []);
  const onInboxUnread = useCallback((n) => setInboxUnread(n), []);

  const tabs = [
    { id: 'tasks', label: 'Tâches', icon: FaTasks, badge: taskUnread },
    { id: 'inbox', label: 'Privé', icon: FaEnvelope, badge: inboxUnread },
  ];

  return (
    <MobileLayout title="Discussions" fullBleed>
      <Head title="Discussions" />
      <div className="min-h-full bg-white dark:bg-slate-900">
        <div className="sticky top-0 z-20 border-b border-slate-100 bg-white px-3 pb-2 pt-3 dark:border-slate-800 dark:bg-slate-900">
          <div role="tablist" className="grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1 dark:bg-slate-800">
            {tabs.map(({ id, label, icon: Icon, badge }) => (
              <button key={id} role="tab" type="button" aria-selected={tab === id} onClick={() => select(id)}
                className={`flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold transition ${tab === id ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}>
                <Icon className="text-[13px]" /> {label}
                {badge > 0 && <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-white">{badge > 99 ? '99+' : badge}</span>}
              </button>
            ))}
          </div>
        </div>

        {mounted.has('tasks') && <div hidden={tab !== 'tasks'}><TaskDiscussionList withProjectFilter={false} onUnreadChange={onTaskUnread} /></div>}
        {mounted.has('inbox') && <div hidden={tab !== 'inbox'}><InboxList onUnreadChange={onInboxUnread} onOpen={(c) => router.visit(`/inbox/${c.id}`)} /></div>}
      </div>
    </MobileLayout>
  );
}
