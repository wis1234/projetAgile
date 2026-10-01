import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import RoleManagement from '@/Components/RoleManagement';
import Modal from '@/Components/Modal';
import {
    FaArrowLeft, FaEdit, FaEnvelope, FaPhone, FaProjectDiagram, FaTasks, FaFolderOpen, FaExclamationTriangle,
    FaBriefcase, FaBuilding, FaCalendarAlt, FaClock, FaCheckCircle, FaCrown, FaCreditCard, FaUniversity, FaTrash, FaHistory,
} from 'react-icons/fa';
import {
    Avatar, Badge, Card, Stat, ProgressBar, EmptyState, InfoRow, GLOBAL_ROLES, PROJECT_ROLES,
    statusOf, fmtDate, timeAgo,
} from '@/Components/People/shared';

const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

function Show({ user, auth }) {
    const { flash = {} } = usePage().props;
    const me = auth?.user || auth;
    const perm = user.permissions || {};
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [copied, setCopied] = useState('');

    const roleCfg = GLOBAL_ROLES[user.role] || GLOBAL_ROLES.user;
    const stats = user.stats || {};
    const byStatus = stats.tasks_by_status || {};
    const statusEntries = Object.entries(byStatus).filter(([, n]) => n > 0);

    const copy = async (key, value) => {
        try { await navigator.clipboard.writeText(value); setCopied(key); setTimeout(() => setCopied(''), 1500); } catch { /* presse-papiers indisponible */ }
    };

    const handleRoleChange = async (newRole, sendEmail = true) => {
        const res = await fetch(`/users/${user.id}/assign-role`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': csrf() },
            body: JSON.stringify({ role: newRole, send_email: sendEmail }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || data.error || 'Erreur lors de la mise à jour du rôle');
        router.reload({ only: ['user'] });
        return data;
    };

    const remove = () => router.delete(`/users/${user.id}`, { onFinish: () => setConfirmDelete(false) });

    return (
        <div className="min-h-screen bg-slate-50 pb-16 dark:bg-slate-900">
            <Head title={user.name} />

            {/* Bandeau */}
            <div className="h-28 bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-600 sm:h-36" />
            <div className="mx-auto -mt-14 max-w-6xl px-4 sm:-mt-16 sm:px-6">
                <Link href="/users" className="mb-3 inline-flex items-center gap-2 rounded-lg bg-black/25 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-black/40">
                    <FaArrowLeft /> Utilisateurs
                </Link>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="rounded-2xl bg-white p-1 shadow-lg dark:bg-slate-900">
                        <Avatar name={user.name} src={user.profile_photo_url} size="xl" className="!h-24 !w-24 !rounded-xl sm:!h-28 sm:!w-28" />
                    </div>
                    <div className="min-w-0 flex-1 pb-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="truncate text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">{user.name}</h1>
                            <Badge cfg={roleCfg} />
                            {perm.is_self && <Badge cfg={{ cls: 'bg-blue-600 text-white' }}>Vous</Badge>}
                        </div>
                        {(user.job_title || user.company) && (
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                {[user.job_title, user.company].filter(Boolean).join(' · ')}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {user.email && (
                            <a href={`mailto:${user.email}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                                <FaEnvelope /> Écrire
                            </a>
                        )}
                        {perm.can_edit && perm.edit_url && (
                            <Link href={perm.edit_url} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                                <FaEdit /> Modifier
                            </Link>
                        )}
                    </div>
                </div>

                {flash.success && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">{flash.success}</p>}
                {flash.error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">{flash.error}</p>}

                {/* Indicateurs */}
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Stat label="Projets" value={stats.projects} tone="text-blue-600 dark:text-blue-400" />
                    <Stat label="Tâches assignées" value={stats.tasks_total} />
                    <Stat label="Tâches en retard" value={stats.tasks_overdue} tone={stats.tasks_overdue ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'} />
                    <Stat label="Fichiers déposés" value={stats.files} tone="text-emerald-600 dark:text-emerald-400" />
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-3">
                    {/* Colonne principale */}
                    <div className="space-y-6 lg:col-span-2">
                        {user.bio && (
                            <Card title="À propos">
                                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">{user.bio}</p>
                            </Card>
                        )}

                        <Card title={`Projets (${user.projects?.length || 0})`} icon={FaProjectDiagram}>
                            {user.projects?.length ? (
                                <ul className="divide-y divide-slate-100 dark:divide-slate-700/70">
                                    {user.projects.map((p) => {
                                        const r = PROJECT_ROLES[p.role] || PROJECT_ROLES.member;
                                        return (
                                            <li key={p.id} className="py-3 first:pt-0 last:pb-0">
                                                <div className="flex items-center justify-between gap-3">
                                                    <Link href={`/projects/${p.id}`} className="min-w-0 truncate text-sm font-semibold text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
                                                        {p.name}
                                                    </Link>
                                                    <Badge cfg={r}>{p.role === 'manager' && <FaCrown className="text-[10px]" />}{r.label}</Badge>
                                                </div>
                                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                    Depuis le {fmtDate(p.joined_at, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    {p.status && <> · {p.status}</>}
                                                </p>
                                                <div className="mt-2"><ProgressBar done={p.tasks_done} total={p.tasks_total} /></div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <EmptyState icon={FaProjectDiagram} title="Aucun projet" text={perm.sees_private ? "Cette personne ne fait partie d'aucun projet." : "Vous n'avez aucun projet en commun avec cette personne."} />
                            )}
                        </Card>

                        <Card title="Tâches récentes" icon={FaTasks}>
                            {statusEntries.length > 0 && (
                                <div className="mb-4 flex flex-wrap gap-2">
                                    {statusEntries.map(([s, n]) => <Badge key={s} cfg={statusOf(s)}>{n} {statusOf(s).label.toLowerCase()}</Badge>)}
                                </div>
                            )}
                            {user.recent_tasks?.length ? (
                                <ul className="divide-y divide-slate-100 dark:divide-slate-700/70">
                                    {user.recent_tasks.map((t) => (
                                        <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                                            <div className="min-w-0">
                                                <Link href={`/tasks/${t.id}`} className="block truncate text-sm font-medium text-slate-900 hover:text-blue-600 dark:text-white">{t.title}</Link>
                                                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                                    {t.project?.name}{t.due_date && <> · échéance {fmtDate(t.due_date, { day: 'numeric', month: 'short' })}</>}
                                                </p>
                                            </div>
                                            <Badge cfg={statusOf(t.status)} />
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <EmptyState icon={FaTasks} title="Aucune tâche assignée" />
                            )}
                        </Card>

                        {perm.sees_private && (
                            <Card title="Activité récente" icon={FaHistory}>
                                {user.recent_activity?.length ? (
                                    <ul className="space-y-3">
                                        {user.recent_activity.map((a) => (
                                            <li key={a.id} className="flex gap-3 text-sm">
                                                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                                                <div className="min-w-0">
                                                    <p className="text-slate-800 dark:text-slate-200">{a.description}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{timeAgo(a.created_at)}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <EmptyState title="Aucune activité enregistrée" />}
                            </Card>
                        )}
                    </div>

                    {/* Colonne latérale */}
                    <div className="space-y-6">
                        <Card title="Coordonnées">
                            <div className="divide-y divide-slate-100 dark:divide-slate-700/70">
                                {user.email ? (
                                    <InfoRow icon={FaEnvelope} label="E-mail">
                                        <button type="button" onClick={() => copy('email', user.email)} className="text-left hover:text-blue-600" title="Copier">
                                            {user.email} {copied === 'email' && <span className="text-xs text-emerald-600">copié</span>}
                                        </button>
                                    </InfoRow>
                                ) : <p className="py-2 text-sm text-slate-500">Coordonnées non visibles.</p>}
                                {user.phone && (
                                    <InfoRow icon={FaPhone} label="Téléphone"><a href={`tel:${user.phone}`} className="hover:text-blue-600">{user.phone}</a></InfoRow>
                                )}
                                {user.job_title && <InfoRow icon={FaBriefcase} label="Poste">{user.job_title}</InfoRow>}
                                {user.company && <InfoRow icon={FaBuilding} label="Entreprise">{user.company}</InfoRow>}
                            </div>
                        </Card>

                        <Card title="Compte">
                            <div className="divide-y divide-slate-100 dark:divide-slate-700/70">
                                <InfoRow icon={FaCalendarAlt} label="Membre depuis">{fmtDate(user.created_at)}</InfoRow>
                                {perm.sees_private && (
                                    <>
                                        <InfoRow icon={FaClock} label="Dernière activité">{user.last_seen_at ? timeAgo(user.last_seen_at) : 'Inconnue'}</InfoRow>
                                        <InfoRow icon={FaCheckCircle} label="E-mail">
                                            {user.email_verified_at ? <span className="text-emerald-600">Vérifié le {fmtDate(user.email_verified_at, { day: 'numeric', month: 'short', year: 'numeric' })}</span> : <span className="text-amber-600">Non vérifié</span>}
                                        </InfoRow>
                                    </>
                                )}
                                {stats.tasks_overdue > 0 && (
                                    <InfoRow icon={FaExclamationTriangle} label="Attention"><span className="text-red-600">{stats.tasks_overdue} tâche(s) en retard</span></InfoRow>
                                )}
                            </div>
                        </Card>

                        {perm.sees_private && user.subscription && (
                            <Card title="Abonnement" icon={FaCreditCard}>
                                {user.subscription.active ? (
                                    <div className="space-y-1 text-sm">
                                        <p className="font-semibold text-slate-900 dark:text-white">{user.subscription.plan || 'Abonnement actif'}</p>
                                        <p className="text-slate-500 dark:text-slate-400">
                                            Jusqu'au {user.subscription.ends_at}{user.subscription.days_remaining != null && <> ({user.subscription.days_remaining} j restants)</>}
                                        </p>
                                    </div>
                                ) : <p className="text-sm text-slate-500 dark:text-slate-400">Aucun abonnement actif.</p>}
                            </Card>
                        )}

                        {perm.sees_private && user.bank && (
                            <Card title="Coordonnées bancaires" icon={FaUniversity}>
                                <dl className="space-y-1 text-sm">
                                    <div className="flex justify-between gap-3"><dt className="text-slate-500">Banque</dt><dd className="font-medium">{user.bank.bank_name}</dd></div>
                                    <div className="flex justify-between gap-3"><dt className="text-slate-500">Titulaire</dt><dd className="font-medium">{user.bank.account_holder_name}</dd></div>
                                    <div className="flex justify-between gap-3"><dt className="text-slate-500">IBAN</dt><dd className="font-mono text-xs">{user.bank.iban_masked}</dd></div>
                                </dl>
                            </Card>
                        )}

                        {perm.can_assign_role && <RoleManagement user={{ ...user, role: user.role }} currentUser={me} onRoleChange={handleRoleChange} />}

                        {perm.can_delete && (
                            <Card title="Zone sensible">
                                <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-500/10 dark:text-red-300">
                                    <FaTrash /> Supprimer ce compte
                                </button>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            <Modal show={confirmDelete} onClose={() => setConfirmDelete(false)} maxWidth="md">
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Supprimer {user.name} ?</h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Le compte sera supprimé définitivement. Cette action est irréversible.</p>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200">Annuler</button>
                        <button type="button" onClick={remove} className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700">Supprimer</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

Show.layout = (page) => <AdminLayout children={page} />;
export default Show;
