import { useEditor, EditorContent } from '@tiptap/react';
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
          class: 'text-blue-500 hover:underline'
        }
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Highlight,
      TextStyle,
      Color,
      Image
    ],
    content: content,
    editable: editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
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

  return (
    <div className="editor">
      {editable && <MenuBar editor={editor} />}
      <EditorContent 
        editor={editor} 
        className={`prose max-w-none p-4 ${editable ? 'min-h-[300px] border border-t-0 rounded-b-lg' : ''}`}
      />
    </div>
  );
};

export default Tiptap;
