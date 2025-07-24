import React, { useEffect, useState } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { Link, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { FaFileAlt, FaPlus, FaUser, FaProjectDiagram, FaClock, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaSearch, FaDownload } from 'react-icons/fa';
import ActionButton from '../../Components/ActionButton';
import axios from 'axios';

export default function Index({ files, filters }) {
    const { flash = {} } = usePage().props;
    const [search, setSearch] = useState(filters?.search || '');
    const [notification, setNotification] = React.useState(flash.success || '');
    const [notificationType, setNotificationType] = React.useState('success');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const allChecked = files.data.length > 0 && selectedFiles.length === files.data.length;
    const isIndeterminate = selectedFiles.length > 0 && selectedFiles.length < files.data.length;

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        Inertia.get('/files', { search }, { preserveState: true, replace: true });
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

    React.useEffect(() => {
        if (flash.success) {
            setNotification(flash.success);
            setNotificationType('success');
        }
    }, [flash.success]);

    return (
        <div className="flex flex-col w-full bg-white dark:bg-gray-900 rounded-none shadow-none p-0 m-0">
            <main className="flex-1 flex flex-col w-full bg-white dark:bg-gray-900 p-0 m-0">
                <div className="flex flex-col h-full w-full max-w-7xl mx-auto mt-14 pt-4 bg-white dark:bg-gray-900">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <FaFileAlt className="text-3xl text-blue-600" />
                            <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-200 tracking-tight">Fichiers</h1>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Rechercher un fichier..."
                                    className="border px-3 py-2 rounded w-full md:w-64 mb-0 focus:ring-2 focus:ring-blue-400"
                                />
                                <button type="submit" className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded shadow font-semibold">
                                    <FaSearch />
                                </button>
                            </form>
                            <Link href="/files/create" className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded font-semibold shadow whitespace-nowrap">
                                <FaPlus /> Nouveau fichier
                            </Link>
                            <button
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow font-semibold disabled:opacity-50"
                                disabled={selectedFiles.length === 0}
                                onClick={handleBulkDownload}
                                type="button"
                            >
                                <FaDownload /> Télécharger{selectedFiles.length > 1 ? ' (' + selectedFiles.length + ')' : ''}
                            </button>
                        </div>
                    </div>
                    {notification && (
                        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded shadow-lg text-white transition-all ${notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{notification}</div>
                    )}
                    <div className="overflow-x-auto rounded-lg shadow bg-white dark:bg-gray-800 mb-8">
                        <table className="min-w-full text-sm">
                            <thead className="sticky top-0 z-10 bg-gradient-to-r from-blue-100 to-blue-300 dark:from-blue-900 dark:to-blue-700 shadow">
                                <tr>
                                    <th className="p-2 md:p-3 text-center">
                                        <input
                                            type="checkbox"
                                            checked={allChecked}
                                            ref={el => { if (el) el.indeterminate = isIndeterminate; }}
                                            onChange={handleSelectAll}
                                            aria-label="Tout sélectionner"
                                        />
                                    </th>
                                    <th className="p-2 md:p-3 text-left font-bold">Type</th>
                                    <th className="p-2 md:p-3 text-left font-bold max-w-[120px] truncate">Nom</th>
                                    <th className="p-2 md:p-3 text-left font-bold max-w-[120px] truncate">Projet</th>
                                    <th className="p-2 md:p-3 text-left font-bold max-w-[120px] truncate">Utilisateur</th>
                                    <th className="p-2 md:p-3 text-left font-bold">Taille</th>
                                    <th className="p-2 md:p-3 text-left font-bold">Statut</th>
                                    <th className="p-2 md:p-3 text-left font-bold">Date</th>
                                    <th className="p-2 md:p-3 text-left font-bold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {files.data.map((file, idx) => {
                                    const isImage = file.type && file.type.startsWith('image/');
                                    const isPdf = file.type && file.type.includes('pdf');
                                    const isDoc = file.type && (file.type.includes('word') || file.type.includes('doc'));
                                    const isExcel = file.type && (file.type.includes('excel') || file.type.includes('spreadsheet'));
                                    const isHtml = file.type && file.type.includes('html');
                                    let icon = <FaFileAlt className="text-gray-400" />;
                                    if (isImage) icon = <FaFileAlt className="text-pink-400" />;
                                    else if (isPdf) icon = <FaFileAlt className="text-red-500" />;
                                    else if (isDoc) icon = <FaFileAlt className="text-blue-500" />;
                                    else if (isExcel) icon = <FaFileAlt className="text-green-500" />;
                                    else if (isHtml) icon = <FaFileAlt className="text-orange-500" />;
                                    let statusBadge = <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800"><FaHourglassHalf /> En attente</span>;
                                    if (file.status === 'validated') statusBadge = <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-100 text-green-800"><FaCheckCircle /> Validé</span>;
                                    if (file.status === 'rejected') statusBadge = <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-100 text-red-800"><FaTimesCircle /> Rejeté</span>;
                                    return (
                                        <tr
                                            key={file.id}
                                            className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800 cursor-pointer' : 'bg-blue-50 dark:bg-blue-900 cursor-pointer'}
                                            onClick={() => window.location.href = `/files/${file.id}`}
                                            tabIndex={0}
                                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') window.location.href = `/files/${file.id}`; }}
                                        >
                                            <td className="p-2 md:p-3 align-middle text-center" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedFiles.includes(file.id)}
                                                    onChange={() => handleSelectFile(file.id)}
                                                    aria-label={`Sélectionner ${file.name}`}
                                                />
                                            </td>
                                            <td className="p-2 md:p-3 align-middle">{icon}</td>
                                            <td className="p-2 md:p-3 align-middle font-semibold text-blue-800 dark:text-blue-200 max-w-[120px] truncate">{file.name}</td>
                                            <td className="p-2 md:p-3 align-middle max-w-[120px] truncate">{file.project?.name || '-'}</td>
                                            <td className="p-2 md:p-3 align-middle max-w-[120px] truncate">{file.user?.name || '-'}</td>
                                            <td className="p-2 md:p-3 align-middle"><span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 rounded text-xs font-mono">{file.size} o</span></td>
                                            <td className="p-2 md:p-3 align-middle">{statusBadge}</td>
                                            <td className="p-2 md:p-3 align-middle"><span className="inline-flex items-center gap-1"><FaClock className="text-gray-400" /> {new Date(file.created_at).toLocaleString()}</span></td>
                                            <td className="p-2 md:p-3 align-middle text-center" onClick={e => e.stopPropagation()}>
                                                <a
                                                    href={route('files.download', { file: file.id })}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    title="Télécharger le fichier"
                                                >
                                                    <FaDownload />
                                                </a>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-6 flex justify-center gap-2 mb-8">
                        {files.links && files.links.map((link, i) => (
                            <button
                                key={i}
                                className={`btn btn-sm rounded-full px-4 py-2 font-semibold shadow ${link.active ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-blue-700 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-800'}`}
                                disabled={!link.url}
                                onClick={() => link.url && Inertia.get(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

Index.layout = page => <AdminLayout children={page} />; 