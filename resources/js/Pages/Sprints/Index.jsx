import React, { useState, useEffect } from 'react';
import { router, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FaFlagCheckered, FaPlus, FaSearch, FaTable, FaTh, FaProjectDiagram, FaCalendarAlt, FaList } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Index = ({ sprints, filters: initialFilters = {} }) => {
  const { flash = {} } = usePage().props;
  
  // Debug: Afficher la structure des données reçues
  useEffect(() => {
 
  }, [sprints]);
  const [search, setSearch] = useState(initialFilters.search || '');
  const [viewMode, setViewMode] = useState('table'); // 'table' par défaut
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (flash.success) {
      setNotification({ type: 'success', message: flash.success });
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [flash.success]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    router.get(route('sprints.index'), { search }, { 
      preserveState: true, 
      replace: true
    });
  };

  const formatDate = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('fr-FR', options);
  };

  const getStatusInfo = (sprint) => {
    const endDate = new Date(sprint.end_date);
    const now = new Date();
    const isPast = endDate < now;

    if (isPast) {
      return { label: 'Terminé', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
    }
    return { label: 'En cours', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-white dark:bg-gray-950 p-0 m-0">
      <main className="flex-1 flex flex-col w-full py-4 sm:py-6 lg:py-8 px-2 sm:px-4 lg:px-8">
        {/* Header */}
        <div className="flex flex-col space-y-4 sm:space-y-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <FaFlagCheckered className="text-3xl sm:text-4xl text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">
                Gestion des Sprints
              </h1>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition duration-200 ${
                    viewMode === 'table' 
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                      : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  <FaList className="text-xs" />
                  <span className="hidden sm:inline">Tableau</span>
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition duration-200 ${
                    viewMode === 'cards' 
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                      : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  <FaTh className="text-xs" />
                  <span className="hidden sm:inline">Cartes</span>
                </button>
              </div>
              <Link 
                href={route('sprints.create')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition duration-200 hover:shadow-md whitespace-nowrap text-sm sm:text-base"
              >
                <FaPlus className="text-sm sm:text-lg" /> 
                <span className="hidden sm:inline">Nouveau Sprint</span>
                <span className="sm:hidden">Nouveau</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-lg">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
            <div className="lg:col-span-3">
              <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recherche par nom de sprint
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                  placeholder="Rechercher un sprint..."
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition duration-200 hover:shadow-md"
            >
              <FaSearch />
              <span className="hidden sm:inline">Rechercher</span>
            </button>
          </form>
        </div>

        {/* Content */}
        {viewMode === 'table' ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-lg mb-8 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-gray-700 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Sprint</th>
                    <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Projet</th>
                    <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Période</th>
                    <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {sprints.data?.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-10 text-gray-500 dark:text-gray-400 text-lg">
                        Aucun sprint trouvé.
                      </td>
                    </tr>
                  ) : sprints.data?.map(sprint => (
                    <tr 
                      key={sprint.id} 
                      className="border-b border-gray-200 dark:border-gray-700 transition duration-150 ease-in-out hover:bg-blue-50 dark:hover:bg-gray-700 group cursor-pointer hover:shadow-md"
                      onClick={() => router.get(route('sprints.show', sprint.id))}
                    >
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center border-2 border-blue-200 dark:border-blue-600 shadow-sm group-hover:border-blue-400 transition-colors duration-200">
                            <FaFlagCheckered className="text-white text-lg" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                              {sprint.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">ID: {sprint.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <FaProjectDiagram />
                          <span>{sprint.project?.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4 align-middle text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt />
                          <span>{formatDate(sprint.start_date)} - {formatDate(sprint.end_date)}</span>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusInfo(sprint).color}`}>
                          {getStatusInfo(sprint).label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
          >
            {sprints.data?.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <FaFlagCheckered className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-xl text-gray-500 dark:text-gray-400">Aucun sprint trouvé</p>
              </div>
            ) : sprints.data?.map((sprint) => (
              <motion.div
                key={sprint.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer group"
                onClick={() => router.get(route('sprints.show', sprint.id))}
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FaFlagCheckered className="text-white text-lg" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                        {sprint.name}
                      </h3>
                      <div className="flex items-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {sprint.project?.name || 'N/A'}
                        </p>
                        {sprint.project?.is_muted && (
                            <span className="ml-2 px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full flex-shrink-0">
                                Sourdine
                            </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusInfo(sprint).color} flex-shrink-0`}>
                    {getStatusInfo(sprint).label}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt />
                    <span>{formatDate(sprint.start_date)} - {formatDate(sprint.end_date)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination simplifiée */}
        {sprints.links && sprints.links.length > 1 && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Indicateur de résultats */}
            {sprints.total > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Affichage de <span className="font-medium">{sprints.from || 0}</span> à <span className="font-medium">{sprints.to || 0}</span> sur <span className="font-medium">{sprints.total || 0}</span> résultats
              </div>
            )}
            
            <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg p-2 shadow">
              {sprints.links.map((link, index) => {
                let label = link.label;
                if (label.includes('Previous')) label = '«';
                if (label.includes('Next')) label = '»';
                
                return (
                  <Link
                    key={index}
                    href={link.url || '#'}
                    className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium
                      ${link.active 
                        ? 'bg-blue-600 text-white' 
                        : link.url 
                          ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700' 
                          : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      }`}
                    disabled={!link.url}
                  >
                    <span dangerouslySetInnerHTML={{ __html: label }} />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Notification */}
        {notification && (
          <motion.div 
            className={`fixed top-4 right-4 z-50 px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-xl text-white transition-all text-sm sm:text-base max-w-sm ${
              notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {notification.message}
          </motion.div>
        )}
      </main>
    </div>
  );
};

Index.layout = page => <AdminLayout children={page} />;
export default Index;