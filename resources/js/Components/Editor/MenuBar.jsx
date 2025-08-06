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
  FaPalette
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
];

const MenuBar = ({ editor, colors = COLORS, onTrackChanges }) => {
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
            <FaPalette className="w-5 h-5" style={{ color: currentColor }} />
            <span className="ml-1 text-sm">Couleur</span>
          </div>
        </button>
        {showColorPicker && (
          <div className="absolute z-10 mt-1 w-48 p-2 bg-white rounded-md shadow-lg border border-gray-200 grid grid-cols-5 gap-1">
            {colors.map((color) => (
              <button
                key={color.value}
                onClick={() => {
                  editor.chain().focus().setColor(color.value).run();
                  setCurrentColor(color.value);
                  setShowColorPicker(false);
                }}
                className="w-6 h-6 rounded-full border border-gray-300"
                style={{ backgroundColor: color.value }}
                title={`${color.name} (${color.value})`}
              />
            ))}
            <div className="col-span-5 mt-2 pt-2 border-t border-gray-100">
              <input
                type="color"
                value={currentColor}
                onChange={(e) => {
                  const newColor = e.target.value;
                  editor.chain().focus().setColor(newColor).run();
                  setCurrentColor(newColor);
                }}
                className="w-full h-8 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('codeBlock') ? 'bg-gray-200' : ''}`}
        title="Bloc de code"
      >
        <FaCode className="w-5 h-5" />
      </button>

      {onTrackChanges && (
        <button
          onClick={onTrackChanges}
          className="ml-auto p-2 text-blue-600 hover:bg-blue-50 rounded"
          title="Suivi des modifications"
        >
          <FaHistory className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default MenuBar;


