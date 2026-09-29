import { Extension, Mark, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { Fragment, Slice } from '@tiptap/pm/model';

/**
 * Suivi des modifications (mode « Suggestion », comme Google Docs / Word).
 *
 * - En mode suggestion, le texte tapé est marqué « insertion » (souligné, couleur de l'auteur)
 *   et le texte supprimé est marqué « suppression » (barré) au lieu d'être réellement supprimé.
 * - Les marques font partie du document Yjs : elles sont synchronisées en temps réel.
 * - Accepter une insertion / rejeter une suppression = garder le texte ; l'inverse = le retirer.
 *
 * Limite : seules les modifications de TEXTE sont suivies (pas la mise en forme ni la
 * structure des paragraphes).
 */

const PALETTE = ['#1a73e8', '#188038', '#e37400', '#9334e6', '#d01884', '#00796b', '#c5221f', '#5f6368'];
export const suggestionColor = (userId) => PALETTE[Math.abs(Number(userId) || 0) % PALETTE.length];

const suggestionAttributes = () => ({
  changeId: {
    default: null,
    parseHTML: (el) => el.getAttribute('data-change-id'),
    renderHTML: (a) => (a.changeId ? { 'data-change-id': a.changeId } : {}),
  },
  userId: {
    default: null,
    parseHTML: (el) => el.getAttribute('data-user-id'),
    renderHTML: (a) => (a.userId != null ? { 'data-user-id': String(a.userId) } : {}),
  },
  userName: {
    default: null,
    parseHTML: (el) => el.getAttribute('data-user-name'),
    renderHTML: (a) => (a.userName ? { 'data-user-name': a.userName } : {}),
  },
  createdAt: {
    default: null,
    parseHTML: (el) => el.getAttribute('data-created'),
    renderHTML: (a) => (a.createdAt ? { 'data-created': a.createdAt } : {}),
  },
});

export const InsertionMark = Mark.create({
  name: 'insertion',
  inclusive: false,
  keepOnSplit: false,
  excludes: '',
  addAttributes: suggestionAttributes,
  parseHTML() { return [{ tag: 'span[data-suggest="ins"]' }]; },
  renderHTML({ mark, HTMLAttributes }) {
    return ['span', mergeAttributes(
      { 'data-suggest': 'ins', class: 'tc-ins', style: `--tc-color:${suggestionColor(mark.attrs.userId)}` },
      HTMLAttributes
    ), 0];
  },
});

export const DeletionMark = Mark.create({
  name: 'deletion',
  inclusive: false,
  keepOnSplit: false,
  excludes: '',
  addAttributes: suggestionAttributes,
  parseHTML() { return [{ tag: 'span[data-suggest="del"]' }]; },
  renderHTML({ mark, HTMLAttributes }) {
    return ['span', mergeAttributes(
      { 'data-suggest': 'del', class: 'tc-del', style: `--tc-color:${suggestionColor(mark.attrs.userId)}` },
      HTMLAttributes
    ), 0];
  },
});

/* ───────────────────────── utilitaires ───────────────────────── */

const newId = () => `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const sameUser = (m, user) => String(m.attrs.userId) === String(user.id);
const attrsFor = (user, changeId) => ({
  changeId, userId: user.id, userName: user.name, createdAt: new Date().toISOString(),
});

/** Réutilise l'identifiant d'une modification voisine du même auteur (frappe continue = une seule modification). */
function adjacentId(doc, pos, type, user, dir) {
  const $p = doc.resolve(pos);
  const node = dir < 0 ? $p.nodeBefore : $p.nodeAfter;
  const m = node?.marks.find((x) => x.type === type && sameUser(x, user));
  return m ? m.attrs.changeId : null;
}

/**
 * Marque [from, to] comme supprimé. Le texte inséré par le même auteur est réellement retiré
 * (annuler sa propre suggestion). Retourne { removed } = nb de caractères réellement supprimés.
 */
function markDeleted(tr, from, to, user) {
  const { insertion: ins, deletion: del } = tr.doc.type.schema.marks;
  const segs = [];
  tr.doc.nodesBetween(from, to, (node, pos) => {
    if (!node.isInline) return true;
    const s = Math.max(pos, from);
    const e = Math.min(pos + node.nodeSize, to);
    if (e > s) segs.push({ s, e, marks: node.marks });
    return false;
  });

  const own = [];
  const toMark = [];
  segs.forEach((seg) => {
    if (seg.marks.some((m) => m.type === ins && sameUser(m, user))) own.push(seg);
    else if (!seg.marks.some((m) => m.type === del)) toMark.push(seg);
  });

  if (toMark.length) {
    const id = adjacentId(tr.doc, from, del, user, -1) || adjacentId(tr.doc, to, del, user, 1) || newId();
    toMark.forEach((seg) => tr.addMark(seg.s, seg.e, del.create(attrsFor(user, id))));
  }

  let removed = 0;
  own.sort((a, b) => b.s - a.s).forEach((seg) => {
    tr.delete(seg.s, seg.e);
    removed += seg.e - seg.s;
  });
  return { removed };
}

/** Limites d'un mot (pour Ctrl+Retour arrière / Ctrl+Suppr). */
function wordEdge(text, offset, dir) {
  let i = offset;
  if (dir < 0) {
    while (i > 0 && /\s/.test(text[i - 1])) i--;
    while (i > 0 && !/\s/.test(text[i - 1])) i--;
  } else {
    while (i < text.length && /\s/.test(text[i])) i++;
    while (i < text.length && !/\s/.test(text[i])) i++;
  }
  return i;
}

/** Suppression suivie à la position du curseur. Retourne true si l'évènement est géré. */
function trackedDelete(view, user, dir, word) {
  const { state } = view;
  const { selection } = state;
  const tr = state.tr;

  // Sélection non vide : on marque toute la sélection
  if (!selection.empty) {
    const { from, to } = selection;
    markDeleted(tr, from, to, user);
    const pos = tr.mapping.map(dir < 0 ? from : to);
    tr.setSelection(TextSelection.create(tr.doc, Math.min(pos, tr.doc.content.size)));
    view.dispatch(tr.scrollIntoView());
    return true;
  }

  const $from = selection.$from;
  const parent = $from.parent;
  if (!parent.isTextblock) return false;

  // Début / fin de paragraphe : comportement normal (fusion de blocs, non suivie)
  if (dir < 0 && $from.parentOffset === 0) return false;
  if (dir > 0 && $from.parentOffset === parent.content.size) return false;

  const del = state.schema.marks.deletion;
  const blockStart = $from.start();
  let pos = $from.pos;

  // Cherche la cible en sautant le texte déjà marqué comme supprimé
  const charAt = (p, d) => {
    const $p = state.doc.resolve(p);
    const node = d < 0 ? $p.nodeBefore : $p.nodeAfter;
    if (!node) return null;
    let size = 1;
    if (node.isText) {
      const t = node.text;
      if (d < 0 ? /[\uDC00-\uDFFF]$/.test(t) : /^[\uD800-\uDBFF]/.test(t)) size = 2;
    }
    return { node, size };
  };

  let guard = 0;
  while (guard++ < 5000) {
    const c = charAt(pos, dir);
    if (!c) return true; // rien de plus à supprimer dans ce bloc
    if (c.node.marks.some((m) => m.type === del)) { pos += dir * c.size; continue; }
    break;
  }
  const first = charAt(pos, dir);
  if (!first) { view.dispatch(tr.setSelection(TextSelection.create(state.doc, pos))); return true; }

  let from;
  let to;
  if (word) {
    const text = parent.textBetween(0, parent.content.size, undefined, '\ufffc');
    const offset = pos - blockStart;
    const edge = wordEdge(text, offset, dir);
    from = blockStart + Math.min(offset, edge);
    to = blockStart + Math.max(offset, edge);
  } else if (dir < 0) { from = pos - first.size; to = pos; }
  else { from = pos; to = pos + first.size; }

  markDeleted(tr, from, to, user);
  const target = dir < 0 ? from : to;
  tr.setSelection(TextSelection.create(tr.doc, Math.min(tr.mapping.map(target), tr.doc.content.size)));
  view.dispatch(tr.scrollIntoView());
  return true;
}

/* ───────────────────────── extension ───────────────────────── */

export const suggestionKey = new PluginKey('suggestionMode');

export const SuggestionMode = Extension.create({
  name: 'suggestionMode',

  addStorage() {
    return { enabled: false, user: null };
  },

  addProseMirrorPlugins() {
    const storage = this.storage;
    const active = (view) => storage.enabled && storage.user && view.editable;

    return [
      new Plugin({
        key: suggestionKey,
        props: {
          handleTextInput(view, from, to, text) {
            if (!active(view)) return false;
            const user = storage.user;
            const { insertion: ins, deletion: del } = view.state.schema.marks;
            const tr = view.state.tr;
            let at = from;

            if (to > from) {
              markDeleted(tr, from, to, user);
              at = tr.mapping.map(to);
            }

            const id = adjacentId(tr.doc, at, ins, user, -1) || newId();
            tr.insertText(text, at);
            tr.removeMark(at, at + text.length, del);
            tr.addMark(at, at + text.length, ins.create(attrsFor(user, id)));
            tr.setSelection(TextSelection.create(tr.doc, at + text.length));
            view.dispatch(tr.scrollIntoView());
            return true;
          },

          handleKeyDown(view, event) {
            if (!active(view)) return false;
            if (event.key !== 'Backspace' && event.key !== 'Delete') return false;
            const word = event.ctrlKey || event.altKey;
            if (event.metaKey && !word) return false;
            return trackedDelete(view, storage.user, event.key === 'Backspace' ? -1 : 1, word);
          },

          handlePaste(view) {
            if (!active(view)) return false;
            const { selection } = view.state;
            if (selection.empty) return false;
            // Le texte remplacé est marqué supprimé, puis le collage se fait juste après
            const tr = view.state.tr;
            markDeleted(tr, selection.from, selection.to, storage.user);
            const end = tr.mapping.map(selection.to);
            tr.setSelection(TextSelection.create(tr.doc, end));
            view.dispatch(tr);
            return false;
          },

          transformPasted(slice, view) {
            if (!view || !active(view)) return slice;
            const { insertion: ins, deletion: del } = view.state.schema.marks;
            const mark = ins.create(attrsFor(storage.user, newId()));
            const mapFragment = (fragment) => {
              const nodes = [];
              fragment.forEach((node) => {
                if (node.isText) {
                  nodes.push(node.mark(node.marks.filter((m) => m.type !== ins && m.type !== del).concat(mark)));
                } else {
                  nodes.push(node.copy(mapFragment(node.content)));
                }
              });
              return Fragment.fromArray(nodes);
            };
            return new Slice(mapFragment(slice.content), slice.openStart, slice.openEnd);
          },

          handleDOMEvents: {
            cut(view, event) {
              if (!active(view) || view.state.selection.empty) return false;
              event.preventDefault();
              try { document.execCommand('copy'); } catch { /* ignore */ }
              return trackedDelete(view, storage.user, -1, false);
            },
            // Claviers virtuels (mobile) : la touche « retour arrière » n'émet pas toujours keydown
            beforeinput(view, event) {
              if (!active(view)) return false;
              const t = event.inputType;
              const map = {
                deleteContentBackward: [-1, false], deleteContentForward: [1, false],
                deleteWordBackward: [-1, true], deleteWordForward: [1, true],
              };
              if (!map[t]) return false;
              const handled = trackedDelete(view, storage.user, map[t][0], map[t][1]);
              if (handled) event.preventDefault();
              return handled;
            },
          },
        },
      }),
    ];
  },
});

/* ───────────────────── lecture / résolution ───────────────────── */

/** Liste les modifications en attente (regroupées par identifiant). */
export function collectSuggestions(doc) {
  const map = new Map();
  doc.descendants((node, pos) => {
    if (!node.isInline) return true;
    node.marks.forEach((m) => {
      if (m.type.name !== 'insertion' && m.type.name !== 'deletion') return;
      const id = m.attrs.changeId;
      if (!id) return;
      let c = map.get(id);
      if (!c) {
        c = { id, type: m.type.name, userId: m.attrs.userId, userName: m.attrs.userName, createdAt: m.attrs.createdAt, ranges: [], excerpt: '' };
        map.set(id, c);
      }
      const end = pos + node.nodeSize;
      const last = c.ranges[c.ranges.length - 1];
      if (last && last.to === pos) last.to = end; else c.ranges.push({ from: pos, to: end });
      if (node.isText && c.excerpt.length < 200) c.excerpt += node.text;
    });
    return false;
  });
  return Array.from(map.values()).map((c) => ({
    ...c,
    status: 'pending',
    excerpt: c.excerpt.length > 160 ? `${c.excerpt.slice(0, 157)}…` : c.excerpt,
  }));
}

/** Accepte ou rejette une modification. Retourne false si elle n'existe plus. */
export function resolveSuggestion(editor, id, accept) {
  const { state, view } = editor;
  const { insertion: ins, deletion: del } = state.schema.marks;
  const found = [];
  state.doc.descendants((node, pos) => {
    if (!node.isInline) return true;
    node.marks.forEach((m) => {
      if ((m.type === ins || m.type === del) && m.attrs.changeId === id) {
        found.push({ from: pos, to: pos + node.nodeSize, mark: m });
      }
    });
    return false;
  });
  if (!found.length) return false;

  const tr = state.tr;
  const remove = [];
  found.forEach((r) => {
    const keepText = (r.mark.type === ins && accept) || (r.mark.type === del && !accept);
    if (keepText) tr.removeMark(r.from, r.to, r.mark);
    else remove.push(r);
  });
  remove.sort((a, b) => b.from - a.from).forEach((r) => tr.delete(r.from, r.to));
  view.dispatch(tr);
  return true;
}

export default SuggestionMode;
