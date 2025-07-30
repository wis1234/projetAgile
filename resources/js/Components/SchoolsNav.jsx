import React from 'react';
import { Link } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faList, 
    faPlus, 
    faUsers, 
    faCog,
    faSchool
} from '@fortawesome/free-solid-svg-icons';

export default function SchoolsNav({ activeTab = 'index' }) {
    return (
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-4" aria-label="Navigation des écoles">
                <Link
                    href="/schools"
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-t-lg ${
                        activeTab === 'index'
                            ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                >
                    <FontAwesomeIcon icon={faList} className="mr-2" />
                    Liste des écoles
                </Link>
                
                <Link
                    href="/schools/create"
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-t-lg ${
                        activeTab === 'create'
                            ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Ajouter une école
                </Link>
                
                {activeTab === 'show' || activeTab === 'edit' ? (
                    <>
                        <Link
                            href={`/schools/${window.location.pathname.split('/')[2]}`}
                            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-t-lg ${
                                activeTab === 'show'
                                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            <FontAwesomeIcon icon={faSchool} className="mr-2" />
                            Détails
                        </Link>
                        
                        <Link
                            href={`/schools/${window.location.pathname.split('/')[2]}/edit`}
                            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-t-lg ${
                                activeTab === 'edit'
                                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            <FontAwesomeIcon icon={faCog} className="mr-2" />
                            Modifier
                        </Link>
                        
                        <Link
                            href={`/schools/${window.location.pathname.split('/')[2]}/hosts`}
                            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-t-lg ${
                                activeTab === 'admins'
                                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            <FontAwesomeIcon icon={faUsers} className="mr-2" />
                            Administrateurs
                        </Link>
                    </>
                ) : null}
            </nav>
        </div>
    );
}
