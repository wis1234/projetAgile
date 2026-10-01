import React, { useEffect, useRef, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal';
import {
    FaUsers, FaPlus, FaSearch, FaTh, FaList, FaUserShield, FaUserTie, FaUser, FaProjectDiagram, FaCheckCircle, FaTrash, FaTimes,
} from 'react-icons/fa';
import { Avatar, Badge, Stat, EmptyState, GLOBAL_ROLES, fmtDate } from '@/Components/People/shared';

const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
const api = async (url, method, body) => {
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': csrf() },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || 'Une erreur est survenue');
    return data;
};

export default function Index({ users, filters = {}, roles = [], auth, stats = null }) {
    const { flash = {} } = usePage().props;
    const canAssignRole = !!(auth?.can_assign_role);
    const canCreate = auth?.role === 'admin';
    const [search, setSearch] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || '');
    const [view, setView] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'cards' : 'table'));
    const [toast, setToast] = useState(flash.success ? { type: 'success', msg: flash.success } : null);
    const [busy, setBusy] = useState({});
    const [newRole, setNewRole] = useState('');
    const [roleToDelete, setRoleToDelete] = useState(null);
    const first = useRef(true);

    const notify = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3500); };

    // Recherche / filtre en direct (anti-rebond)
    useEffect(() => {
        if (first.current) { first.current = false; return; }
        const t = setTimeout(() => {
            router.get('/users', { search: search || undefined, role: roleFilter || undefined }, { preserveState: true, replace: true, only: ['users', 'filters'] });
        }, 350);
        return () => clearTimeout(t);
    }, [search, roleFilter]);

    const changeRole = async (u, role) => {
        setBusy((b) => ({ ...b, [u.id]: true }));
        try {
            await api(`/users/${u.id}/assign-role`, 'POST', { role });
            notify('success', `Rôle de ${u.name} mis à jour.`);
            router.reload({ only: ['users', 'stats'] });
        } catch (e) { notify('error', e.message); }
        setBusy((b) => ({ ...b, [u.id]: false }));
    };
    const createRole = async (e) => {
        e.preventDefault();
        try { await api('/roles/create', 'POST', { role: newRole.trim() }); setNewRole(''); notify('success', 'Rôle créé.'); router.reload({ only: ['roles'] }); }
        catch (err) { notify('error', err.message); }
    };
    const deleteRole = async () => {
        try { await api(`/roles/${roleToDelete.id}/delete`, 'DELETE'); notify('success', 'Rôle supprimé.'); router.reload({ only: ['roles'] }); }
        catch (err) { notify('error', err.message); }
        setRoleToDelete(null);
    };

    const rows = users?.data || [];
    const links = users?.links || [];
    const roleOptions = ['admin', 'manager', 'member', 'developer', 'candidate', 'user'];

    const RoleCell = ({ u }) => canAssignRole ? (
        <select value={u.role} disabled={busy[u.id]} onChange={(e) => changeRole(u, e.target.value)} onClick={(e) => e.stopPropagation()}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
            {roleOptions.map((r) => <option key={r} value={r}>{GLOBAL_ROLES[r].label}</option>)}
        </select>
    ) : <Badge cfg={GLOBAL_ROLES[u.role] || GLOBAL_ROLES.user} />;

    const open = (u) => router.get(`/users/${u.id}`);

    return (
        <div className="min-h-screen bg-slate-50 pb-16 dark:bg-slate-900">
            <Head title="Utilisateurs" />
            <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Utilisateurs</h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{users?.total ?? rows.length} personne(s){filters.search || filters.role ? ' trouvée(s)' : ''}</p>
                    </div>
                    {canCreate && (
                        <Link href="/users/create" className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                            <FaPlus /> Nouvel utilisateur
                        </Link>
                    )}
                </div>

                {toast && (
                    <div role="status" className={`mt-4 flex items-center justify-between rounded-lg border p-3 text-sm ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200' : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200'}`}>
                        {toast.msg}<button onClick={() => setToast(null)} aria-label="Fermer"><FaTimes /></button>
                    </div>
                )}

                {stats && (
                    <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <Stat label="Total" value={stats.total_users} tone="text-blue-600 dark:text-blue-400" />
                        <Stat label="Administrateurs" value={stats.admins_count} tone="text-amber-600" />
                        <Stat label="Managers" value={stats.managers_count} tone="text-purple-600" />
                        <Stat label="Membres" value={stats.members_count} />
                    </div>
                )}

                {/* Barre d'outils */}
                <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:flex-row md:items-center">
                    <div className="relative flex-1">
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom ou e-mail…" aria-label="Rechercher"
                            className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-100 md:py-2.5 md:text-sm" />
                    </div>
                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} aria-label="Filtrer par rôle"
                        className="rounded-lg border border-slate-300 bg-white px-3 py-3 text-base dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-100 md:py-2.5 md:text-sm">
                        <option value="">Tous les rôles</option>
                        {roleOptions.map((r) => <option key={r} value={r}>{GLOBAL_ROLES[r].label}</option>)}
                    </select>
                    <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-700">
                        {[['table', FaList, 'Tableau'], ['cards', FaTh, 'Cartes']].map(([k, Icon, l]) => (
                            <button key={k} onClick={() => setView(k)} aria-pressed={view === k}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${view === k ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-600 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'}`}>
                                <Icon className="text-xs" /> {l}
                            </button>
                        ))}
                    </div>
                </div>

                {rows.length === 0 ? (
                    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
                        <EmptyState icon={FaUsers} title="Aucun utilisateur trouvé" text="Modifiez votre recherche ou vos filtres." />
                    </div>
                ) : view === 'table' ? (
                    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Personne</th>
                                        <th className="px-4 py-3 font-semibold">Poste</th>
                                        <th className="px-4 py-3 font-semibold">Rôle</th>
                                        <th className="px-4 py-3 text-center font-semibold">Projets</th>
                                        <th className="px-4 py-3 font-semibold">Inscrit le</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/70">
                                    {rows.map((u) => (
                                        <tr key={u.id} onClick={() => open(u)} className="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar name={u.name} src={u.profile_photo_url} size="md" />
                                                    <div className="min-w-0">
                                                        <p className="flex items-center gap-1.5 truncate font-semibold text-slate-900 dark:text-white">
                                                            {u.name}{u.verified && <FaCheckCircle className="text-xs text-emerald-500" title="E-mail vérifié" />}
                                                        </p>
                                                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{[u.job_title, u.company].filter(Boolean).join(' · ') || '—'}</td>
                                            <td className="px-4 py-3"><RoleCell u={u} /></td>
                                            <td className="px-4 py-3 text-center tabular-nums text-slate-700 dark:text-slate-200">{u.projects_count}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">{fmtDate(u.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {rows.map((u) => (
                            <article key={u.id} onClick={() => open(u)} className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                                <div className="flex items-start gap-3">
                                    <Avatar name={u.name} src={u.profile_photo_url} size="lg" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold text-slate-900 dark:text-white">{u.name}</p>
                                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                                        {(u.job_title || u.company) && <p className="mt-0.5 truncate text-xs text-slate-600 dark:text-slate-300">{[u.job_title, u.company].filter(Boolean).join(' · ')}</p>}
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between gap-2">
                                    <RoleCell u={u} />
                                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><FaProjectDiagram /> {u.projects_count} projet(s)</span>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {links.length > 3 && (
                    <nav className="mt-6 flex flex-wrap justify-center gap-1" aria-label="Pagination">
                        {links.map((l, i) => (
                            <button key={i} disabled={!l.url || l.active} onClick={() => l.url && router.get(l.url, {}, { preserveState: true, preserveScroll: false })}
                                dangerouslySetInnerHTML={{ __html: l.label }}
                                className={`min-w-[2.5rem] rounded-lg px-3 py-2 text-sm ${l.active ? 'bg-blue-600 font-semibold text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'}`} />
                        ))}
                    </nav>
                )}

                {canAssignRole && (
                    <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5">
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Rôles de la plateforme</h2>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {roles.map((r) => (
                                <span key={r.id} className="inline-flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                                    {r.name}
                                    {!['admin', 'user'].includes(r.name) && (
                                        <button onClick={() => setRoleToDelete(r)} aria-label={`Supprimer ${r.name}`} className="rounded-full p-1 text-slate-400 hover:bg-red-100 hover:text-red-600"><FaTrash className="text-[10px]" /></button>
                                    )}
                                </span>
                            ))}
                        </div>
                        <form onSubmit={createRole} className="mt-4 flex gap-2">
                            <input value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="Nouveau rôle" required
                                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-100 sm:text-sm" />
                            <button className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Créer</button>
                        </form>
                    </section>
                )}
            </div>

            <Modal show={!!roleToDelete} onClose={() => setRoleToDelete(null)} maxWidth="md">
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Supprimer le rôle « {roleToDelete?.name} » ?</h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Impossible tant que des utilisateurs l'utilisent.</p>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={() => setRoleToDelete(null)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold dark:border-slate-600 dark:text-slate-200">Annuler</button>
                        <button onClick={deleteRole} className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700">Supprimer</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

Index.layout = (page) => <AdminLayout children={page} />;
