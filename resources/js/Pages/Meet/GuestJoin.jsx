import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { FaVideo, FaUser, FaSignInAlt, FaPhoneSlash, FaLink } from 'react-icons/fa';
import LiveKitCallModal from '@/Components/LiveKitCallModal';

export default function GuestJoin({ expired, error, token, projectName, inviteCode }) {
  const [guestName, setGuestName] = useState('');
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [tokenEndpoint, setTokenEndpoint] = useState('');
  const [submitError, setSubmitError] = useState('');

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    setJoining(true);
    setSubmitError('');

    try {
      // On enregistre l'endpoint de token pour le LiveKitCallModal
      setTokenEndpoint(`/meet/join/${token}/token?guest_name=${encodeURIComponent(guestName.trim())}`);
      setJoined(true);
    } catch (err) {
      setSubmitError(err.message || 'Impossible de rejoindre l\'appel');
      setJoining(false);
    }
  };

  // ─── Appel terminé ou lien invalide ─────────────────────────────────
  if (expired) {
    return (
      <>
        <Head title="Appel terminé — ProJA Meet" />
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-6">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
              <FaPhoneSlash className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-3">
              {error === 'link_invalid' ? 'Lien invalide' : 'Cet appel est terminé'}
            </h1>
            <p className="text-slate-400 mb-8">
              {error === 'link_invalid'
                ? 'Ce lien d\'invitation n\'existe pas ou a été supprimé.'
                : `L'appel sur « ${projectName} » est terminé. Le lien d'invitation n'est plus valide.`
              }
            </p>
            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">P</span>
              </div>
              ProJA Meet
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Appel rejoint → afficher le modal LiveKit ─────────────────────
  if (joined) {
    return (
      <>
        <Head title={`Appel — ${projectName} — ProJA Meet`} />
        <LiveKitCallModal
          tokenEndpoint={tokenEndpoint}
          isHost={false}
          skipIncomingScreen={true}
          title={projectName}
          callerName={`Invité — ${guestName}`}
          onClose={() => {
            setJoined(false);
            setJoining(false);
            // Rediriger vers la page d'accueil après avoir quitté
            window.location.href = '/';
          }}
        />
      </>
    );
  }

  // ─── Formulaire d'entrée invité ─────────────────────────────────────
  return (
    <>
      <Head title={`Rejoindre l'appel — ${projectName} — ProJA Meet`} />
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-6">
        <div className="max-w-md w-full">
          {/* Header / Branding */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
              <FaVideo className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-1">ProJA Meet</h1>
            <p className="text-slate-400">Vous êtes invité à rejoindre un appel</p>
          </div>

          {/* Carte du formulaire */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            {/* Info projet */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                <FaLink className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-white">{projectName}</p>
                <p className="text-xs text-slate-500">Code : {inviteCode}</p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                En cours
              </span>
            </div>

            <form onSubmit={handleJoin} className="space-y-5">
              <div>
                <label htmlFor="guest_name" className="block text-sm font-medium text-slate-300 mb-2">
                  Votre nom
                </label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    id="guest_name"
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Entrez votre nom"
                    maxLength={50}
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {submitError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 px-4 py-2.5 text-sm">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={!guestName.trim() || joining}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joining ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Connexion en cours…
                  </>
                ) : (
                  <>
                    <FaSignInAlt className="w-4 h-4" />
                    Rejoindre l'appel
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-600 mt-6">
            Vous rejoindrez en tant qu'invité. Aucun compte requis.
          </p>
        </div>
      </div>
    </>
  );
}
