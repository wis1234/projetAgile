import React, { useCallback } from 'react';
import { useEditor } from '@tiptap/react';
import { 
  FaBold, 
  FaItalic, 
  FaUnderline, 
  FaStrikethrough, 
  FaCode, 
  FaListUl, 
  FaListOl, 
  FaQuoteRight, 
  FaAlignLeft, 
  FaAlignCenter, 
  FaAlignRight, 
  FaAlignJustify, 
  FaLink, 
  FaUnlink, 
  FaImage, 
  FaPaperclip,
  FaHeading,
  FaPalette,
  FaFont
} from 'react-icons/fa';

const MenuBar = ({ editor, colors = [] }) => {
  if (!editor) {
    return null;
  }

  const addImage = useCallback(() => {
    const url = window.prompt('Entrez l\'URL de l\'image');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // Vérifier si l'URL commence par http:// ou https://, sinon l'ajouter
    const formattedUrl = url.match(/^https?:\/\//) ? url : `https://${url}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href: formattedUrl, target: '_blank' }).run();
  }, [editor]);

  return (
    <div className="editor-menu flex flex-wrap items-center gap-1 p-2 bg-white border-b border-gray-100 rounded-t-lg">
      {/* Boutons de formatage de base */}
      <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-lg">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-200 text-blue-600' : 'text-gray-700'}`}
          title="Gras (Ctrl+B)"
        >
          <FaBold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-200 text-blue-600' : 'text-gray-700'}`}
          title="Italique (Ctrl+I)"
        >
          <FaItalic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('underline') ? 'bg-gray-200 text-blue-600' : 'text-gray-700'}`}
          title="Souligné (Ctrl+U)"
        >
          <FaUnderline className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('strike') ? 'bg-gray-200 text-blue-600' : 'text-gray-700'}`}
          title="Barré (Ctrl+Shift+S)"
        >
          <FaStrikethrough className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-8 bg-gray-300 mx-1"></div>

      {/* Boutons de titres et listes */}
      <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-lg">
        <div className="relative group">
          <button
            className="p-2 rounded hover:bg-gray-200 text-gray-700"
            title="Titres"
          >
            <FaHeading className="w-4 h-4" />
          </button>
          <div className="absolute left-0 mt-1 w-32 bg-white shadow-lg rounded-md p-2 hidden group-hover:block z-10">
            {[1, 2, 3, 4, 5, 6].map((level) => (
              <button
                key={level}
                onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
                className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${editor.isActive('heading', { level }) ? 'bg-blue-50 text-blue-600' : ''}`}
              >
                Titre {level}
              </button>
            ))}
            <button
              onClick={() => editor.chain().focus().setParagraph().run()}
              className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${editor.isActive('paragraph') ? 'bg-blue-50 text-blue-600' : ''}`}
            >
              Paragraphe
            </button>
          </div>
        </div>

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-200 text-blue-600' : 'text-gray-700'}`}
          title="Liste à puces"
        >
          <FaListUl className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-200 text-blue-600' : 'text-gray-700'}`}
          title="Liste numérotée"
        >
          <FaListOl className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('blockquote') ? 'bg-gray-200 text-blue-600' : 'text-gray-700'}`}
          title="Citation"
        >
          <FaQuoteRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('codeBlock') ? 'bg-gray-200 text-blue-600' : 'text-gray-700'}`}
          title="Bloc de code"
        >
          <FaCode className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-8 bg-gray-300 mx-1"></div>

      {/* Boutons d'alignement et de mise en forme */}
      <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-lg">
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200 text-blue-600' : 'text-gray-700'}`}
          title="Aligner à gauche"
        >
          <FaAlignLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200 text-blue-600' : 'text-gray-700'}`}
          title="Centrer"
        >
          <FaAlignCenter className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200 text-blue-600' : 'text-gray-700'}`}
          title="Aligner à droite"
        >
          <FaAlignRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-200 text-blue-600' : 'text-gray-700'}`}
          title="Justifier"
        >
          <FaAlignJustify className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-8 bg-gray-300 mx-1"></div>

      {/* Liens et médias */}
      <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-lg">
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
