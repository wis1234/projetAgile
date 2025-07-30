import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faEdit, 
  faTrash, 
  faPlus, 
  faSchool, 
  faMapMarkerAlt,
  faPhone,
  faEnvelope,
  faGlobe,
  faUserTie,
  faInfoCircle,
  faUsers,
  faCalendarAlt,
  faIdCard,
  faGraduationCap,
  faUserGraduate,
  faCopy,
  faCheck,
  faExternalLinkAlt,
  faChartBar,
  faAward,
  faClock,
  faCity,
  faLink
} from '@fortawesome/free-solid-svg-icons';
import School from '@/Models/School';

export default function ShowSchool({ school, auth }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const getStatusBadge = (status) => {
    const statusClasses = {
      [School.STATUS_ACTIVE]: 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 dark:from-green-900/30 dark:to-green-800/30 dark:text-green-400 border border-green-300 dark:border-green-700 shadow-sm',
      [School.STATUS_INACTIVE]: 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 dark:from-red-900/30 dark:to-red-800/30 dark:text-red-400 border border-red-300 dark:border-red-700 shadow-sm',
      [School.STATUS_PENDING]: 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 dark:from-yellow-900/30 dark:to-yellow-800/30 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700 shadow-sm',
    };
    
    const statusText = School.getStatusOptions();
    const statusIcons = {
      [School.STATUS_ACTIVE]: faCheck,
      [School.STATUS_INACTIVE]: faTrash,
      [School.STATUS_PENDING]: faClock,
    };
    
    return (
      <span className={`px-4 py-2 inline-flex items-center text-sm font-semibold rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'} transform transition-all duration-200 hover:scale-105`}>
        <FontAwesomeIcon icon={statusIcons[status]} className="mr-2 w-3 h-3" />
        {statusText[status] || status}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeClasses = {
      [School.TYPE_PRIMARY]: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 dark:from-blue-900/30 dark:to-blue-800/30 dark:text-blue-400 border border-blue-300 dark:border-blue-700',
      [School.TYPE_MIDDLE]: 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 dark:from-purple-900/30 dark:to-purple-800/30 dark:text-purple-400 border border-purple-300 dark:border-purple-700',
      [School.TYPE_HIGH]: 'bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 dark:from-indigo-900/30 dark:to-indigo-800/30 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-700',
      [School.TYPE_UNIVERSITY]: 'bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800 dark:from-pink-900/30 dark:to-pink-800/30 dark:text-pink-400 border border-pink-300 dark:border-pink-700',
      [School.TYPE_OTHER]: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 dark:from-gray-700/30 dark:to-gray-600/30 dark:text-gray-400 border border-gray-300 dark:border-gray-600',
    };
    
    const typeText = School.getTypeOptions();
    const typeIcons = {
      [School.TYPE_PRIMARY]: faSchool,
      [School.TYPE_MIDDLE]: faGraduationCap,
      [School.TYPE_HIGH]: faUserGraduate,
      [School.TYPE_UNIVERSITY]: faAward,
      [School.TYPE_OTHER]: faSchool,
    };
    
    return (
      <span className={`px-4 py-2 inline-flex items-center text-sm font-semibold rounded-full ${typeClasses[type] || 'bg-gray-100 text-gray-800'} shadow-sm`}>
        <FontAwesomeIcon icon={typeIcons[type]} className="mr-2 w-3 h-3" />
        {typeText[type] || type}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non spécifié';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
    }
  };

  const handleDelete = () => {
    router.delete(route('schools.destroy', school.id), {
      onSuccess: () => {
        // Redirection gérée par le contrôleur
      },
    });
  };

  // Données pour les cartes d'information avec animations
  const infoCards = [
    {
      title: 'Identité',
      icon: faIdCard,
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
      borderColor: 'border-blue-200 dark:border-blue-700',
      items: [
        { label: 'Code', value: school.code || 'Non spécifié', copyable: true },
        { label: 'Type', value: getTypeBadge(school.type), isComponent: true },
        { label: 'Statut', value: getStatusBadge(school.status), isComponent: true },
      ]
    },
    {
      title: 'Contact',
      icon: faPhone,
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
      borderColor: 'border-green-200 dark:border-green-700',
      items: [
        { label: 'Email', value: school.email || 'Non spécifié', link: school.email ? `mailto:${school.email}` : null, copyable: true },
        { label: 'Téléphone', value: school.phone || 'Non spécifié', link: school.phone ? `tel:${school.phone}` : null, copyable: true },
        { label: 'Site web', value: school.website ? new URL(school.website).hostname : 'Non spécifié', 
          link: school.website ? school.website : null, copyable: true }
      ]
    },
    {
      title: 'Localisation',
      icon: faMapMarkerAlt,
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
      borderColor: 'border-purple-200 dark:border-purple-700',
      items: [
        { label: 'Adresse', value: school.address || 'Non spécifiée', copyable: true },
        { label: 'Ville', value: school.city || 'Non spécifiée', copyable: true },
        { label: 'Pays', value: school.country || 'Non spécifié', copyable: true }
      ]
    },
    {
      title: 'Statistiques',
      icon: faChartBar,
      color: 'text-orange-600',
      bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20',
      borderColor: 'border-orange-200 dark:border-orange-700',
      items: [
        { 
          label: 'Capacité d\'accueil', 
          value: school.capacity ? `${school.capacity.toLocaleString()} élèves` : 'Non spécifiée'
        },
        { 
          label: 'Date de création', 
          value: formatDate(school.created_at)
        },
        { 
          label: 'Dernière mise à jour', 
          value: formatDate(school.updated_at)
        }
      ]
    }
  ];

  const tabs = [
    { id: 'overview', name: 'Vue d\'ensemble', icon: faInfoCircle },
    { id: 'details', name: 'Détails', icon: faSchool },
    { id: 'stats', name: 'Statistiques', icon: faChartBar }
  ];

  return (
    <AdminLayout>
      <Head title={`${school.name} - Détails`} />
      
      <div className="py-6 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* En-tête avec boutons d'action */}
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100 text-blue-600">
                  <FontAwesomeIcon icon={faSchool} className="h-6 w-6" />
                </div>
                <h2 className="ml-4 text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  {school.name}
                </h2>
                <div className="ml-4 flex">
                  {getStatusBadge(school.status)}
                  <span className="ml-2">
                    {getTypeBadge(school.type)}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Détails et informations de l'établissement
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
              <Link
                href={route('schools.edit', school.id)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FontAwesomeIcon icon={faEdit} className="-ml-1 mr-2 h-4 w-4 text-gray-500" />
                Modifier
              </Link>
              <Link
                href={route('schools.index')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="-ml-1 mr-2 h-4 w-4" />
                Retour
              </Link>
            </div>
          </div>

          {/* Grille d'informations */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Carte d'information principale */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6 bg-gray-50">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Informations générales
                  </h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-gray-400" />
                        Adresse
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {school.address || 'Non spécifiée'}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">
                        <FontAwesomeIcon icon={faCity} className="mr-2 text-gray-400" />
                        Ville
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {school.city || 'Non spécifiée'}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">
                        <FontAwesomeIcon icon={faGlobe} className="mr-2 text-gray-400" />
                        Pays
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {school.country || 'Non spécifié'}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">
                        <FontAwesomeIcon icon={faPhone} className="mr-2 text-gray-400" />
                        Téléphone
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {school.phone || 'Non spécifié'}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">
                        <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-gray-400" />
                        Email
                      </dt>
                      <dd className="mt-1 text-sm text-blue-600 hover:text-blue-800">
                        {school.email ? (
                          <a href={`mailto:${school.email}`} className="hover:underline">
                            {school.email}
                          </a>
                        ) : 'Non spécifié'}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">
                        <FontAwesomeIcon icon={faLink} className="mr-2 text-gray-400" />
                        Site web
                      </dt>
                      <dd className="mt-1 text-sm">
                        {school.website ? (
                          <a 
                            href={school.website.startsWith('http') ? school.website : `https://${school.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {school.website.replace(/^https?:\/\//, '')}
                          </a>
                        ) : 'Non spécifié'}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">
                        <FontAwesomeIcon icon={faInfoCircle} className="mr-2 text-gray-400" />
                        Description
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                        {school.description || 'Aucune description disponible'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Onglets */}
          <div className={`mb-8 transition-all duration-700 delay-100 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <FontAwesomeIcon icon={tab.icon} className="mr-2" />
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Contenu des onglets */}
          {activeTab === 'overview' && (
            <div className={`transition-all duration-500 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              {/* Grille d'informations avec animations staggerées */}
              <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
                {infoCards.map((card, index) => (
                  <div 
                    key={index}
                    className={`flex flex-col p-6 rounded-xl shadow-sm ${card.bgColor} border-2 ${card.borderColor} hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-105`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center mb-6">
                      <div className={`p-3 mr-4 rounded-full ${card.color} bg-white/50 dark:bg-gray-800/50 shadow-sm`}>
                        <FontAwesomeIcon icon={card.icon} className={`w-6 h-6 ${card.color}`} />
                      </div>
                      <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                        {card.title}
                      </h2>
                    </div>
                    <div className="space-y-4 flex-1">
                      {card.items.map((item, i) => (
                        <div key={i} className="flex flex-col space-y-1">
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {item.label}
                          </span>
                          <div className="flex items-center justify-between">
                            {item.isComponent ? (
                              item.value
                            ) : item.link ? (
                              <a 
                                href={item.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all flex items-center group"
                              >
                                <span className="mr-2">{item.value}</span>
                                <FontAwesomeIcon icon={faExternalLinkAlt} className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </a>
                            ) : (
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-200 break-all">
                                {item.value}
                              </span>
                            )}
                            {item.copyable && item.value !== 'Non spécifié' && item.value !== 'Non spécifiée' && (
                              <button
                                onClick={() => copyToClipboard(item.value, `${card.title}-${item.label}`)}
                                className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                title="Copier"
                              >
                                <FontAwesomeIcon 
                                  icon={copiedField === `${card.title}-${item.label}` ? faCheck : faCopy} 
                                  className={`w-3 h-3 ${copiedField === `${card.title}-${item.label}` ? 'text-green-500' : ''}`} 
                                />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className={`transition-all duration-500 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              {/* Section Description détaillée */}
              <div className="bg-white dark:bg-gray-800 shadow-lg overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 mb-8">
                <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <FontAwesomeIcon icon={faInfoCircle} className="mr-3 text-blue-500" />
                    Description détaillée
                  </h3>
                </div>
                <div className="px-6 py-8">
                  {school.description ? (
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed text-base">
                        {school.description}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FontAwesomeIcon icon={faInfoCircle} className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 italic text-lg">
                        Aucune description fournie pour cet établissement.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className={`transition-all duration-500 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <div className="bg-white dark:bg-gray-800 shadow-lg overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 mb-8">
                <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <FontAwesomeIcon icon={faChartBar} className="mr-3 text-green-500" />
                    Statistiques et métriques
                  </h3>
                </div>
                <div className="px-6 py-8">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <FontAwesomeIcon icon={faUsers} className="h-8 w-8 text-blue-500 mb-3" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {school.capacity ? school.capacity.toLocaleString() : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Capacité d'accueil</div>
                    </div>
                    <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <FontAwesomeIcon icon={faCalendarAlt} className="h-8 w-8 text-green-500 mb-3" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {school.created_at ? new Date().getFullYear() - new Date(school.created_at).getFullYear() : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Années d'existence</div>
                    </div>
                    <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <FontAwesomeIcon icon={faAward} className="h-8 w-8 text-purple-500 mb-3" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {school.type ? School.getTypeOptions()[school.type] : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Type d'établissement</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmation de suppression améliorée */}
      {showDeleteConfirm && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-900 opacity-75 backdrop-blur-sm"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border-2 border-red-200 dark:border-red-800">
              <div>
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                  <FontAwesomeIcon icon={faTrash} className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    Supprimer l'établissement
                  </h3>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-4">
                    <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                      {school.name}
                    </p>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Êtes-vous sûr de vouloir supprimer cet établissement ? Cette action est <strong>irréversible</strong> et toutes les données associées seront perdues.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="w-full inline-flex justify-center items-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-3 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="w-full inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-base font-medium text-white hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                  onClick={handleDelete}
                >
                  <FontAwesomeIcon icon={faTrash} className="mr-2 h-4 w-4" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}