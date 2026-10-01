import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FaPhoneAlt } from 'react-icons/fa';
import LiveKitCallModal from '@/Components/LiveKitCallModal';

const freshCsrf = async () => {
  try {
    const res = await fetch('/csrf-token', { credentials: 'include' });
    const data = await res.json();
    document.querySelector('meta[name="csrf-token"]')?.setAttribute('content', data.token);
    return data.token;
  } catch {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  }
};

const post = async (url, body) => {
  const token = await freshCsrf();
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': token },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error('call_failed');
  return res.json();
};

/**
 * Appel direct (façon WhatsApp) : un tap sonne UNE seule personne, sans écran de sélection.
 * Il réutilise l'infrastructure LiveKit du projet partagé : la salle est celle du projet commun
 * et seul le contact est « sonné » (member_ids = [contact]).
 */
export default function DirectCallButton({ contact, variant = 'dark', onError }) {
  const projectId = contact?.shared_project_id;
  const [open, setOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [isInitiator, setIsInitiator] = useState(false);

  const start = async () => {
    if (!projectId || starting) {
      if (!projectId) onError?.("Aucun projet en commun : l'appel direct n'est pas disponible.");
      return;
    }
    setStarting(true);
    setOpen(true);
    try {
      const data = await post(`/projects/${projectId}/livekit-call/join-or-start`, { member_ids: [contact.id] });
      setIsInitiator(!!data.isInitiator);
      if (data.inviteUrl) setInviteLink(data.inviteUrl);
    } catch {
      setOpen(false);
      onError?.("Impossible de lancer l'appel. Réessayez dans un instant.");
    } finally {
      setStarting(false);
    }
  };

  const close = async () => {
    setOpen(false);
    setInviteLink('');
    if (isInitiator) {
      const token = await freshCsrf();
      fetch(`/projects/${projectId}/livekit-call/end`, {
        method: 'POST', credentials: 'same-origin',
        headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': token },
      }).catch(() => {});
    }
  };

  const cls = variant === 'dark'
    ? 'text-white/90 hover:bg-white/15'
    : 'text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-white/10';

  return (
    <>
      <button
        type="button"
        onClick={start}
        disabled={!projectId}
        title={projectId ? `Appeler ${contact?.name || ''}` : 'Aucun projet en commun'}
        aria-label={`Appeler ${contact?.name || ''}`}
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 ${cls}`}
      >
        <FaPhoneAlt className="h-[15px] w-[15px]" />
      </button>

      {open && createPortal(
        <LiveKitCallModal
          tokenEndpoint={`/projects/${projectId}/livekit-token`}
          muteEndpoint={`/projects/${projectId}/livekit-call/mute-participant`}
          inviteLink={inviteLink}
          isHost={isInitiator}
          skipIncomingScreen
          title={contact?.name}
          callerName={contact?.name}
          callerPhotoUrl={contact?.profile_photo_url || ''}
          onAnswered={async () => {
            const token = await freshCsrf();
            fetch(`/projects/${projectId}/livekit-call/answered`, {
              method: 'POST', credentials: 'same-origin',
              headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': token },
            }).catch(() => {});
          }}
          onClose={close}
        />,
        document.body,
      )}
    </>
  );
}
