import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const searchKey = new PluginKey('searchHighlight');

/**
 * Retourne toutes les occurrences { from, to } d'un terme dans le document.
 * La recherche se fait par bloc de texte (paragraphe, titre…) : un mot coupé par une
 * mise en forme ou un commentaire (gras, couleur, surlignage…) est donc bien retrouvé.
 */
export function findMatches(doc, term, caseSensitive = false) {
  if (!term) return [];
  const needle = caseSensitive ? term : term.toLowerCase();
  const matches = [];
  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;
    let text = '';
    node.forEach((child) => {
      text += child.isText ? child.text : '\ufffc'.repeat(child.nodeSize); // objets inline (images…) = 1 caractère
    });
    const hay = caseSensitive ? text : text.toLowerCase();
    let i = 0;
    while ((i = hay.indexOf(needle, i)) !== -1) {
      matches.push({ from: pos + 1 + i, to: pos + 1 + i + needle.length });
      i += needle.length || 1;
    }
    return false;
  });
  return matches;
}

export const SearchHighlight = Extension.create({
  name: 'searchHighlight',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: searchKey,
        state: {
          init: () => ({ term: '', caseSensitive: false, current: 0 }),
          apply(tr, value) {
            const meta = tr.getMeta(searchKey);
            return meta ? { ...value, ...meta } : value;
          },
        },
        props: {
          decorations(state) {
            const { term, caseSensitive, current } = searchKey.getState(state);
            if (!term) return null;
            const matches = findMatches(state.doc, term, caseSensitive);
            if (!matches.length) return null;
            return DecorationSet.create(
              state.doc,
              matches.map((m, i) =>
                Decoration.inline(m.from, m.to, {
                  class: i === current ? 'search-match search-match-current' : 'search-match',
                })
              )
            );
          },
        },
      }),
    ];
  },
});

export default SearchHighlight;
