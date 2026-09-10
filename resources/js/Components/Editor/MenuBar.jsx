import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  FaBold, FaItalic, FaUnderline, FaStrikethrough,
  FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify,
  FaListUl, FaListOl, FaUndo, FaRedo,
  FaLink, FaImage, FaCode, FaHistory,
  FaPalette, FaHighlighter, FaCheck, FaTimes, FaChevronDown,
  FaQuoteLeft, FaMinus
} from 'react-icons/fa';
import { MdOutlineFormatClear } from 'react-icons/md';

/* ─── Design tokens ─── */
const ACCENT    = '#1a73e8'; // Google Docs blue
const ACCENT_BG = '#c2d7f7';

/* ─── Données statiques ─── */
const TEXT_STYLES = [
  { label: 'Texte normal', tag: 'paragraph',  level: null, size: '14px', weight: 'normal' },
  { label: 'Titre 1',      tag: 'heading',    level: 1,    size: '22px', weight: '700'    },
  { label: 'Titre 2',      tag: 'heading',    level: 2,    size: '18px', weight: '700'    },
  { label: 'Titre 3',      tag: 'heading',    level: 3,    size: '15px', weight: '700'    },
  { label: 'Titre 4',      tag: 'heading',    level: 4,    size: '13px', weight: '700'    },
  { label: 'Citation',     tag: 'blockquote', level: null, size: '13px', weight: 'italic' },
];

const FONT_FAMILIES = [
  { label: 'Arial',          value: 'Arial, sans-serif'           },
  { label: 'Times New Roman',value: "'Times New Roman', serif"    },
  { label: 'Georgia',        value: 'Georgia, serif'              },
  { label: 'Courier New',    value: "'Courier New', monospace"    },
  { label: 'Helvetica',      value: 'Helvetica, sans-serif'       },
  { label: 'Roboto',         value: "'Roboto', sans-serif"        },
];

const FONT_SIZES = ['8','9','10','11','12','14','16','18','20','24','28','32','36','40','48','72'];

const TEXT_COLORS = [
  { name: 'Noir',       value: '#000000' },{ name: 'Gris foncé', value: '#434343' },
  { name: 'Gris',       value: '#666666' },{ name: 'Gris clair', value: '#999999' },
  { name: 'Blanc',      value: '#ffffff' },{ name: 'Rouge',      value: '#ff0000' },
  { name: 'Orange',     value: '#ff9900' },{ name: 'Jaune',      value: '#ffff00' },
  { name: 'Vert',       value: '#00ff00' },{ name: 'Cyan',       value: '#00ffff' },
  { name: 'Bleu clair', value: '#4a86e8' },{ name: 'Bleu',       value: '#0000ff' },
  { name: 'Violet',     value: '#9900ff' },{ name: 'Magenta',    value: '#ff00ff' },
  { name: 'Rose pâle',  value: '#ea9999' },{ name: 'Pêche',      value: '#f9cb9c' },
  { name: 'Banane',     value: '#ffe599' },{ name: 'Sauge',      value: '#b6d7a8' },
  { name: 'Azur',       value: '#9fc5e8' },{ name: 'Lavande',    value: '#b4a7d6' },
  { name: 'Brique',     value: '#cc4125' },{ name: 'Or',         value: '#f1c232' },
  { name: 'Vert forêt', value: '#6aa84f' },{ name: 'Marine',     value: '#1c4587' },
];

const HIGHLIGHT_COLORS = [
  { name: 'Jaune',  bg: 'rgba(255,215,0,0.4)',   dot: '#ffd700' },
  { name: 'Vert',   bg: 'rgba(0,200,0,0.25)',    dot: '#00c800' },
  { name: 'Cyan',   bg: 'rgba(0,207,255,0.3)',   dot: '#00cfff' },
  { name: 'Rose',   bg: 'rgba(255,105,180,0.3)', dot: '#ff69b4' },
  { name: 'Orange', bg: 'rgba(255,165,0,0.3)',   dot: '#ffa500' },
  { name: 'Violet', bg: 'rgba(147,112,219,0.3)', dot: '#9370db' },
];

