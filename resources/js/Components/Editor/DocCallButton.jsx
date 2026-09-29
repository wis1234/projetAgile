import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaVideo } from 'react-icons/fa';
import LiveKitCallModal from '@/Components/LiveKitCallModal';
import CallMemberSelectModal from '@/Components/CallMemberSelectModal';

const getFreshCsrfToken = async () => {
  try {
    const res = await fetch('/csrf-token', { credentials: 'include' });
    const data = await res.json();
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) metaTag.setAttribute('content', data.token);
    return data.token;
  } catch {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  }
};

const postJson = async (url, body) => {
  const token = await getFreshCsrfToken();
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-TOKEN': token,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
};

/**
 * Bouton « Appel ProJA » (façon Google Meet) pour l'éditeur de documents.
 * Réutilise exactement les mêmes routes et la même modale d'appel que la page du projet :
 *  - pas d'appel en cours  → on choisit d'abord QUI appeler, puis l'appel démarre ;
 *  - appel en cours        → on le rejoint directement.
 */
export default function DocCallButton({ project, auth, compact = false, label = 'ProJA Meet' }) {
  const [callActive, setCallActive] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showSelect, setShowSelect] = useState(false);
  const [starting, setStarting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [isInitiator, setIsInitiator] = useState(false);

  const roles = Array.isArray(auth?.user?.roles) ? auth.user.roles : [];
  const isPrivileged = roles.includes('admin') || roles.includes('manager');
  const projectId = project?.id;
  const userId = auth?.user?.id;

  // Membres du projet (mêmes champs que la page projet : id, name, profile_photo_url)
  const members = useMemo(() => (project?.users || []).map((u) => ({
    id: u.id,
    name: u.name,
    profile_photo_url: u.profile_photo_url
      || (u.avatar ? (String(u.avatar).startsWith('http') ? u.avatar : `/storage/${u.avatar}`) : null),
  })), [project]);

  const refreshStatus = useCallback(() => {
    if (!projectId) return;
    fetch(`/projects/${projectId}/livekit-call/status`, { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => setCallActive(!!d.active))
      .catch(() => {});
  }, [projectId]);

  // Statut de l'appel : au chargement, puis toutes les 60 s
  useEffect(() => {
    refreshStatus();
    const iv = setInterval(refreshStatus, 60000);
    return () => clearInterval(iv);
  }, [refreshStatus]);

  // Temps réel : l'appel démarre / se termine (sans quitter le canal utilisé par le reste de l'application)
  useEffect(() => {
    if (!window.Echo || !userId || !projectId) return undefined;
    const channel = window.Echo.private(`user.${userId}`);
    const mine = (e) => String(e.projectId) === String(projectId);
    const onStarted = (e) => { if (mine(e)) setCallActive(true); };
    const onEnded = (e) => { if (mine(e)) setCallActive(false); };
    const onAnswered = (e) => { if (mine(e)) setCallActive(true); };
    channel.listen('.livekit.call.started', onStarted);
    channel.listen('.livekit.call.ended', onEnded);
    channel.listen('.livekit.call.answered', onAnswered);
    return () => {
      channel.stopListening('.livekit.call.started', onStarted);
      channel.stopListening('.livekit.call.ended', onEnded);
      channel.stopListening('.livekit.call.answered', onAnswered);
    };
  }, [userId, projectId]);

  const joinExisting = async () => {
    setShowCall(true);
    try {
      const data = await postJson(`/projects/${projectId}/livekit-call/join-or-start`);
      setCallActive(true);
      setIsInitiator(!!data.isInitiator);
      if (data.inviteUrl) setInviteLink(data.inviteUrl);
    } catch (err) {
      console.error('Erreur appel:', err);
    }
  };

  const startWithMembers = async (memberIds) => {
    setStarting(true);
    setShowCall(true);
    try {
      const data = await postJson(`/projects/${projectId}/livekit-call/join-or-start`, { member_ids: memberIds });
      setCallActive(true);
      setIsInitiator(!!data.isInitiator);
      if (data.inviteUrl) setInviteLink(data.inviteUrl);
    } catch (err) {
      console.error('Erreur appel:', err);
    } finally {
      setStarting(false);
      setShowSelect(false);
    }
  };

  const handleClick = () => {
    if (callActive) joinExisting();
    else setShowSelect(true);
  };

  if (!projectId) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title={callActive ? 'Un appel est en cours : rejoindre' : 'Lancer un appel ProJA Meet avec les membres du projet'}
        className={`flex items-center rounded-full font-medium border transition-colors flex-shrink-0 whitespace-nowrap ${
          compact ? 'gap-1.5 h-7 px-2.5 sm:px-3 text-[12.5px]' : 'gap-2 h-9 px-3 md:px-4 text-[13px]'
        } ${
          callActive
            ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
            : 'bg-white text-[#1a73e8] border-slate-300 hover:bg-[#e8f0fe]'
        }`}
      >
        <FaVideo className={compact ? 'text-[12px]' : 'text-[13px]'} />
        <span className="hidden sm:inline">{label}</span>
        {callActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
      </button>

      <CallMemberSelectModal
        show={showSelect}
        onClose={() => setShowSelect(false)}
        members={members}
        currentUserId={userId}
        onStart={startWithMembers}
        loading={starting}
      />

      {showCall && createPortal(
        <LiveKitCallModal
          tokenEndpoint={`/projects/${projectId}/livekit-token`}
          inviteLink={inviteLink}
          muteEndpoint={`/projects/${projectId}/livekit-call/mute-participant`}
          isHost={isInitiator || isPrivileged}
          skipIncomingScreen={true}
          title={project.name}
          onAnswered={async () => {
            const token = await getFreshCsrfToken();
            fetch(`/projects/${projectId}/livekit-call/answered`, {
              method: 'POST',
              headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': token },
            }).catch(() => {});
          }}
          onClose={async () => {
            setShowCall(false);
            setInviteLink('');
            refreshStatus();
            if (isInitiator) {
              const token = await getFreshCsrfToken();
              fetch(`/projects/${projectId}/livekit-call/end`, {
                method: 'POST',
                headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': token },
              }).catch(() => {});
            }
          }}
        />,
        document.body
      )}
    </>
  );
}
