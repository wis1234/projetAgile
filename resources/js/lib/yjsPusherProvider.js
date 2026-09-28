/**
 * Provider Yjs qui transporte les mises à jour via les "whispers" (client events)
 * d'un canal de présence Laravel Echo / Pusher.
 *
 * Prérequis : "Enable client events" activé dans le tableau de bord Pusher.
 * Limites Pusher respectées : 10 messages / seconde / client, 10 Ko / message.
 */
import * as Y from 'yjs';
import {
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
  removeAwarenessStates,
} from 'y-protocols/awareness';

const CHUNK_SIZE = 6000;      // caractères base64 par message (< 10 Ko)
const SEND_INTERVAL = 110;    // ms entre deux messages (~9 msg/s max)
const FLUSH_DELAY = 120;      // regroupement des mises à jour locales
const AWARENESS_DELAY = 250;  // regroupement des curseurs

export const toBase64 = (u8) => {
  let s = '';
  const step = 0x8000;
  for (let i = 0; i < u8.length; i += step) {
    s += String.fromCharCode.apply(null, u8.subarray(i, i + step));
  }
  return btoa(s);
};

export const fromBase64 = (b64) => {
  const s = atob(b64);
  const u8 = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
  return u8;
};

const rid = () => Math.random().toString(36).slice(2, 10);

export class PusherYjsProvider {
  constructor({ doc, awareness, readOnly = false, onReload = null }) {
    this.doc = doc;
    this.awareness = awareness;
    this.readOnly = readOnly;
    this.onReload = onReload;

    this.channel = null;
    this.ready = false;
    this.hereCount = 0;
    this.destroyed = false;

    this.queue = [];
    this.pending = [];
    this.buffers = new Map();
    this.pendingSync = new Map();
    this.awChanged = new Set();
    this.flushTimer = null;
    this.sendTimer = null;
    this.awTimer = null;
    this.gcTimer = null;

    this._onDocUpdate = (update, origin) => {
      if (this.readOnly || this.destroyed) return;
      if (origin === this || origin === 'init') return;
      this.pending.push(update);
      if (!this.flushTimer) {
        this.flushTimer = setTimeout(() => this._flush(), FLUSH_DELAY);
      }
    };

    this._onAwarenessUpdate = ({ added, updated, removed }, origin) => {
      if (origin === this || this.destroyed) return;
      [...added, ...updated, ...removed].forEach((id) => this.awChanged.add(id));
      if (!this.awTimer) {
        this.awTimer = setTimeout(() => this._flushAwareness(), AWARENESS_DELAY);
      }
    };
  }

  /** Branche le provider sur un canal de présence Echo (déjà obtenu via Echo.join). */
  attach(channel) {
    this.channel = channel;

    channel
      .here((users) => {
        this.hereCount += 1;
        this.ready = true;
        if (this.hereCount > 1 && !this.readOnly) {
          // Reconnexion : renvoyer notre état complet (Yjs est idempotent)
          this._send('yjs-sync', toBase64(Y.encodeStateAsUpdate(this.doc)), rid());
        }
        if (users.length > 1) this._requestSync();
        this._sendOwnAwareness();
        this._pump();
      })
      .joining(() => this._sendOwnAwareness())
      .leaving((user) => {
        const ids = [];
        this.awareness.getStates().forEach((state, clientId) => {
          if (state?.user?.id === user.id && clientId !== this.doc.clientID) ids.push(clientId);
        });
        if (ids.length) removeAwarenessStates(this.awareness, ids, this);
      });

    channel.listenForWhisper('yjs-update', (m) => this._recv('yjs-update', m));
    channel.listenForWhisper('yjs-sync', (m) => this._recv('yjs-sync', m));
    channel.listenForWhisper('yjs-sync-req', (m) => this._recv('yjs-sync-req', m));
    channel.listenForWhisper('yjs-aw', (m) => this._recv('yjs-aw', m));
    channel.listenForWhisper('yjs-reload', (m) => this._recv('yjs-reload', m));

    this.doc.on('update', this._onDocUpdate);
    this.awareness.on('update', this._onAwarenessUpdate);

    this.gcTimer = setInterval(() => {
      const now = Date.now();
      this.buffers.forEach((b, id) => { if (now - b.t > 30000) this.buffers.delete(id); });
    }, 15000);
  }

