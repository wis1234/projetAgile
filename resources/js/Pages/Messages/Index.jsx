import React, { useEffect, useState } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { Link, usePage } from '@inertiajs/react';
import ActionButton from '../../Components/ActionButton';
import { FaSearch } from 'react-icons/fa';

export default function Index({ messages, filters }) {
    const { flash = {} } = usePage().props;
    const [search, setSearch] = React.useState(filters?.search || '');
    const [notification, setNotification] = useState(flash.success || '');
    const [notificationType, setNotificationType] = useState('success');

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        Inertia.get(route('messages.index'), { search }, { preserveState: true, replace: true });
    };

    useEffect(() => {
        if (window.Echo) {
            const channel = window.Echo.channel('messages');
            channel.listen('MessageUpdated', (e) => {
                setNotification('Un message a été modifié (ou ajouté/supprimé)');
                setNotificationType('success');
                Inertia.reload({ only: ['messages'] });
            });
            return () => {
                channel.stopListening('MessageUpdated');
            };
        }
    }, []);

    useEffect(() => {
        if (flash.success) {
            setNotification(flash.success);
            setNotificationType('success');
        }
    }, [flash.success]);

    return (
        <div className="flex flex-col h-full w-full">
            {/* Notification toast temps réel */}
            {notification && (
                <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded shadow-lg text-white transition-all ${notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {notification}
                    <button onClick={() => setNotification('')} className="ml-4 text-white font-bold">&times;</button>
                </div>
            )}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2 md:gap-0">
                <h1 className="text-2xl font-bold">Messages</h1>
                <Link href={route('messages.create')}>
                    <ActionButton variant="primary">Nouveau message</ActionButton>
                </Link>
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 mb-4">
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher..."
                        className="border px-3 py-2 rounded w-full md:w-64 mb-0"
                    />
                    <button type="submit" className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded shadow font-semibold">
                        <FaSearch />
                    </button>
                </form>
            </div>
            {flash.success && <div className="alert alert-success mb-4">{flash.success}</div>}
            <div className="overflow-x-auto">
                <table className="table w-full">
                    <thead>
                        <tr>
                            <th>Contenu</th>
                            <th>Projet</th>
                            <th>Utilisateur</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {messages.data.map(message => (
                            <tr key={message.id}>
                                <td>{message.content}</td>
                                <td>{message.project?.name || '-'}</td>
                                <td>{message.user?.name || '-'}</td>
                                <td>{new Date(message.created_at).toLocaleDateString()}</td>
                                <td className="flex gap-2">
                                    <Link href={route('messages.show', message.id)}>
                                        <ActionButton variant="info" size="sm">Voir</ActionButton>
                                    </Link>
                                    <Link href={route('messages.edit', message.id)}>
                                        <ActionButton variant="warning" size="sm">Éditer</ActionButton>
                                    </Link>
                                    <ActionButton variant="danger" size="sm" onClick={() => Inertia.delete(route('messages.destroy', message.id))}>Supprimer</ActionButton>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 flex justify-center">
                {/* Pagination */}
                {messages.links && messages.links.map((link, i) => (
                    <button
                        key={i}
                        className={`btn btn-sm mx-1 ${link.active ? 'btn-primary' : 'btn-ghost'}`}
                        disabled={!link.url}
                        onClick={() => link.url && Inertia.get(link.url)}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </div>
        </div>
    );
} 