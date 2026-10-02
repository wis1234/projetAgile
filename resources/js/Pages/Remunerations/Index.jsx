import React, { useState } from 'react';
import WalletCard, { WithdrawalHistory } from '@/Components/Wallet/WalletCard';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { 
  FaFilter, 
  FaSearch, 
  FaMoneyBillWave, 
  FaClock, 
  FaCheckCircle, 
  FaTimesCircle,
  FaFileExport,
  FaArrowLeft,
  FaFileAlt
} from 'react-icons/fa';

export default function RemunerationIndex({ remunerations, filters, stats, wallet, withdrawals = [], payoutDefaults = {} }) {
  const { auth } = usePage().props;
  const isAdmin = auth.user.roles?.includes('admin');
  const [tab, setTab] = useState(() => (typeof window !== 'undefined' && window.location.hash === '#retraits' ? 'withdrawals' : 'earnings'));
  const { flash = {} } = usePage().props;
  const pendingWithdrawals = withdrawals.filter((w) => ['pending', 'processing'].includes(w.status)).length;
  const [params, setParams] = useState({
    search: filters.search || '',
    status: filters.status || '',
    type: filters.type || '',
    start_date: filters.start_date || '',
    end_date: filters.end_date || '',
  });

  const handleFilter = () => {
    router.get(route('remunerations.index'), params, {
      preserveState: true,
      replace: true,
    });
  };

  const resetFilters = () => {
    setParams({
      search: '',
      status: '',
      type: '',
      start_date: '',
      end_date: '',
    });
    router.get(route('remunerations.index'));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' XOF';
  };

  return (
    <>
      <Head title="Historique des rémunérations" />
      
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Mes gains</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Suivez vos rémunérations et retirez-les sur votre Mobile Money.</p>
          </div>
          <Link href={route('remunerations.dashboard')} className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
            Tableau de bord
          </Link>
        </div>

        {flash.success && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">{flash.success}</p>}
        {flash.error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">{flash.error}</p>}

        {wallet && <WalletCard wallet={wallet} defaults={payoutDefaults} />}

        {/* Onglets */}
        <div role="tablist" className="mb-6 mt-8 inline-flex rounded-2xl bg-gray-100 p-1 dark:bg-gray-800">
          {[['earnings', 'Mes gains'], ['withdrawals', 'Mes retraits']].map(([id, label]) => (
            <button key={id} role="tab" type="button" aria-selected={tab === id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${tab === id ? 'bg-white text-blue-700 shadow-sm dark:bg-gray-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}>
              {label}
              {id === 'withdrawals' && pendingWithdrawals > 0 && <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white">{pendingWithdrawals}</span>}
            </button>
          ))}
        </div>

        {tab === 'withdrawals' ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
            <h2 className="mb-1 text-base font-bold text-gray-900 dark:text-white">Historique des retraits</h2>
            <WithdrawalHistory withdrawals={withdrawals} />
          </div>
        ) : (
        <>
        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Recherche
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  value={params.search}
                  onChange={(e) => setParams({ ...params, search: e.target.value })}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  placeholder="Rechercher..."
                />
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Statut
              </label>
              <select
                id="status"
                name="status"
                value={params.status}
                onChange={(e) => setParams({ ...params, status: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="paid">Payé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <select
                id="type"
                name="type"
                value={params.type}
                onChange={(e) => setParams({ ...params, type: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value="">Tous les types</option>
                <option value="task_completion">Tâche terminée</option>
                <option value="bonus">Bonus</option>
                <option value="refund">Remboursement</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div className="flex items-end space-x-2">
              <button
                type="button"
                onClick={handleFilter}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaFilter className="mr-2 h-4 w-4" />
                Filtrer
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <FaMoneyBillWave className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Total gagné
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(stats.total_earned || 0)}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <FaClock className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      En attente
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(stats.pending_amount || 0)}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <FaCheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Tâches terminées
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {stats.completed_tasks || 0}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau des rémunérations */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tâche
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Montant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Statut
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {remunerations.data && remunerations.data.length > 0 ? (
                  remunerations.data.map((remuneration) => (
                    <tr key={remuneration.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {remuneration.user?.avatar && (
                            <img 
                              className="h-10 w-10 rounded-full mr-3" 
                              src={remuneration.user.avatar} 
                              alt={remuneration.user.name} 
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {remuneration.user?.name || 'Utilisateur inconnu'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {remuneration.task?.title || 'Sans tâche associée'}
                            </div>
                            {remuneration.task?.project && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 mt-1">
                                {remuneration.task.project.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            remuneration.type === 'task' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : remuneration.type === 'bonus'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : remuneration.type === 'refund'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {remuneration.type_label || remuneration.type}
                          </span>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {remuneration.formatted_created_at}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(remuneration.amount)}
                        </div>
                        {remuneration.task?.due_date && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Échéance: {remuneration.task.due_date}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col">
                          <span>{remuneration.formatted_date}</span>
                          {remuneration.task?.status && (
                            <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                              {remuneration.task.status}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          remuneration.status === 'paid' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : remuneration.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {remuneration.status_label || remuneration.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {remuneration.task?.id && (
                          <Link 
                            href={`/tasks/${remuneration.task.id}`}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                          >
                            Voir
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">
                      Aucune rémunération trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {remunerations.data && remunerations.data.length > 0 && (
            <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <Link 
                  href={remunerations.prev_page_url ? `${remunerations.prev_page_url}` : '#'}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    !remunerations.prev_page_url 
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  disabled={!remunerations.prev_page_url}
                >
                  Précédent
                </Link>
                <Link 
                  href={remunerations.next_page_url ? `${remunerations.next_page_url}` : '#'}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    !remunerations.next_page_url 
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  disabled={!remunerations.next_page_url}
                >
                  Suivant
                </Link>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Affichage de <span className="font-medium">{remunerations.from || 0}</span> à <span className="font-medium">{remunerations.to || 0}</span> sur <span className="font-medium">{remunerations.total || 0}</span> résultats
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    {remunerations.links && remunerations.links.map((link, index) => (
                      <Link
                        key={index}
                        href={link.url || '#'}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          link.active
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600 dark:bg-indigo-900 dark:border-indigo-700 dark:text-indigo-200'
                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                      />
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
        </>
        )}
      </div>
    </>
  );
}

RemunerationIndex.layout = page => <AdminLayout children={page} />;
