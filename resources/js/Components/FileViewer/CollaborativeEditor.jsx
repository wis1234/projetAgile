import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FaUndo, FaRedo, FaBold, FaItalic, FaUnderline, FaStrikethrough,
  FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify,
  FaListUl, FaListOl, FaLink, FaHighlighter,
  FaUsers, FaHistory, FaCheckCircle, FaClock, FaUser,
  FaLock, FaLockOpen, FaTimes, FaEdit, FaSave, FaExclamationTriangle,
} from 'react-icons/fa';
import { MdFormatSize } from 'react-icons/md';

// ── Génère une couleur par utilisateur (stable) ─────────────────────────────
const USER_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#14B8A6',
];
const getUserColor = (userId) => USER_COLORS[userId % USER_COLORS.length];

// ── Avatar d'un collaborateur en ligne ──────────────────────────────────────
export const CollaboratorAvatar = ({ user, size = 8, showTooltip = true }) => {
  const color = getUserColor(user.id);
  const initials = (user.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="relative group">
      <div
        className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm cursor-default`}
        style={{ backgroundColor: color }}
      >
        {initials}
      </div>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          {user.name}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
};

// ── Barre d'outils de mise en forme ────────────────────────────────────────
const ToolbarButton = ({ onClick, active, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded transition-colors ${
      active
        ? 'bg-blue-100 text-blue-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`}
  >
    {children}
  </button>
);

const Separator = () => <div className="w-px h-5 bg-gray-200 mx-1" />;

const FormatToolbar = ({ editorRef, onAction }) => {
  const exec = (cmd, val) => {
    document.execCommand(cmd, false, val);
    editorRef?.current?.focus();
    if (onAction) onAction(cmd, val);
  };
  const isActive = (cmd) => {
    try { return document.queryCommandState(cmd); } catch { return false; }
  };

  const FONT_SIZES = ['10', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48'];
  const COLORS = ['#000000', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 bg-white border-b border-gray-200">
      {/* Histoire */}
      <ToolbarButton onClick={() => exec('undo')} title="Annuler (Ctrl+Z)">
        <FaUndo className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => exec('redo')} title="Rétablir (Ctrl+Y)">
        <FaRedo className="h-3.5 w-3.5" />
      </ToolbarButton>
      <Separator />

      {/* Taille de police */}
      <div className="flex items-center gap-1">
        <MdFormatSize className="h-4 w-4 text-gray-500" />
        <select
          onChange={(e) => exec('fontSize', e.target.value)}
          className="text-xs border border-gray-200 rounded px-1 py-0.5 text-gray-700 focus:outline-none focus:border-blue-400"
          defaultValue="3"
        >
          {['8','9','10','11','12','14','16','18','20','22','24','26','28','36','48','72'].map((s, i) => (
            <option key={s} value={i + 1}>{s}</option>
          ))}
        </select>
      </div>
      <Separator />

      {/* Style de texte */}
      <ToolbarButton onClick={() => exec('bold')} active={isActive('bold')} title="Gras (Ctrl+B)">
        <FaBold className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => exec('italic')} active={isActive('italic')} title="Italique (Ctrl+I)">
        <FaItalic className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => exec('underline')} active={isActive('underline')} title="Souligner (Ctrl+U)">
        <FaUnderline className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => exec('strikeThrough')} active={isActive('strikeThrough')} title="Barré">
        <FaStrikethrough className="h-3.5 w-3.5" />
      </ToolbarButton>
      <Separator />

      {/* Couleur texte */}
      <div className="flex items-center gap-0.5">
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => exec('foreColor', c)}
            title={`Couleur ${c}`}
            className="w-4 h-4 rounded-full border border-gray-200 hover:scale-110 transition-transform"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      {/* Surligneur */}
      <ToolbarButton onClick={() => exec('backColor', '#FEF08A')} title="Surligner">
        <FaHighlighter className="h-3.5 w-3.5 text-yellow-500" />
      </ToolbarButton>
      <Separator />

      {/* Alignement */}
      <ToolbarButton onClick={() => exec('justifyLeft')} title="Aligner à gauche">
        <FaAlignLeft className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => exec('justifyCenter')} title="Centrer">
        <FaAlignCenter className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => exec('justifyRight')} title="Aligner à droite">
        <FaAlignRight className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => exec('justifyFull')} title="Justifier">
        <FaAlignJustify className="h-3.5 w-3.5" />
      </ToolbarButton>
      <Separator />

      {/* Listes */}
      <ToolbarButton onClick={() => exec('insertUnorderedList')} title="Liste à puces">
        <FaListUl className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => exec('insertOrderedList')} title="Liste numérotée">
        <FaListOl className="h-3.5 w-3.5" />
      </ToolbarButton>
      <Separator />

      {/* Lien */}
      <ToolbarButton
        onClick={() => {
          const url = prompt('Entrez l\'URL du lien :');
          if (url) exec('createLink', url);
        }}
        title="Insérer un lien"
      >
        <FaLink className="h-3.5 w-3.5" />
      </ToolbarButton>
    </div>
  );
};

// ── Entrée d'historique ─────────────────────────────────────────────────────
const HistoryEntry = ({ entry }) => {
  const color = getUserColor(entry.userId);
  const initials = (entry.userName || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60)  return 'à l\'instant';
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    return `il y a ${Math.floor(diff / 3600)} h`;
  };

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: color }}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800">{entry.userName}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{entry.description}</p>
      </div>
      <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">{timeAgo(entry.at)}</span>
    </div>
  );
};

