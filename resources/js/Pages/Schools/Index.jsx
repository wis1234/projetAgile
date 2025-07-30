import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SchoolsNav from '@/Components/SchoolsNav';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faSearch, 
  faSchool, 
  faUsers,
  faPhone,
  faEnvelope,
  faMapMarkerAlt,
  faEllipsisV,
  faSort,
  faSortUp,
  faSortDown,
  faFilter,
  faEye,
  faEdit,
  faTrash,
  faUserTie,
  faChalkboardTeacher,
  faGraduationCap,
  faCalendarAlt,
  faTh,
  faList,
  faBuilding,
  faGlobe,
  faAward,
  faChartBar,
  faClock,
  faCheck,
  faExclamationTriangle,
  faUniversity,
  faChild,
  faUserGraduate,
  faTimes,
  faRefresh,
  faChevronDown,
  faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import School from '@/Models/School';

export default function SchoolsIndex({ schools, auth, filters = {} }) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
  const [typeFilter, setTypeFilter] = useState(filters.type || 'all');
  const [sortConfig, setSortConfig] = useState({
    key: filters.sort || 'name',
    direction: filters.direction || 'asc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedSchools, setSelectedSchools] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    router.get(route('schools.index'), {
      search: searchTerm,
      status: statusFilter,
      type: typeFilter,
      sort: sortConfig.key,
      direction: sortConfig.direction
    }, {
      preserveState: true,
      preserveScroll: true
    });
  };

  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
    
    router.get(route('schools.index'), {
      search: searchTerm,
      status: statusFilter,
      type: typeFilter,
      sort: key,
      direction
    }, {
      preserveState: true,
      preserveScroll: true
    });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return faSort;
    return sortConfig.direction === 'asc' ? faSortUp : faSortDown;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      [School.STATUS_ACTIVE]: { 
        classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
        icon: faCheck
      },
      [School.STATUS_INACTIVE]: { 
        classes: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
        icon: faTimes
      },
      [School.STATUS_PENDING]: { 
        classes: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
        icon: faClock
      },
    };
    
    const statusText = School.getStatusOptions();
    const config = statusConfig[status] || { 
      classes: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
      icon: faExclamationTriangle
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border ${config.classes}`}>
        <FontAwesomeIcon icon={config.icon} className="mr-1 w-3 h-3" />
        <span className="truncate">{statusText[status] || status}</span>
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      [School.TYPE_PRIMARY]: { 
        classes: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
        icon: faChild
      },
      [School.TYPE_MIDDLE]: { 
        classes: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
        icon: faSchool
      },
      [School.TYPE_HIGH]: { 
        classes: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
        icon: faGraduationCap
      },
      [School.TYPE_UNIVERSITY]: { 
        classes: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800',
        icon: faUniversity
      },
      [School.TYPE_OTHER]: { 
        classes: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
        icon: faBuilding
      },
    };
    
    const typeText = School.getTypeOptions();
    const config = typeConfig[type] || { 
      classes: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
      icon: faBuilding
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border ${config.classes}`}>
        <FontAwesomeIcon icon={config.icon} className="mr-1 w-3 h-3" />
        <span className="truncate">{typeText[type] || type}</span>
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    router.get(route('schools.index'));
  };

  const handleDeleteSchool = (school) => {
    router.delete(route('schools.destroy', school.id), {
      onSuccess: () => {
        setShowDeleteConfirm(null);
      }
    });
  };

  const stats = [
    {
      name: 'Total établissements',
      value: schools.meta?.total || schools.data.length,
      icon: faSchool,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      name: 'Actifs',
      value: schools.data.filter(s => s.status === School.STATUS_ACTIVE).length,
      icon: faCheck,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      name: 'En attente',
      value: schools.data.filter(s => s.status === School.STATUS_PENDING).length,
      icon: faClock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20'
    },
    {
      name: 'Types différents',
      value: new Set(schools.data.map(s => s.type)).size,
      icon: faAward,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    }
  ];

  // Vue en grille avec effets de survol maintenus
  const GridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {schools.data.map((school) => (
        <div 
          key={school.id} 
          className="group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden cursor-pointer"
          onClick={() => router.get(route('schools.show', school.id))}
        >
          <div className="p-5">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                <FontAwesomeIcon icon={faSchool} className="h-5 w-5" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {school.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {school.city || 'Ville non spécifiée'}
                </p>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                <FontAwesomeIcon icon={faUserTie} className="w-4 h-4 mr-2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <span>{school.director_name || 'Directeur non spécifié'}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                <FontAwesomeIcon icon={faUsers} className="w-4 h-4 mr-2 text-gray-400 group-hover:text-green-500 transition-colors" />
                <span>{school.students_count || 0} élèves</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                <FontAwesomeIcon icon={faChalkboardTeacher} className="w-4 h-4 mr-2 text-gray-400 group-hover:text-purple-500 transition-colors" />
                <span>{school.teachers_count || 0} enseignants</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 group-hover:border-gray-200 transition-colors">
              <div className="flex justify-between items-center">
                {getStatusBadge(school.status)}
                {getTypeBadge(school.type)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <AdminLayout>
      <Head title="Établissements Scolaires" />
      
      <div className="py-6 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* En-tête avec icône et titre */}
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100 text-blue-600">
                  <FontAwesomeIcon icon={faSchool} className="h-6 w-6" />
                </div>
                <h2 className="ml-4 text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  Établissements Scolaires
                </h2>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Gérez les établissements scolaires de votre plateforme
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 order-2 sm:order-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 rounded-l-lg transition-colors ${
                    viewMode === 'table' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <FontAwesomeIcon icon={faList} className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded-r-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <FontAwesomeIcon icon={faTh} className="h-4 w-4" />
                </button>
              </div>
              
              <Link
                href={route('schools.create')}
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg font-medium text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors order-1 sm:order-2"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                <span className="hidden sm:inline">Nouvel établissement</span>
                <span className="sm:hidden">Nouveau</span>
              </Link>
            </div>
          </div>

          <SchoolsNav />

          {/* Statistiques */}
          <div className={`grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8 transition-all duration-700 delay-100 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            {stats.map((stat, index) => (
              <div 
                key={stat.name}
                className={`${stat.bgColor} p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300`}
              >
                <div className="flex items-center">
                  <div className={`p-2 sm:p-3 rounded-lg ${stat.color} bg-white/70 dark:bg-gray-800/70`}>
                    <FontAwesomeIcon icon={stat.icon} className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                      {stat.name}
                    </p>
                    <p className={`text-lg sm:text-xl font-bold ${stat.color}`}>
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filtres et recherche */}
          <div className={`bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-200 dark:border-gray-700 transition-all duration-700 delay-200 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label htmlFor="search" className="sr-only">Rechercher</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon icon={faSearch} className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="search"
                      id="search"
                      className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`inline-flex items-center justify-center px-4 py-2.5 border rounded-lg text-sm font-medium transition-all duration-200 ${
                      showFilters 
                        ? 'border-blue-500 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-600' 
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    <FontAwesomeIcon icon={faFilter} className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Filtres</span>
                    <FontAwesomeIcon 
                      icon={showFilters ? faChevronUp : faChevronDown} 
                      className="ml-1 h-3 w-3" 
                    />
                  </button>
                  
                  {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200"
                    >
                      <FontAwesomeIcon icon={faRefresh} className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Réinitialiser</span>
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                  >
                    <FontAwesomeIcon icon={faSearch} className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Rechercher</span>
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 animate-slideDown">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Statut
                      </label>
                      <select
                        id="status"
                        name="status"
                        className="block w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg dark:bg-gray-700 dark:text-white transition-all duration-200"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="all">Tous les statuts</option>
                        {Object.entries(School.getStatusOptions()).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Type
                      </label>
                      <select
                        id="type"
                        name="type"
                        className="block w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg dark:bg-gray-700 dark:text-white transition-all duration-200"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                      >
                        <option value="all">Tous les types</option>
                        {Object.entries(School.getTypeOptions()).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="sm:col-span-2 lg:col-span-1 flex items-end">
                      <button
                        type="button"
                        onClick={handleSearch}
                        className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
                      >
                        Appliquer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contenu principal */}
      <div className={`bg-white transition-all duration-700 delay-300 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            {schools.data.length > 0 ? (
              viewMode === 'grid' ? (
                <GridView />
              ) : (
                /* Vue tableau responsive */
                <div className="bg-white dark:bg-gray-800 shadow-sm overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                  {/* Version desktop - Tableau simplifié */}
                  <div className="hidden lg:block">
                    <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th
                            scope="col"
                            className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            onClick={() => handleSort('name')}
                          >
                            <div className="flex items-center">
                              <span>Établissement</span>
                              <FontAwesomeIcon 
                                icon={getSortIcon('name')} 
                                className="ml-1 h-3 w-3 text-gray-400" 
                              />
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            onClick={() => handleSort('type')}
                          >
                            <div className="flex items-center">
                              <span>Type</span>
                              <FontAwesomeIcon 
                                icon={getSortIcon('type')} 
                                className="ml-1 h-3 w-3 text-gray-400" 
                              />
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            onClick={() => handleSort('status')}
                          >
                            <div className="flex items-center">
                              <span>Statut</span>
                              <FontAwesomeIcon 
                                icon={getSortIcon('status')} 
                                className="ml-1 h-3 w-3 text-gray-400" 
                              />
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {schools.data.map((school, index) => (
                          <tr 
                            key={school.id} 
                            className="border-b border-gray-200 dark:border-gray-700 transition duration-150 ease-in-out hover:bg-blue-50 dark:hover:bg-gray-700 group cursor-pointer hover:shadow-md"
                            onClick={() => router.get(route('schools.show', school.id))}
                          >
                              <td className="px-3 py-4">
                              <div className="flex items-center min-w-0">
                                <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                  <FontAwesomeIcon 
                                    icon={faSchool} 
                                    className="h-4 w-4 text-white" 
                                  />
                                </div>
                                <div className="ml-3 min-w-0 flex-1">
                                  <div className="font-semibold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 truncate" title={school.name}>
                                    {school.name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mt-1 inline-block">
                                    {school.code}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-4">
                              {getTypeBadge(school.type)}
                            </td>
                            <td className="px-3 py-4">
                              {getStatusBadge(school.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Version mobile/tablet */}
                  <div className="lg:hidden">
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {schools.data.map((school, index) => (
                        <div key={school.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <FontAwesomeIcon icon={faSchool} className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {school.name}
                                  </h3>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mt-1 inline-block">
                                    {school.code}
                                  </p>
                                </div>
                                <button
                                  onClick={() => setExpandedRow(expandedRow === school.id ? null : school.id)}
                                  className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                  <FontAwesomeIcon 
                                    icon={expandedRow === school.id ? faChevronUp : faChevronDown} 
                                    className="h-4 w-4" 
                                  />
                                </button>
                              </div>
                              
                              <div className="mt-2 flex flex-wrap gap-2">
                                {getStatusBadge(school.status)}
                                {getTypeBadge(school.type)}
                              </div>
                              
                              <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1 h-3 w-3" />
                                <span className="truncate">{school.city}, {school.country}</span>
                              </div>
                              
                              {expandedRow === school.id && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    <strong>Code:</strong> {school.code}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    <strong>Adresse:</strong> {school.address}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    <strong>Créé le:</strong> {formatDate(school.created_at)}
                                  </div>
                                  <div className="flex flex-wrap gap-1 pt-2">
                                    <Link
                                      href={route('schools.show', school.id)}
                                      className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                                    >
                                      <FontAwesomeIcon icon={faEye} className="mr-1 h-3 w-3" />
                                      Voir
                                    </Link>
                                    <Link
                                      href={route('schools.edit', school.id)}
                                      className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors"
                                    >
                                      <FontAwesomeIcon icon={faEdit} className="mr-1 h-3 w-3" />
                                      Modifier
                                    </Link>
                                    {(auth.user.role === 'admin' || (auth.user.role === 'school_admin' && auth.user.school_id === school.id)) && (
                                      <>
                                        <Link
                                          href={route('schools.hosts.index', school.id)}
                                          className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition-colors"
                                        >
                                          <FontAwesomeIcon icon={faUserTie} className="mr-1 h-3 w-3" />
                                          Admins
                                        </Link>
                                        <button
                                          onClick={() => setShowDeleteConfirm(school)}
                                          className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                                        >
                                          <FontAwesomeIcon icon={faTrash} className="mr-1 h-3 w-3" />
                                          Supprimer
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pagination */}
                  {schools.data.length > 0 && schools.meta && (
                    <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-600 sm:px-6">
                      <div className="flex-1 flex justify-between items-center">
                        <div className="hidden sm:block">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            Affichage de <span className="font-medium">{schools.meta.from}</span> à{' '}
                            <span className="font-medium">{schools.meta.to}</span> sur{' '}
                            <span className="font-medium">{schools.meta.total}</span> résultats
                          </p>
                        </div>
                        <div className="flex-1 flex justify-center sm:justify-end">
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            {schools.meta.links.map((link, index) => {
                              const isFirst = index === 0;
                              const isLast = index === schools.meta.links.length - 1;
                              const isActive = link.active;
                              const isDisabled = !link.url;
                              
                              return (
                                <Link
                                  key={index}
                                  href={link.url || '#'}
                                  className={`relative inline-flex items-center px-2 py-2 text-sm font-medium transition-colors ${
                                    isActive
                                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                      : isDisabled
                                      ? 'bg-white border-gray-300 text-gray-300 cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-600'
                                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                                  } ${isFirst ? 'rounded-l-md' : ''} ${isLast ? 'rounded-r-md' : ''} border`}
                                  dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                              );
                            })}
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : (
              /* État vide */
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-8 sm:p-12 text-center border border-gray-200 dark:border-gray-700">
                <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4 sm:mb-6">
                  <FontAwesomeIcon icon={faSchool} className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Aucun établissement trouvé
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                    ? "Aucun établissement ne correspond à vos critères de recherche."
                    : "Vous n'avez pas encore d'établissement enregistré."
                  }
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? (
                    <button
                      onClick={clearFilters}
                      className="inline-flex items-center justify-center px-4 py-2 border border-blue-600 text-blue-600 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-medium transition-colors"
                    >
                      <FontAwesomeIcon icon={faRefresh} className="mr-2" />
                      Réinitialiser les filtres
                    </button>
                  ) : (
                    <Link
                      href={route('schools.create')}
                      className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      <FontAwesomeIcon icon={faPlus} className="mr-2" />
                      Créer le premier établissement
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 border border-gray-200 dark:border-gray-700">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                  <FontAwesomeIcon icon={faTrash} className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Supprimer l'établissement
                  </h3>
                  <div className="mt-2">
                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mb-3">
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">
                        {showDeleteConfirm.name}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Code: {showDeleteConfirm.code}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Cette action est irréversible et toutes les données associées seront perdues.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm transition-colors"
                  onClick={() => handleDeleteSchool(showDeleteConfirm)}
                >
                  <FontAwesomeIcon icon={faTrash} className="mr-2 h-4 w-4" />
                  Supprimer
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm transition-colors"
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        /* Responsive fixes */
        @media (max-width: 640px) {
          .px-mobile-safe {
            padding-left: 1rem;
            padding-right: 1rem;
          }
          
          .table-container {
            width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            margin: 0 -1rem;
            padding: 0 1rem;
          }
          
          .table-wrapper {
            min-width: 640px;
          }
          
          .stat-card {
            padding: 1rem;
          }
          
          .stat-icon {
            padding: 0.5rem;
          }
          
          .stat-value {
            font-size: 1.125rem;
          }
          
          .header-actions {
            flex-direction: column;
            width: 100%;
            gap: 0.75rem;
          }
          
          .header-actions > * {
            width: 100%;
          }
          
          .search-container {
            width: 100%;
          }
        }
        
        /* Fix for iOS elastic scrolling */
        html, body {
          max-width: 100%;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
        }
        
        /* Ensure table cells don't break layout */
        td, th {
          white-space: nowrap;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        /* Fix for sticky header */
        .sticky-header {
          position: sticky;
          top: 0;
          z-index: 10;
          background-color: inherit;
        }
      `}</style>
    </AdminLayout>
  );
}