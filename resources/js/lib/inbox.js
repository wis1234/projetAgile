// Helpers partagés par Discussions/Index, Inbox/Show et leurs versions mobiles.
// Un seul endroit pour : appels API, nom du canal Echo, dates, état "vu" local.

const JSON_HEADERS = { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' };

export const getCsrf = () =>
  document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

// ─── Canal Echo privé d'une conversation à deux (ids triés → même canal des deux côtés) ───
export const inboxChannelName = (userAId, userBId) => {
  const ids = [Number(userAId), Number(userBId)].sort((a, b) => a - b);
  return `private-inbox.${ids[0]}.${ids[1]}`;
};

// ─── Avatar : photo de profil ou initiales générées ───
export const contactAvatar = (contact) =>
  contact?.profile_photo_url ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(contact?.name || 'User')}&background=0ea5e9&color=fff`;

// ─── "Vu" local (par appareil), même principe que discussion_seen_{taskId} ───
const SEEN_PREFIX = 'inbox_seen_';
export const getInboxSeen = (contactId) =>
  typeof window === 'undefined' ? null : localStorage.getItem(`${SEEN_PREFIX}${contactId}`);
export const setInboxSeen = (contactId) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${SEEN_PREFIX}${contactId}`, new Date().toISOString());
  }
};

// Non lu = dernier message reçu (pas de moi) et plus récent que la dernière ouverture
export const isInboxUnread = (contact) => {
  const last = contact?.last_message;
  if (!last || last.is_me) return false;
  const seen = getInboxSeen(contact.id);
  const date = last.created_at ? new Date(last.created_at) : null;
  return Boolean(date && (!seen || date > new Date(seen)));
};

// ─── Dates ───
export const formatClock = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

export const formatListTime = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return formatClock(dateString);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays < 7) return d.toLocaleDateString('fr-FR', { weekday: 'short' });
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

export const formatDayLabel = (dateString) => {
  const d = new Date(dateString);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Aujourd'hui";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const isSameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

// ─── Un message est "à moi" ? (le serveur peut fournir is_me, sinon on compare sender_id) ───
export const isMine = (message, myId) =>
  typeof message?.is_me === 'boolean'
    ? message.is_me
    : Number(message?.sender_id) === Number(myId);

// ─── Onglet actif conservé dans l'URL (?tab=inbox) pour que "Retour" revienne au bon onglet ───
export const readTabFromUrl = () => {
  if (typeof window === 'undefined') return 'tasks';
  return new URLSearchParams(window.location.search).get('tab') === 'inbox' ? 'inbox' : 'tasks';
};
export const writeTabToUrl = (tab) => {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (tab === 'inbox') url.searchParams.set('tab', 'inbox');
  else url.searchParams.delete('tab');
  window.history.replaceState(window.history.state, '', url);
};

// ─── API ───
const parseError = async (res, fallback) => {
  const payload = await res.json().catch(() => ({}));
  return new Error(payload.message || fallback);
};

export async function fetchInboxContacts() {
  const res = await fetch('/api/inbox/users', { credentials: 'same-origin', headers: JSON_HEADERS });
  if (!res.ok) throw await parseError(res, "Impossible de charger les contacts.");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchInboxConversation(contactId) {
  const res = await fetch(`/api/inbox/conversations/${contactId}`, {
    credentials: 'same-origin',
    headers: JSON_HEADERS,
  });
  if (!res.ok) throw await parseError(res, "Impossible d'ouvrir cette conversation.");
  const data = await res.json();
  return {
    messages: Array.isArray(data.messages) ? data.messages : [],
    contact: data.contact || data.user || null,
  };
}

export async function postInboxMessage(contactId, content) {
  const res = await fetch(`/api/inbox/conversations/${contactId}/messages`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { ...JSON_HEADERS, 'Content-Type': 'application/json', 'X-CSRF-TOKEN': getCsrf() },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw await parseError(res, "Erreur lors de l'envoi du message.");
  const payload = await res.json().catch(() => ({}));
  return payload?.message || null;
}
