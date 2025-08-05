import React from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Image } from '@tiptap/extension-image';
import { FaBold, FaItalic, FaUnderline, FaStrikethrough, FaCode, FaListUl, FaListOl, FaQuoteRight, 
  FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify, FaLink, FaUnlink, FaImage, FaPaperclip } from 'react-icons/fa';

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt('URL de l\'image');

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      {/* Style de texte */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded ${editor.isActive('bold') ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
          title="Gras"
        >
          <FaBold />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded ${editor.isActive('italic') ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
          title="Italique"
        >
          <FaItalic />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded ${editor.isActive('underline') ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
          title="Souligné"
        >
          <FaUnderline />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded ${editor.isActive('strike') ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
          title="Barré"
        >
          <FaStrikethrough />
        </button>
      </div>

      <div className="w-px h-8 bg-gray-300 mx-1"></div>

      {/* En-têtes et paragraphes */}
      <div className="flex items-center space-x-1">
        <select
          value={editor.getAttributes('heading')?.level || 'paragraph'}
          onChange={(e) => {
            const value = e.target.value;
            if (value === 'paragraph') {
              editor.chain().focus().setParagraph().run();
            } else {
              editor.chain().focus().toggleHeading({ level: parseInt(value) }).run();
            }
          }}
          className="text-sm border rounded p-1 bg-white"
        >
          <option value="paragraph">Paragraphe</option>
          <option value="1">Titre 1</option>
          <option value="2">Titre 2</option>
          <option value="3">Titre 3</option>
          <option value="4">Titre 4</option>
        </select>
      </div>

      <div className="w-px h-8 bg-gray-300 mx-1"></div>

      {/* Listes et citations */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded ${editor.isActive('bulletList') ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
          title="Liste à puces"
        >
          <FaListUl />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded ${editor.isActive('orderedList') ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
          title="Liste numérotée"
        >
          <FaListOl />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded ${editor.isActive('blockquote') ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
          title="Citation"
        >
          <FaQuoteRight />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-2 rounded ${editor.isActive('codeBlock') ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
          title="Bloc de code"
        >
          <FaCode />
        </button>
      </div>

      <div className="w-px h-8 bg-gray-300 mx-1"></div>

      {/* Alignement */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
          title="Aligner à gauche"
        >
          <FaAlignLeft />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
          title="Centrer"
        >
          <FaAlignCenter />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-2 rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
          title="Aligner à droite"
        >
          <FaAlignRight />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`p-2 rounded ${editor.isActive({ textAlign: 'justify' }) ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
          title="Justifier"
        >
          <FaAlignJustify />
        </button>
      </div>

      <div className="w-px h-8 bg-gray-300 mx-1"></div>

      {/* Liens et médias */}
      <div className="flex items-center space-x-1">
        <button
          onClick={setLink}
          className={`p-2 rounded ${editor.isActive('link') ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
          title="Insérer un lien"
        >
          <FaLink />
        </button>
        <button
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive('link')}
          className="p-2 rounded text-gray-400 disabled:opacity-50"
          title="Supprimer le lien"
        >
          <FaUnlink />
        </button>
        <button
          onClick={addImage}
          className="p-2 rounded text-gray-600 hover:bg-gray-100"
          title="Insérer une image"
        >
          <FaImage />
        </button>
      </div>

      {/* Couleur de texte et surlignage */}
      <div className="flex items-center space-x-1">
        <input
          type="color"
          onInput={event => editor.chain().focus().setColor(event.target.value).run()}
          value={editor.getAttributes('textStyle').color || '#000000'}
          className="w-8 h-8 p-0 border-0 bg-transparent cursor-pointer"
          title="Couleur du texte"
        />
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`p-2 rounded ${editor.isActive('highlight') ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
          title="Surligner"
        >
          <span className="px-1 bg-yellow-200">A</span>
        </button>
      </div>
    </div>
  );
};

export default MenuBar;
