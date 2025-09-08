import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FaArrowLeft, FaDownload, FaSearch, FaFilter, FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaFilePdf, FaFileWord, FaSpinner, FaFileExcel } from 'react-icons/fa';

export default function ApplicationsIndex({ recruitment, applications, filters: initialFilters = {} }) {
    const [search, setSearch] = useState(initialFilters.search || '');
    const [isLoading, setIsLoading] = useState(false);
    const { flash = {} } = usePage().props;
    const [notification, setNotification] = useState(flash.success || '');

    // Handle search input changes
    const handleSearchChange = (e) => {
        setSearch(e.target.value);
    };

    // Handle search form submission
    const handleSearchSubmit = (e) => {
        if (e) {
            e.preventDefault();
        }
        
        setIsLoading(true);
        
        const params = {};
        if (search) params.search = search;
        
        router.get(
            route('recruitment.applications.index', recruitment.id), 
            params, 
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['applications'],
                onFinish: () => setIsLoading(false)
            }
        );
    };

    // Handle reset filters
    const handleResetFilters = () => {
        setSearch('');
        setIsLoading(true);
        
        router.get(
            route('recruitment.applications.index', recruitment.id), 
            {}, 
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['applications'],
                onFinish: () => setIsLoading(false)
            }
        );
    };

    // Handle pagination
    const handlePagination = (url) => {
        if (!url) return;
        
        setIsLoading(true);
        
        // Extract page number from URL
        const page = new URL(url).searchParams.get('page');
        
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (page) params.append('page', page);
        
        router.get(
            `${route('recruitment.applications.index', recruitment.id)}?${params.toString()}`,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['applications'],
                onFinish: () => setIsLoading(false)
            }
        );
    };
    
    // Show notification from flash message
    useEffect(() => {
        if (flash.success) {
            setNotification(flash.success);
            const timer = setTimeout(() => setNotification(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [flash]);
    const getStatusBadge = (status) => {
        const statusClasses = {
            pending: 'bg-yellow-100 text-yellow-800',
            reviewed: 'bg-blue-100 text-blue-800',
            interviewed: 'bg-purple-100 text-purple-800',
            accepted: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
        };
        
        const statusLabels = {
            pending: 'En attente',
            reviewed: 'Examinée',
            interviewed: 'En entretien',
            accepted: 'Acceptée',
            rejected: 'Rejetée',
        };
        
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
                {statusLabels[status] || status}
            </span>
        );
    };

    const getFileIcon = (filename) => {
        if (!filename) return <FaFilePdf className="text-red-500" />;
        const ext = filename.split('.').pop().toLowerCase();
        return ext === 'pdf' ? 
            <FaFilePdf className="text-red-500" /> : 
            <FaFileWord className="text-blue-500" />;
    };

    return (
        <div className="min-h-screen bg-white">
        <AdminLayout>
            <Head title={`Candidatures - ${recruitment.title}`} />
            
            <div className="py-6 bg-white">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                                <div>
                                    <div className="flex items-center">
                                        <Link 
                                            href={route('recruitment.show', recruitment.id)}
                                            className="mr-4 text-gray-500 hover:text-gray-700"
                                        >
                                            <FaArrowLeft className="h-5 w-5" />
                                        </Link>
                                        <h2 className="text-2xl font-semibold text-gray-800">
                                            Candidatures pour : {recruitment.title}
                                        </h2>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {applications.total} candidature{applications.total !== 1 ? 's' : ''} reçue{applications.total !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                
                                <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                                    <form onSubmit={handleSearchSubmit} className="flex space-x-2 w-full sm:w-auto">
                                    <div className="relative flex-grow">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaSearch className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={handleSearchChange}
                                            placeholder="Rechercher par nom, email..."
                                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <>
                                                <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                                Recherche...
                                            </>
                                        ) : (
                                            <>
                                                <FaSearch className="-ml-1 mr-2 h-4 w-4" />
                                                Rechercher
                                            </>
                                        )}
                                    </button>
                                    
                                    {(search) && (
                                        <button
                                            type="button"
                                            onClick={handleResetFilters}
                                            disabled={isLoading}
                                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                        >
                                            Réinitialiser
                                        </button>
                                    )}
                                    </form>
                                    
                                    <a 
                                        href={route('recruitment.applications.export', recruitment.id)}
                                        className="inline-flex items-center justify-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition ease-in-out duration-150 whitespace-nowrap"
                                    >
                                        <FaFileExcel className="mr-2" />
                                        Exporter en Excel
                                    </a>
                                </div>
                            </div>
                            
                            {notification && (
                                <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 rounded">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-green-700">{notification}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                {isLoading && (
                                    <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
                                        <div className="flex flex-col items-center">
                                            <FaSpinner className="animate-spin h-8 w-8 text-blue-500 mb-2" />
                                            <p className="text-sm text-gray-500">Chargement en cours...</p>
                                        </div>
                                    </div>
                                )}
                                {applications.data.length > 0 ? (
                                    <ul className="divide-y divide-gray-200">
                                        {applications.data.map((application) => (
                                            <li key={application.id} className="hover:bg-gray-50">
                                                <Link 
                                                    href={route('recruitment.applications.show', [recruitment.id, application.id])}
                                                    className="block hover:bg-gray-50"
                                                >
                                                    <div className="px-4 py-4 sm:px-6">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center">
                                                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                                    <FaUser className="h-6 w-6 text-blue-600" />
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="text-sm font-medium text-blue-600">
                                                                        {application.first_name} {application.last_name}
                                                                    </div>
                                                                    <div className="flex items-center text-sm text-gray-500">
                                                                        <FaEnvelope className="mr-1.5 h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                                                                        <span className="truncate">{application.email}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="ml-2 flex-shrink-0 flex">
                                                                {getStatusBadge(application.status)}
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 sm:flex sm:justify-between">
                                                            <div className="sm:flex">
                                                                <div className="flex items-center text-sm text-gray-500">
                                                                    <FaPhone className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                                    {application.phone}
                                                                </div>
                                                                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                                                    <FaCalendarAlt className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                                    Postulé le {new Date(application.created_at).toLocaleDateString('fr-FR', {
                                                                        year: 'numeric',
                                                                        month: 'long',
                                                                        day: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </div>
                                                            </div>
                                                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                                <a 
                                                                    href={route('recruitment.applications.download', [recruitment.id, application.id])}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                                >
                                                                    <FaDownload className="mr-1.5 h-3 w-3" />
                                                                    Télécharger le CV
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-center py-12">
                                        <svg
                                            className="mx-auto h-12 w-12 text-gray-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            aria-hidden="true"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune candidature</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Aucune candidature n'a été soumise pour cette offre pour le moment.
                                        </p>
                                    </div>
                                )}
                            </div>
                            
                            {applications.data.length > 0 && (
                                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                                <div className="text-sm text-gray-500">
                                    Affichage <span className="font-medium">{applications.from}</span> à <span className="font-medium">{applications.to}</span> sur <span className="font-medium">{applications.total}</span> candidature{applications.total !== 1 ? 's' : ''}
                                </div>
                                
                                {applications.links.length > 3 && (
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                        {applications.links.map((link, index) => {
                                            const isActive = link.active;
                                            const isDisabled = !link.url;
                                            const buttonClass = `
                                                relative inline-flex items-center px-4 py-2 border text-sm font-medium
                                                ${isActive 
                                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600 cursor-default' 
                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                }
                                                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                            `;
                                            
                                            return (
                                                <Link
                                                    key={index}
                                                    href={link.url || '#'}
                                                    as="button"
                                                    disabled={isDisabled || isActive}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (link.url) {
                                                            handlePagination(link.url);
                                                        }
                                                    }}
                                                    className={buttonClass}
                                                    dangerouslySetInnerHTML={{ 
                                                        __html: link.label 
                                                            .replace('Previous', 'Précédent')
                                                            .replace('Next', 'Suivant')
                                                    }}
                                                />
                                            );
                                        })}
                                    </nav>
                                )}
                            </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
        </div>
    );
}
