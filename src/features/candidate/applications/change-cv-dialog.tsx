"use client";

import { CheckCircle, Eye, FilePdf, SpinnerGap, UploadSimple } from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  type CandidateApplicationMutationApi,
  type CandidateCvApi,
  createCandidateCv,
  downloadCandidateCvVersion,
  getMyCandidateCvs,
  updateCandidateApplicationCv,
  uploadCandidateCvFile,
} from "@/features/candidate/api/profile";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

type ChangeCvDialogProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  currentCvVersionId: string;
  accessToken: string;
  onChanged: (updated: CandidateApplicationMutationApi) => void;
}>;

export function ChangeCvDialog({
  open,
  onOpenChange,
  applicationId,
  currentCvVersionId,
  accessToken,
  onChanged,
}: ChangeCvDialogProps) {
  const t = useTranslations("CandidateWorkspace");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);
  const [previewingCvId, setPreviewingCvId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    data: cvsData,
    isLoading: isLoadingCvs,
    isError: isCvsError,
    refetch: refetchCvs,
  } = useQuery({
    enabled: open,
    queryFn: () => getMyCandidateCvs(accessToken),
    queryKey: ["candidate-cvs", accessToken],
  });

  useEffect(() => {
    if (!open) {
      setSelectedCvId(null);
      setUploadError(null);
    }
  }, [open]);

  useEffect(() => {
    if (selectedCvId || !cvsData?.items?.length) return;
    const owningCv = cvsData.items.find((cv) =>
      cv.versions.some((version) => version.id === currentCvVersionId),
    );
    setSelectedCvId(owningCv?.id ?? cvsData.items[0]?.id ?? null);
  }, [cvsData, currentCvVersionId, selectedCvId]);

  const selectedCvVersionId = useMemo(() => {
    const selectedCv = cvsData?.items.find((cv) => cv.id === selectedCvId);
    if (!selectedCv) return null;
    return (
      [...selectedCv.versions].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      )[0]?.id ?? null
    );
  }, [cvsData, selectedCvId]);

  const mutation = useMutation({
    mutationFn: () =>
      updateCandidateApplicationCv(accessToken, applicationId, {
        cvVersionId: selectedCvVersionId!,
      }),
    onSuccess: (updated) => {
      onChanged(updated);
      onOpenChange(false);
    },
  });

  const handlePreview = async (cv: CandidateCvApi) => {
    const latestVersion = [...cv.versions].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )[0];
    if (!latestVersion) return;

    const previewWindow = window.open("about:blank", "_blank");
    if (!previewWindow) return;
    previewWindow.opener = null;

    setPreviewingCvId(cv.id);
    try {
      const { blob } = await downloadCandidateCvVersion(accessToken, latestVersion.id, {
        expectedMimeType: latestVersion.sourceFile?.mimeType ?? null,
        fileName: latestVersion.sourceFile?.originalName ?? cv.title,
      });

      const objectUrl = URL.createObjectURL(blob);
      previewWindow.location.replace(objectUrl);
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5 * 60 * 1000);
    } catch {
      previewWindow.close();
    } finally {
      setPreviewingCvId(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const uploadRes = await uploadCandidateCvFile(file, accessToken);
      const cvRes = await createCandidateCv(accessToken, {
        source: "UPLOAD",
        sourceFileId: uploadRes.file.id,
        title: file.name,
      });
      await refetchCvs();
      setSelectedCvId(cvRes.id);
    } catch {
      setUploadError(t("applicationDetail.changeCv.uploadError"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const isUnchanged = Boolean(selectedCvVersionId) && selectedCvVersionId === currentCvVersionId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t("applicationDetail.changeCv.cancel")} className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("applicationDetail.changeCv.title")}</DialogTitle>
          <DialogDescription className="pt-1 leading-6">
            {t("applicationDetail.changeCv.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
          {isLoadingCvs ? (
            <div className="flex h-16 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
              <SpinnerGap aria-hidden="true" className="animate-spin text-slate-400" size={20} />
            </div>
          ) : isCvsError ? (
            <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
              {t("applicationDetail.changeCv.loadError")}
            </p>
          ) : cvsData?.items && cvsData.items.length > 0 ? (
            cvsData.items.map((cv) => {
              const isCurrent = cv.versions.some((version) => version.id === currentCvVersionId);
              return (
                <button
                  key={cv.id}
                  type="button"
                  onClick={() => {
                    setSelectedCvId(cv.id);
                    void handlePreview(cv);
                  }}
                  disabled={previewingCvId === cv.id}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border p-3 text-left transition disabled:cursor-wait disabled:opacity-70",
                    selectedCvId === cv.id
                      ? "border-brand bg-brand-muted/40"
                      : "border-slate-200 bg-white hover:bg-slate-50",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <FilePdf
                      aria-hidden="true"
                      size={20}
                      weight="fill"
                      className="shrink-0 text-red-500"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">{cv.title}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {isCurrent ? (
                      <span className="bg-brand-muted text-accent-foreground rounded px-2 py-0.5 text-[10px] font-bold uppercase">
                        {t("applicationDetail.changeCv.currentBadge")}
                      </span>
                    ) : null}
                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                      {previewingCvId === cv.id ? (
                        <SpinnerGap aria-hidden="true" size={15} className="animate-spin" />
                      ) : (
                        <Eye aria-hidden="true" size={15} />
                      )}
                    </span>
                  </div>
                </button>
              );
            })
          ) : (
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
              {t("applicationDetail.changeCv.noCvs")}
            </p>
          )}
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            aria-label={t("applicationDetail.changeCv.uploadAnother")}
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="hover:border-brand flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-xs font-bold text-slate-600 transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? (
              <>
                <SpinnerGap aria-hidden="true" className="animate-spin" size={16} />
                {t("applicationDetail.changeCv.uploading")}
              </>
            ) : (
              <>
                <UploadSimple aria-hidden="true" size={16} />
                {t("applicationDetail.changeCv.uploadAnother")}
              </>
            )}
          </button>
          {uploadError ? (
            <p className="mt-2 text-xs font-semibold text-red-600">{uploadError}</p>
          ) : null}
        </div>

        {mutation.isError ? (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
            {t("applicationDetail.changeCv.error")}
          </p>
        ) : null}
        {mutation.isSuccess ? (
          <p className="bg-success-muted flex items-center gap-1.5 rounded-xl p-3 text-sm font-semibold text-teal-800">
            <CheckCircle aria-hidden="true" size={16} weight="fill" />
            {t("applicationDetail.changeCv.success")}
          </p>
        ) : null}

        <DialogFooter>
          <Button variant="ghost" disabled={mutation.isPending} onClick={() => onOpenChange(false)}>
            {t("applicationDetail.changeCv.cancel")}
          </Button>
          <Button
            disabled={!selectedCvVersionId || uploading || mutation.isPending || isUnchanged}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? <SpinnerGap aria-hidden="true" className="animate-spin" /> : null}
            {mutation.isPending
              ? t("applicationDetail.changeCv.submitting")
              : t("applicationDetail.changeCv.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
