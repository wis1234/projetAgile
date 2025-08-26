import React, { useState, useEffect } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { Link, usePage, router } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { FaFileAlt, FaPlus, FaSearch, FaDownload, FaTable, FaTh, FaImage, FaFilePdf, FaFileWord, FaFileExcel, FaFileCode, FaClock, FaDropbox, FaProjectDiagram } from 'react-icons/fa';

export default function Index({ files, filters }) {
    const { flash = {} } = usePage().props;
    const [search, setSearch] = useState(filters?.search || '');
    const [notification, setNotification] = useState(flash.success || '');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [viewMode, setViewMode] = useState('cards');
    
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        router.get('/files', { search }, { preserveState: true, replace: true });
    };

    const handleRowClick = (fileId) => {
        router.visit(`/files/${fileId}`);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedFiles(files.data.map(f => f.id));
        } else {
            setSelectedFiles([]);
        }
    };
    const handleSelectFile = (id) => {
        setSelectedFiles(prev => prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]);
    };
    const handleBulkDownload = async () => {
        if (selectedFiles.length === 0) return;
        try {
            const response = await axios.post(route('files.downloadMultiple'), { ids: selectedFiles }, {
                responseType: 'blob',
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            const blob = new Blob([response.data], { type: 'application/zip' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'fichiers_selectionnes.zip';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 100);
        } catch (e) {
            alert('Erreur lors du téléchargement groupé');
        }
    };

    useEffect(() => {
        if (flash.success) {
            setNotification(flash.success);
        }
    }, [flash.success]);

    const getFileIcon = (fileType) => {
        if (!fileType) return <FaFileAlt className="text-gray-400 text-xl" />;
        if (fileType.startsWith('image/')) return <FaImage className="text-pink-500 text-xl" />;
        if (fileType.includes('pdf')) return <FaFilePdf className="text-red-500 text-xl" />;
        if (fileType.includes('word')) return <FaFileWord className="text-blue-500 text-xl" />;
        if (fileType.includes('excel')) return <FaFileExcel className="text-green-500 text-xl" />;
        if (fileType.includes('html')) return <FaFileCode className="text-orange-500 text-xl" />;
        return <FaFileAlt className="text-gray-400 text-xl" />;
    };

    const truncateFileType = (fileType) => {
        if (!fileType) return 'Inconnu';
        const mainType = fileType.split('(')[0].trim();
        return mainType.length > 15 ? `${mainType.substring(0, 12)}...` : mainType;
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 p-4 sm:p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <FaFileAlt className="text-blue-600 dark:text-blue-300 text-2xl" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fichiers</h1>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                        <div className="inline-flex rounded-md shadow-sm border border-gray-300 dark:border-gray-600">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-l-md ${viewMode === 'table' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200'}`}
                            >
                                <FaTable className="inline mr-1" /> Tableau
                            </button>
                            <button
                                onClick={() => setViewMode('cards')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-r-md ${viewMode === 'cards' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200'}`}
                            >
                                <FaTh className="inline mr-1" /> Cartes
                            </button>
                        </div>
                        
                        <Link 
                            href="/files/create" 
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <FaPlus /> Nouveau fichier
                        </Link>
                    </div>
                </div>
                
                {/* Search */}
                <form onSubmit={handleSearchSubmit} className="max-w-xl">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Rechercher des fichiers..."
                        />
                    </div>
                </form>
            </div>

            {/* No Results Message */}
            {files.data.length === 0 && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
                    <FaFileAlt className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                        Aucun fichier trouvé
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {search ? 'Aucun fichier ne correspond à votre recherche.' : 'Commencez par ajouter votre premier fichier.'}
                    </p>
                    <div className="mt-6">
                        <Link
                            href="/files/create"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <FaPlus className="mr-2 h-4 w-4" />
                            Nouveau fichier
                        </Link>
                    </div>
                </div>
            )}

            {/* Content */}
            {files.data.length > 0 && (
                viewMode === 'table' ? (
                    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
                        <div className="overflow-x-auto w-full">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Nom
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Projet
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Taille
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Dropbox
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {files.data.map((file) => (
                                        <tr 
                                            key={file.id} 
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 ease-in-out cursor-pointer transform hover:-translate-y-0.5 hover:shadow-md"
                                            onClick={() => handleRowClick(file.id)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0">
                                                        {getFileIcon(file.type)}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {file.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            {truncateFileType(file.type)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {file.project?.name || '-'}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {file.user?.name || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {(file.size / 1024).toFixed(2)} KB
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center">
                                                    <FaClock className="mr-1 text-gray-400" />
                                                    {new Date(file.created_at).toLocaleDateString('fr-FR')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {file.dropbox_path && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                        <FaDropbox className="mr-1" /> Dropbox
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {files.data.map((file) => (
                            <div 
                                key={file.id} 
                                className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-700 cursor-pointer transform hover:-translate-y-0.5"
                                onClick={() => handleRowClick(file.id)}
                            >
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                            {getFileIcon(file.type)}
                                        </div>
                                        {file.dropbox_path && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                <FaDropbox className="mr-1" /> Dropbox
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{file.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                                        {truncateFileType(file.type)}
                                    </p>
                                    {file.project && (
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                                            <FaProjectDiagram className="mr-1" />
                                            <span>{file.project.name}</span>
                                            {file.project_is_muted && (
                                                <span className="ml-2 px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full flex-shrink-0">
                                                    Sourdine
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    
                                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                                            <span>Taille: {(file.size / 1024).toFixed(2)} KB</span>
                                            <span className="flex items-center">
                                                <FaClock className="mr-1" />
                                                {new Date(file.created_at).toLocaleDateString('fr-FR')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* Pagination */}
            {files.data.length > 0 && files.links.length > 3 && (
                <div className="mt-4">
                    <div className="flex flex-wrap -mb-1">
                        {files.links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                className={`mr-1 mb-1 px-4 py-2 text-sm rounded ${link.active ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'} ${!link.url ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Notification */}
            {notification && (
                <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg">
                    {notification}
                </div>
            )}
        </div>
    );
}

Index.layout = page => <AdminLayout children={page} />;