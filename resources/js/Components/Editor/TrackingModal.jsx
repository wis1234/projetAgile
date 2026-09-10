import React, { useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
    XMarkIcon, CheckIcon, ClockIcon, ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import { FaCheck, FaTimes, FaPlus, FaMinus, FaPaintBrush } from 'react-icons/fa';

/**
 * TrackingModal — refonte.
 *
 * Props attendues (à brancher sur l'extension TipTap `track-changes` /
 * l'endpoint suivi côté back — le contrat exact de cette extension n'a pas
 * été fourni, donc la forme ci-dessous est une proposition à ajuster) :
 *
 *  - users:        [{ id, name, email }]
 *  - changes:      [{
 *                     id, userId, type: 'insertion' | 'deletion' | 'formatting',
 *                     excerpt: string,       // extrait de texte concerné
 *                     createdAt: string,     // ISO
 *                     status: 'pending' | 'accepted' | 'rejected',
 *                   }]
 *  - onAccept(changeId), onReject(changeId)  // actions sur une modification
 *  - onSelectUser(userId), selectedUserId    // filtre par auteur (optionnel)
 */

const USER_COLORS = [
    { dot: 'bg-blue-400',   chip: 'bg-blue-50 text-blue-700 border-blue-100' },
    { dot: 'bg-emerald-400',chip: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    { dot: 'bg-amber-400',  chip: 'bg-amber-50 text-amber-700 border-amber-100' },
    { dot: 'bg-violet-400', chip: 'bg-violet-50 text-violet-700 border-violet-100' },
    { dot: 'bg-pink-400',   chip: 'bg-pink-50 text-pink-700 border-pink-100' },
    { dot: 'bg-indigo-400', chip: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
];
const colorFor = (userId) => USER_COLORS[Number(userId) % USER_COLORS.length];

const TYPE_META = {
    insertion:  { icon: <FaPlus className="text-[9px]" />,        label: 'Ajout',       badge: 'bg-emerald-50 text-emerald-600' },
    deletion:   { icon: <FaMinus className="text-[9px]" />,       label: 'Suppression', badge: 'bg-red-50 text-red-600' },
    formatting: { icon: <FaPaintBrush className="text-[9px]" />,  label: 'Mise en forme', badge: 'bg-sky-50 text-sky-600' },
};

const fmtDateTime = (d) => d
    ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '—';

const groupByDay = (changes) => {
    const groups = {};
    changes.forEach((c) => {
        const key = c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Sans date';
        groups[key] = groups[key] || [];
        groups[key].push(c);
    });
    return groups;
};

export default function TrackingModal({
    isOpen, onClose, users = [], changes = [],
    onSelectUser, selectedUserId,
    onAccept, onReject,
}) {
    const [filterUserId, setFilterUserId] = useState(selectedUserId ?? null);

    const visibleChanges = useMemo(() => {
        const list = filterUserId ? changes.filter(c => c.userId === filterUserId) : changes;
        return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [changes, filterUserId]);

    const pendingCount = changes.filter(c => c.status === 'pending').length;
    const grouped = groupByDay(visibleChanges);

    const handleSelectUser = (id) => {
        const next = filterUserId === id ? null : id;
        setFilterUserId(next);
        onSelectUser?.(next);
    };

    return (
        <Transition appear show={isOpen} as={React.Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={React.Fragment}
                    enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={React.Fragment}
                            enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                            leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all flex flex-col max-h-[85vh]">

                                {/* Header */}
                                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                                    <div>
                                        <Dialog.Title className="text-[15px] font-semibold text-[#1E2129]">
                                            Suivi des modifications
                                        </Dialog.Title>
                                        <p className="text-[12px] text-slate-400 mt-0.5">
                                            {pendingCount > 0
                                                ? `${pendingCount} modification${pendingCount > 1 ? 's' : ''} en attente`
                                                : 'Toutes les modifications sont traitées'}
                                        </p>
                                    </div>
                                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Filtre par auteur */}
                                {users.length > 0 && (
                                    <div className="flex items-center gap-1.5 px-5 py-3 border-b border-slate-100 overflow-x-auto">
                                        <button
                                            onClick={() => handleSelectUser(null)}
                                            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11.5px] font-medium border transition-colors
                                                ${!filterUserId ? 'bg-[#1E2129] text-white border-[#1E2129]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            Tous
                                        </button>
                                        {users.map((user) => {
                                            const c = colorFor(user.id);
                                            const active = filterUserId === user.id;
                                            return (
                                                <button
                                                    key={user.id}
                                                    onClick={() => handleSelectUser(user.id)}
                                                    className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-medium border transition-colors
                                                        ${active ? c.chip + ' border-current/20' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                                                    {user.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Timeline */}
                                <div className="flex-1 overflow-y-auto">
                                    {visibleChanges.length === 0 && (
                                        <div className="text-center py-14 text-[13px] text-slate-400">
                                            Aucune modification à afficher
                                        </div>
                                    )}

                                    {Object.entries(grouped).map(([day, dayChanges]) => (
                                        <div key={day}>
                                            <div className="sticky top-0 px-5 py-1.5 bg-slate-50/90 backdrop-blur border-y border-slate-100 text-[11px] font-medium text-slate-500">
                                                {day}
                                            </div>
                                            <div className="relative">
                                                {dayChanges.map((change, i) => {
                                                    const user = users.find(u => u.id === change.userId);
                                                    const color = colorFor(change.userId);
                                                    const type = TYPE_META[change.type] ?? TYPE_META.formatting;
                                                    const isLast = i === dayChanges.length - 1;
                                                    return (
                                                        <div key={change.id} className="relative flex gap-3 px-5 py-3">
                                                            {/* Timeline rail */}
                                                            <div className="flex flex-col items-center">
                                                                <span className={`w-2.5 h-2.5 rounded-full ring-4 ring-white ${color.dot}`} />
                                                                {!isLast && <span className="w-px flex-1 bg-slate-100 mt-1" />}
                                                            </div>

                                                            <div className="flex-1 min-w-0 pb-1">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="text-[12.5px] font-medium text-[#1E2129]">{user?.name ?? 'Utilisateur'}</span>
                                                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${type.badge}`}>
                                                                        {type.icon}{type.label}
                                                                    </span>
                                                                    <span className="flex items-center gap-1 text-[10.5px] text-slate-400 ml-auto">
                                                                        <ClockIcon className="h-3 w-3" />
                                                                        {fmtDateTime(change.createdAt)}
                                                                    </span>
                                                                </div>

                                                                {change.excerpt && (
                                                                    <p className="mt-1.5 text-[12px] leading-relaxed text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 italic">
                                                                        « {change.excerpt} »
                                                                    </p>
                                                                )}

                                                                {change.status === 'pending' ? (
                                                                    <div className="flex items-center gap-2 mt-2">
                                                                        <button
                                                                            onClick={() => onAccept?.(change.id)}
                                                                            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-medium hover:bg-emerald-100 transition-colors"
                                                                        >
                                                                            <FaCheck className="text-[9px]" /> Accepter
                                                                        </button>
                                                                        <button
                                                                            onClick={() => onReject?.(change.id)}
                                                                            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-[11px] font-medium hover:bg-red-100 transition-colors"
                                                                        >
                                                                            <FaTimes className="text-[9px]" /> Rejeter
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <span className={`inline-flex items-center gap-1 mt-2 text-[11px] font-medium
                                                                        ${change.status === 'accepted' ? 'text-emerald-600' : 'text-red-500'}`}>
                                                                        <CheckIcon className="h-3 w-3" />
                                                                        {change.status === 'accepted' ? 'Acceptée' : 'Rejetée'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}