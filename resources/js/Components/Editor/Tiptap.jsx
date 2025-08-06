import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Image } from '@tiptap/extension-image';
import { useEffect } from 'react';
import MenuBar from './MenuBar';

const Tiptap = ({ content, onChange, editable = true }) => {
  const editor = useEditor({
    extensions: [
      // Configuration minimale de StarterKit
      StarterKit.configure({
        // Désactive uniquement les extensions qui seront configurées séparément
        heading: false,
        link: false,
        textAlign: false
      }),
      // Extensions avec configurations personnalisées
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 hover:underline',
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Highlight.configure({
        multicolor: true
      }),
      TextStyle,
      Color,
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto'
        }
      })
    ],
    content: content,
    editable: editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none p-4 min-h-[300px] bg-white rounded-b-lg',
      },
      handleKeyDown: (view, event) => {
        // Ctrl+S pour sauvegarder
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
          event.preventDefault();
          onChange(view.state.doc.content.toString());
          return true;
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  // Couleurs prédéfinies pour le sélecteur de couleur
  const colors = [
    { name: 'Noir', value: '#000000' },
    { name: 'Rouge', value: '#ef4444' },
    { name: 'Bleu', value: '#3b82f6' },
    { name: 'Vert', value: '#10b981' },
    { name: 'Jaune', value: '#f59e0b' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Rose', value: '#ec4899' },
    { name: 'Gris', value: '#6b7280' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md">
      <MenuBar editor={editor} colors={colors} />
      <div className="border-t border-gray-100">
        <EditorContent 
          editor={editor} 
          className="focus:ring-0 focus:ring-offset-0 focus:outline-none"
        />
      </div>
      
      {/* Menu contextuel pour la sélection de texte */}
      {editor && (
        <BubbleMenu 
          editor={editor} 
          tippyOptions={{ duration: 100 }}
          className="bg-white shadow-lg rounded-md p-1 flex items-center space-x-1 border border-gray-200"
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1 rounded hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-gray-100' : ''}`}
            title="Gras (Ctrl+B)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
              <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1 rounded hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-gray-100' : ''}`}
            title="Italique (Ctrl+I)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="4" x2="10" y2="4"></line>
              <line x1="14" y1="20" x2="5" y2="20"></line>
              <line x1="15" y1="4" x2="9" y2="20"></line>
            </svg>
          </button>
          <div className="h-6 w-px bg-gray-200 mx-1"></div>
          <div className="flex items-center space-x-1">
            {colors.map(color => (
              <button
                key={color.value}
                onClick={() => editor.chain().focus().setColor(color.value).run()}
                className="w-5 h-5 rounded-full border border-gray-200"
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </BubbleMenu>
      )}
    </div>
  );
};

export default Tiptap;
