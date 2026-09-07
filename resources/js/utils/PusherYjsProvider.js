// resources/js/Utils/PusherYjsProvider.js
import * as Y from 'yjs';
import axios from 'axios';
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
  removeAwarenessStates
} from 'y-protocols/awareness';

const toBase64 = (u8) => btoa(String.fromCharCode(...new Uint8Array(u8)));
const fromBase64 = (b64) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

export class PusherYjsProvider {
  constructor({ pusher, channelName, ydoc, user, fileId, flushDelay = 80, saveDelay = 4000 }) {
    this.ydoc = ydoc;
    this.user = user;
    this.fileId = fileId;
    this.awareness = new Awareness(ydoc);
    this.channel = pusher.subscribe(channelName);

    this.flushDelay = flushDelay;
    this._pendingUpdates = [];
    this._flushTimer = null;

    this.saveDelay = saveDelay;
    this._saveTimer = null;
    this._destroyed = false;

    this.awareness.setLocalStateField('user', user);

    // ── Envoi des changements locaux du document ──
    this._onDocUpdate = (update, origin) => {
      if (origin === this) return;
      this._pendingUpdates.push(update);
      this._scheduleFlush();
      this._scheduleSave();
    };
    this.ydoc.on('update', this._onDocUpdate);

    // ── Envoi des changements de présence ──
    this._onAwarenessUpdate = ({ added, updated, removed }) => {
      const changed = added.concat(updated).concat(removed);
      const update = encodeAwarenessUpdate(this.awareness, changed);
      this._safeTrigger('client-awareness', { update: toBase64(update) });
    };
    this.awareness.on('update', this._onAwarenessUpdate);

    // ── Réception des mises à jour ──
    this.channel.bind('client-yjs-update', (data) => {
      try {
        Y.applyUpdate(this.ydoc, fromBase64(data.update), this);
      } catch (e) {
        console.error("Erreur Yjs update:", e);
      }
    });

    this.channel.bind('client-awareness', (data) => {
      try {
        applyAwarenessUpdate(this.awareness, fromBase64(data.update), this);
      } catch (e) {
        console.error("Erreur awareness update:", e);
      }
    });

    this.channel.bind('client-yjs-sync', (data) => {
      if (data.to !== this.user.id) return;
      try {
        Y.applyUpdate(this.ydoc, fromBase64(data.state), this);
      } catch (e) {
        console.error("Erreur Yjs sync:", e);
      }
    });

    // ── Rattrapage : envoi de l'état complet à un nouveau membre ──
    this.channel.bind('pusher:member_added', (member) => {
      const state = Y.encodeStateAsUpdate(this.ydoc);
      this._safeTrigger('client-yjs-sync', { state: toBase64(state), to: member.id });
    });

    this.channel.bind('pusher:member_removed', (member) => {
      // Fix: member.id (presence channel) est une string, s.user.id (Laravel) est un number.
      // On force la comparaison en string pour éviter les curseurs fantômes.
      const clientIds = [...this.awareness.getStates().entries()]
        .filter(([, s]) => String(s.user?.id) === String(member.id))
        .map(([id]) => id);
      removeAwarenessStates(this.awareness, clientIds, this);
    });

    // ── Sauvegarde avant fermeture/rechargement de la page ──
    this._onBeforeUnload = () => {
      this._persistState(true);
    };
    window.addEventListener('beforeunload', this._onBeforeUnload);
  }

  _scheduleFlush() {
    if (this._flushTimer) return;
    this._flushTimer = setTimeout(() => {
      const merged = Y.mergeUpdates(this._pendingUpdates);
      this._pendingUpdates = [];
      this._flushTimer = null;
      this._safeTrigger('client-yjs-update', { update: toBase64(merged) });
    }, this.flushDelay);
  }

  _scheduleSave() {
    if (this._saveTimer) return;
    this._saveTimer = setTimeout(() => {
      this._saveTimer = null;
      this._persistState();
    }, this.saveDelay);
  }

  async _persistState(useBeacon = false) {
    if (this._destroyed) return;
    const state = Y.encodeStateAsUpdate(this.ydoc);
    const payload = { state: toBase64(state) };

    // Sur beforeunload, axios peut ne pas avoir le temps de finir la requête.
    // On utilise sendBeacon en dernier recours (pas de retour d'erreur possible).
    if (useBeacon && navigator.sendBeacon) {
      try {
        const url = route('files.update-yjs-state', this.fileId);
        const token = document.querySelector('meta[name="csrf-token"]')?.content;
        const blob = new Blob(
          [JSON.stringify({ ...payload, _token: token, _method: 'PUT' })],
          { type: 'application/json' }
        );
        navigator.sendBeacon(url, blob);
      } catch (e) {
        console.error('Erreur sendBeacon Yjs state:', e);
      }
      return;
    }

    try {
      await axios.put(route('files.update-yjs-state', this.fileId), payload);
    } catch (e) {
      console.error('Erreur sauvegarde Yjs state:', e);
    }
  }

  _safeTrigger(event, payload) {
    if (this.channel.subscribed) {
      this.channel.trigger(event, payload);
    }
  }

  destroy() {
    this._destroyed = true;

    if (this._flushTimer) clearTimeout(this._flushTimer);
    if (this._saveTimer) clearTimeout(this._saveTimer);

    // Dernière sauvegarde synchrone à la fermeture du composant.
    this._persistState();

    window.removeEventListener('beforeunload', this._onBeforeUnload);

    this.ydoc.off('update', this._onDocUpdate);
    this.awareness.off('update', this._onAwarenessUpdate);
    this.channel.unbind_all();
    this.channel.unsubscribe();
    this.awareness.destroy();
  }
}