import React from 'react';
import { Link } from '@inertiajs/react';
import { FaArrowLeft, FaBullhorn, FaChevronRight } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import AdminLayout from '@/Layouts/AdminLayout';

function AnnouncementsIndex({ announcements }) {
  const { t } = useTranslation();
  const items = announcements?.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 dark:from-gray-950 dark:via-slate-950 dark:to-blue-950/30">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200"
        >
          <FaArrowLeft className="text-xs" /> {t('dashboard')}
        </Link>

        <header className="rounded-3xl bg-gradient-to-r from-blue-950 via-blue-800 to-blue-700 p-6 text-white shadow-xl shadow-blue-900/15 sm:p-8">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <FaBullhorn className="text-xl" />
          </span>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">ProJA · Communication</p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{t('announcements')}</h1>
          <p className="mt-2 max-w-2xl text-sm text-blue-100">
            Communiqués publiés dans les projets dont vous êtes membre.
          </p>
        </header>

        <div className="space-y-4">
          {items.length ? items.map((announcement) => (
            <article key={announcement.id} className="rounded-3xl border border-white bg-white p-5 shadow-lg shadow-slate-200/60 dark:border-gray-700 dark:bg-gray-800 dark:shadow-black/20 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                      {announcement.project.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{announcement.created_at}</span>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{announcement.title}</h2>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-600 dark:text-gray-300">{announcement.body}</p>
                  <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                    Publié par {announcement.author || 'un membre du projet'}
                  </p>
                </div>
                <Link
                  href={`/projects/${announcement.project.id}#announcements`}
                  className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                >
                  Voir le projet <FaChevronRight className="text-xs" />
                </Link>
              </div>
            </article>
          )) : (
            <div className="rounded-3xl border border-dashed border-blue-200 bg-white/70 px-4 py-14 text-center dark:border-gray-700 dark:bg-gray-800/60">
              <FaBullhorn className="mx-auto mb-3 text-3xl text-blue-300 dark:text-blue-500" />
              <p className="font-semibold text-gray-700 dark:text-gray-200">Aucun communiqué pour le moment.</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Les annonces de vos projets apparaîtront ici.</p>
            </div>
          )}
        </div>

        {announcements?.links?.length > 3 && (
          <nav className="flex flex-wrap justify-center gap-2" aria-label="Pagination">
            {announcements.links.map((link, index) => (
              <Link
                key={`${link.label}-${index}`}
                href={link.url || '#'}
                preserveScroll
                className={`rounded-lg px-3 py-2 text-sm ${
                  link.active
                    ? 'bg-blue-600 font-semibold text-white'
                    : link.url
                    ? 'bg-white text-gray-700 shadow-sm hover:bg-blue-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                    : 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                }`}
                aria-disabled={!link.url}
                onClick={(event) => {
                  if (!link.url) event.preventDefault();
                }}
              >
                {link.label.replace('&laquo;', '‹').replace('&raquo;', '›')}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}

AnnouncementsIndex.layout = (page) => <AdminLayout children={page} />;

export default AnnouncementsIndex;
