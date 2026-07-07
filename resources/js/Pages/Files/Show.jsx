import React, { useState, useEffect } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { motion } from 'framer-motion';
import FileHeader from '@/Components/FileDetails/FileHeader';
import FilePreview from '@/Components/FileDetails/FilePreview';
import FileMetadata from '@/Components/FileDetails/FileMetadata';
import CommentsSection from '@/Components/FileDetails/CommentsSection';
import RelatedInfo from '@/Components/FileDetails/RelatedInfo';
import SaveToDropboxButton from '@/Components/Files/SaveToDropboxButton';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  FaProjectDiagram,
  FaTasks,
  FaUser,
  FaFileAlt,
  FaClock,
  FaArrowLeft,
  FaTimes,
  FaLock,
  FaLockOpen,
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
  FaKey,
  FaExclamationTriangle,
  FaCheckCircle,
} from 'react-icons/fa';
import { isFileEditable } from '@/utils/fileUtils';
import axios from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// Password Gate — shown to non-managers when the file is locked
// ─────────────────────────────────────────────────────────────────────────────
const PasswordGate = ({ fileName, onUnlock }) => {
  const [password, setPassword]   = useState('');
  const [show, setShow]           = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError('');
    try {
      // POST to your backend to verify the password
      await axios.post(route('files.unlock', { file: window.location.pathname.split('/').pop() }), {
        password,
      });
      onUnlock(password);
    } catch {
      setError('Mot de passe incorrect. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md overflow-hidden"
      >
        {/* Top banner */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-8 flex flex-col items-center">
          <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center mb-4 ring-2 ring-white/20">
            <FaLock className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white text-center">Fichier protégé</h2>
          <p className="text-slate-300 text-sm mt-1 text-center truncate max-w-xs" title={fileName}>
            {fileName}
          </p>
        </div>

        <div className="px-8 py-7">
          <p className="text-sm text-gray-500 mb-5 text-center">
            Ce fichier est protégé par un mot de passe. Saisissez-le pour accéder à son contenu.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaKey className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Entrez le mot de passe…"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {show ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5"
              >
                <FaExclamationTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600
                         hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium
                         rounded-lg transition-colors focus:outline-none focus:ring-2
                         focus:ring-blue-500 focus:ring-offset-2"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              ) : (
                <FaLockOpen className="h-4 w-4" />
              )}
              {loading ? 'Vérification…' : 'Déverrouiller'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Set / Change Password Modal  (manager only)
// ─────────────────────────────────────────────────────────────────────────────
const PasswordManagerModal = ({ isOpen, onClose, file, onSaved }) => {
  const [mode, setMode]         = useState('set');   // 'set' | 'remove'
  const [newPwd, setNewPwd]     = useState('');
  const [confirmPwd, setConfirm]= useState('');
  const [showNew, setShowNew]   = useState(false);
  const [showCfm, setShowCfm]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewPwd(''); setConfirm('');
      setError(''); setSuccess('');
      setMode(file.is_password_protected ? 'change' : 'set');
    }
  }, [isOpen, file.is_password_protected]);

  const strength = (pwd) => {
    if (!pwd) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8)             score++;
    if (/[A-Z]/.test(pwd))           score++;
    if (/[0-9]/.test(pwd))           score++;
    if (/[^A-Za-z0-9]/.test(pwd))    score++;
    const map = [
      { level: 0, label: '', color: '' },
      { level: 1, label: 'Faible',    color: 'bg-red-500' },
      { level: 2, label: 'Moyen',     color: 'bg-yellow-500' },
      { level: 3, label: 'Fort',      color: 'bg-blue-500' },
      { level: 4, label: 'Très fort', color: 'bg-green-500' },
    ];
    return map[score];
  };

  const str = strength(newPwd);

  const handleSave = async () => {
    setError(''); setSuccess('');
    if (mode !== 'remove') {
      if (!newPwd) return setError('Veuillez saisir un mot de passe.');
      if (newPwd.length < 6) return setError('Le mot de passe doit contenir au moins 6 caractères.');
      if (newPwd !== confirmPwd) return setError('Les mots de passe ne correspondent pas.');
    }
    setLoading(true);
    try {
      await axios.patch(route('files.password', file.id), {
        action:   mode === 'remove' ? 'remove' : 'set',
        password: mode === 'remove' ? null : newPwd,
      });
      setSuccess(
        mode === 'remove'
          ? 'Protection supprimée avec succès.'
          : 'Mot de passe enregistré avec succès.'
      );
      setTimeout(() => { onSaved(mode !== 'remove'); onClose(); }, 1200);
    } catch (err) {
      setError(err?.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150"  leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-white/10 rounded-full flex items-center justify-center">
                      <FaShieldAlt className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <Dialog.Title className="text-base font-semibold text-white">
                        Protection par mot de passe
                      </Dialog.Title>
                      <p className="text-slate-400 text-xs mt-0.5 truncate max-w-xs">{file.name}</p>
                    </div>
                  </div>
                  <button onClick={onClose}
                    className="text-slate-400 hover:text-white transition-colors p-1 rounded">
                    <FaTimes className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  {/* Current status badge */}
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                    ${file.is_password_protected
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-green-50 text-green-700 border border-green-200'}`}>
                    {file.is_password_protected
                      ? <><FaLock className="h-3.5 w-3.5"/> Fichier actuellement protégé</>
                      : <><FaLockOpen className="h-3.5 w-3.5"/> Fichier actuellement non protégé</>}
                  </div>

                  {/* Mode tabs */}
                  <div className="flex rounded-lg overflow-hidden border border-gray-200 text-sm">
                    {[
                      { key: 'set',    label: file.is_password_protected ? 'Changer' : 'Définir' },
                      ...(file.is_password_protected
                        ? [{ key: 'remove', label: 'Supprimer la protection' }]
                        : []),
                    ].map(({ key, label }) => (
                      <button key={key}
                        onClick={() => { setMode(key); setError(''); setSuccess(''); }}
                        className={`flex-1 px-4 py-2 font-medium transition-colors
                          ${mode === key
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {mode !== 'remove' ? (
                    <div className="space-y-4">
                      {/* New password */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {file.is_password_protected ? 'Nouveau mot de passe' : 'Mot de passe'}
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaKey className="h-3.5 w-3.5 text-gray-400" />
                          </div>
                          <input
                            type={showNew ? 'text' : 'password'}
                            value={newPwd}
                            onChange={(e) => setNewPwd(e.target.value)}
                            className="block w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm
                                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Minimum 6 caractères…"
                          />
                          <button type="button" onClick={() => setShowNew(!showNew)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                            {showNew ? <FaEyeSlash className="h-3.5 w-3.5" /> : <FaEye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                        {/* Strength bar */}
                        {newPwd && (
                          <div className="mt-2 space-y-1">
                            <div className="flex gap-1">
                              {[1,2,3,4].map(i => (
                                <div key={i}
                                  className={`h-1 flex-1 rounded-full transition-colors duration-300
                                    ${i <= str.level ? str.color : 'bg-gray-200'}`} />
                              ))}
                            </div>
                            <p className="text-xs text-gray-500">Force : <span className="font-medium">{str.label}</span></p>
                          </div>
                        )}
                      </div>

                      {/* Confirm */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Confirmer le mot de passe
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaCheckCircle className={`h-3.5 w-3.5 ${
                              confirmPwd && confirmPwd === newPwd ? 'text-green-500' : 'text-gray-400'
                            }`} />
                          </div>
                          <input
                            type={showCfm ? 'text' : 'password'}
                            value={confirmPwd}
                            onChange={(e) => setConfirm(e.target.value)}
                            className={`block w-full pl-9 pr-10 py-2.5 border rounded-lg text-sm
                                        focus:ring-2 focus:ring-blue-500 transition-colors
                                        ${confirmPwd && confirmPwd !== newPwd
                                          ? 'border-red-300 focus:border-red-500'
                                          : 'border-gray-300 focus:border-blue-500'}`}
                            placeholder="Répétez le mot de passe…"
                          />
                          <button type="button" onClick={() => setShowCfm(!showCfm)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                            {showCfm ? <FaEyeSlash className="h-3.5 w-3.5" /> : <FaEye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* What will be protected */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                        <p className="text-xs font-semibold text-blue-700 mb-2">
                          Actions bloquées sans mot de passe :
                        </p>
                        <ul className="space-y-1">
                          {['Télécharger', 'Visualiser / Prévisualiser', 'Modifier', 'Supprimer', 'Commenter', 'Partager'].map(a => (
                            <li key={a} className="flex items-center gap-1.5 text-xs text-blue-600">
                              <FaLock className="h-2.5 w-2.5 flex-shrink-0" />{a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-4">
                      <div className="flex gap-3">
                        <FaExclamationTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-red-700">Supprimer la protection</p>
                          <p className="text-sm text-red-600 mt-1">
                            Le fichier sera accessible à tous sans mot de passe.
                            Cette action prend effet immédiatement.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Feedback */}
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                      <FaExclamationTriangle className="h-3.5 w-3.5 flex-shrink-0" />{error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
                      <FaCheckCircle className="h-3.5 w-3.5 flex-shrink-0" />{success}
                    </motion.div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                  <button onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300
                               rounded-lg hover:bg-gray-50 transition-colors">
                    Annuler
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading || (mode !== 'remove' && (!newPwd || newPwd !== confirmPwd))}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors
                                focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center gap-2
                                ${mode === 'remove'
                                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300'
                                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300'}`}
                  >
                    {loading
                      ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                      : mode === 'remove' ? <FaLockOpen className="h-3.5 w-3.5" /> : <FaLock className="h-3.5 w-3.5" />}
                    {loading ? 'Enregistrement…'
                      : mode === 'remove' ? 'Supprimer la protection'
                      : file.is_password_protected ? 'Changer le mot de passe'
                      : 'Protéger le fichier'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Show component
// ─────────────────────────────────────────────────────────────────────────────
const Show = ({ file, auth, canManageFile }) => {
  const { user: currentUser } = auth;

  const [currentFile, setCurrentFile] = useState({
    ...file,
    task:    file.task    || null,
    project: file.project || null,
  });

  const [isDeleteModalOpen,   setIsDeleteModalOpen]   = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Session-level unlock: manager always unlocked, others start locked if file is protected
  const [isUnlocked, setIsUnlocked] = useState(
    canManageFile || !file.is_password_protected
  );

  const isFileOwner  = currentFile.user_id === currentUser?.id;
  const canEditContent = isFileEditable(currentFile.type, currentFile.name);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleDelete   = () => setIsDeleteModalOpen(true);
  const confirmDelete  = () => {
    router.delete(route('files.destroy', currentFile.id), {
      onSuccess: () => router.visit(route('files.index')),
    });
  };

  const handleDownload = (e) => {
    e.preventDefault();
    if (!isUnlocked) return;
    window.open(route('files.download', currentFile.id), '_blank');
  };

  const handlePreview = (e) => {
    e.preventDefault();
    if (!isUnlocked) return;
    window.open(route('files.preview', 'public/' + currentFile.id), '_blank');
  };

  const handleShare = () => {
    if (!isUnlocked) return;
    navigator.clipboard.writeText(window.location.href);
    alert('Lien copié dans le presse-papier');
  };

  // Called by PasswordManagerModal when a password is set/removed
  const handlePasswordSaved = (isNowProtected) => {
    setCurrentFile(prev => ({ ...prev, is_password_protected: isNowProtected }));
    // Manager stays unlocked regardless
  };

  // Called by PasswordGate when the correct password is entered
  const handleUnlock = () => setIsUnlocked(true);

  // ── Gate: show lock screen if protected and not yet unlocked ───────────────
  if (!isUnlocked) {
    return (
      <AdminLayout>
        <Head title={`Fichier protégé - ${currentFile.name}`} />
        <PasswordGate fileName={currentFile.name} onUnlock={handleUnlock} />
      </AdminLayout>
    );
  }

  // ── Animation ──────────────────────────────────────────────────────────────
  const container = {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const item = {
    hidden: { opacity: 0, y: 10 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <AdminLayout>
      <Head title={`Fichier - ${currentFile.name}`} />

      <div className="min-h-screen bg-gray-50">
        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-4">
                <Link
                  href={route('files.index')}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700
                             text-white rounded-lg transition-colors duration-200"
                  title="Retour à la liste des fichiers"
                >
                  <FaArrowLeft className="h-4 w-4" />
                  <span className="text-sm font-medium">Retour</span>
                </Link>

                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <FaFileAlt className="h-6 w-6 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate"
                            title={currentFile.name}>
                          {currentFile.name}
                        </h1>
                        {/* Lock badge */}
                        {currentFile.is_password_protected && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                                           text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                            <FaLock className="h-2.5 w-2.5" /> Protégé
                          </span>
                        )}
                      </div>

                      <div className="mt-1">
                        <span className="text-sm text-gray-600 font-medium">Tâche : </span>
                        {currentFile.task ? (
                          <Link
                            href={`/tasks/${currentFile.task.id}`}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs
                                       font-medium bg-blue-100 text-blue-800 hover:bg-blue-200
                                       transition-colors duration-200"
                            title="Voir la tâche"
                          >
                            <FaTasks className="mr-1.5 h-3 w-3" />
                            {currentFile.task.title}
                          </Link>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full
                                           text-xs font-medium bg-gray-100 text-gray-600">
                            <FaTimes className="mr-1.5 h-3 w-3" /> Aucune
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="mt-1 text-sm text-gray-500">
                    Dernière mise à jour :{' '}
                    {new Date(currentFile.updated_at).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Content ────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-4 gap-6"
            variants={container} initial="hidden" animate="show"
          >
            {/* Left — 3 columns */}
            <div className="lg:col-span-3 space-y-6">
              <motion.div
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                variants={item}
              >
                <FilePreview
                  file={currentFile}
                  canManageFile={canManageFile}
                  onDelete={handleDelete}
                  onShare={handleShare}
                  onDownload={handleDownload}
                />
              </motion.div>

              <motion.div
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                variants={item}
              >
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">Détails du fichier</h2>
                </div>
                <div className="p-6">
                  <FileMetadata file={currentFile} />
                </div>
              </motion.div>

              <motion.div
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                variants={item}
              >
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">Commentaires</h2>
                </div>
                <div className="p-6">
                  <CommentsSection fileId={currentFile.id} currentUser={currentUser} />
                </div>
              </motion.div>
            </div>

            {/* Right sidebar — 1 column */}
            <div className="lg:col-span-1 space-y-6">

              {/* Password protection card — managers only */}
              {canManageFile && (
                <motion.div
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                  variants={item}
                >
                  <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                    <FaShieldAlt className="h-4 w-4 text-slate-600" />
                    <h2 className="text-sm font-semibold text-gray-900">Protection</h2>
                  </div>
                  <div className="p-4 space-y-3">
                    {/* Status */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
                      ${currentFile.is_password_protected
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                      {currentFile.is_password_protected
                        ? <><FaLock className="h-3 w-3 flex-shrink-0" /> Protégé par mot de passe</>
                        : <><FaLockOpen className="h-3 w-3 flex-shrink-0" /> Non protégé</>}
                    </div>
                    <button
                      onClick={() => setIsPasswordModalOpen(true)}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5
                                  border rounded-lg text-sm font-medium transition-all duration-200
                                  focus:outline-none focus:ring-2 focus:ring-offset-2
                                  ${currentFile.is_password_protected
                                    ? 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 focus:ring-amber-500'
                                    : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50 focus:ring-slate-500'}`}
                    >
                      {currentFile.is_password_protected
                        ? <><FaKey className="h-3.5 w-3.5" /> Gérer le mot de passe</>
                        : <><FaLock className="h-3.5 w-3.5" /> Ajouter un mot de passe</>}
                    </button>
                    {currentFile.is_password_protected && (
                      <p className="text-xs text-gray-400 text-center">
                        Les non-managers doivent saisir le mot de passe pour toute action.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Dropbox */}
              {canManageFile && (
                <motion.div
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                  variants={item}
                >
                  <div className="p-4">
                    <SaveToDropboxButton
                      fileId={currentFile.id}
                      className="w-full flex items-center justify-center px-4 py-2.5 border border-transparent
                                 rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600
                                 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2
                                 focus:ring-purple-500 transition-all duration-200"
                      text="Sauvegarder sur Dropbox"
                    />
                  </div>
                </motion.div>
              )}

              {/* File info */}
              <motion.div
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                variants={item}
              >
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">Informations</h2>
                </div>
                <div className="p-6 space-y-4">
                  <RelatedInfo
                    icon={<FaFileAlt className="h-5 w-5 text-blue-600" />}
                    title="Type de fichier"
                    value={currentFile.type || '-'}
                  />
                  <RelatedInfo
                    icon={<FaClock className="h-5 w-5 text-purple-600" />}
                    title="Date de création"
                    value={currentFile.created_at
                      ? new Date(currentFile.created_at).toLocaleString('fr-FR') : '-'}
                  />
                  <RelatedInfo
                    icon={<FaClock className="h-5 w-5 text-yellow-600" />}
                    title="Dernière modification"
                    value={currentFile.updated_at
                      ? new Date(currentFile.updated_at).toLocaleString('fr-FR') : '-'}
                  />
                </div>
              </motion.div>

              {/* Related entities */}
              <motion.div
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                variants={item}
              >
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">Liens associés</h2>
                </div>
                <div className="p-6 space-y-4">
                  {currentFile.project && (
                    <RelatedInfo
                      icon={<FaProjectDiagram className="h-5 w-5 text-green-600" />}
                      title="Projet"
                      value={currentFile.project.name}
                      href={route('projects.show', currentFile.project.id)}
                    />
                  )}
                  {currentFile.task ? (
                    <RelatedInfo
                      icon={<FaTasks className="h-5 w-5 text-indigo-600" />}
                      title="Tâche"
                      value={
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full
                                         text-xs font-medium bg-blue-100 text-blue-800">
                          <FaTasks className="mr-1.5 h-3 w-3" />{currentFile.task.title}
                        </span>
                      }
                      href={`/tasks/${currentFile.task.id}`}
                    />
                  ) : (
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <FaTasks className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900">Tâche</h3>
                        <span className="text-sm text-gray-500">Non associée</span>
                      </div>
                    </div>
                  )}
                  <RelatedInfo
                    icon={<FaUser className="h-5 w-5 text-amber-600" />}
                    title="Déposé par"
                    value={currentFile.user?.name || 'Utilisateur inconnu'}
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Delete modal ──────────────────────────────────────────────────── */}
      <Transition appear show={isDeleteModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsDeleteModalOpen(false)}>
          <Transition.Child as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200"  leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment}
                enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Confirmer la suppression
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Êtes-vous sûr de vouloir supprimer ce fichier ? Cette action est irréversible.
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end space-x-3">
                    <button type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100
                                 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                      onClick={() => setIsDeleteModalOpen(false)}>
                      Annuler
                    </button>
                    <button type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-600
                                 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                      onClick={() => { setIsDeleteModalOpen(false); confirmDelete(); }}>
                      Supprimer
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* ── Password manager modal ────────────────────────────────────────── */}
      <PasswordManagerModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        file={currentFile}
        onSaved={handlePasswordSaved}
      />
    </AdminLayout>
  );
};

export default Show;
