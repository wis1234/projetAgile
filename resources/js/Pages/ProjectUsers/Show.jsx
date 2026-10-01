import React, { useMemo, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'react-toastify';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    FaArrowLeft, FaUsers, FaUserEdit, FaUserPlus, FaProjectDiagram, FaTasks, FaCalendarAlt, FaSearch, FaCrown,
    FaVolumeMute, FaVolumeUp, FaEnvelope, FaPhone, FaExclamationTriangle, FaInfoCircle,
} from 'react-icons/fa';
import {
    Avatar, Badge, Card, Stat, ProgressBar, EmptyState, PROJECT_ROLES, GLOBAL_ROLES, statusOf, fmtDate,
} from '@/Components/People/shared';

const ROLE_HELP = {
    manager: 'Gère le projet, ses membres et valide le travail.',
    member: 'Participe aux tâches et aux discussions du projet.',
    observer: 'Consulte le projet sans y contribuer.',
};

export default function Show({ project: initial, auth, can_manage = false }) {
    const { flash = {} } = usePage().props;
    const [members, setMembers] = useState(initial.users || []);
    const [q, setQ] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [pending, setPending] = useState({});

    React.useEffect(() => setMembers(initial.users || []), [initial]);

    const counts = useMemo(() => members.reduce((a, m) => ({ ...a, [m.pivot.role]: (a[m.pivot.role] || 0) + 1 }), {}), [members]);
    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        return members.filter((m) =>
            (!roleFilter || m.pivot.role === roleFilter) &&
            (!s || [m.name, m.email, m.job_title, m.company].some((v) => (v || '').toLowerCase().includes(s))));
    }, [members, q, roleFilter]);

    const taskEntries = Object.entries(initial.tasks_by_status || {}).filter(([, n]) => n > 0);
    const totalOverdue = members.reduce((s, m) => s + (m.tasks_overdue || 0), 0);

    const toggleMute = async (m) => {
        setPending((p) => ({ ...p, [m.id]: true }));
        try {
            const { data } = await axios.post(route('project-users.toggle-mute', [initial.id, m.id]), {}, { headers: { Accept: 'application/json' } });
            if (data.success) {
                setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, pivot: { ...x.pivot, is_muted: data.is_muted } } : x)));
                toast.success(data.message);
            }
        } catch {
            toast.error('Impossible de modifier le statut de ce membre.');
        }
        setPending((p) => ({ ...p, [m.id]: false }));
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-16 dark:bg-slate-900">
            <Head title={`Membres · ${initial.name}`} />
            <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
                <Link href={route('project-users.index')} className="inline-flex items-center gap-2 py-1 text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300">
                    <FaArrowLeft /> Tous les membres
                </Link>

                {/* En-tête projet */}
                <div className="mt-3 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:flex-row sm:items-center sm:p-6">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow"><FaProjectDiagram className="text-2xl" /></span>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <Link href={route('projects.show', initial.id)} className="truncate text-xl font-bold text-slate-900 hover:text-blue-600 dark:text-white sm:text-2xl">{initial.name}</Link>
                            {initial.status && <Badge cfg={{ cls: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200' }}>{initial.status}</Badge>}
                        </div>
                        {initial.description && <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{initial.description}</p>}
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><FaCalendarAlt /> Créé le {fmtDate(initial.created_at)}</p>
                    </div>
                    {can_manage && (
                        <div className="flex flex-wrap gap-2">
                            <Link href={route('project-users.edit', initial.id)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 sm:flex-none"><FaUserEdit /> Gérer</Link>
                            <Link href={`${route('project-users.create')}?project_id=${initial.id}`} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 sm:flex-none"><FaUserPlus /> Ajouter</Link>
                        </div>
                    )}
                </div>

                {flash.success && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">{flash.success}</p>}
                {flash.error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">{flash.error}</p>}

                <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <Stat label="Membres" value={members.length} tone="text-blue-600 dark:text-blue-400" />
                    <Stat label="Chefs de projet" value={counts.manager || 0} tone="text-amber-600" />
                    <Stat label="Tâches" value={initial.tasks_count} />
                    <Stat label="Tâches en retard" value={totalOverdue} tone={totalOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'} />
                </div>
                {taskEntries.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {taskEntries.map(([s, n]) => <Badge key={s} cfg={statusOf(s)}>{n} {statusOf(s).label.toLowerCase()}</Badge>)}
                    </div>
                )}

                {/* Membres */}
                <Card className="mt-6" title={`Équipe (${filtered.length}${filtered.length !== members.length ? `/${members.length}` : ''})`} icon={FaUsers}>
                    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un membre…" aria-label="Rechercher un membre"
                                className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3 text-base focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-100 md:py-2.5 md:text-sm" />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                            {[['', 'Tous'], ...Object.entries(PROJECT_ROLES).map(([k, v]) => [k, v.label])].map(([k, l]) => (
                                <button key={k} onClick={() => setRoleFilter(k)} aria-pressed={roleFilter === k}
                                    className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${roleFilter === k ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300' : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                                    {l}{k && counts[k] ? ` · ${counts[k]}` : ''}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filtered.length === 0 ? (
                        <EmptyState icon={FaUsers} title="Aucun membre trouvé" text="Modifiez votre recherche ou le filtre de rôle." />
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {filtered.map((m) => {
                                const r = PROJECT_ROLES[m.pivot.role] || PROJECT_ROLES.member;
                                const muted = m.pivot.is_muted;
                                const isMe = m.id === auth.user.id;
                                return (
                                    <article key={m.id} className={`flex flex-col rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-slate-800 ${isMe ? 'border-blue-300 dark:border-blue-500/50' : 'border-slate-200 dark:border-slate-700'}`}>
                                        <div className="flex items-start gap-3">
                                            <Avatar name={m.name} src={m.profile_photo_url} size="lg" className={muted ? 'opacity-50' : ''} />
                                            <div className="min-w-0 flex-1">
                                                <Link href={`/users/${m.id}`} className={`block truncate font-semibold text-slate-900 hover:text-blue-600 dark:text-white ${muted ? 'opacity-60' : ''}`}>
                                                    {m.name}{isMe && <span className="ml-1.5 text-xs font-normal text-blue-600">(vous)</span>}
                                                </Link>
                                                {(m.job_title || m.company) && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{[m.job_title, m.company].filter(Boolean).join(' · ')}</p>}
                                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                    <Badge cfg={r}>{m.pivot.role === 'manager' && <FaCrown className="text-[10px]" />}{r.label}</Badge>
                                                    {muted && <Badge cfg={{ cls: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300' }}><FaVolumeMute className="text-[10px]" /> Sourdine</Badge>}
                                                    {m.global_role && m.global_role !== 'user' && m.global_role !== 'member' && GLOBAL_ROLES[m.global_role] && <Badge cfg={GLOBAL_ROLES[m.global_role]} />}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                                            {m.email && <a href={`mailto:${m.email}`} className="flex items-center gap-2 truncate hover:text-blue-600"><FaEnvelope className="shrink-0 text-xs text-slate-400" /> <span className="truncate">{m.email}</span></a>}
                                            {m.phone && <a href={`tel:${m.phone}`} className="flex items-center gap-2 hover:text-blue-600"><FaPhone className="shrink-0 text-xs text-slate-400" /> {m.phone}</a>}
                                            <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><FaCalendarAlt className="shrink-0" /> Dans le projet depuis le {fmtDate(m.pivot.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        </div>

                                        <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-700/70">
                                            <p className="mb-1.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                                <span className="flex items-center gap-1.5"><FaTasks /> Tâches terminées</span>
                                                {m.tasks_overdue > 0 && <span className="flex items-center gap-1 font-medium text-red-600"><FaExclamationTriangle /> {m.tasks_overdue} en retard</span>}
                                            </p>
                                            <ProgressBar done={m.tasks_done} total={m.tasks_total} />
                                        </div>

                                        {can_manage && !isMe && m.pivot.role !== 'manager' && (
                                            <button type="button" disabled={pending[m.id]} onClick={() => toggleMute(m)}
                                                className={`mt-3 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition disabled:opacity-60 ${muted ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200'}`}>
                                                {muted ? <><FaVolumeUp /> Réactiver les notifications</> : <><FaVolumeMute /> Mettre en sourdine</>}
                                            </button>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </Card>

                <Card className="mt-6" title="Rôles dans le projet" icon={FaInfoCircle}>
                    <div className="grid gap-3 md:grid-cols-3">
                        {Object.entries(PROJECT_ROLES).map(([k, v]) => (
                            <div key={k} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900/40">
                                <Badge cfg={v} />
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{ROLE_HELP[k]}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}

Show.layout = (page) => <AdminLayout children={page} />;
