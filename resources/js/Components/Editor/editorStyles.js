/* Styles de l'éditeur de documents (tableaux, tâches, citations, commentaires, recherche). */
if (typeof document !== 'undefined' && !document.getElementById('doc-editor-styles')) {
  const st = document.createElement('style');
  st.id = 'doc-editor-styles';
  st.textContent = `
    .doc-editor .ProseMirror { border: 0 !important; box-shadow: none !important; padding: 0 !important; min-height: 60vh; background: transparent !important; outline: none; color: #202124; font-size: 15px; }
    .doc-editor .ProseMirror:focus { box-shadow: none !important; }
    .doc-editor .ProseMirror p { margin: 0.5em 0; }
    .doc-editor .ProseMirror h1 { font-size: 2em; margin: 0.8em 0 0.4em; }
    .doc-editor .ProseMirror h2 { font-size: 1.5em; margin: 0.8em 0 0.4em; }
    .doc-editor .ProseMirror h3 { font-size: 1.2em; margin: 0.8em 0 0.4em; }
    .doc-editor .ProseMirror ul { list-style: disc; padding-left: 1.6em; }
    .doc-editor .ProseMirror ol { list-style: decimal; padding-left: 1.6em; }
    .doc-editor .ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0.2em; }
    .doc-editor .ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5em; }
    .doc-editor .ProseMirror ul[data-type="taskList"] li > label { margin-top: 0.25em; user-select: none; }
    .doc-editor .ProseMirror ul[data-type="taskList"] li > div { flex: 1; }
    .doc-editor .ProseMirror ul[data-type="taskList"] li[data-checked="true"] > div { text-decoration: line-through; color: #80868b; }

    /* Citation (style "Just Do It !") */
    .doc-editor .ProseMirror blockquote { margin: 1.2em 0; padding: 0.9em 1.3em; border-left: 5px solid #1a73e8; background: #f1f6fe; border-radius: 0 10px 10px 0; font-style: italic; font-size: 1.2em; color: #1a3a6b; }
    .doc-editor .ProseMirror blockquote p { margin: 0.2em 0; }
    .doc-editor .ProseMirror blockquote p:last-child:not(:first-child) { font-size: 0.75em; font-style: normal; font-weight: 600; text-align: right; color: #5f6368; }

    /* Tableaux */
    .doc-editor .ProseMirror table { border-collapse: collapse; table-layout: fixed; width: 100%; margin: 1em 0; overflow: hidden; }
    .doc-editor .ProseMirror td, .doc-editor .ProseMirror th { border: 1px solid #c4c7c5; padding: 6px 10px; vertical-align: top; position: relative; min-width: 60px; }
    .doc-editor .ProseMirror th { background: #f1f3f4; font-weight: 600; text-align: left; }
    .doc-editor .ProseMirror .selectedCell:after { content: ''; position: absolute; inset: 0; background: rgba(26,115,232,0.15); pointer-events: none; }
    .doc-editor .ProseMirror .tableWrapper { overflow-x: auto; }

    .doc-editor .ProseMirror hr { border: 0; border-top: 1px solid #dadce0; margin: 1.2em 0; }
    .doc-editor .ProseMirror img { max-width: 100%; height: auto; }
    .doc-editor .ProseMirror sub { vertical-align: sub; font-size: 0.8em; }
    .doc-editor .ProseMirror sup { vertical-align: super; font-size: 0.8em; }
    .doc-editor .ProseMirror a { color: #1a73e8; text-decoration: underline; }

    /* Recherche */
    .doc-editor .search-match { background: #fff2a8; border-radius: 2px; }
    .doc-editor .search-match-current { background: #ffb74d; }

    /* Commentaires (la couleur des passages commentés est injectée dynamiquement) */
    .doc-editor .comment-mark { cursor: pointer; }

    @media print {
      body * { visibility: hidden !important; }
      .doc-paper, .doc-paper * { visibility: visible !important; }
      .doc-paper { position: absolute !important; left: 0; top: 0; width: 100% !important; box-shadow: none !important; border: 0 !important; }
    }
  `;
  document.head.appendChild(st);
}
export {};
