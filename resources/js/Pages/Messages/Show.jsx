import React from 'react';
import { Link, usePage } from '@inertiajs/react';

export default function Show({ message }) {
    const { flash } = usePage().props;
    return (
        <div className="flex flex-col h-full w-full">
            <div className="max-w-xl w-full mx-auto">
                <h1 className="text-2xl font-bold mb-4">Détail du message</h1>
                {flash.success && <div className="alert alert-success mb-4">{flash.success}</div>}
                <div className="mb-4">
                    <div><span className="font-semibold">Contenu :</span> {message.content}</div>
                    <div><span className="font-semibold">Projet :</span> {message.project?.name || '-'}</div>
                    <div><span className="font-semibold">Utilisateur :</span> {message.user?.name || '-'}</div>
                    <div><span className="font-semibold">Créé le :</span> {new Date(message.created_at).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                    <Link href={route('messages.edit', message.id)} className="btn btn-warning">Éditer</Link>
                    <Link href={route('messages.index')} className="btn btn-secondary">Retour à la liste</Link>
                </div>
            </div>
        </div>
    );
} 