import React, { useCallback, useState, useEffect } from 'react';
import { 
  FaBold, 
  FaItalic, 
  FaUnderline, 
  FaStrikethrough, 
  FaAlignLeft, 
  FaAlignCenter, 
  FaAlignRight, 
  FaAlignJustify,
  FaListUl,
  FaListOl,
  FaUndo,
  FaRedo,
  FaLink,
  FaImage,
  FaHeading,
  FaCode,
  FaHistory,
  FaPalette,
  FaHighlighter,
  FaCheck,
  FaTimes
} from 'react-icons/fa';
import { BiFontSize } from 'react-icons/bi';

const FONT_SIZES = [
  { label: 'Petit', value: '12px' },
  { label: 'Normal', value: '16px' },
  { label: 'Moyen', value: '20px' },
  { label: 'Grand', value: '24px' },
  { label: 'Très grand', value: '32px' },
];

const COLORS = [
  { name: 'Noir', value: '#000000' },
  { name: 'Rouge', value: '#FF0000' },
  { name: 'Vert', value: '#008000' },
  { name: 'Bleu', value: '#0000FF' },
  { name: 'Jaune', value: '#FFD700' },
  { name: 'Orange', value: '#FFA500' },
  { name: 'Violet', value: '#800080' },
  { name: 'Gris', value: '#808080' },
  { name: 'Marron', value: '#A52A2A' },
  { name: 'Rose', value: '#FFC0CB' },
  { name: 'Bleu clair', value: '#87CEEB' },
  { name: 'Vert clair', value: '#90EE90' },
  { name: 'Rouge foncé', value: '#8B0000' },
  { name: 'Bleu marine', value: '#000080' },
  { name: 'Vert foncé', value: '#006400' },
];

const HIGHLIGHT_COLORS = [
  { name: 'Jaune', value: 'rgba(255, 213, 0, 0.3)' },
  { name: 'Rouge', value: 'rgba(255, 0, 0, 0.2)' },
  { name: 'Vert', value: 'rgba(0, 200, 0, 0.2)' },
  { name: 'Bleu', value: 'rgba(0, 0, 255, 0.2)' },
  { name: 'Orange', value: 'rgba(255, 165, 0, 0.2)' },
  { name: 'Violet', value: 'rgba(128, 0, 128, 0.2)' },
];



