import { Extension } from '@tiptap/core';

/** Interligne (comme Google Docs) sur les paragraphes et titres. */
export const LineHeight = Extension.create({
  name: 'lineHeight',

  addOptions() {
    return { types: ['paragraph', 'heading'] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (el) => el.style.lineHeight || null,
            renderHTML: (attrs) => (attrs.lineHeight ? { style: `line-height: ${attrs.lineHeight}` } : {}),
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight:
        (value) =>
        ({ commands }) =>
          this.options.types.map((t) => commands.updateAttributes(t, { lineHeight: value })).every(Boolean),
      unsetLineHeight:
        () =>
        ({ commands }) =>
          this.options.types.map((t) => commands.resetAttributes(t, 'lineHeight')).every(Boolean),
    };
  },
});

export default LineHeight;
