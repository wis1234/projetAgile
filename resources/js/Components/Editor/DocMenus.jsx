import React, { useCallback, useRef, useState } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import DropdownPanel from './DropdownPanel';

const SHORTCUTS = [
  ['Enregistrer', 'Ctrl + S'], ['Annuler', 'Ctrl + Z'], ['Rétablir', 'Ctrl + Y'],
  ['Gras', 'Ctrl + B'], ['Italique', 'Ctrl + I'], ['Souligné', 'Ctrl + U'],
  ['Lien', 'Ctrl + K'], ['Rechercher et remplacer', 'Ctrl + H'],
  ['Ajouter un commentaire', 'Ctrl + Alt + M'], ['Tout sélectionner', 'Ctrl + A'],
  ['Titre 1 / 2 / 3', 'Ctrl + Alt + 1 / 2 / 3'], ['Liste à puces', 'Ctrl + Maj + 8'],
  ['Liste numérotée', 'Ctrl + Maj + 7'], ['Aligner à gauche / centre / droite', 'Ctrl + Maj + L / E / R'],
];

const TopMenu = ({ label, items, open, onToggle, onHover, onClose }) => (
  <div className="relative">
    <button
      type="button"
      onClick={onToggle}
      onMouseEnter={onHover}
      className={`px-2.5 h-7 rounded text-[13px] text-slate-700 transition-colors ${open ? 'bg-[#e8eaed]' : 'hover:bg-[#f1f3f4]'}`}
    >
      {label}
    </button>
    <DropdownPanel open={open} onClose={onClose} className="min-w-[270px] py-1.5">
      {items.filter(Boolean).map((it, i) => {
        if (it.type === 'sep') return <div key={`s${i}`} className="my-1 border-t border-slate-200" />;
        if (it.type === 'heading') return <div key={`h${i}`} className="px-4 pt-1.5 pb-0.5 text-[10.5px] uppercase tracking-wide text-slate-400">{it.label}</div>;
        return (
          <button
            key={it.label + i}
            type="button"
            disabled={it.disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { onClose(); it.onClick?.(); }}
            className="flex items-center w-full gap-2 px-4 h-8 text-left text-[13px] text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <span className="w-4 flex-shrink-0 text-[#1a73e8]">{it.checked ? <FaCheck className="text-[10px]" /> : null}</span>
            <span className="flex-1 truncate">{it.label}</span>
            {it.shortcut && <span className="text-[11px] text-slate-400 ml-4">{it.shortcut}</span>}
          </button>
        );
      })}
    </DropdownPanel>
  </div>
);

const DocMenus = ({ editor, isReadOnly = false, actions = {}, fullWidth = true, commentsOpen = false, suggesting = false, rightSlot = null }) => {
  const [openKey, setOpenKey] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const fileInput = useRef(null);

  const close = useCallback(() => setOpenKey(null), []);
  const has = (name) => !!editor?.extensionManager?.extensions?.some((e) => e.name === name);
  const run = (fn) => () => { if (editor && !isReadOnly) fn(editor.chain().focus()).run(); };
  const ro = isReadOnly;

  const onPickImage = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || !editor) return;
    if (f.size > 2 * 1024 * 1024) { window.alert('Image trop lourde (2 Mo maximum). Utilisez plutôt une URL.'); return; }
    const reader = new FileReader();
    reader.onload = () => editor.chain().focus().setImage({ src: reader.result }).run();
    reader.readAsDataURL(f);
  };

  const insertUrlImage = () => { const url = window.prompt("URL de l'image"); if (url) editor.chain().focus().setImage({ src: url }).run(); };
  const insertLink = () => {
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('URL du lien', prev ?? '');
    if (url === null) return;
    if (url === '') editor.chain().focus().extendMarkRange('link').unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };
  const insertDate = () => editor.chain().focus().insertContent(new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })).run();
  const pasteText = async () => {
    try { const t = await navigator.clipboard.readText(); if (t) editor.chain().focus().insertContent(t).run(); }
    catch { window.alert('Le navigateur bloque le collage par le menu. Utilisez Ctrl + V.'); }
  };
  const wordStats = () => {
    const text = editor.getText();
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    window.alert(`Mots : ${words}\nCaractères : ${text.length}\nCaractères (sans espaces) : ${text.replace(/\s/g, '').length}`);
  };

  const menus = editor ? [
    ['Fichier', [
      { label: 'Enregistrer une version', shortcut: 'Ctrl+S', onClick: actions.save, disabled: ro },
      { label: 'Renommer', onClick: actions.rename, disabled: ro },
      { type: 'sep' },
      { type: 'heading', label: 'Télécharger' },
      { label: 'Page web (.html)', onClick: actions.downloadHtml },
      { label: 'Microsoft Word (.doc)', onClick: actions.downloadDoc },
      { label: 'Texte brut (.txt)', onClick: actions.downloadTxt },
      { type: 'sep' },
      { label: 'Historique des versions', onClick: actions.history },
      { label: 'Partager', onClick: actions.share },
      { type: 'sep' },
      { label: 'Imprimer', shortcut: 'Ctrl+P', onClick: actions.print },
      { type: 'sep' },
      { label: 'Fermer', onClick: actions.close },
    ]],
    ['Édition', [
      { label: 'Annuler', shortcut: 'Ctrl+Z', onClick: run((c) => c.undo()), disabled: ro || !editor.can().undo() },
      { label: 'Rétablir', shortcut: 'Ctrl+Y', onClick: run((c) => c.redo()), disabled: ro || !editor.can().redo() },
      { type: 'sep' },
      { label: 'Couper', shortcut: 'Ctrl+X', onClick: () => { editor.view.focus(); document.execCommand('cut'); }, disabled: ro },
      { label: 'Copier', shortcut: 'Ctrl+C', onClick: () => { editor.view.focus(); document.execCommand('copy'); } },
      { label: 'Coller', shortcut: 'Ctrl+V', onClick: pasteText, disabled: ro },
      { type: 'sep' },
      { label: 'Tout sélectionner', shortcut: 'Ctrl+A', onClick: () => editor.chain().focus().selectAll().run() },
      { type: 'sep' },
      { label: 'Rechercher et remplacer', shortcut: 'Ctrl+H', onClick: actions.find },
    ]],
    ['Affichage', [
      { label: 'Pleine largeur', checked: fullWidth, onClick: actions.toggleFullWidth },
      { label: 'Plein écran', onClick: actions.toggleFullscreen },
      { type: 'sep' },
      { label: 'Commentaires', checked: commentsOpen, onClick: actions.toggleComments },
      { label: 'Historique des versions', onClick: actions.history },
    ]],
    ['Insertion', [
      { label: 'Image depuis l’ordinateur…', onClick: () => fileInput.current?.click(), disabled: ro },
      { label: 'Image depuis une URL…', onClick: insertUrlImage, disabled: ro },
      { label: 'Lien…', shortcut: 'Ctrl+K', onClick: insertLink, disabled: ro },
      { type: 'sep' },
      has('table') && { label: 'Tableau 3 × 3', onClick: run((c) => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true })), disabled: ro },
      { label: 'Ligne horizontale', onClick: run((c) => c.setHorizontalRule()), disabled: ro },
      { label: 'Bloc de code', onClick: run((c) => c.toggleCodeBlock()), disabled: ro },
      { label: 'Citation', onClick: run((c) => c.toggleBlockquote()), disabled: ro },
      { type: 'sep' },
      { label: 'Liste à puces', onClick: run((c) => c.toggleBulletList()), disabled: ro },
      { label: 'Liste numérotée', onClick: run((c) => c.toggleOrderedList()), disabled: ro },
      has('taskList') && { label: 'Liste de tâches', onClick: run((c) => c.toggleTaskList()), disabled: ro },
      { type: 'sep' },
      { label: 'Date du jour', onClick: insertDate, disabled: ro },
      { label: 'Commentaire', shortcut: 'Ctrl+Alt+M', onClick: actions.comment, disabled: ro },
    ]],
    ['Format', [
      { type: 'heading', label: 'Texte' },
      { label: 'Gras', shortcut: 'Ctrl+B', checked: editor.isActive('bold'), onClick: run((c) => c.toggleBold()), disabled: ro },
      { label: 'Italique', shortcut: 'Ctrl+I', checked: editor.isActive('italic'), onClick: run((c) => c.toggleItalic()), disabled: ro },
      { label: 'Souligné', shortcut: 'Ctrl+U', checked: editor.isActive('underline'), onClick: run((c) => c.toggleUnderline()), disabled: ro },
      { label: 'Barré', checked: editor.isActive('strike'), onClick: run((c) => c.toggleStrike()), disabled: ro },
      has('superscript') && { label: 'Exposant', checked: editor.isActive('superscript'), onClick: run((c) => c.toggleSuperscript()), disabled: ro },
      has('subscript') && { label: 'Indice', checked: editor.isActive('subscript'), onClick: run((c) => c.toggleSubscript()), disabled: ro },
      { type: 'sep' },
      { type: 'heading', label: 'Styles de paragraphe' },
      { label: 'Texte normal', checked: editor.isActive('paragraph'), onClick: run((c) => c.setParagraph()), disabled: ro },
      { label: 'Titre 1', checked: editor.isActive('heading', { level: 1 }), onClick: run((c) => c.setHeading({ level: 1 })), disabled: ro },
      { label: 'Titre 2', checked: editor.isActive('heading', { level: 2 }), onClick: run((c) => c.setHeading({ level: 2 })), disabled: ro },
      { label: 'Titre 3', checked: editor.isActive('heading', { level: 3 }), onClick: run((c) => c.setHeading({ level: 3 })), disabled: ro },
      { type: 'sep' },
      { type: 'heading', label: 'Alignement' },
      { label: 'À gauche', onClick: run((c) => c.setTextAlign('left')), disabled: ro },
      { label: 'Centré', onClick: run((c) => c.setTextAlign('center')), disabled: ro },
      { label: 'À droite', onClick: run((c) => c.setTextAlign('right')), disabled: ro },
      { label: 'Justifié', onClick: run((c) => c.setTextAlign('justify')), disabled: ro },
      has('lineHeight') && { type: 'sep' },
      has('lineHeight') && { type: 'heading', label: 'Interligne' },
      ...(has('lineHeight') ? ['1', '1.15', '1.5', '2'].map((v) => ({ label: v === '1.15' ? '1,15 (par défaut)' : v.replace('.', ','), onClick: run((c) => c.setLineHeight(v)), disabled: ro })) : []),
      { type: 'sep' },
      { label: 'Effacer la mise en forme', onClick: run((c) => c.clearNodes().unsetAllMarks()), disabled: ro },
    ]],
    ['Outils', [
      { label: 'Nombre de mots', onClick: wordStats },
      { label: 'Rechercher et remplacer', shortcut: 'Ctrl+H', onClick: actions.find },
      { type: 'sep' },
      { label: 'Mode suggestion (suivre mes modifications)', checked: suggesting, onClick: actions.toggleSuggesting, disabled: ro },
      { label: 'Voir et traiter les modifications', onClick: actions.tracking },
      { label: 'Historique des versions', onClick: actions.history },
    ]],
    ['Aide', [
      { label: 'Raccourcis clavier', onClick: () => setShowShortcuts(true) },
    ]],
  ] : [];

  return (
    <>
      <div className="flex items-center gap-0.5 px-2 sm:px-4 py-0.5 overflow-x-auto scrollbar-hide" role="menubar">
        {menus.map(([label, items]) => (
          <TopMenu
            key={label}
            label={label}
            items={items}
            open={openKey === label}
            onToggle={() => setOpenKey((k) => (k === label ? null : label))}
            onHover={() => { if (openKey && openKey !== label) setOpenKey(label); }}
            onClose={close}
          />
        ))}
        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={onPickImage} />

        {/* Côté droit de la barre de menus : mode Édition / Suggestion + bouton ProJA Meet */}
        <div className="ml-auto flex items-center gap-2 flex-shrink-0 pl-3">
        {!isReadOnly && actions.toggleSuggesting && (
            <div className="flex items-center rounded-full bg-[#f1f3f4] p-0.5 text-[12px] font-medium">
              <button
                type="button"
                onClick={() => suggesting && actions.toggleSuggesting()}
                className={`px-3 h-6 rounded-full transition-colors ${!suggesting ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                title="Vos modifications sont appliquées directement"
              >
                Édition
              </button>
              <button
                type="button"
                onClick={() => !suggesting && actions.toggleSuggesting()}
                className={`px-3 h-6 rounded-full transition-colors ${suggesting ? 'bg-amber-100 text-amber-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                title="Vos modifications sont proposées et doivent être acceptées"
              >
                Suggestion
              </button>
            </div>
        )}
        {rightSlot}
        </div>
      </div>

      {showShortcuts && (
        <div className="fixed inset-0 z-[1100] bg-black/30 flex items-center justify-center p-4" onClick={() => setShowShortcuts(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-semibold text-slate-800">Raccourcis clavier</h3>
              <button type="button" onClick={() => setShowShortcuts(false)} className="p-1 rounded hover:bg-slate-100 text-slate-400"><FaTimes /></button>
            </div>
            <div className="divide-y divide-slate-100">
              {SHORTCUTS.map(([n, k]) => (
                <div key={n} className="flex items-center justify-between py-2 text-[13px]">
                  <span className="text-slate-700">{n}</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-mono">{k}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DocMenus;
