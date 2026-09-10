import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Image } from '@tiptap/extension-image';
import FontFamily from '@tiptap/extension-font-family';
import FontSize from '@tiptap/extension-font-size';
import { useEffect } from 'react';
import MenuBar from './MenuBar';

/**
 * Éditeur Tiptap léger (utilisé notamment sur Tasks/Show).
 * NOTE: fusion des deux versions précédemment dupliquées dans ce fichier
 * (bug bloquant : `Identifier 'Tiptap' has already been declared`).
 * - Heading est explicitement ajouté (StarterKit.heading désactivé) pour
 *   que H1-H3 fonctionnent avec la toolbar.
 * - FontFamily + FontSize sont inclus pour matcher MenuBar.jsx (qui appelle
 *   editor.chain().focus().setFontSize(...) — cause de l'erreur silencieuse
 *   corrigée ici).
 */
const Tiptap = ({ content, onChange, editable = true }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        link: false,
      }),
      Heading.configure({ levels: [1, 2, 3] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:underline',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
      FontFamily,
      FontSize.configure({ types: ['textStyle'] }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-2',
        },
      }),
    ],
    content: content,
    editable: editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: [
          // Style "feuille A4" — fond blanc, police serif, ombre portée
          'prose prose-sm sm:prose max-w-none focus:outline-none',
          'min-h-[300px] px-10 py-10 sm:px-16',
          'font-serif text-[#1E2129] bg-white',
          '[&_h1]:font-sans [&_h1]:text-[2em] [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-[#1E2129]',
          '[&_h2]:font-sans [&_h2]:text-[1.5em] [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-[#1E2129]',
          '[&_h3]:font-sans [&_h3]:text-[1.17em] [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-[#1E2129]',
          '[&_p]:leading-relaxed [&_p]:my-1',
          '[&_ul]:list-disc [&_ul]:ml-5 [&_ul]:my-2',
          '[&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:my-2',
          '[&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600',
          '[&_code]:bg-slate-100 [&_code]:rounded [&_code]:px-1 [&_code]:text-sm [&_code]:font-mono',
          '[&_pre]:bg-[#1E2129] [&_pre]:text-slate-100 [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:overflow-x-auto',
          '[&_a]:text-[#3454D1] [&_a]:underline',
          '[&_hr]:border-slate-200 [&_hr]:my-4',
        ].join(' '),
      },
      handleKeyDown: (view, event) => {
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

  return (
    <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_rgba(30,33,41,0.06)] border border-slate-200/60 overflow-hidden transition-shadow duration-200 hover:shadow-[0_1px_2px_rgba(0,0,0,0.05),0_16px_32px_rgba(30,33,41,0.09)]">
      {editable && (
        <div className="flex items-center px-3 py-2 border-b border-slate-100 bg-white overflow-x-auto">
          <MenuBar editor={editor} />
        </div>
      )}
      <div className="border-t border-slate-100">
        <EditorContent
          editor={editor}
          className="focus:ring-0 focus:ring-offset-0 focus:outline-none"
        />
      </div>

      {/* Menu contextuel sur sélection de texte */}
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          className="bg-white shadow-lg rounded-lg p-1 flex items-center gap-0.5 border border-slate-200"
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-slate-100 text-sm font-bold ${editor.isActive('bold') ? 'bg-[#EEF1FC] text-[#3454D1]' : 'text-slate-700'}`}
            title="Gras"
          >B</button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-slate-100 text-sm italic ${editor.isActive('italic') ? 'bg-[#EEF1FC] text-[#3454D1]' : 'text-slate-700'}`}
            title="Italique"
          >I</button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded hover:bg-slate-100 text-sm underline ${editor.isActive('underline') ? 'bg-[#EEF1FC] text-[#3454D1]' : 'text-slate-700'}`}
            title="Souligné"
          >U</button>
          <div className="w-px h-4 bg-slate-200 mx-0.5" />
          <button
            onClick={() => editor.chain().focus().toggleHighlight({ color: '#FEF08A' }).run()}
            className={`p-1.5 rounded hover:bg-slate-100 text-xs ${editor.isActive('highlight') ? 'bg-yellow-100' : ''}`}
            title="Surligner"
          >🖊</button>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded hover:bg-slate-100 text-xs ${editor.isActive('bulletList') ? 'bg-[#EEF1FC] text-[#3454D1]' : 'text-slate-700'}`}
            title="Liste"
          >≡</button>
          <button
            onClick={() => editor.chain().focus().setLink({ href: window.prompt('URL du lien:', editor.getAttributes('link').href || 'https://') || '' }).run()}
            className={`p-1.5 rounded hover:bg-slate-100 text-xs ${editor.isActive('link') ? 'bg-[#EEF1FC] text-[#3454D1]' : 'text-slate-700'}`}
            title="Lien"
          >🔗</button>
        </BubbleMenu>
      )}
    </div>
  );
};

export default Tiptap;