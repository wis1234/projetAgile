import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  FaUsers, FaSearch, FaSpinner, FaCheck, FaExclamationTriangle,
  FaLink, FaCopy, FaGlobe, FaLock, FaUserPlus, FaTrash, FaShieldAlt
} from 'react-icons/fa';

const PERM_LABELS = {
  view: 'Lecteur',
  comment: 'Commentateur',
  edit: 'Éditeur',
  admin: 'Administrateur',
  none: 'Aucun accès',
};

export default function AccessPanel({
  fileId,
  initialCollaborators = [],
  canManage = false,
  initialShareUrl = '',
  initialPublicPermission = 'none',
  onClose,
}) {
  const [accesses, setAccesses] = useState(initialCollaborators);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [toast, setToast] = useState(null);
  const [shareUrl, setShareUrl] = useState(initialShareUrl);
  const [publicPermission, setPublicPermission] = useState(initialPublicPermission);
  const [updatingPublic, setUpdatingPublic] = useState(false);
  const [copied, setCopied] = useState(false);
  const [externalEmail, setExternalEmail] = useState('');
  const [externalName, setExternalName] = useState('');
  const [externalPerm, setExternalPerm] = useState('edit');
  const [invitingExternal, setInvitingExternal] = useState(false);
  const [showExternalForm, setShowExternalForm] = useState(false);

  const searchTimer = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Charger les accès et les infos de partage public
  useEffect(() => {
    axios.get(`/files/${fileId}/access`)
      .then(({ data }) => {
        if (data.accesses) {
          const formatted = data.accesses.map(a => ({
            id: a.user?.id,
            name: a.user?.name,
            email: a.user?.email,
            profile_photo_url: a.user?.profile_photo_path ? `/storage/${a.user.profile_photo_path}` : null,
            permission: a.permission,
          })).filter(a => a.id);
          setAccesses(formatted);
        }
        if (data.share_url) setShareUrl(data.share_url);
        if (data.public_permission) setPublicPermission(data.public_permission);
      })
      .catch(() => {});
  }, [fileId]);

  // Recherche d'utilisateurs internes
  const searchUsers = useCallback(async (q) => {
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const { data } = await axios.get(`/api/users/search?q=${encodeURIComponent(q)}`);
      setResults(data.users ?? data ?? []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => searchUsers(search), 350);
    return () => clearTimeout(searchTimer.current);
  }, [search, searchUsers]);

  // Détecter si la saisie est une adresse email valide
  const isEmailInput = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(search.trim());

  // Accorder l'accès à un utilisateur interne
  const grantAccess = async (user, permission) => {
    try {
      await axios.post(`/files/${fileId}/access`, { user_id: user.id, permission });
      setAccesses(prev => {
        const idx = prev.findIndex(a => a.id === user.id);
        const entry = {
          id: user.id,
          name: user.name,
          email: user.email,
          profile_photo_url: user.profile_photo_path ? `/storage/${user.profile_photo_path}` : null,
          permission,
        };
        return idx >= 0 ? prev.map((a, i) => i === idx ? entry : a) : [...prev, entry];
      });
      setSearch('');
      setResults([]);
      showToast(`Accès « ${PERM_LABELS[permission] || permission} » accordé à ${user.name}`);
    } catch {
      showToast("Erreur lors de l'attribution de l'accès", 'error');
    }
  };

  // Inviter un collaborateur externe par email
  const inviteExternalUser = async (e) => {
    if (e) e.preventDefault();
    const emailToInvite = (externalEmail || search).trim();
    if (!emailToInvite) return;

    setInvitingExternal(true);
    try {
      const { data } = await axios.post(`/files/${fileId}/access`, {
        email: emailToInvite,
        name: externalName.trim() || undefined,
        permission: externalPerm,
      });

      if (data.access?.user) {
        const u = data.access.user;
        setAccesses(prev => {
          const idx = prev.findIndex(a => a.id === u.id);
          const entry = {
            id: u.id,
            name: u.name,
            email: u.email,
            profile_photo_url: u.profile_photo_path ? `/storage/${u.profile_photo_path}` : null,
            permission: data.access.permission,
          };
          return idx >= 0 ? prev.map((a, i) => i === idx ? entry : a) : [...prev, entry];
        });
      }

      setSearch('');
      setResults([]);
      setExternalEmail('');
      setExternalName('');
      setShowExternalForm(false);
      showToast(`Invitation externe envoyée à ${emailToInvite} !`);
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur lors de l'invitation externe", 'error');
    } finally {
      setInvitingExternal(false);
    }
  };

  // Mettre à jour la permission
  const updatePermission = async (userId, permission) => {
    try {
      await axios.post(`/files/${fileId}/access`, { user_id: userId, permission });
      setAccesses(prev => prev.map(a => a.id === userId ? { ...a, permission } : a));
      if (permission === 'none') {
        setAccesses(prev => prev.filter(a => a.id !== userId));
      }
      showToast('Permission mise à jour');
    } catch {
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  // Révoquer un accès
  const revokeAccess = async (userId, name) => {
    if (!window.confirm(`Révoquer l'accès de ${name} ?`)) return;
    try {
      await axios.delete(`/files/${fileId}/access/${userId}`);
      setAccesses(prev => prev.filter(a => a.id !== userId));
      showToast(`Accès de ${name} révoqué`);
    } catch {
      showToast('Erreur lors de la révocation', 'error');
    }
  };

  // Modifier le statut de partage public
  const handlePublicPermissionChange = async (perm) => {
    setUpdatingPublic(true);
    try {
      const { data } = await axios.post(`/files/${fileId}/public-share`, { public_permission: perm });
      setPublicPermission(data.public_permission);
      if (data.share_url) setShareUrl(data.share_url);
      showToast(perm === 'none' ? 'Lien public désactivé' : `Lien public activé (${PERM_LABELS[perm]})`);
    } catch {
      showToast('Erreur lors de la mise à jour du lien public', 'error');
    } finally {
      setUpdatingPublic(false);
    }
  };

  const copyShareLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showToast('Lien de collaboration copié dans le presse-papier !');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-80 sm:w-96 shadow-2xl z-40 text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
        <div className="flex items-center gap-2">
          <FaUsers className="text-blue-600 dark:text-blue-400 text-sm" />
          <h3 className="font-semibold text-sm">Partager et collaborer</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            ✕
          </button>
        )}
      </div>

      {/* Notifications Toast */}
      {toast && (
        <div className="mx-4 mt-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white shadow-sm ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}>
            {toast.type === 'success' ? <FaCheck className="text-[10px]" /> : <FaExclamationTriangle className="text-[10px]" />}
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* ── Section 1 : Lien de partage externe / invité ── */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FaGlobe className="text-blue-500 text-xs" />
              Lien de partage externe
            </span>
            {updatingPublic && <FaSpinner className="animate-spin text-xs text-blue-500" />}
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Permet à des personnes externes (clients, partenaires) d'accéder au document sans compte.
          </p>

          {canManage ? (
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Accès via le lien
              </label>
              <select
                value={publicPermission}
                onChange={e => handlePublicPermissionChange(e.target.value)}
                disabled={updatingPublic}
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">🔒 Désactivé (Accès restreint)</option>
                <option value="view">👁️ Toute personne avec le lien (Lecteur)</option>
                <option value="comment">💬 Toute personne avec le lien (Commentateur)</option>
                <option value="edit">✏️ Toute personne avec le lien (Éditeur en direct)</option>
              </select>
            </div>
          ) : (
            <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
              {publicPermission === 'none' ? <FaLock className="text-slate-400" /> : <FaGlobe className="text-emerald-500" />}
              <span>{publicPermission === 'none' ? 'Lien restreint' : `Accessible : ${PERM_LABELS[publicPermission]}`}</span>
            </div>
          )}

          {publicPermission !== 'none' && shareUrl && (
            <div className="pt-1">
              <button
                type="button"
                onClick={copyShareLink}
                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition duration-150 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20'
                }`}
              >
                {copied ? <FaCheck className="text-xs" /> : <FaCopy className="text-xs" />}
                {copied ? 'Lien copié !' : 'Copier le lien de collaboration'}
              </button>
            </div>
          )}
        </div>

        {/* ── Section 2 : Ajouter des collaborateurs ── */}
        {canManage && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FaUserPlus className="text-indigo-500 text-xs" />
                Ajouter une personne
              </span>
              <button
                type="button"
                onClick={() => setShowExternalForm(!showExternalForm)}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {showExternalForm ? 'Recherche rapide' : '+ Inviter par email'}
              </button>
            </div>

            {/* Formulaire d'invitation externe dédiée */}
            {showExternalForm ? (
              <form onSubmit={inviteExternalUser} className="bg-blue-50/60 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-2.5">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Email de l'invité externe *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ex: client@entreprise.com"
                    value={externalEmail}
                    onChange={e => setExternalEmail(e.target.value)}
                    className="w-full text-xs mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Nom ou Titre (optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Marc (Partenaire)"
                    value={externalName}
                    onChange={e => setExternalName(e.target.value)}
                    className="w-full text-xs mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Rôle accordé
                  </label>
                  <select
                    value={externalPerm}
                    onChange={e => setExternalPerm(e.target.value)}
                    className="w-full text-xs mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="edit">Éditeur (Peut modifier en direct)</option>
                    <option value="comment">Commentateur (Peut commenter)</option>
                    <option value="view">Lecteur (Lecture seule)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={invitingExternal || !externalEmail.trim()}
                  className="w-full mt-2 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition"
                >
                  {invitingExternal ? <FaSpinner className="animate-spin text-xs" /> : <FaUserPlus className="text-xs" />}
                  Envoyer l'invitation
                </button>
              </form>
            ) : (
              <div className="relative">
                <FaSearch className="absolute left-3 top-2.5 text-slate-400 text-xs" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Nom ou e-mail (externe ou interne)…"
                  className="w-full pl-8 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 transition"
                />
                {searching && <FaSpinner className="absolute right-3 top-2.5 animate-spin text-slate-400 text-xs" />}

                {/* Résultats de recherche */}
                {results.length > 0 && (
                  <div className="mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-lg max-h-56 overflow-y-auto">
                    {results.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-2.5 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-semibold truncate">{user.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => grantAccess(user, 'edit')}
                            className="px-2 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 text-[10px] font-semibold rounded hover:bg-blue-100 transition"
                          >
                            Éditer
                          </button>
                          <button
                            type="button"
                            onClick={() => grantAccess(user, 'view')}
                            className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold rounded hover:bg-slate-200 transition"
                          >
                            Voir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggestion pour inviter directement l'email tapé */}
                {isEmailInput && results.length === 0 && !searching && (
                  <div className="mt-2 p-2.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 rounded-xl">
                    <p className="text-xs text-indigo-900 dark:text-indigo-200 font-medium">
                      Inviter cet utilisateur externe :
                    </p>
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono truncate my-1">
                      {search}
                    </p>
                    <button
                      type="button"
                      onClick={inviteExternalUser}
                      disabled={invitingExternal}
                      className="mt-1 w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition"
                    >
                      {invitingExternal ? <FaSpinner className="animate-spin text-xs" /> : <FaUserPlus className="text-xs" />}
                      Inviter en mode Éditeur direct
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Section 3 : Collaborateurs avec accès ── */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Personnes ayant accès ({accesses.length})
            </span>
          </div>

          {accesses.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              Seuls les membres du projet ont actuellement accès à ce document.
            </p>
          ) : (
            <div className="space-y-1.5">
              {accesses.map(collab => (
                <div
                  key={collab.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {collab.profile_photo_url ? (
                      <img src={collab.profile_photo_url} alt="" className="w-6 h-6 rounded-full shrink-0 object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {(collab.name || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{collab.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{collab.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {canManage ? (
                      <>
                        <select
                          value={collab.permission}
                          onChange={e => updatePermission(collab.id, e.target.value)}
                          className="text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-1.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none"
                        >
                          <option value="view">Lecteur</option>
                          <option value="comment">Commentateur</option>
                          <option value="edit">Éditeur</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => revokeAccess(collab.id, collab.name)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded transition"
                          title="Révoquer l'accès"
                        >
                          <FaTrash className="text-[10px]" />
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {PERM_LABELS[collab.permission] || collab.permission}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
