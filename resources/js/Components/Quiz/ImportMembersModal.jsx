import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';
import { FaCheck, FaChevronLeft, FaChevronRight, FaSearch, FaSpinner, FaTimes, FaUserPlus, FaUsers } from 'react-icons/fa';
import Avatar from '@/Components/Quiz/Avatar';
import toast from '@/lib/toast';

/**
 * Import en masse d'utilisateurs ProJA vers un quiz, avec filtres et sélection paginée.
 */
export default function ImportMembersModal({ project, quiz, open, onClose }) {
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [allSelected, setAllSelected] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [excluded, setExcluded] = useState(() => new Set());
  const [submitting, setSubmitting] = useState(false);
  const requestId = useRef(0);
  const routeArgs = [project.id, quiz.id];

  useEffect(() => {
    if (!open) return undefined;
    setPage(1);
    setAllSelected(false);
    setSelected(new Set());
    setExcluded(new Set());
  }, [open, query, dateFrom, dateTo]);

  useEffect(() => {
    if (!open) return undefined;
    const current = ++requestId.current;
    setLoading(true);
    axios
      .get(route('projects.quizzes.candidates.importable', routeArgs), {
        params: {
          q: query.trim(),
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          page,
          per_page: 20,
        },
      })
      .then(({ data }) => {
        if (current !== requestId.current) return;
        setRows(data.data);
        setLastPage(data.last_page);
        setTotal(data.total);
      })
      .catch(() => {
        if (current === requestId.current) toast.error("Impossible de charger la liste des membres.");
      })
      .finally(() => {
        if (current === requestId.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query, dateFrom, dateTo, page]);

  if (!open) return null;

  const selectedCount = allSelected ? Math.max(0, total - excluded.size) : selected.size;
  const toggle = (id) => {
    if (allSelected) {
      setExcluded((set) => {
        const next = new Set(set);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
      return;
    }

    setSelected((set) => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const submit = () => {
    if (selectedCount <= 0) {
      toast.warning('Sélectionnez au moins un utilisateur à ajouter.');
      return;
    }
    router.post(
      route('projects.quizzes.candidates.members', routeArgs),
      allSelected
        ? {
            all: true,
            except_user_ids: Array.from(excluded),
            q: query.trim(),
            date_from: dateFrom || null,
            date_to: dateTo || null,
          }
        : { all: false, user_ids: Array.from(selected) },
      {
        preserveScroll: true,
        onStart: () => setSubmitting(true),
        onSuccess: (page) => {
          const summary = page.props.flash?.import_summary;
          if (summary) {
            toast.success(
              summary.skipped > 0
                ? `${summary.added} membre(s) ajouté(s). ${summary.skipped} étaient déjà membres — ignorés, vous pouvez continuer.`
                : `${summary.added} membre(s) ajouté(s) au quiz.`
            );
          } else if (page.props.flash?.success) {
            toast.success(page.props.flash.success);
          } else if (page.props.flash?.error) {
            toast.error(page.props.flash.error);
          }
          setAllSelected(false);
          setSelected(new Set());
          setExcluded(new Set());
          onClose();
        },
        onError: () => toast.error("L'ajout des utilisateurs a échoué. Réessayez."),
        onFinish: () => setSubmitting(false),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="import-members-title">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 id="import-members-title" className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FaUsers className="text-purple-600" /> Utilisateurs inscrits sur ProJA
          </h3>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Fermer">
            <FaTimes />
          </button>
        </div>

        <div className="px-5 pt-3 pb-2 space-y-2 border-b border-gray-100 dark:border-gray-700">
          <div className="relative">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrer par nom ou e-mail…"
              className="w-full pl-10 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-sm focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
              Inscrit à partir du
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1 w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-xs"
              />
            </label>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
              Inscrit jusqu'au
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1 w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-xs"
              />
            </label>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-purple-700 dark:text-purple-300">
              {selectedCount} / {total} sélectionné(s)
            </span>
            <button
              type="button"
              onClick={() => {
                setAllSelected(!allSelected);
                setSelected(new Set());
                setExcluded(new Set());
              }}
              disabled={total === 0 || loading}
              className="font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            >
              {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
          {loading && (
            <div className="flex items-center justify-center py-10 text-gray-400"><FaSpinner className="animate-spin text-xl" /></div>
          )}
          {!loading && rows.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">
              Aucun utilisateur vérifié ne correspond à ce filtre ou n'est déjà membre de ce quiz.
            </p>
          )}
          {!loading && rows.map((u) => {
            const checked = allSelected ? !excluded.has(u.id) : selected.has(u.id);
            return (
              <label key={u.id} className="flex items-center gap-3 px-5 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(u.id)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <Avatar name={u.name} src={u.photo} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-gray-900 dark:text-white truncate">{u.name}</span>
                  <span className="block text-xs text-gray-500 truncate">{u.email}</span>
                  {u.registered_at && <span className="block text-[10px] text-gray-400">Inscrit le {u.registered_at}</span>}
                </span>
              </label>
            );
          })}
        </div>

        {lastPage > 1 && (
          <div className="flex items-center justify-between px-5 py-2.5 border-t border-gray-100 dark:border-gray-700 text-sm">
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-lg disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Page précédente">
              <FaChevronLeft />
            </button>
            <span className="text-gray-500 dark:text-gray-400">Page {page} / {lastPage}</span>
            <button type="button" disabled={page >= lastPage || loading} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-lg disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Page suivante">
              <FaChevronRight />
            </button>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 dark:border-gray-700">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            Annuler
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || selectedCount <= 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition disabled:opacity-50"
          >
            {submitting ? <FaSpinner className="animate-spin" /> : <FaCheck />} Ajouter {selectedCount} utilisateur(s) au quiz
          </button>
        </div>
      </div>
    </div>
  );
}