// ── Panneau historique (slide-in) ───────────────────────────────────────────
const HistoryPanel = ({ history, onClose }) => (
  <div className="absolute right-0 top-0 bottom-0 w-72 bg-white border-l border-gray-200 shadow-xl z-30 flex flex-col">
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center gap-2">
        <FaHistory className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-semibold text-gray-700">Historique</span>
      </div>
      <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
        <FaTimes className="h-4 w-4" />
      </button>
    </div>
    <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
      {history.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-gray-400">Aucune modification</div>
      ) : (
        history.map((entry, i) => <HistoryEntry key={i} entry={entry} />)
      )}
    </div>
  </div>
);

// ── CollaborativeEditorBanner — affiché quand le mode edit est actif ────────
export const CollaborativeEditorBanner = ({
  file,
  currentUser,
  activeCollaborators = [],
  editHistory = [],
  onSave,
  onDeactivate,
  canDeactivate,
  isSaving = false,
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const editorRef = useRef(null);
  const [content, setContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const others = activeCollaborators.filter(u => u.id !== currentUser?.id);

  const handleInput = useCallback(() => {
    setHasChanges(true);
    if (onSave) onSave(editorRef.current?.innerHTML);
  }, [onSave]);

  return (
    <div className="bg-white border border-blue-200 rounded-xl overflow-hidden shadow-sm">
      {/* ── Barre de statut édition ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="flex items-center gap-3">
          {/* Indicateur "en direct" */}
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            <span className="text-xs font-semibold text-white/90">Mode Édition actif</span>
          </span>

          {/* Collaborateurs actifs */}
          {others.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-white/60 text-xs">·</span>
              <div className="flex -space-x-1.5">
                {others.slice(0, 4).map(u => (
                  <div key={u.id} className="ring-2 ring-blue-600 rounded-full">
                    <CollaboratorAvatar user={u} size={6} />
                  </div>
                ))}
                {others.length > 4 && (
                  <div className="w-6 h-6 rounded-full bg-blue-500 ring-2 ring-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                    +{others.length - 4}
                  </div>
                )}
              </div>
              <span className="text-white/70 text-xs">
                {others.length === 1 ? `${others[0].name} édite` : `${others.length} personnes éditent`}
              </span>
            </div>
          )}
        </div>

        {/* Actions droite */}
        <div className="flex items-center gap-2">
          {/* Bouton historique */}
          <button
            onClick={() => setShowHistory(v => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              showHistory ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <FaHistory className="h-3 w-3" />
            <span className="hidden sm:inline">Historique</span>
            {editHistory.length > 0 && (
              <span className="bg-white/20 text-white text-[10px] px-1 rounded-full">{editHistory.length}</span>
            )}
          </button>

          {/* Sauvegarder */}
          {hasChanges && (
            <button
              onClick={() => { setHasChanges(false); if (onSave) onSave(editorRef.current?.innerHTML); }}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1 bg-white text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors shadow-sm"
            >
              {isSaving ? (
                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              ) : (
                <FaSave className="h-3 w-3" />
              )}
              Sauvegarder
            </button>
          )}

          {/* Désactiver (si autorisé) */}
          {canDeactivate && (
            <button
              onClick={onDeactivate}
              className="flex items-center gap-1.5 px-2.5 py-1 text-white/70 hover:bg-white/10 hover:text-white rounded-lg text-xs transition-colors"
              title="Désactiver le mode édition"
            >
              <FaLock className="h-3 w-3" />
              <span className="hidden sm:inline">Verrouiller</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Barre d'outils de mise en forme ─────────────────────────────── */}
      <FormatToolbar
        editorRef={editorRef}
        onAction={(cmd) => {
          // Pourrait émettre via WebSocket ici
        }}
      />

      {/* ── Zone d'édition + historique ─────────────────────────────────── */}
      <div className="relative flex min-h-[240px]">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          className="flex-1 min-h-[240px] p-4 text-sm text-gray-800 focus:outline-none leading-relaxed"
          style={{ fontFamily: 'inherit' }}
          data-placeholder="Commencez à éditer ce document…"
        />

        {/* Panneau historique */}
        {showHistory && (
          <HistoryPanel history={editHistory} onClose={() => setShowHistory(false)} />
        )}
      </div>

      {/* ── Pied de page ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
        <span>
          <FaClock className="inline h-3 w-3 mr-1" />
          Modifications enregistrées automatiquement
        </span>
        <span className={hasChanges ? 'text-amber-500 font-medium' : 'text-green-500'}>
          {hasChanges ? '● Non sauvegardé' : '✓ À jour'}
        </span>
      </div>
    </div>
  );
};

// ── Bouton d'activation du mode édition ────────────────────────────────────
export const EditModeToggle = ({ isEnabled, canToggle, onToggle, isCollabFile }) => {
  if (!isCollabFile) return null;

  if (!canToggle) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-400 rounded-lg text-xs border border-gray-200">
        <FaLock className="h-3.5 w-3.5" />
        <span>Édition désactivée</span>
      </div>
    );
  }

  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${
        isEnabled
          ? 'bg-blue-600 hover:bg-blue-700 text-white'
          : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600'
      }`}
      title={isEnabled ? 'Désactiver le mode édition collaborative' : 'Activer le mode édition collaborative'}
    >
      {isEnabled ? (
        <>
          <FaLockOpen className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Édition active</span>
        </>
      ) : (
        <>
          <FaEdit className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Édition collaborative</span>
        </>
      )}
    </button>
  );
};

export default CollaborativeEditorBanner;