/* ─── Atoms ─── */
const Divider = () => (
  <div className="w-px h-5 bg-gray-300 dark:bg-slate-600 flex-shrink-0 mx-0.5" />
);

const ToolBtn = ({ active, disabled, title, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`
      relative flex items-center justify-center rounded h-7 min-w-[28px] px-1.5 text-[13px]
      transition-colors select-none
      ${active
        ? 'bg-[#c2d7f7] text-[#1a73e8] dark:bg-blue-900/40 dark:text-blue-300'
        : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
      }
      ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    {children}
    {active && (
      <span className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-[#1a73e8] dark:bg-blue-400" />
    )}
  </button>
);

/* ─── Dropdown wrapper (click-outside aware) ─── */
const DropdownPanel = ({ open, onClose, children, className = '' }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      ref={ref}
      className={`absolute top-full left-0 z-50 mt-1 bg-white dark:bg-slate-800
        border border-gray-200 dark:border-slate-600 rounded-lg shadow-xl overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
};

/* ─── Colour swatch grid ─── */
const ColorSwatchGrid = ({ colors, current, onSelect, onClear }) => (
  <div className="p-2 w-52">
    <div className="grid grid-cols-8 gap-0.5 mb-2">
      {colors.map(c => (
        <button
          key={c.value}
          type="button"
          title={c.name}
          onClick={() => onSelect(c.value)}
          className={`w-5 h-5 rounded border transition-transform hover:scale-110
            ${current === c.value ? 'ring-2 ring-[#1a73e8] ring-offset-1' : 'border-gray-200'}`}
          style={{ backgroundColor: c.value }}
        />
      ))}
    </div>
    <div className="border-t border-gray-100 dark:border-slate-700 pt-2 flex items-center gap-1.5">
      <input
        type="color"
        defaultValue={current || '#000000'}
        onChange={e => onSelect(e.target.value)}
        className="w-6 h-6 cursor-pointer rounded border-none p-0"
        title="Couleur personnalisée"
      />
      <span className="text-[11px] text-gray-500 dark:text-slate-400">Personnalisée</span>
    </div>
    {onClear && (
      <button
        type="button"
        onClick={onClear}
        className="mt-1 text-[11px] text-red-500 hover:text-red-700 flex items-center gap-1"
      >
        <FaTimes className="text-[9px]" /> Réinitialiser
      </button>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
const MenuBar = ({ editor, onTrackChanges }) => {
  const [open, setOpen]                   = useState(null); // 'style'|'font'|'size'|'color'|'highlight'
  const [currentColor, setCurrentColor]   = useState('#000000');
  const [currentHL, setCurrentHL]         = useState(null);
  const [fontSize, setFontSize]           = useState('11');
  const [fontFamily, setFontFamily]       = useState('');

  const toggle = key => setOpen(v => v === key ? null : key);
  const closeAll = () => setOpen(null);

  /* Sync state from editor selection */
  useEffect(() => {
    if (!editor) return;
    const color = editor.getAttributes('textStyle')?.color;
    if (color) setCurrentColor(color);
    const sz = editor.getAttributes('textStyle')?.fontSize;
    if (sz) setFontSize(sz.replace(/[a-z]+/gi, ''));
    const ff = editor.getAttributes('textStyle')?.fontFamily;
    if (ff !== undefined) setFontFamily(ff ?? '');
  }, [editor?.state?.selection]);

  const addImage = useCallback(() => {
    const url = window.prompt("URL de l'image");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const setLink = useCallback(() => {
    const prev = editor.getAttributes('link').href;
    const url  = window.prompt('URL du lien', prev ?? '');
    if (url === null) return;
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  /* Active text style */
  const activeStyle = TEXT_STYLES.find(s => {
    if (s.tag === 'heading'    && s.level) return editor?.isActive('heading', { level: s.level });
    if (s.tag === 'blockquote')            return editor?.isActive('blockquote');
    return editor?.isActive('paragraph');
  }) ?? TEXT_STYLES[0];

  const activeFontLabel = FONT_FAMILIES.find(f => f.value === fontFamily)?.label ?? 'Arial';

  if (!editor) return null;

  return (
    <div className="flex flex-col bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 select-none">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1 min-h-[40px]">

        {/* ── Undo / Redo ── */}
        <ToolBtn title="Annuler (Ctrl+Z)" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
          <FaUndo className="text-[11px]" />
        </ToolBtn>
        <ToolBtn title="Rétablir (Ctrl+Y)" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
          <FaRedo className="text-[11px]" />
        </ToolBtn>

        <Divider />

        {/* ── Text style dropdown ── */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggle('style')}
            className="flex items-center gap-1 h-7 px-2 rounded text-[12px] text-gray-700 dark:text-slate-300
              hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors min-w-[128px] border border-transparent hover:border-gray-200 dark:hover:border-slate-600"
          >
            <span className="flex-1 text-left truncate" style={{ fontSize: activeStyle.size, fontWeight: activeStyle.weight }}>
              {activeStyle.label}
            </span>
            <FaChevronDown className="text-[9px] text-gray-400 flex-shrink-0" />
          </button>
          <DropdownPanel open={open === 'style'} onClose={closeAll} className="w-52">
            {TEXT_STYLES.map(s => (
              <button
                key={s.label}
                type="button"
                onClick={() => {
                  if (s.tag === 'heading')    editor.chain().focus().setHeading({ level: s.level }).run();
                  else if (s.tag === 'blockquote') editor.chain().focus().toggleBlockquote().run();
                  else                        editor.chain().focus().setParagraph().run();
                  closeAll();
                }}
                className={`flex items-center gap-2 w-full px-3 py-2 text-left transition-colors
                  hover:bg-blue-50 dark:hover:bg-slate-700
                  ${activeStyle.label === s.label ? 'bg-blue-50 dark:bg-slate-700' : ''}`}
                style={{ fontSize: s.size, fontWeight: s.weight }}
              >
                {activeStyle.label === s.label && <FaCheck className="text-[10px] text-[#1a73e8]" />}
                <span className={activeStyle.label !== s.label ? 'pl-3.5' : ''}>{s.label}</span>
              </button>
            ))}
          </DropdownPanel>
        </div>

        <Divider />

        {/* ── Font family dropdown ── */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggle('font')}
            className="flex items-center gap-1 h-7 px-2 rounded text-[12px] text-gray-700 dark:text-slate-300
              hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors min-w-[110px] border border-transparent hover:border-gray-200 dark:hover:border-slate-600"
            style={{ fontFamily: fontFamily || 'Arial, sans-serif' }}
          >
            <span className="flex-1 text-left truncate">{activeFontLabel}</span>
            <FaChevronDown className="text-[9px] text-gray-400 flex-shrink-0" />
          </button>
          <DropdownPanel open={open === 'font'} onClose={closeAll} className="w-44">
            {FONT_FAMILIES.map(f => (
              <button
                key={f.value}
                type="button"
                onClick={() => {
                  editor.chain().focus().setFontFamily(f.value).run();
                  setFontFamily(f.value);
                  closeAll();
                }}
                className={`flex items-center gap-2 w-full px-3 py-2 text-left text-[13px] transition-colors
                  hover:bg-blue-50 dark:hover:bg-slate-700
                  ${fontFamily === f.value ? 'bg-blue-50 dark:bg-slate-700' : ''}`}
                style={{ fontFamily: f.value }}
              >
                {fontFamily === f.value && <FaCheck className="text-[10px] text-[#1a73e8] flex-shrink-0" />}
                <span className={fontFamily !== f.value ? 'pl-3.5' : ''}>{f.label}</span>
              </button>
            ))}
          </DropdownPanel>
        </div>

        <Divider />

        {/* ── Font size ── */}
        <div className="relative flex items-center gap-0">
          <button
            type="button"
            onClick={() => { const n = Math.max(6, (parseInt(fontSize)||11) - 1); editor.chain().focus().setFontSize(`${n}pt`).run(); setFontSize(String(n)); }}
            className="h-7 w-5 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 text-sm transition-colors border border-r-0 border-gray-200 dark:border-slate-600 rounded-l"
            title="Réduire"
          >−</button>
          <input
            type="text"
            value={fontSize}
            onChange={e => setFontSize(e.target.value)}
            onBlur={e => { const v = parseInt(e.target.value); if (v > 0) { editor.chain().focus().setFontSize(`${v}pt`).run(); setFontSize(String(v)); } }}
            onKeyDown={e => { if (e.key === 'Enter') { const v = parseInt(fontSize); if (v > 0) editor.chain().focus().setFontSize(`${v}pt`).run(); closeAll(); } }}
            className="h-7 w-10 text-center text-[12px] border-y border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:z-10"
          />
          <button
            type="button"
            onClick={() => toggle('size')}
            className="h-7 w-4 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 text-[8px] transition-colors border border-gray-200 dark:border-slate-600"
            title="Choisir taille"
          ><FaChevronDown /></button>
          <button
            type="button"
            onClick={() => { const n = (parseInt(fontSize)||11) + 1; editor.chain().focus().setFontSize(`${n}pt`).run(); setFontSize(String(n)); }}
            className="h-7 w-5 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 text-sm transition-colors border border-l-0 border-gray-200 dark:border-slate-600 rounded-r"
            title="Augmenter"
          >+</button>
          <DropdownPanel open={open === 'size'} onClose={closeAll} className="w-16">
            <div className="py-1 max-h-52 overflow-y-auto">
              {FONT_SIZES.map(s => (
                <button key={s} type="button"
                  onClick={() => { editor.chain().focus().setFontSize(`${s}pt`).run(); setFontSize(s); closeAll(); }}
                  className={`block w-full text-center px-2 py-1 text-[12px] hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors
                    ${fontSize === s ? 'font-bold text-[#1a73e8]' : 'text-gray-700 dark:text-slate-200'}`}
                >{s}</button>
              ))}
            </div>
          </DropdownPanel>
        </div>

        <Divider />

        {/* ── Text formatting ── */}
        <ToolBtn active={editor.isActive('bold')}       title="Gras (Ctrl+B)"      onClick={() => editor.chain().focus().toggleBold().run()}>      <FaBold        className="text-[12px]" /></ToolBtn>
        <ToolBtn active={editor.isActive('italic')}     title="Italique (Ctrl+I)"  onClick={() => editor.chain().focus().toggleItalic().run()}>    <FaItalic      className="text-[12px]" /></ToolBtn>
        <ToolBtn active={editor.isActive('underline')}  title="Souligné (Ctrl+U)"  onClick={() => editor.chain().focus().toggleUnderline().run()}> <FaUnderline   className="text-[12px]" /></ToolBtn>
        <ToolBtn active={editor.isActive('strike')}     title="Barré"              onClick={() => editor.chain().focus().toggleStrike().run()}>    <FaStrikethrough className="text-[12px]" /></ToolBtn>

        <Divider />

        {/* ── Text color ── */}
        <div className="relative">
          <button type="button" onClick={() => toggle('color')} title="Couleur du texte"
            className="flex flex-col items-center justify-center h-7 w-8 rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <FaPalette className="text-[12px] text-gray-600 dark:text-slate-300" />
            <span className="w-5 h-1 rounded-full mt-0.5" style={{ backgroundColor: currentColor }} />
          </button>
          <DropdownPanel open={open === 'color'} onClose={closeAll}>
            <ColorSwatchGrid
              colors={TEXT_COLORS}
              current={currentColor}
              onSelect={v => { editor.chain().focus().setColor(v).run(); setCurrentColor(v); closeAll(); }}
              onClear={() => { editor.chain().focus().unsetColor().run(); setCurrentColor('#000000'); closeAll(); }}
            />
          </DropdownPanel>
        </div>

        {/* ── Highlight color ── */}
        <div className="relative">
          <button type="button" onClick={() => toggle('highlight')} title="Surbrillance"
            className="flex flex-col items-center justify-center h-7 w-8 rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <FaHighlighter className="text-[12px] text-gray-600 dark:text-slate-300" />
            <span className="w-5 h-1 rounded-full mt-0.5" style={{ backgroundColor: currentHL ?? '#ffd700' }} />
          </button>
          <DropdownPanel open={open === 'highlight'} onClose={closeAll} className="w-52">
            <div className="p-3">
              <p className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 mb-2">Couleur de surlignage</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {HIGHLIGHT_COLORS.map(c => (
                  <button key={c.name} type="button" title={c.name}
                    onClick={() => { editor.chain().focus().toggleHighlight({ color: c.bg }).run(); setCurrentHL(c.dot); closeAll(); }}
                    className={`w-7 h-7 rounded border-2 transition-transform hover:scale-110 ${currentHL === c.dot ? 'border-[#1a73e8]' : 'border-transparent'}`}
                    style={{ backgroundColor: c.bg }}
                  />
                ))}
              </div>
              <button type="button" onClick={() => { editor.chain().focus().unsetHighlight().run(); setCurrentHL(null); closeAll(); }}
                className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-1">
                <FaTimes className="text-[9px]" /> Supprimer le surlignage
              </button>
            </div>
          </DropdownPanel>
        </div>

        <Divider />

        {/* ── Alignment ── */}
        <ToolBtn active={editor.isActive({ textAlign: 'left' })}    title="Gauche (Ctrl+Shift+L)"  onClick={() => editor.chain().focus().setTextAlign('left').run()}>    <FaAlignLeft    className="text-[12px]" /></ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: 'center' })}  title="Centré (Ctrl+Shift+E)"  onClick={() => editor.chain().focus().setTextAlign('center').run()}>  <FaAlignCenter  className="text-[12px]" /></ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: 'right' })}   title="Droite (Ctrl+Shift+R)"  onClick={() => editor.chain().focus().setTextAlign('right').run()}>   <FaAlignRight   className="text-[12px]" /></ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: 'justify' })} title="Justifié (Ctrl+Shift+J)" onClick={() => editor.chain().focus().setTextAlign('justify').run()}><FaAlignJustify className="text-[12px]" /></ToolBtn>

        <Divider />

        {/* ── Lists ── */}
        <ToolBtn active={editor.isActive('bulletList')}  title="Liste à puces"   onClick={() => editor.chain().focus().toggleBulletList().run()}>  <FaListUl className="text-[12px]" /></ToolBtn>
        <ToolBtn active={editor.isActive('orderedList')} title="Liste numérotée" onClick={() => editor.chain().focus().toggleOrderedList().run()}><FaListOl className="text-[12px]" /></ToolBtn>

        <Divider />

        {/* ── Block elements ── */}
        <ToolBtn active={editor.isActive('blockquote')} title="Citation" onClick={() => editor.chain().focus().toggleBlockquote().run()}><FaQuoteLeft className="text-[12px]" /></ToolBtn>
        <ToolBtn active={editor.isActive('codeBlock')}  title="Bloc de code" onClick={() => editor.chain().focus().toggleCodeBlock().run()}><FaCode className="text-[12px]" /></ToolBtn>
        <ToolBtn title="Ligne de séparation" onClick={() => editor.chain().focus().setHorizontalRule().run()}><FaMinus className="text-[12px]" /></ToolBtn>

        <Divider />

        {/* ── Link / Image / Clear ── */}
        <ToolBtn active={editor.isActive('link')} title="Lien (Ctrl+K)" onClick={setLink}><FaLink  className="text-[12px]" /></ToolBtn>
        <ToolBtn title="Image" onClick={addImage}><FaImage className="text-[12px]" /></ToolBtn>
        <ToolBtn title="Effacer la mise en forme" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
          <MdOutlineFormatClear className="text-[14px]" />
        </ToolBtn>

        {/* ── Track changes ── */}
        {onTrackChanges && (
          <>
            <Divider />
            <ToolBtn title="Suivi des modifications" onClick={onTrackChanges}>
              <FaHistory className="text-[12px]" />
            </ToolBtn>
          </>
        )}
      </div>
    </div>
  );
};

export default MenuBar;