  /** Prévient les autres collaborateurs qu'ils doivent recharger (ex. après restauration). */
  notifyReload() {
    this._send('yjs-reload', 'x');
  }

  destroy() {
    this.destroyed = true;
    this.doc.off('update', this._onDocUpdate);
    this.awareness.off('update', this._onAwarenessUpdate);
    [this.flushTimer, this.sendTimer, this.awTimer].forEach((t) => t && clearTimeout(t));
    this.pendingSync.forEach((t) => clearTimeout(t));
    if (this.gcTimer) clearInterval(this.gcTimer);
    this.pendingSync.clear();
    this.buffers.clear();
    this.queue = [];
    try {
      ['yjs-update', 'yjs-sync', 'yjs-sync-req', 'yjs-aw', 'yjs-reload'].forEach((e) =>
        this.channel?.stopListeningForWhisper(e)
      );
    } catch { /* ignore */ }
  }

  /* ───────────────────────── envoi ───────────────────────── */

  _flush() {
    this.flushTimer = null;
    if (!this.pending.length) return;
    const merged = this.pending.length === 1 ? this.pending[0] : Y.mergeUpdates(this.pending);
    this.pending = [];
    this._send('yjs-update', toBase64(merged));
  }

  _flushAwareness() {
    this.awTimer = null;
    const ids = [...this.awChanged];
    this.awChanged.clear();
    if (!ids.length) return;
    this._send('yjs-aw', toBase64(encodeAwarenessUpdate(this.awareness, ids)));
  }

  _sendOwnAwareness() {
    if (this.awareness.getLocalState() == null) return;
    this._send('yjs-aw', toBase64(encodeAwarenessUpdate(this.awareness, [this.doc.clientID])));
  }

  _requestSync() {
    this._send('yjs-sync-req', 'x', rid());
  }

  _send(event, data, r) {
    const id = rid();
    const n = Math.max(1, Math.ceil(data.length / CHUNK_SIZE));
    for (let i = 0; i < n; i++) {
      const payload = { id, i, n, d: data.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE) };
      if (r) payload.r = r;
      this.queue.push({ event, payload });
    }
    this._pump();
  }

  _pump() {
    if (this.destroyed || !this.ready || this.sendTimer || !this.queue.length) return;
    const { event, payload } = this.queue.shift();
    try {
      this.channel.whisper(event, payload);
    } catch (e) {
      console.warn('[yjs] whisper impossible', e);
    }
    this.sendTimer = setTimeout(() => {
      this.sendTimer = null;
      this._pump();
    }, SEND_INTERVAL);
  }

  /* ─────────────────────── réception ─────────────────────── */

  _recv(event, m) {
    if (this.destroyed || !m || typeof m.d !== 'string') return;

    let data = m.d;
    if (m.n > 1) {
      let b = this.buffers.get(m.id);
      if (!b) {
        b = { parts: new Array(m.n), got: 0, t: Date.now() };
        this.buffers.set(m.id, b);
      }
      if (b.parts[m.i] === undefined) {
        b.parts[m.i] = m.d;
        b.got += 1;
      }
      if (b.got < m.n) return;
      this.buffers.delete(m.id);
      data = b.parts.join('');
    }

    try {
      switch (event) {
        case 'yjs-update':
          Y.applyUpdate(this.doc, fromBase64(data), this);
          break;

        case 'yjs-sync':
          if (m.r && this.pendingSync.has(m.r)) {
            clearTimeout(this.pendingSync.get(m.r));
            this.pendingSync.delete(m.r);
          }
          Y.applyUpdate(this.doc, fromBase64(data), this);
          break;

        case 'yjs-sync-req': {
          if (!m.r || this.pendingSync.has(m.r)) break;
          const t = setTimeout(() => {
            this.pendingSync.delete(m.r);
            if (this.destroyed) return;
            this._send('yjs-sync', toBase64(Y.encodeStateAsUpdate(this.doc)), m.r);
            this._sendOwnAwareness();
          }, 50 + Math.random() * 450);
          this.pendingSync.set(m.r, t);
          break;
        }

        case 'yjs-aw':
          applyAwarenessUpdate(this.awareness, fromBase64(data), this);
          break;

        case 'yjs-reload':
          this.onReload?.();
          break;

        default:
          break;
      }
    } catch (e) {
      console.warn('[yjs] message ignoré', event, e);
    }
  }
}
