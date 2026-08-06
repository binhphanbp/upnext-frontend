"use client";

import {
  CheckCircle,
  DownloadSimple,
  FileDoc,
  FilePdf,
  SpinnerGap,
  Star,
  Trash,
  UploadSimple,
  WarningCircle,
} from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

import {
  type CandidateCvApi,
  createCandidateCv,
  downloadCandidateCvVersion,
  setCandidateCvDefault,
  uploadCandidateCvFile,
} from "@/features/candidate/api/profile";
import { CvSnapshotPreviewDialog } from "@/features/candidate/cv-builder/cv-snapshot-preview-dialog";
import { parseCvSnapshot } from "@/features/candidate/cv-builder/store";
import type { CvData } from "@/features/candidate/cv-builder/types";
import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

const maximumCvSizeMb = 5;
const maximumCvSizeBytes = maximumCvSizeMb * 1024 * 1024;
const supportedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

type RunCvMutation = <TResult>(
  action: (accessToken: string) => Promise<TResult>,
) => Promise<TResult>;

type ProfileDocumentsProps = Readonly<{
  accessToken: string;
  cvs: CandidateCvApi[];
  isError: boolean;
  isLoading: boolean;
  mutateCvs: RunCvMutation;
  onDelete: (cv: CandidateCvApi) => void;
  onRetry: () => void;
}>;

