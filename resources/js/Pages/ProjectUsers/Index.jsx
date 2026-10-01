import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    FaUsers, FaUserPlus, FaSearch, FaProjectDiagram, FaCrown, FaTimes, FaTh, FaList, FaSort, FaSortUp, FaSortDown,
    FaEnvelope, FaArrowRight, FaCheckCircle, FaExclamationTriangle,
} from 'react-icons/fa';
import { Avatar, Badge, EmptyState, PROJECT_ROLES, fmtDate } from '@/Components/People/shared';

const selectCls = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-100 md:py-2.5 md:text-sm';

function HeroStat({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur ring-1 ring-white/15">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15"><Icon /></span>
            <div className="min-w-0">
                <p className="text-2xl font-bold leading-none tabular-nums">{value ?? 0}</p>
                <p className="mt-1 truncate text-xs text-blue-100">{label}</p>
            </div>
        </div>
    );
}

function MemberCard({ m }) {
    const projects = m.common_projects || [];
    const roles = [...new Set(projects.map((p) => p.role))];
    const contact = [m.job_title, m.company].filter(Boolean).join(' · ');
    return (
        <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-500/50">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600" />
            <div className="flex flex-1 flex-col p-5">
                {/* Identité */}
                <div className="flex items-start gap-4">
                    <Avatar name={m.name} src={m.avatar} size="xl" className="!h-16 !w-16 shrink-0 !rounded-2xl ring-2 ring-white shadow-md dark:ring-slate-700" />
                    <div className="min-w-0 flex-1 pt-0.5">
                        <h3 className="truncate text-base font-bold text-slate-900 dark:text-white">{m.name}</h3>
                        <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">{contact || 'Membre'}</p>
                        <a href={`mailto:${m.email}`} onClick={(e) => e.stopPropagation()} className="mt-1.5 inline-flex max-w-full items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400">
                            <FaEnvelope className="shrink-0" /><span className="truncate">{m.email}</span>
                        </a>
                    </div>
                </div>

                {/* Rôles */}
                {roles.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                        {roles.map((r) => {
                            const cfg = PROJECT_ROLES[r] || PROJECT_ROLES.member;
                            return <Badge key={r} cfg={cfg}>{r === 'manager' && <FaCrown className="text-[10px]" />}{cfg.label}</Badge>;
                        })}
                    </div>
                )}

                {/* Projets communs */}
                <div className="mt-4 flex-1">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Projets en commun · {projects.length}</p>
                    <ul className="space-y-1.5">
                        {projects.slice(0, 3).map((p) => (
                            <li key={p.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-900/40">
                                <FaProjectDiagram className="shrink-0 text-xs text-blue-500" />
                                <span className="min-w-0 flex-1 truncate font-medium text-slate-700 dark:text-slate-200">{p.name}</span>
                                {p.role === 'manager' && <FaCrown className="shrink-0 text-xs text-amber-500" title="Chef de projet" />}
                            </li>
                        ))}
                        {projects.length > 3 && <li className="px-1 text-xs font-medium text-slate-500">+ {projects.length - 3} autre(s) projet(s)</li>}
                    </ul>
                </div>

                {/* Pied */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-700/70">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Inscrit le {fmtDate(m.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <Link href={`/users/${m.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/10">
                        Voir le profil <FaArrowRight className="text-xs transition group-hover:translate-x-0.5" />
                    </Link>
                </div>
            </div>
        </article>
    );
}

function SortTh({ label, field, filters, onSort, className = '' }) {
    const active = filters.sort_by === field;
    const Icon = active ? (filters.sort_dir === 'desc' ? FaSortDown : FaSortUp) : FaSort;
    return (
        <th className={`px-5 py-3 text-left ${className}`}>
            <button type="button" onClick={() => onSort(field)} className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-blue-600 dark:text-slate-400">
                {label} <Icon className={active ? 'text-blue-600' : 'opacity-40'} />
            </button>
        </th>
    );
}

export default function Index({ members = {}, filters: initial = {}, globalStats = {}, projectsList = [], allowedRoles = [] }) {
    const { flash = {} } = usePage().props;
    const [filters, setFilters] = useState(initial);
    const [search, setSearch] = useState(initial.search || '');
    const [view, setView] = useState('cards');
    const first = useRef(true);

    const rows = members.data || [];
    const total = members.total ?? rows.length;
    const links = members.links || [];

    // Application des filtres (anti-rebond) ; la recherche alimente les filtres
    useEffect(() => {
        const t = setTimeout(() => setFilters((f) => (f.search === (search || undefined) ? f : { ...f, search: search || undefined })), 350);
        return () => clearTimeout(t);
    }, [search]);
    useEffect(() => {
        if (first.current) { first.current = false; return; }
        const clean = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
        router.get(window.location.pathname, clean, { preserveState: true, replace: true, only: ['members', 'filters', 'globalStats'] });
    }, [filters]);

    const set = (k, v) => setFilters((f) => ({ ...f, [k]: v || undefined }));
    const sort = (field) => setFilters((f) => ({ ...f, sort_by: field, sort_dir: f.sort_by === field && f.sort_dir === 'asc' ? 'desc' : 'asc' }));
    const reset = () => { setSearch(''); setFilters({}); };

    const chips = useMemo(() => {
        const out = [];
        if (filters.search) out.push(['search', `« ${filters.search} »`]);
        if (filters.role) out.push(['role', PROJECT_ROLES[filters.role]?.label || filters.role]);
        if (filters.project_id) out.push(['project_id', projectsList.find((p) => String(p.id) === String(filters.project_id))?.name || 'Projet']);
        if (filters.project_status) out.push(['project_status', filters.project_status]);
        return out;
    }, [filters, projectsList]);
    const statuses = useMemo(() => [...new Set(projectsList.map((p) => p.status).filter(Boolean))], [projectsList]);

    return (
        <div className="min-h-screen bg-slate-50 pb-16 dark:bg-slate-900">
            <Head title="Membres des projets" />

            {/* En-tête */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700">
                <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
                <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-indigo-400/20" />
                <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-white">
                            <p className="text-xs font-semibold uppercase tracking-widest text-blue-100/80">Équipes</p>
                            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Membres des projets</h1>
                            <p className="mt-1 text-sm text-blue-100">Les personnes avec qui vous collaborez, projet par projet.</p>
                        </div>
                        <Link href={route('project-users.create')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-lg transition hover:bg-blue-50">
                            <FaUserPlus /> Ajouter un membre
                        </Link>
                    </div>
                    <div className="mt-6 grid grid-cols-1 gap-3 text-white sm:grid-cols-3">
                        <HeroStat icon={FaUsers} label="Membres uniques" value={globalStats.total_members} />
                        <HeroStat icon={FaProjectDiagram} label="Projets" value={globalStats.total_projects} />
                        <HeroStat icon={FaCrown} label="Chefs de projet" value={globalStats.total_roles?.manager || 0} />
                    </div>
                </div>
            </div>

            <div className="relative z-10 mx-auto -mt-10 max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">
                {flash.success && <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"><FaCheckCircle /> {flash.success}</p>}
                {flash.error && <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200"><FaExclamationTriangle /> {flash.error}</p>}

                {/* Barre de filtres */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
                        <div className="relative">
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, e-mail, poste, entreprise…" aria-label="Rechercher"
                                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-100 md:py-2.5 md:text-sm" />
                        </div>
                        <select value={filters.role || ''} onChange={(e) => set('role', e.target.value)} aria-label="Rôle" className={selectCls}>
                            <option value="">Tous les rôles</option>
                            {allowedRoles.map((r) => <option key={r} value={r}>{PROJECT_ROLES[r]?.label || r}</option>)}
                        </select>
                        <select value={filters.project_id || ''} onChange={(e) => set('project_id', e.target.value)} aria-label="Projet" className={selectCls}>
                            <option value="">Tous les projets</option>
                            {projectsList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <select value={filters.project_status || ''} onChange={(e) => set('project_status', e.target.value)} aria-label="Statut du projet" className={selectCls}>
                            <option value="">Tous les statuts</option>
                            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{total} membre{total > 1 ? 's' : ''}</span>
                            {chips.map(([k, label]) => (
                                <button key={k} type="button" onClick={() => { if (k === 'search') setSearch(''); set(k, ''); }}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300">
                                    {label} <FaTimes className="text-[10px]" />
                                </button>
                            ))}
                            {chips.length > 0 && <button type="button" onClick={reset} className="text-xs font-medium text-slate-500 underline hover:text-slate-700 dark:text-slate-400">Tout effacer</button>}
                        </div>
                        <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-700" role="group" aria-label="Affichage">
                            {[['cards', FaTh, 'Cartes'], ['table', FaList, 'Tableau']].map(([k, Icon, l]) => (
                                <button key={k} type="button" onClick={() => setView(k)} aria-pressed={view === k}
                                    className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${view === k ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-600 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'}`}>
                                    <Icon className="text-xs" /> <span className="hidden sm:inline">{l}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {rows.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
                        <EmptyState icon={FaUsers} title="Aucun membre trouvé" text="Essayez d'élargir votre recherche ou d'effacer les filtres." />
                    </div>
                ) : view === 'cards' ? (
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {rows.map((m) => <MemberCard key={m.id} m={m} />)}
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-900/40">
                                    <tr>
                                        <SortTh label="Membre" field="name" filters={filters} onSort={sort} />
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Rôles</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Projets en commun</th>
                                        <SortTh label="Inscrit le" field="created_at" filters={filters} onSort={sort} />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/70">
                                    {rows.map((m) => {
                                        const ps = m.common_projects || [];
                                        return (
                                            <tr key={m.id} onClick={() => router.get(`/users/${m.id}`)} className="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar name={m.name} src={m.avatar} size="md" />
                                                        <div className="min-w-0">
                                                            <p className="truncate font-semibold text-slate-900 dark:text-white">{m.name}</p>
                                                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{[m.job_title, m.company].filter(Boolean).join(' · ') || m.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex flex-wrap gap-1">
                                                        {[...new Set(ps.map((p) => p.role))].map((r) => <Badge key={r} cfg={PROJECT_ROLES[r] || PROJECT_ROLES.member} />)}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {ps.slice(0, 2).map((p) => <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-200"><FaProjectDiagram className="text-blue-500" />{p.name}</span>)}
                                                        {ps.length > 2 && <span className="text-xs text-slate-500">+{ps.length - 2}</span>}
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-3.5 text-slate-500 dark:text-slate-400">{fmtDate(m.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {links.length > 3 && (
                    <nav className="flex flex-wrap justify-center gap-1.5 pt-2" aria-label="Pagination">
                        {links.map((l, i) => (
                            <button key={i} disabled={!l.url || l.active} onClick={() => l.url && router.get(l.url, {}, { preserveState: true })}
                                dangerouslySetInnerHTML={{ __html: l.label }}
                                className={`min-w-[2.5rem] rounded-xl px-3 py-2 text-sm font-medium ${l.active ? 'bg-blue-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'}`} />
                        ))}
                    </nav>
                )}
            </div>
        </div>
    );
}

Index.layout = (page) => <AdminLayout children={page} />;
