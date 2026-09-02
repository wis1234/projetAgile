import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import MobileLayout from '@/Layouts/MobileLayout';
import { nativeFeedback } from '@/lib/platform';

export default function MobileMessagesIndex({ messages, filters }) {
  const [search, setSearch] = useState(filters?.search || '');

  const handleSearch = (e) => {
    e.preventDefault();
    router.get('/messages', { search }, { preserveState: true, replace: true });
  };

  const handleDelete = (id) => {
    if (confirm('Supprimer ce message ?')) {
      router.delete(`/messages/${id}`);
    }
  };

  return (
    <MobileLayout title="Messages" headerRight={
      <Link href="/messages/create" className="p-2 text-blue-600 dark:text-blue-400">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    }>
      <div className="p-4 space-y-4">
        {/* Barre de recherche */}
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un message..."
            className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
          />
          <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </form>

        {/* Liste des messages */}
        <div className="space-y-3">
          {messages?.data?.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">📬</div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun message trouvé.</p>
            </div>
          ) : (
            messages?.data?.map(message => (
              <div
                key={message.id}
                onClick={() => {
                  nativeFeedback.tap();
                  router.get(`/messages/${message.id}`);
                }}
                className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm active:scale-[0.98] transition-transform"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                      {message.user?.name?.substring(0, 2).toUpperCase() || '??'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                        {message.user?.name || 'Utilisateur inconnu'}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {new Date(message.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {message.project && (
                    <span className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md">
                      {message.project.name}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">
                  {message.content}
                </p>
                <div className="mt-3 flex justify-end gap-2 border-t border-gray-50 dark:border-gray-700 pt-3">
                  <Link
                    href={`/messages/${message.id}/edit`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                  >
                    Éditer
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(message.id);
                    }}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {messages?.links?.length > 3 && (
          <div className="flex justify-center gap-1 mt-6 overflow-x-auto pb-2">
            {messages.links.map((link, i) => (
              <button
                key={i}
                onClick={() => link.url && router.get(link.url)}
                disabled={!link.url}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                  link.active
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 disabled:opacity-50'
                }`}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
