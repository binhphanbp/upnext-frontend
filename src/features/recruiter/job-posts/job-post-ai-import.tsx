"use client";

import { FileArrowUp, FileText, Sparkle, X } from "@phosphor-icons/react";
import { useRef, useState, type DragEvent } from "react";

import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";

type JobPostAiImportProps = Readonly<{
  isSubmitting: boolean;
  onExtractFile: (file: File) => Promise<boolean>;
  onExtractText: (text: string) => Promise<boolean>;
  onStartFromScratch: () => void;
  onOpenGenerator: () => void;
}>;

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = ".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp";

export function JobPostAiImport({
  isSubmitting,
  onExtractFile,
  onExtractText,
  onStartFromScratch,
  onOpenGenerator,
}: JobPostAiImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"file" | "paste">("file");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const selectFile = (nextFile?: File) => {
    if (!nextFile) return;
    if (nextFile.size > MAX_FILE_SIZE) {
      setError("File vượt quá giới hạn 8 MB.");
      setFile(null);
      return;
    }

    const extension = nextFile.name.split(".").pop()?.toLocaleLowerCase();
    if (!extension || !["pdf", "docx", "txt", "jpg", "jpeg", "png", "webp"].includes(extension)) {
      setError("Chỉ hỗ trợ PDF, DOCX, TXT hoặc ảnh JPG, PNG, WEBP.");
      setFile(null);
      return;
    }

    setError("");
    setFile(nextFile);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files[0]);
  };

  const submit = async () => {
    if (mode === "file") {
      if (!file) {
        setError("Vui lòng chọn file JD cần quét.");
        return;
      }
      setError("");
      await onExtractFile(file);
      return;
    }

    if (text.trim().length < 60) {
      setError("Nội dung JD cần tối thiểu 60 ký tự.");
      return;
    }
    setError("");
    await onExtractText(text.trim());
  };

  return (
    <div className="space-y-6">
      <div className="upnext-shadow w-full rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h1 className="font-outfit flex flex-wrap items-center justify-center gap-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Tạo tin từ JD có sẵn với
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <Sparkle size={24} weight="fill" aria-hidden="true" />
                UpNext AI
              </span>
            </h1>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 font-normal text-slate-600">
              AI chỉ trích xuất nội dung có trong nguồn. Bạn sẽ được kiểm tra và chỉnh sửa toàn bộ
              dữ liệu trước khi đăng.
            </p>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section aria-labelledby="jd-source-heading">
              <h2 id="jd-source-heading" className="text-sm font-semibold text-slate-900">
                Cung cấp JD theo cách của bạn
              </h2>

              <div
                role="tablist"
                aria-label="Nguồn JD"
                className="mt-3 inline-flex rounded-xl bg-slate-100 p-1"
              >
                <button
                  id="jd-file-tab"
                  type="button"
                  role="tab"
                  aria-selected={mode === "file"}
                  aria-controls="jd-file-panel"
                  onClick={() => {
                    setMode("file");
                    setError("");
                  }}
                  className="upnext-focus rounded-lg px-4 py-2 text-sm font-medium text-slate-600 aria-selected:bg-white aria-selected:text-slate-900 aria-selected:shadow-sm"
                >
                  Tải file JD
                </button>
                <button
                  id="jd-paste-tab"
                  type="button"
                  role="tab"
                  aria-selected={mode === "paste"}
                  aria-controls="jd-paste-panel"
                  onClick={() => {
                    setMode("paste");
                    setError("");
                  }}
                  className="upnext-focus rounded-lg px-4 py-2 text-sm font-medium text-slate-600 aria-selected:bg-white aria-selected:text-slate-900 aria-selected:shadow-sm"
                >
                  Dán nội dung
                </button>
              </div>

              {mode === "file" ? (
                <div
                  id="jd-file-panel"
                  role="tabpanel"
                  aria-labelledby="jd-file-tab"
                  className="mt-5"
                >
                  <label htmlFor="jd-file-input" className="sr-only">
                    Chọn file JD cần quét
                  </label>
                  <input
                    ref={inputRef}
                    id="jd-file-input"
                    aria-label="File JD cần quét"
                    type="file"
                    accept={ACCEPTED_FILE_TYPES}
                    disabled={isSubmitting}
                    onChange={(event) => selectFile(event.target.files?.[0])}
                    className="sr-only"
                  />

                  <div
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setDragging(true);
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
                      dragging
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 bg-slate-50/70"
                    }`}
                  >
                    <FileArrowUp
                      size={40}
                      className="mx-auto text-emerald-600"
                      aria-hidden="true"
                    />
                    <p className="mt-3 text-sm font-semibold text-slate-800">
                      Kéo thả file vào đây hoặc chọn từ máy
                    </p>
                    <p className="mt-1 text-xs leading-5 font-normal text-slate-500">
                      PDF, DOCX, TXT, JPG, PNG hoặc WEBP; tối đa 8 MB
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => inputRef.current?.click()}
                      className="mt-4"
                    >
                      Chọn file JD
                    </Button>
                  </div>

                  {file ? (
                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <FileText
                        size={24}
                        className="shrink-0 text-emerald-700"
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
                        <p className="text-xs font-normal text-slate-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Bỏ file ${file.name}`}
                        disabled={isSubmitting}
                        onClick={() => {
                          setFile(null);
                          if (inputRef.current) inputRef.current.value = "";
                        }}
                        className="upnext-focus rounded-full p-1.5 text-slate-500 hover:bg-white"
                      >
                        <X size={17} aria-hidden="true" />
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div
                  id="jd-paste-panel"
                  role="tabpanel"
                  aria-labelledby="jd-paste-tab"
                  className="mt-5"
                >
                  <label htmlFor="jd-source-text" className="sr-only">
                    Nội dung JD
                  </label>
                  <Textarea
                    id="jd-source-text"
                    rows={13}
                    value={text}
                    disabled={isSubmitting}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="Dán toàn bộ chức danh, mô tả công việc, yêu cầu và quyền lợi..."
                    className="min-h-72 resize-y font-normal"
                  />
                  <p className="mt-1.5 text-right text-xs font-normal text-slate-500">
                    {text.trim().length.toLocaleString("vi-VN")} ký tự
                  </p>
                </div>
              )}

              {error ? (
                <p
                  role="alert"
                  className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
                >
                  {error}
                </p>
              ) : null}

              <div className="mt-5 flex justify-end">
                <Button
                  type="button"
                  disabled={isSubmitting || (mode === "file" ? !file : text.trim().length < 60)}
                  onClick={submit}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <Sparkle size={17} weight="fill" aria-hidden="true" />
                  {isSubmitting ? "AI đang quét JD..." : "Quét và tự động điền"}
                </Button>
              </div>
            </section>

            <aside className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <Sparkle size={28} weight="fill" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-slate-900">AI sẽ làm gì?</h2>
              <ol className="mt-3 space-y-3 text-sm leading-6 font-normal text-slate-600">
                <li>
                  <strong className="font-semibold text-slate-800">1.</strong> Đọc nội dung và nhận
                  diện các phần của JD.
                </li>
                <li>
                  <strong className="font-semibold text-slate-800">2.</strong> Ánh xạ cấp bậc, kỹ
                  năng và danh mục có trong hệ thống.
                </li>
                <li>
                  <strong className="font-semibold text-slate-800">3.</strong> Điền bản nháp để bạn
                  kiểm tra, không tự động đăng.
                </li>
              </ol>
              <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 font-normal text-amber-900">
                Những thông tin không có trong JD gốc sẽ được để trống thay vì tự suy diễn.
              </p>
            </aside>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5 text-sm font-normal text-slate-500">
            <span>Hoặc</span>
            <button
              type="button"
              onClick={onStartFromScratch}
              className="upnext-focus rounded text-sm font-medium text-emerald-700 hover:underline"
            >
              nhập tin từ đầu
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={onOpenGenerator}
              className="upnext-focus rounded text-sm font-medium text-emerald-700 hover:underline"
            >
              tạo JD tự động bằng AI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
