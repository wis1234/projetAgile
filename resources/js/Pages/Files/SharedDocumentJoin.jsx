import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { FaFileWord, FaFileExcel, FaUsers, FaArrowRight, FaShieldAlt, FaLock } from 'react-icons/fa';

export default function SharedDocumentJoin({ file, public_permission, error }) {
  const [guestName, setGuestName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isExcel = file?.name?.toLowerCase().endsWith('.xlsx') || 
                  file?.name?.toLowerCase().endsWith('.xls') || 
                  file?.name?.toLowerCase().endsWith('.csv') ||
                  file?.type?.includes('spreadsheet');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    setSubmitting(true);
    router.post(`/shared-document/${file.share_token}`, {
      guest_name: guestName.trim(),
    });
  };

  const permText = {
    view: 'Lecture seule',
    comment: 'Commentaires autorisés',
    edit: 'Modification et collaboration en direct',
  }[public_permission] || 'Accès invité';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <Head title={`Rejoindre le document - ${file?.name || 'ProJA'}`} />

      <div className="w-full max-w-md bg-white/10 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-3xl p-8 shadow-2xl text-white">
        {/* App Logo & Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg mb-4 ${
            isExcel ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
          }`}>
            {isExcel ? <FaFileExcel /> : <FaFileWord />}
          </div>

          <span className="text-xs font-semibold tracking-wider uppercase text-blue-300 bg-blue-500/20 px-3 py-1 rounded-full mb-2">
            Collaboration ProJA en direct
          </span>

          <h1 className="text-xl font-bold text-white truncate max-w-sm" title={file?.name}>
            {file?.name || 'Document partagé'}
          </h1>

          {file?.owner_name && (
            <p className="text-xs text-slate-300 mt-1">
              Partagé par <span className="font-semibold text-white">{file.owner_name}</span>
            </p>
          )}

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {permText}
          </div>
        </div>

        {error ? (
          <div className="bg-red-500/20 border border-red-500/40 rounded-2xl p-4 text-center">
            <FaLock className="mx-auto text-red-400 text-2xl mb-2" />
            <p className="text-xs text-red-200">{error}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Votre nom ou prénom pour la session *
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="ex: Sophie Dupont (Partenaire externe)"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/15 transition"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Ce nom sera visible par les autres participants pendant que vous travaillez ensemble.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || !guestName.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50"
            >
              <span>{submitting ? 'Connexion en cours…' : 'Rejoindre et commencer à travailler'}</span>
              <FaArrowRight className="text-xs" />
            </button>

            <div className="pt-2 text-center">
              <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <FaShieldAlt className="text-slate-400" /> Session sécurisée sans mot de passe
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
