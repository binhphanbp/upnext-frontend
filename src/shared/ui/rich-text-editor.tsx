"use client";

import {
  TextB,
  TextItalic,
  TextUnderline,
  TextH,
  TextHTwo,
  TextHThree,
  ListBullets,
  ListNumbers,
  Quotes,
  Link as LinkIcon,
  ArrowUUpLeft,
  ArrowUUpRight,
  ArrowsIn,
  ArrowsOut,
  Code,
  CodeBlock,
  Eraser,
  Minus,
  TextStrikethrough,
  Clock,
  Article,
} from "@phosphor-icons/react/dist/ssr";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/shared/lib/cn";

export interface RichTextEditorProps {
  expandable?: boolean | undefined;
  error?: boolean | undefined;
  onChange: (value: string) => void;
  placeholder?: string | undefined;
  value: string;
}

export function RichTextEditor({
  expandable = false,
  error,
  onChange,
  placeholder,
  value,
}: RichTextEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
        link: false,
        underline: false,
      }),
      Underline,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-emerald-600 underline underline-offset-4 cursor-pointer",
        },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Nhập nội dung bài viết chi tiết tại đây...",
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-slate-400 before:float-left before:pointer-events-none before:h-0",
      }),
    ],
    [placeholder],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: value,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
    editorProps: {
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData("text/plain");
        if (text && /<[a-z][\s\S]*>/i.test(text)) {
          // If the user pastes raw HTML like <p>...</p>, parse and insert it directly as rich text HTML!
          event.preventDefault();
          editor?.commands.insertContent(text);
          return true;
        }
        return false;
      },
      attributes: {
        class: cn(
          "min-h-[260px] p-4.5 outline-none font-normal break-words overflow-x-hidden",
          // Base styles for the editor content
          "text-[15px] leading-7 text-slate-700",
          "[&_p]:mb-4 last:[&_p]:mb-0",
          "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-7 [&_h2]:mb-3 first:[&_h2]:mt-0 [&_h2]:pb-1.5 [&_h2]:border-b [&_h2]:border-slate-100",
          "[&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:mt-6 [&_h3]:mb-2.5 first:[&_h3]:mt-0",
          "[&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-slate-900 [&_h4]:mt-5 [&_h4]:mb-2 first:[&_h4]:mt-0",
          "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul_li]:mb-1.5",
          "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol_li]:mb-1.5",
          "[&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500 [&_blockquote]:bg-emerald-50/40 [&_blockquote]:py-2 [&_blockquote]:pl-4 [&_blockquote]:pr-3 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_blockquote]:my-4 [&_blockquote]:rounded-r-lg",
          "[&_code]:bg-slate-100 [&_code]:text-emerald-700 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono",
          "[&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:my-4 [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:p-0",
          "[&_a]:text-emerald-600 [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-emerald-700",
          "[&_hr]:border-slate-200 [&_hr]:my-6",
        ),
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Nhập đường dẫn liên kết (URL):", previousUrl);
    if (url === null) {
      return;
    }
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  // Sync external value changes (e.g. form reset, async post data load)
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (value !== currentHtml && (value || currentHtml !== "<p></p>")) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  useEffect(() => {
    if (!isExpanded) return undefined;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsExpanded(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded]);

  const stats = useMemo(() => {
    if (!editor) return { words: 0, chars: 0, readingMin: 1 };
    const text = editor.getText();
    const cleanText = text.trim();
    const words = cleanText ? cleanText.split(/\s+/).length : 0;
    const chars = text.length;
    const readingMin = Math.max(1, Math.ceil(words / 200));
    return { words, chars, readingMin };
  }, [editor, editor?.state?.doc]);

  if (!editor) {
    return <div className="min-h-[260px] w-full rounded-xl border border-slate-200 bg-slate-50" />;
  }

  const editorSurface = (
    <div
      aria-label={isExpanded ? "Trình soạn thảo phóng to" : undefined}
      aria-modal={isExpanded || undefined}
      role={isExpanded ? "dialog" : undefined}
      className={cn(
        "w-full overflow-hidden border bg-white text-sm font-normal text-slate-700 flex flex-col",
        "focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 focus-within:outline-none",
        error ? "border-rose-300 ring-1 ring-rose-200" : "border-slate-200",
        !isExpanded && "rounded-xl shadow-xs",
        isExpanded && "fixed inset-0 z-[1001] rounded-none shadow-none bg-white",
      )}
    >
      {/* Top Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50/80 p-2 select-none">
        {/* Text Style */}
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="In đậm (Ctrl+B)"
        >
          <TextB className="h-4.5 w-4.5" weight={editor.isActive("bold") ? "bold" : "regular"} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="In nghiêng (Ctrl+I)"
        >
          <TextItalic className="h-4.5 w-4.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Gạch chân (Ctrl+U)"
        >
          <TextUnderline className="h-4.5 w-4.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Gạch ngang chữ"
        >
          <TextStrikethrough className="h-4.5 w-4.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Mã trong dòng (Inline code)"
        >
          <Code className="h-4.5 w-4.5" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-slate-200" />

        {/* Headings */}
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Tiêu đề H2"
        >
          <TextHTwo
            className="h-4.5 w-4.5"
            weight={editor.isActive("heading", { level: 2 }) ? "bold" : "regular"}
          />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Tiêu đề H3"
        >
          <TextHThree
            className="h-4.5 w-4.5"
            weight={editor.isActive("heading", { level: 3 }) ? "bold" : "regular"}
          />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 4 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          title="Tiêu đề H4"
        >
          <span className="font-mono text-xs font-bold">H4</span>
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-slate-200" />

        {/* Lists & Quotes */}
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Danh sách gạch đầu dòng"
        >
          <ListBullets className="h-4.5 w-4.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Danh sách đánh số"
        >
          <ListNumbers className="h-4.5 w-4.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Đoạn trích dẫn"
        >
          <Quotes className="h-4.5 w-4.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Khối mã nguồn (Code block)"
        >
          <CodeBlock className="h-4.5 w-4.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Đường phân cách ngang"
        >
          <Minus className="h-4.5 w-4.5" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-slate-200" />

        {/* Link & Clean */}
        <ToolbarButton
          active={editor.isActive("link")}
          onClick={setLink}
          title="Chèn / Chỉnh sửa liên kết"
        >
          <LinkIcon className="h-4.5 w-4.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          title="Xóa toàn bộ định dạng đoạn văn"
        >
          <Eraser className="h-4.5 w-4.5" />
        </ToolbarButton>

        <div className="flex-1" />

        {/* History & Fullscreen */}
        <ToolbarButton
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
          title="Hoàn tác (Ctrl+Z)"
        >
          <ArrowUUpLeft className="h-4.5 w-4.5" />
        </ToolbarButton>
        <ToolbarButton
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
          title="Làm lại (Ctrl+Y)"
        >
          <ArrowUUpRight className="h-4.5 w-4.5" />
        </ToolbarButton>
        {expandable ? (
          <ToolbarButton
            active={isExpanded}
            ariaLabel={isExpanded ? "Thu nhỏ trình soạn thảo" : "Toàn màn hình trình soạn thảo"}
            onClick={() => setIsExpanded((current) => !current)}
            title={isExpanded ? "Thu nhỏ (Esc)" : "Toàn màn hình"}
          >
            {isExpanded ? (
              <ArrowsIn className="h-4.5 w-4.5" />
            ) : (
              <ArrowsOut className="h-4.5 w-4.5" />
            )}
          </ToolbarButton>
        ) : null}
      </div>

      {/* Editor Content Area */}
      <EditorContent
        editor={editor}
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-white cursor-text break-words",
          isExpanded && "p-6 max-w-4xl mx-auto w-full",
        )}
      />

      {/* Bottom Status Bar */}
      <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50/60 px-3 py-1.5 text-[11px] text-slate-500 select-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Article className="h-3.5 w-3.5 text-slate-400" />
            <strong>{stats.words}</strong> từ
          </span>
          <span className="text-slate-300">•</span>
          <span>
            <strong>{stats.chars}</strong> ký tự
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <Clock className="h-3.5 w-3.5" />
          <span>~{stats.readingMin} phút đọc</span>
        </div>
      </div>
    </div>
  );

  if (!isExpanded) return editorSurface;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[1000] bg-slate-950/40 backdrop-blur-xs" aria-hidden="true" />
      {editorSurface}
    </>,
    document.body,
  );
}

function ToolbarButton({
  active,
  ariaLabel,
  children,
  disabled,
  onClick,
  title,
}: Readonly<{
  active?: boolean;
  ariaLabel?: string;
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
}>) {
  return (
    <button
      aria-label={ariaLabel}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors outline-none",
        active
          ? "bg-emerald-100 text-emerald-700 shadow-xs"
          : "text-slate-500 hover:bg-slate-200 hover:text-slate-700",
        disabled && "opacity-35 cursor-not-allowed hover:bg-transparent hover:text-slate-500",
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
