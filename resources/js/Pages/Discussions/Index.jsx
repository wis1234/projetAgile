import React, { useCallback, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FaCommentDots, FaTasks, FaLock, FaEnvelope } from 'react-icons/fa';
import TaskDiscussionList from '@/Components/Inbox/TaskDiscussionList';
import InboxList from '@/Components/Inbox/InboxList';
import { readTabFromUrl, writeTabToUrl } from '@/lib/inbox';

/**
 * Discussions : bascule entre la messagerie des TÂCHES et la messagerie PERSONNELLE.
 * Les deux listes se chargent progressivement au scroll ; l'onglet est mémorisé dans l'URL.
 */
export default function Index() {
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
    { id: 'inbox', label: 'Messages privés', icon: FaEnvelope, badge: inboxUnread },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-12 dark:bg-slate-950">
      <Head title="Discussions" />

      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700">
        <div className="pointer-events-none absolute -right-14 -top-14 h-56 w-56 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-20 left-1/4 h-48 w-48 rounded-full bg-indigo-400/20" />
        <div className="relative mx-auto flex max-w-4xl items-center gap-4 px-4 pb-16 pt-8 sm:px-6">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 text-xl text-white ring-1 ring-white/20"><FaCommentDots /></span>
          <div className="text-white">
            <h1 className="text-2xl font-bold">Discussions</h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-blue-100"><FaLock className="h-3 w-3" /> Échangez sur vos tâches ou en privé avec votre équipe</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-10 max-w-4xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          {/* Bascule */}
          <div role="tablist" className="grid grid-cols-2 gap-1 border-b border-slate-100 bg-slate-50 p-1.5 dark:border-slate-800 dark:bg-slate-900">
            {tabs.map(({ id, label, icon: Icon, badge }) => (
              <button key={id} role="tab" type="button" aria-selected={tab === id} onClick={() => select(id)}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${tab === id ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                <Icon className="text-[15px]" /> {label}
                {badge > 0 && <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-white">{badge > 99 ? '99+' : badge}</span>}
              </button>
            ))}
          </div>

          {/* Les deux listes restent montées une fois visitées : pas de rechargement en basculant */}
          {mounted.has('tasks') && <div hidden={tab !== 'tasks'}><TaskDiscussionList onUnreadChange={onTaskUnread} /></div>}
          {mounted.has('inbox') && <div hidden={tab !== 'inbox'}><InboxList onUnreadChange={onInboxUnread} onOpen={(c) => router.visit(`/inbox/${c.id}`)} /></div>}
        </div>
      </div>
    </div>
  );
}

Index.layout = (page) => <AdminLayout children={page} />;