const MenuBar = ({ editor, colors = COLORS, onTrackChanges }) => {
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [currentHighlightColor, setCurrentHighlightColor] = useState(HIGHLIGHT_COLORS[0].value);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');

  useEffect(() => {
    if (editor?.isActive('textStyle')) {
      const color = editor.getAttributes('textStyle').color || '#000000';
      setCurrentColor(color);
    }
  }, [editor?.state.selection]);

  const addImage = useCallback(() => {
    const url = window.prompt(`Entrez l'URL de l'image`);
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="menu-bar flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-white rounded-t-lg">
      {/* Text Formatting */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
        title="Gras"
      >
        <FaBold />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
        title="Italique"
      >
        <FaItalic />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
        title="Souligné"
      >
        <FaUnderline />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('strike') ? 'bg-gray-200' : ''}`}
        title="Barré"
      >
        <FaStrikethrough />
      </button>

      <div className="border-l border-gray-300 h-6 mx-1"></div>

      {/* Liens et Images */}
      <button
        onClick={setLink}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('link') ? 'bg-gray-200' : ''}`}
        title="Insérer un lien"
      >
        <FaLink className="w-5 h-5" />
      </button>
      <button
        onClick={addImage}
        className={`p-2 rounded hover:bg-gray-100`}
        title="Insérer une image"
      >
        <FaImage className="w-5 h-5" />
      </button>

      <div className="border-l border-gray-300 h-6 mx-1"></div>

      {/* Font Size */}
      <div className="relative">
        <button
          onClick={() => setShowFontSize(!showFontSize)}
          className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('textStyle') ? 'bg-gray-200' : ''}`}
          title="Taille de police"
        >
          <div className="flex items-center">
            <BiFontSize className="w-5 h-5" />
            <span className="ml-1 text-sm">Taille</span>
          </div>
        </button>
        {showFontSize && (
          <div className="absolute z-10 mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200">
            {FONT_SIZES.map((size) => (
              <button
                key={size.value}
                onClick={() => {
                  editor.chain().focus().setFontSize(size.value).run();
                  setShowFontSize(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
              >
                {size.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Text Color */}
      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('textStyle') ? 'bg-gray-200' : ''}`}
          title="Couleur du texte"
        >
          <div className="flex items-center">
            <div className="relative">
              <FaPalette className="w-5 h-5" style={{ color: currentColor }} />
              <div 
                className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
                style={{ backgroundColor: currentColor }}
              />
            </div>
            <span className="ml-1 text-sm">Couleur</span>
          </div>
        </button>
        {showColorPicker && (
          <div className="absolute z-50 mt-1 w-64 p-3 bg-white rounded-md shadow-xl border border-gray-200">
            <div className="grid grid-cols-6 gap-2">
              {colors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => {
                    editor.chain().focus().setColor(color.value).run();
                    setCurrentColor(color.value);
                    setShowColorPicker(false);
                  }}
                  className={`w-6 h-6 rounded-full border-2 ${currentColor === color.value ? 'ring-2 ring-offset-2 ring-blue-500' : 'border-gray-200'} hover:scale-110 transition-transform`}
                  style={{ backgroundColor: color.value }}
                  title={`${color.name} (${color.value})`}
                />
              ))}
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center mb-2">
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => {
                    const newColor = e.target.value;
                    editor.chain().focus().setColor(newColor).run();
                    setCurrentColor(newColor);
                  }}
                  className="w-10 h-8 cursor-pointer rounded"
                />
                <span className="ml-2 text-sm text-gray-600">Personnalisé</span>
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">Sélectionnez une couleur</span>
                <button
                  onClick={() => {
                    editor.chain().focus().unsetColor().run();
                    setCurrentColor('#000000');
                    setShowColorPicker(false);
                  }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bouton de surbrillance */}
      <div className="relative">
        <button
          onClick={() => setShowHighlightMenu(!showHighlightMenu)}
          className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('highlight') ? 'bg-gray-200' : ''}`}
          title="Surbrillance"
        >
          <FaHighlighter className="w-5 h-5" style={{ color: currentHighlightColor }} />
        </button>
        {showHighlightMenu && (
          <div className="absolute z-50 mt-1 p-2 bg-white rounded-md shadow-xl border border-gray-200">
            <div className="grid grid-cols-3 gap-2">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => {
                    editor.chain().focus().toggleHighlight({ color: color.value }).run();
                    setCurrentHighlightColor(color.value);
                    setShowHighlightMenu(false);
                  }}
                  className={`w-6 h-6 rounded ${editor.isActive('highlight', { color: color.value }) ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {editor.isActive('highlight', { color: color.value }) && (
                    <FaCheck className="w-3 h-3 mx-auto text-gray-700" />
                  )}
                </button>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  editor.chain().focus().unsetHighlight().run();
                  setShowHighlightMenu(false);
                }}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <FaTimes className="w-3 h-3" /> Supprimer la surbrillance
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bouton de code simplifié */}
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('codeBlock') ? 'bg-gray-200' : ''}`}
        title="Bloc de code"
      >
        <FaCode className="w-5 h-5" />
      </button>

      <div className="flex items-center ml-auto">
        <button
          onClick={() => {
            // Aller en haut du document
            editor.chain().focus().setTextSelection(0).run();
            // Faire défiler vers le haut
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded"
          title="Aller en haut du document"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          onClick={() => {
            // Aller en bas du document
            const endPos = editor.state.doc.content.size;
            editor.chain().focus().setTextSelection(endPos).run();
            // Faire défiler vers le bas
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          }}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded"
          title="Aller en bas du document"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        {onTrackChanges && (
          <button
            onClick={onTrackChanges}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded ml-1"
            title="Suivi des modifications"
          >
            <FaHistory className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MenuBar;


