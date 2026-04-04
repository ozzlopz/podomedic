'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
  Video,
} from 'lucide-react';

type BlogEditorProps = {
  content: string;
  onChange: (html: string, text: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
};

const toolbarButtonClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700';

export default function BlogEditor({ content, onChange, onUploadImage }: BlogEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Image.configure({
        inline: false,
      }),
      Youtube.configure({
        controls: true,
        modestBranding: true,
        nocookie: true,
      }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'min-h-[360px] rounded-[1.75rem] border border-slate-200 bg-white px-5 py-5 text-slate-900 outline-none [&_.ProseMirror-youtube-iframe]:aspect-video [&_.ProseMirror-youtube-iframe]:w-full [&_a]:text-cyan-700 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-cyan-200 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h1]:mt-6 [&_h1]:text-4xl [&_h1]:font-black [&_h2]:mt-5 [&_h2]:text-3xl [&_h2]:font-black [&_h3]:mt-4 [&_h3]:text-2xl [&_h3]:font-bold [&_img]:my-4 [&_img]:rounded-3xl [&_img]:shadow-md [&_li]:ml-5 [&_ol]:list-decimal [&_p]:leading-relaxed [&_ul]:list-disc',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML(), currentEditor.getText());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 px-5 py-10 text-slate-500">
        Cargando editor...
      </div>
    );
  }

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Pega la URL del enlace', previousUrl ?? 'https://');

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().setLink({ href: url }).run();
  };

  const addImageByUrl = () => {
    const url = window.prompt('Pega la URL de la imagen');
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onUploadImage) return;

    setIsUploading(true);

    try {
      const imageUrl = await onUploadImage(file);
      editor.chain().focus().setImage({ src: imageUrl }).run();
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const addYoutube = () => {
    const url = window.prompt('Pega la URL de YouTube');
    if (!url) return;
    editor.chain().focus().setYoutubeVideo({ src: url }).run();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-3">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={toolbarButtonClass}>
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={toolbarButtonClass}>
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={toolbarButtonClass}>
          <Heading1 className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={toolbarButtonClass}>
          <Heading2 className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={toolbarButtonClass}>
          <Heading3 className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={toolbarButtonClass}>
          <List className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={toolbarButtonClass}>
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={toolbarButtonClass}>
          <Quote className="h-4 w-4" />
        </button>
        <button type="button" onClick={addLink} className={toolbarButtonClass}>
          <Link2 className="h-4 w-4" />
        </button>
        <button type="button" onClick={addImageByUrl} className={toolbarButtonClass}>
          <ImageIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={toolbarButtonClass}
          disabled={!onUploadImage || isUploading}
          title="Subir imagen"
        >
          <ImageIcon className="h-4 w-4" />
        </button>
        <button type="button" onClick={addYoutube} className={toolbarButtonClass}>
          <Video className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().undo().run()} className={toolbarButtonClass}>
          <Undo2 className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} className={toolbarButtonClass}>
          <Redo2 className="h-4 w-4" />
        </button>
      </div>

      <EditorContent editor={editor} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      {isUploading && <p className="text-sm font-medium text-cyan-700">Subiendo imagen al blog...</p>}
    </div>
  );
}
