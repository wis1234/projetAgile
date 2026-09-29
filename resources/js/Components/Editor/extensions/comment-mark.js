import { Mark, mergeAttributes } from '@tiptap/core';

/**
 * Marque "commentaire" : ancre un fil de discussion sur un passage sélectionné.
 * Le contenu des commentaires est stocké dans le Y.Map "comments" du document Yjs
 * (donc synchronisé en temps réel et sauvegardé avec le document).
 */
export const CommentMark = Mark.create({
  name: 'comment',
  inclusive: false,
  keepOnSplit: false,
  excludes: '', // autorise plusieurs commentaires superposés

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-comment-id'),
        renderHTML: (attrs) => (attrs.commentId ? { 'data-comment-id': attrs.commentId } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-comment-id]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({ class: 'comment-mark' }, HTMLAttributes), 0];
  },
});

export default CommentMark;
