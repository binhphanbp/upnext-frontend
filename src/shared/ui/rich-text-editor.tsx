"use client";

import {
  TextB,
  TextItalic,
  TextUnderline,
  TextH,
  ListBullets,
  ListNumbers,
  Quotes,
  Link as LinkIcon,
  ArrowUUpLeft,
  ArrowUUpRight,
  Eraser,
} from "@phosphor-icons/react/dist/ssr";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback } from "react";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export interface RichTextEditorProps {
  error?: boolean | undefined;
  onChange: (value: string) => void;
  placeholder?: string | undefined;
  value: string;
}

export function RichTextEditor({ error, onChange, placeholder, value }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      Underline,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-emerald-600 underline underline-offset-4 cursor-pointer",
        },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Nhập nội dung...",
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-slate-400 before:float-left before:pointer-events-none before:h-0",
      }),
    ],
    content: value,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "min-h-[180px] p-4 outline-none",
          // Base styles for the editor content
          "text-sm leading-6 text-slate-700",
          "[&_p]:mb-3 last:[&_p]:mb-0",
          "[&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-6 [&_h2]:mb-3 first:[&_h2]:mt-0",
          "[&_h3]:text-base [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:mt-5 [&_h3]:mb-2 first:[&_h3]:mt-0",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul_li]:mb-1",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol_li]:mb-1",
          "[&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-500 [&_blockquote]:my-3",
          "[&_a]:text-emerald-600 [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-emerald-700",
        ),
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);
    if (url === null) {
      return;
    }
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return <div className="min-h-[180px] w-full rounded-xl border border-slate-200 bg-slate-50" />;
  }

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-xl border bg-white text-sm font-semibold text-slate-700",
        "focus-within:border-primary focus-within:ring-1 focus-within:ring-primary focus-within:outline-none",
        error ? "border-rose-300" : "border-slate-200",
      )}
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50/50 p-2">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="In đậm"
        >
          <TextB className="h-4.5 w-4.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="In nghiêng"
        >
          <TextItalic className="h-4.5 w-4.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Gạch chân"
        >
          <TextUnderline className="h-4.5 w-4.5" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-slate-200" />

        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Tiêu đề"
        >
          <TextH className="h-4.5 w-4.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Danh sách"
        >
          <ListBullets className="h-4.5 w-4.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Danh sách số"
        >
          <ListNumbers className="h-4.5 w-4.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Trích dẫn"
        >
          <Quotes className="h-4.5 w-4.5" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-slate-200" />

        <ToolbarButton active={editor.isActive("link")} onClick={setLink} title="Chèn liên kết">
          <LinkIcon className="h-4.5 w-4.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          title="Xóa định dạng"
        >
          <Eraser className="h-4.5 w-4.5" />
        </ToolbarButton>

        <div className="flex-1" />

        <ToolbarButton
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
          title="Hoàn tác"
        >
          <ArrowUUpLeft className="h-4.5 w-4.5" />
        </ToolbarButton>
        <ToolbarButton
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
          title="Làm lại"
        >
          <ArrowUUpRight className="h-4.5 w-4.5" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  active,
  children,
  disabled,
  onClick,
  title,
}: Readonly<{
  active?: boolean;
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
}>) {
  return (
    <button
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors outline-none",
        active
          ? "bg-emerald-100 text-emerald-700"
          : "text-slate-500 hover:bg-slate-200 hover:text-slate-700",
        disabled && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-slate-500",
      )}
      disabled={disabled}
      onClick={onClick}
      title={title}
      type="button"
    >
      {children}
    </button>
  );
}