export function ProfileDocuments({
  accessToken,
  cvs,
  isError,
  isLoading,
  mutateCvs,
  onDelete,
  onRetry,
}: ProfileDocumentsProps) {
  const t = useTranslations("CandidateProfile.content");
  const locale = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingDefaultId, setPendingDefaultId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [builderPreview, setBuilderPreview] = useState<{ title: string; cvData: CvData } | null>(
    null,
  );

  const chooseFile = (file: File | undefined) => {
    setFeedback(null);
    if (!file) return;

    const extension = file.name.split(".").at(-1)?.toLowerCase();
    const isSupported =
      supportedMimeTypes.has(file.type) || extension === "pdf" || extension === "docx";

    if (!isSupported) {
      setSelectedFile(null);
      setFileError(t("validation.fileType"));
      return;
    }
    if (file.size > maximumCvSizeBytes) {
      setSelectedFile(null);
      setFileError(t("validation.fileSize", { size: maximumCvSizeMb }));
      return;
    }

    setFileError(null);
    setSelectedFile(file);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    chooseFile(event.target.files?.[0]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  };

  const uploadSelectedFile = async () => {
    if (!selectedFile) {
      setFileError(t("validation.fileRequired"));
      return;
    }

    setIsUploading(true);
    setFileError(null);
    setFeedback(null);
    try {
      await mutateCvs(async (token) => {
        const upload = await uploadCandidateCvFile(selectedFile, token);
        return createCandidateCv(token, {
          isDefault: !cvs.some((cv) => cv.isDefault),
          source: "UPLOAD",
          sourceFileId: upload.file.id,
          title: getCandidateCvTitle(selectedFile.name),
        });
      });
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setFeedback(t("documents.uploadSuccess"));
    } catch {
      setFileError(t("documents.uploadError"));
    } finally {
      setIsUploading(false);
    }
  };

  const setDefault = async (cvId: string) => {
    setPendingDefaultId(cvId);
    setFeedback(null);
    try {
      await mutateCvs((token) => setCandidateCvDefault(token, cvId));
      setFeedback(t("documents.setDefaultSuccess"));
    } catch {
      setFeedback(t("feedback.failed"));
    } finally {
      setPendingDefaultId(null);
    }
  };

  const download = async (cv: CandidateCvApi) => {
    const version = getLatestCvVersion(cv);
    if (!version) {
      setFeedback(t("documents.downloadUnavailable"));
      return;
    }

    if (cv.source === "BUILDER") {
      setFeedback(t("documents.builderDownloadUnavailable"));
      return;
    }

    setDownloadingId(cv.id);
    setFeedback(null);
    try {
      const { blob } = await downloadCandidateCvVersion(accessToken, version.id, {
        expectedMimeType: version.sourceFile?.mimeType ?? null,
        fileName: version.sourceFile?.originalName ?? cv.title,
      });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = version.sourceFile?.originalName ?? `${cv.title}.pdf`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    } catch {
      setFeedback(t("documents.downloadUnavailable"));
    } finally {
      setDownloadingId(null);
    }
  };

  const preview = async (cv: CandidateCvApi) => {
    const version = getLatestCvVersion(cv);
    if (!version) {
      setFeedback(t("documents.downloadUnavailable"));
      return;
    }

    if (cv.source === "BUILDER") {
      const cvData = parseCvSnapshot(version.contentJson);
      if (cvData) {
        setFeedback(null);
        setBuilderPreview({ title: cv.title, cvData });
      } else {
        setFeedback(t("documents.previewUnavailable"));
      }
      return;
    }

    const previewWindow = window.open("about:blank", "_blank");
    if (!previewWindow) {
      setFeedback(t("documents.downloadUnavailable"));
      return;
    }
    previewWindow.opener = null;

    setPreviewingId(cv.id);
    setFeedback(null);
    try {
      const { blob } = await downloadCandidateCvVersion(accessToken, version.id, {
        expectedMimeType: version.sourceFile?.mimeType ?? null,
        fileName: version.sourceFile?.originalName ?? cv.title,
      });

      const objectUrl = URL.createObjectURL(blob);
      previewWindow.location.replace(objectUrl);
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5 * 60 * 1000);
    } catch {
      previewWindow.close();
      setFeedback(t("documents.downloadUnavailable"));
    } finally {
      setPreviewingId(null);
    }
  };

  return (
    <section aria-labelledby="profile-section-title">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:pb-6">
        <div className="max-w-2xl">
          <h2
            id="profile-section-title"
            tabIndex={-1}
            className="focus-visible:outline-brand scroll-mt-32 text-2xl font-bold tracking-[-0.025em] text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            {t("sections.documents.title")}
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-600 sm:mt-2">
            {t("sections.documents.description")}
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="hover:border-accent-foreground hover:text-accent-foreground"
        >
          <Link href="/candidate/cv-builder">{t("actions.openCvBuilder")}</Link>
        </Button>
      </div>

      <div className="pt-5 sm:pt-7">
        <div
          className={cn(
            "rounded-2xl border border-dashed px-5 py-6 transition-colors sm:px-7",
            isDragging ? "border-brand bg-brand-muted" : "border-slate-300 bg-slate-50/70",
          )}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null))
              setIsDragging(false);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            aria-label={t("documents.dropzoneLabel")}
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={handleInputChange}
            tabIndex={-1}
          />
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600">
                <UploadSimple aria-hidden="true" size={22} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{t("documents.dropzoneTitle")}</h3>
                <p className="mt-1 text-sm text-slate-600">{t("documents.dropzoneDescription")}</p>
                <p className="mt-2 text-xs font-medium text-slate-500">
                  {t("documents.supportedFormats")} ·{" "}
                  {t("documents.maximumSize", { size: maximumCvSizeMb })}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="hover:border-accent-foreground hover:text-accent-foreground"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
            >
              {t("documents.chooseFile")}
            </Button>
          </div>

          {selectedFile && (
            <div className="mt-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                {selectedFile.type === "application/pdf" ||
                selectedFile.name.toLowerCase().endsWith(".pdf") ? (
                  <FilePdf aria-hidden="true" className="shrink-0 text-red-600" size={24} />
                ) : (
                  <FileDoc aria-hidden="true" className="shrink-0 text-blue-600" size={24} />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{selectedFile.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatFileSize(selectedFile.size, locale)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                className="candidate-profile-primary-action"
                disabled={isUploading}
                onClick={uploadSelectedFile}
              >
                {isUploading ? (
                  <SpinnerGap aria-hidden="true" className="animate-spin" />
                ) : (
                  <UploadSimple aria-hidden="true" />
                )}
                {isUploading ? t("documents.uploading") : t("actions.uploadCv")}
              </Button>
            </div>
          )}

          {(fileError || feedback) && (
            <div
              role={fileError ? "alert" : "status"}
              aria-live="polite"
              className={cn(
                "mt-4 flex items-start gap-2 rounded-xl px-3.5 py-3 text-sm font-semibold",
                fileError ? "bg-red-50 text-red-700" : "bg-success-muted text-teal-800",
              )}
            >
              {fileError ? (
                <WarningCircle aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
              ) : (
                <CheckCircle
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                  size={18}
                  weight="fill"
                />
              )}
              {fileError ?? feedback}
            </div>
          )}
        </div>

        <div className="mt-9">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-7 text-center">
              <p className="text-sm font-semibold text-red-700">
                {t("states.sectionErrorDescription")}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="hover:border-accent-foreground hover:text-accent-foreground mt-4"
                onClick={onRetry}
              >
                {t("actions.retry")}
              </Button>
            </div>
          ) : cvs.length === 0 ? (
            <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5 text-left">
              <span className="border-brand/15 bg-brand-muted text-accent-foreground flex size-11 shrink-0 items-center justify-center rounded-xl border">
                <FilePdf aria-hidden="true" size={22} />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {t("sections.documents.emptyTitle")}
                </h3>
                <p className="mt-1 max-w-md text-sm leading-6 text-slate-600">
                  {t("sections.documents.emptyDescription")}
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200 border-y border-slate-200">
              {[...cvs]
                .sort(
                  (left, right) =>
                    Number(right.isDefault) - Number(left.isDefault) ||
                    new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
                )
                .map((cv) => (
                  <li
                    key={cv.id}
                    className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        {cv.source === "BUILDER" ? (
                          <FileDoc aria-hidden="true" size={22} />
                        ) : (
                          <FilePdf aria-hidden="true" size={22} />
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            className="hover:text-accent-foreground max-w-full cursor-pointer truncate text-left text-sm font-bold text-slate-950 underline-offset-4 hover:underline disabled:cursor-wait disabled:opacity-60"
                            disabled={previewingId === cv.id}
                            onClick={() => void preview(cv)}
                          >
                            {cv.title}
                          </button>
                          {cv.isDefault && (
                            <span className="bg-brand-muted text-accent-foreground inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold">
                              <Star aria-hidden="true" size={12} weight="fill" />
                              {t("documents.defaultLabel")}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {cv.source === "BUILDER"
                            ? t("documents.builderLabel")
                            : t("documents.uploadedLabel")}{" "}
                          · {t("documents.updatedAt", { date: formatDate(cv.updatedAt, locale) })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {!cv.isDefault && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={pendingDefaultId === cv.id}
                          onClick={() => setDefault(cv.id)}
                        >
                          {pendingDefaultId === cv.id ? (
                            <SpinnerGap aria-hidden="true" className="animate-spin" />
                          ) : (
                            <Star aria-hidden="true" />
                          )}
                          {t("actions.setDefault")}
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={downloadingId === cv.id}
                        onClick={() => download(cv)}
                      >
                        {downloadingId === cv.id ? (
                          <SpinnerGap aria-hidden="true" className="animate-spin" />
                        ) : (
                          <DownloadSimple aria-hidden="true" />
                        )}
                        {t("actions.download")}
                      </Button>
                      <button
                        type="button"
                        disabled={cv.isDefault}
                        aria-label={`${t("actions.delete")}: ${cv.title}`}
                        title={
                          cv.isDefault
                            ? t("deleteConfirmations.cv.defaultDescription")
                            : t("actions.delete")
                        }
                        className="focus-visible:outline-brand rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-35"
                        onClick={() => onDelete(cv)}
                      >
                        <Trash aria-hidden="true" size={18} />
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
      <CvSnapshotPreviewDialog
        open={Boolean(builderPreview)}
        onOpenChange={(open) => {
          if (!open) setBuilderPreview(null);
        }}
        title={builderPreview?.title ?? t("sections.documents.title")}
        cvData={builderPreview?.cvData ?? null}
      />
    </section>
  );
}

function getLatestCvVersion(cv: CandidateCvApi) {
  return [...cv.versions].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  )[0];
}

function formatFileSize(bytes: number, locale: string) {
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    maximumFractionDigits: 1,
    style: "unit",
    unit: bytes >= 1024 * 1024 ? "megabyte" : "kilobyte",
    unitDisplay: "short",
  }).format(bytes >= 1024 * 1024 ? bytes / (1024 * 1024) : bytes / 1024);
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function getCandidateCvTitle(fileName: string) {
  return (
    fileName
      .trim()
      .replace(/\.(pdf|docx)$/iu, "")
      .trim()
      .slice(0, 150)
      .trim() || "CV"
  );
}
