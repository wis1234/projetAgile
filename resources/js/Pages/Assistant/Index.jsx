import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import AssistantPanel from '@/Components/Assistant/AssistantPanel';
import { FaRobot } from 'react-icons/fa';

export default function AssistantIndex() {
  const { ai } = usePage().props;
  return (
    <div className="mx-auto flex h-[calc(100dvh-5rem)] max-w-3xl flex-col px-0 py-0 sm:px-6 sm:py-4">
      <Head title="Assistant IA" />
      {ai?.enabled ? (
        <div className="relative min-h-0 flex-1 overflow-hidden border-slate-200 bg-white shadow-sm dark:border-slate-700 sm:rounded-2xl sm:border">
          {ai?.admin && <Link href="/assistant/admin" className="absolute right-3 top-3 z-10 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm hover:bg-white dark:bg-slate-800 dark:text-blue-300">Administration IA</Link>}
          <AssistantPanel variant="page" />
        </div>
      ) : (
        <div className="m-auto max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
          <FaRobot className="mx-auto text-4xl text-slate-300" />
          <h1 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Assistant non activé</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Aucun fournisseur IA n’est actif pour votre compte. Contactez un administrateur.</p>
        </div>
      )}
    </div>
  );
}

AssistantIndex.layout = (page) => <AdminLayout children={page} />;
