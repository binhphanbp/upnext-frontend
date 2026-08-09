"use client";

import {
  ArrowSquareOut,
  CheckCircle,
  Eye,
  FileDoc,
  FilePdf,
  Minus,
  Plus,
  SpinnerGap,
  UploadSimple,
  Warning,
} from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  type CandidateCvApi,
  checkAppliedJob,
  createCandidateCv,
  downloadCandidateCvVersion,
  getMyCandidateCvs,
  getMyCandidateProfile,
  submitApplication,
  updateMyCandidateProfile,
  uploadCandidateCvFile,
} from "@/features/candidate/api/profile";
import { CvSnapshotPreviewDialog } from "@/features/candidate/cv-builder/cv-snapshot-preview-dialog";
import { parseCvSnapshot } from "@/features/candidate/cv-builder/store";
import type { CvData } from "@/features/candidate/cv-builder/types";
import {
  getLatestCandidateCvVersion,
  resolveCandidateCvSelection,
} from "@/features/candidate/cv-selection";
import { getCandidateSession } from "@/features/candidate/session";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { cn } from "@/shared/lib/cn";
import { isValidPhoneNumber, normalizePhoneNumber } from "@/shared/lib/phone";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";

type ApplyModalProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: string;
    title: string;
    company: string;
  };
}>;

const looseUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

export function ApplyModal({ isOpen, onClose, job }: ApplyModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewObjectUrlRef = useRef<string | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const [mounted, setMounted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState("");

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [appliedApplicationId, setAppliedApplicationId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewingCvId, setPreviewingCvId] = useState<string | null>(null);
  const [unavailableCvIds, setUnavailableCvIds] = useState<ReadonlySet<string>>(() => new Set());
  const [builderPreview, setBuilderPreview] = useState<{ title: string; cvData: CvData } | null>(
    null,
  );

  // CV Preview
  const [previewCv, setPreviewCv] = useState<{
    title: string;
    url: string;
    mimeType: string;
  } | null>(null);

  const queryClient = useQueryClient();
  const session = useMemoSession();

  useEffect(() => {
    setMounted(true);

    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    setIsSuccess(false);
    setAlreadyApplied(false);
    setAppliedApplicationId(null);
    setErrorMessage(null);
    setCoverLetter("");
    setPhoneTouched(false);
    setUnavailableCvIds(new Set());
  }, [isOpen]);

  const {
    data: cvsData,
    isLoading: isLoadingCvs,
    refetch: refetchCvs,
  } = useQuery({
    queryKey: ["candidate-cvs", session?.user.id],
    queryFn: () => getMyCandidateCvs(session!.accessToken),
    enabled: !!session && mounted,
  });

  const { data: profileData } = useQuery({
    queryKey: ["candidate-profile", session?.user.id],
    queryFn: () => getMyCandidateProfile(session!.accessToken),
    enabled: !!session && mounted,
  });

  const { data: appliedData, isLoading: isCheckingApplied } = useQuery({
    queryKey: ["check-applied-job", job.id, session?.user.id],
    queryFn: () => checkAppliedJob(session!.accessToken, job.id),
    enabled: !!session && mounted && !!job.id,
    staleTime: 0,
  });

  const hasApplied =
    alreadyApplied || (appliedData?.applied === true && appliedData?.status !== "WITHDRAWN");
  // applicationId: ưu tiên từ state (khi 409), sau đó từ query check
  const resolvedApplicationId = appliedApplicationId ?? appliedData?.applicationId ?? null;

  // A default is only the initial suggestion. Preserve a CV the candidate has
  // selected (especially one they have just uploaded) after query refreshes.
  useEffect(() => {
    setSelectedCvId((current) => resolveCandidateCvSelection(cvsData?.items, current));
  }, [cvsData]);

  // Prefill candidate details when profile loads
  useEffect(() => {
    if (profileData) {
      if (profileData.account?.fullName) {
        setFullName(profileData.account.fullName);
      }
      if (profileData.phoneNumber) {
        setPhoneNumber(profileData.phoneNumber);
        setPhoneTouched(!isValidPhoneNumber(profileData.phoneNumber));
      }
    }
  }, [profileData]);

  const applicableCvs = useMemo(
    () => cvsData?.items.filter((cv) => cv.status === "ACTIVE" && cv.versions.length > 0) ?? [],
    [cvsData],
  );

  const selectedCvVersionId = useMemo(() => {
    const selectedCv = applicableCvs.find((cv) => cv.id === selectedCvId);
    if (!selectedCv) return null;

    return getLatestCandidateCvVersion(selectedCv)?.id ?? null;
  }, [applicableCvs, selectedCvId]);

  const hasValidPhoneNumber = isValidPhoneNumber(phoneNumber);
  const phoneError = phoneTouched
    ? phoneNumber.trim()
      ? hasValidPhoneNumber
        ? null
        : "Nhập số điện thoại hợp lệ để nhà tuyển dụng có thể liên hệ."
      : "Vui lòng nhập số điện thoại để nhà tuyển dụng liên hệ."
    : null;

  const closePreview = () => {
    setPreviewCv(null);
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
  };

  const closeApplyDialog = () => {
    closePreview();
    setBuilderPreview(null);
    onClose();
  };

  const handlePreviewCv = async (cv: CandidateCvApi) => {
    if (!session) return;

    const latestVersion = getLatestCandidateCvVersion(cv);

    if (!latestVersion) {
      setErrorMessage("CV này chưa có phiên bản để xem.");
      return;
    }

    if (cv.source === "BUILDER") {
      const cvData = parseCvSnapshot(latestVersion.contentJson);
      if (cvData) {
        setErrorMessage(null);
        setBuilderPreview({ title: cv.title, cvData });
      } else {
        setUnavailableCvIds((current) => new Set(current).add(cv.id));
        setErrorMessage(
          "CV tạo trên UpNext này chưa có dữ liệu xem trước. Bạn có thể chọn một CV khác hoặc mở CV Builder để cập nhật lại.",
        );
      }
      return;
    }

    setPreviewingCvId(cv.id);
    setErrorMessage(null);

    try {
      const { blob, mimeType } = await downloadCandidateCvVersion(
        session.accessToken,
        latestVersion.id,
        {
          expectedMimeType: latestVersion.sourceFile?.mimeType ?? null,
          fileName: latestVersion.sourceFile?.originalName ?? cv.title,
        },
      );
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }

      const objectUrl = URL.createObjectURL(blob);
      previewObjectUrlRef.current = objectUrl;
      setPreviewCv({
        title: cv.title,
        url: objectUrl,
        mimeType,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setUnavailableCvIds((current) => new Set(current).add(cv.id));
        setErrorMessage(
          "Chưa thể mở CV này. Bạn có thể chọn một CV khác hoặc tải lại tệp bên dưới để tiếp tục ứng tuyển.",
        );
      } else {
        setErrorMessage("Không thể mở bản xem trước CV. Vui lòng thử lại.");
      }
    } finally {
      setPreviewingCvId(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const input = event.currentTarget;
    if (!file || !session) return;

    setUploading(true);
    setErrorMessage(null);

    try {
      // 1. Upload file
      const uploadRes = await uploadCandidateCvFile(file, session.accessToken);
      // 2. Create CV record
      const cvRes = await createCandidateCv(session.accessToken, {
        title: file.name,
        source: "UPLOAD",
        sourceFileId: uploadRes.file.id,
      });

      // 3. Refresh and select
      await refetchCvs();
      setSelectedCvId(cvRes.id);
      setUnavailableCvIds((current) => {
        const next = new Set(current);
        next.delete(cvRes.id);
        return next;
      });
    } catch (err: any) {
      console.error("Failed to upload CV", err);
      setErrorMessage("Không thể tải lên file CV. Vui lòng thử lại.");
    } finally {
      setUploading(false);
      // Allow candidates to select the same file again after a failed upload.
      input.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !selectedCvVersionId) return;

    setPhoneTouched(true);
    if (!hasValidPhoneNumber) return;

    if (!looseUuidPattern.test(job.id)) {
      setErrorMessage(
        "Tin tuyển dụng này không còn khả dụng. Vui lòng chọn một tin tuyển dụng khác.",
      );
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
      if (normalizedPhoneNumber !== normalizePhoneNumber(profileData?.phoneNumber ?? "")) {
        const updatedProfile = await updateMyCandidateProfile(session.accessToken, {
          phoneNumber: normalizedPhoneNumber,
        });
        queryClient.setQueryData(["candidate-profile", session.user.id], updatedProfile);
      }

      await submitApplication(session.accessToken, {
        jobPostId: job.id,
        cvVersionId: selectedCvVersionId,
        coverLetter: coverLetter || null,
      });
      void queryClient.invalidateQueries({ queryKey: ["check-applied-job", job.id] });
      setIsSuccess(true);
    } catch (err: unknown) {
      console.error("Failed to submit application", err);
      // Nếu API trả về 409 Conflict (đã ứng tuyển), hiển thị màn hình đã ứng tuyển
      if (err instanceof ApiError && err.status === 409) {
        // Lấy applicationId từ error payload nếu backend trả về
        const payload = err.payload as any;
        const aId: string | null = payload?.applicationId ?? payload?.data?.applicationId ?? null;
        setAppliedApplicationId(aId);
        setAlreadyApplied(true);
      } else {
        setErrorMessage("Không thể nộp hồ sơ. Vui lòng kiểm tra lại thông tin và thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isSelectedCvUnavailable = selectedCvId ? unavailableCvIds.has(selectedCvId) : false;

  // Helper hook to prevent SSR error
  function useMemoSession() {
    return useMemo(() => {
      if (typeof window === "undefined") return null;
      return getCandidateSession();
    }, []);
  }

  if (!mounted) return null;

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) closeApplyDialog();
        }}
      >
        <DialogContent
          closeLabel="Đóng hộp thoại ứng tuyển"
          onOpenAutoFocus={() => {
            returnFocusRef.current =
              document.activeElement instanceof HTMLElement ? document.activeElement : null;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocusRef.current?.focus();
          }}
          className="flex max-h-[calc(100dvh-2rem)] w-[min(540px,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden rounded-2xl border-slate-100 p-5 shadow-2xl sm:p-6"
        >
          {isCheckingApplied ? (
            /* Loading state while checking applied status */
            <div
              aria-busy="true"
              aria-live="polite"
              className="flex flex-1 flex-col items-center justify-center py-12"
            >
              <DialogTitle className="sr-only">Đang mở biểu mẫu ứng tuyển</DialogTitle>
              <DialogDescription className="sr-only">
                Đang kiểm tra trạng thái ứng tuyển của bạn cho vị trí này.
              </DialogDescription>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
              <p className="mt-3 text-xs text-slate-500">Đang kiểm tra trạng thái ứng tuyển...</p>
            </div>
          ) : isSuccess ? (
            /* Success Screen View */
            <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
              <span className="mb-5 flex h-16 w-16 animate-bounce items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle size={36} weight="fill" />
              </span>
              <DialogTitle className="text-xl font-bold text-slate-900">
                Nộp hồ sơ thành công!
              </DialogTitle>
              <DialogDescription className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500">
                CV của bạn đã được gửi đến nhà tuyển dụng của <b>{job.company}</b>. Bạn có thể theo
                dõi tiến độ xét duyệt hồ sơ bất cứ lúc nào.
              </DialogDescription>

              <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                <Button
                  onClick={() => {
                    closeApplyDialog();
                    router.push("/candidate/applications");
                  }}
                  className="w-full cursor-pointer rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  Theo dõi đơn tuyển dụng
                </Button>
                <Button
                  variant="outline"
                  onClick={closeApplyDialog}
                  className="w-full cursor-pointer rounded-xl border-slate-200 py-2.5 text-xs font-bold text-slate-700"
                >
                  Tìm thêm việc làm
                </Button>
              </div>
            </div>
          ) : hasApplied ? (
            /* Already Applied Screen View */
            <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
              <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                <Warning size={36} weight="fill" />
              </span>
              <DialogTitle className="text-xl font-bold text-slate-900">
                Bạn đã ứng tuyển vị trí này
              </DialogTitle>
              <DialogDescription className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500">
                Hồ sơ của bạn đã được gửi đến <b>{job.company}</b>. Hãy theo dõi tiến độ xét duyệt
                trong trang quản lý đơn ứng tuyển.
              </DialogDescription>

              <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                <Button
                  onClick={() => {
                    closeApplyDialog();
                    if (resolvedApplicationId) {
                      router.push(`/candidate/applications/${resolvedApplicationId}`);
                    } else {
                      router.push("/candidate/applications");
                    }
                  }}
                  className="w-full cursor-pointer rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  Xem đơn ứng tuyển
                </Button>
                <Button
                  variant="outline"
                  onClick={closeApplyDialog}
                  className="w-full cursor-pointer rounded-xl border-slate-200 py-2.5 text-xs font-bold text-slate-700"
                >
                  Đóng
                </Button>
              </div>
            </div>
          ) : (
            /* Application Form View */
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              {/* Header info */}
              <div className="mb-5 pr-8">
                <DialogTitle className="text-lg leading-snug font-bold text-slate-900">
                  Ứng tuyển vị trí <span className="text-emerald-600">{job.title}</span>
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs font-semibold text-slate-500">
                  Công ty: {job.company}
                </DialogDescription>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div
                  role="alert"
                  className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900"
                >
                  <Warning size={17} weight="fill" className="mt-0.5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-semibold">CV chưa thể xem trước</p>
                    <p className="mt-0.5 leading-relaxed text-amber-800">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Scrollable Form Body */}
              <div className="max-h-[50vh] flex-1 space-y-4 overflow-y-auto pr-1">
                {/* Contact Details Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="apply-name"
                      className="mb-1.5 block text-xs font-bold text-slate-700"
                    >
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="apply-name"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nhập họ và tên của bạn"
                      className="h-10 rounded-lg border-slate-200 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="apply-email"
                      className="mb-1.5 block text-xs font-bold text-slate-700"
                    >
                      Địa chỉ email
                    </label>
                    <Input
                      id="apply-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={session?.user?.email || ""}
                      readOnly
                      className="h-10 cursor-not-allowed rounded-lg border-slate-200 bg-slate-50/60 text-xs text-slate-500"
                    />
                  </div>
                </div>

                {/* Phone number */}
                <div>
                  <label
                    htmlFor="apply-phone"
                    className="mb-1.5 block text-xs font-bold text-slate-700"
                  >
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="apply-phone"
                    name="phone"
                    type="tel"
                    required
                    value={phoneNumber}
                    inputMode="tel"
                    autoComplete="tel"
                    aria-describedby={phoneError ? "apply-phone-error" : "apply-phone-hint"}
                    aria-invalid={Boolean(phoneError)}
                    onBlur={() => setPhoneTouched(true)}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      setPhoneTouched(true);
                    }}
                    placeholder="Ví dụ: +84 912 345 678"
                    className={cn(
                      "h-10 rounded-lg text-xs focus:ring-emerald-500",
                      phoneError
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                        : "border-slate-200 focus:border-emerald-500",
                    )}
                  />
                  {phoneError ? (
                    <p id="apply-phone-error" className="mt-1.5 text-xs text-red-600" role="alert">
                      {phoneError}
                    </p>
                  ) : (
                    <p id="apply-phone-hint" className="mt-1.5 text-[11px] text-slate-500">
                      Dùng số điện thoại nhà tuyển dụng có thể liên hệ; thêm mã quốc gia nếu cần.
                    </p>
                  )}
                </div>

                {/* CV Selector */}
                <fieldset>
                  <legend className="mb-1.5 block text-xs font-bold text-slate-700">
                    Chọn CV ứng tuyển <span className="text-red-500">*</span>
                  </legend>

                  {isLoadingCvs ? (
                    <div
                      aria-busy="true"
                      aria-live="polite"
                      className="flex h-16 items-center justify-center rounded-xl border border-slate-100 bg-slate-50"
                    >
                      <span className="sr-only">Đang tải danh sách CV</span>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {applicableCvs.length > 0 ? (
                        <div className="space-y-2">
                          {applicableCvs.map((cv) => {
                            const isSelected = selectedCvId === cv.id;
                            const isUnavailable = unavailableCvIds.has(cv.id);
                            return (
                              <div
                                key={cv.id}
                                className={cn(
                                  "flex w-full items-center justify-between rounded-xl border p-3 text-left transition",
                                  isSelected
                                    ? "border-emerald-500 bg-emerald-50/20"
                                    : "border-slate-200 bg-white hover:bg-slate-50/40",
                                )}
                              >
                                <button
                                  type="button"
                                  aria-pressed={isSelected}
                                  aria-label={`Chọn CV ${cv.title}`}
                                  onClick={() => {
                                    setSelectedCvId(cv.id);
                                    setErrorMessage(null);
                                  }}
                                  className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                                >
                                  <FilePdf
                                    size={20}
                                    weight="fill"
                                    className="flex-shrink-0 text-red-500"
                                  />
                                  <span className="min-w-0">
                                    <span className="block truncate text-xs font-bold text-slate-800">
                                      {cv.title}
                                    </span>
                                    <span className="mt-0.5 block text-[10px] text-slate-400">
                                      Cập nhật: {new Date(cv.updatedAt).toLocaleDateString("vi-VN")}
                                    </span>
                                    {isUnavailable ? (
                                      <span className="mt-1 block text-[10px] font-semibold text-amber-700">
                                        Chưa thể xem trước — chọn CV khác hoặc tải lại tệp
                                      </span>
                                    ) : null}
                                  </span>
                                </button>
                                <div className="ml-2 flex flex-shrink-0 items-center gap-2">
                                  {cv.isDefault && (
                                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 uppercase">
                                      Mặc định
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    disabled={previewingCvId === cv.id}
                                    onClick={() => void handlePreviewCv(cv)}
                                    className="flex items-center gap-1 rounded-lg px-1.5 py-1 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:cursor-wait disabled:opacity-70"
                                    aria-label={`Xem trước CV ${cv.title}`}
                                  >
                                    {previewingCvId === cv.id ? (
                                      <SpinnerGap
                                        size={15}
                                        className="animate-spin text-emerald-600"
                                      />
                                    ) : (
                                      <Eye size={15} />
                                    )}
                                    Xem CV
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500 italic">
                          Bạn chưa tải lên CV nào. Vui lòng chọn tải lên bên dưới.
                        </p>
                      )}
                    </div>
                  )}
                </fieldset>

                {/* Upload zone */}
                <div className="mt-3">
                  <input
                    type="file"
                    aria-label="Tải lên CV"
                    aria-describedby="apply-upload-hint"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3.5 text-xs font-bold text-slate-600 transition hover:border-emerald-500 hover:bg-emerald-50/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
                        Đang tải lên file CV...
                      </>
                    ) : (
                      <>
                        <UploadSimple size={16} />
                        Tải lên CV khác (.pdf, .doc, .docx)
                      </>
                    )}
                  </button>
                  <p id="apply-upload-hint" className="sr-only">
                    Chọn một tệp PDF, DOC hoặc DOCX để tạo một CV mới.
                  </p>
                </div>

                {/* Cover Letter */}
                <div>
                  <label
                    htmlFor="apply-letter"
                    className="mb-1.5 block text-xs font-bold text-slate-700"
                  >
                    Thư giới thiệu (Không bắt buộc)
                  </label>
                  <textarea
                    id="apply-letter"
                    name="coverLetter"
                    aria-label="Thư giới thiệu"
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    maxLength={2000}
                    aria-describedby="apply-letter-hint apply-letter-count"
                    placeholder="Viết một lời chào ngắn hoặc chia sẻ thêm kỹ năng, kinh nghiệm phù hợp để thu hút nhà tuyển dụng..."
                    className="min-h-[90px] w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                  <div className="mt-1.5 flex items-start justify-between gap-3 text-[11px] text-slate-500">
                    <p id="apply-letter-hint">Không bắt buộc. Tối đa 2.000 ký tự.</p>
                    <span
                      id="apply-letter-count"
                      aria-live="polite"
                      className="shrink-0 tabular-nums"
                    >
                      {coverLetter.length.toLocaleString("vi-VN")}/2.000
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={closeApplyDialog}
                  className="w-full cursor-pointer rounded-xl border-slate-200 py-2.5 text-xs font-bold text-slate-700"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={
                    submitting ||
                    uploading ||
                    !selectedCvVersionId ||
                    !hasValidPhoneNumber ||
                    !fullName ||
                    isSelectedCvUnavailable
                  }
                  className="w-full cursor-pointer rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      Đang gửi đơn...
                    </div>
                  ) : (
                    "Nộp hồ sơ ứng tuyển"
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* CV Preview Modal */}
      {isOpen && previewCv && (
        <CvPreviewModal
          title={previewCv.title}
          url={previewCv.url}
          mimeType={previewCv.mimeType}
          onClose={closePreview}
        />
      )}
      <CvSnapshotPreviewDialog
        open={isOpen && Boolean(builderPreview)}
        onOpenChange={(open) => {
          if (!open) setBuilderPreview(null);
        }}
        title={builderPreview?.title ?? "Bản xem trước CV"}
        cvData={builderPreview?.cvData ?? null}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// CV Preview Modal
// ---------------------------------------------------------------------------

type CvPreviewModalProps = Readonly<{
  title: string;
  url: string;
  mimeType: string;
  onClose: () => void;
}>;

function CvPreviewModal({ title, url, mimeType, onClose }: CvPreviewModalProps) {
  const isPdf = mimeType === "application/pdf" || url.toLowerCase().endsWith(".pdf");
  const isWordDocument =
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, x: 0, y: 0 });

  const updateZoom = (nextZoom: number) => {
    const clampedZoom = Math.min(3, Math.max(0.75, nextZoom));
    setZoom(clampedZoom);
    if (clampedZoom === 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const resetView = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        closeLabel="Đóng xem CV"
        onOpenAutoFocus={() => {
          returnFocusRef.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocusRef.current?.focus();
        }}
        className="flex h-[min(92dvh,58rem)] w-[min(860px,calc(100vw-1rem))] max-w-none flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 p-0 shadow-2xl"
      >
        {/* Top bar */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 py-3 pr-12">
          <div className="flex min-w-0 items-center gap-2.5">
            <FilePdf size={18} weight="fill" className="flex-shrink-0 text-red-500" />
            <DialogTitle className="truncate text-sm font-bold text-slate-800">{title}</DialogTitle>
            <DialogDescription className="sr-only">
              Bản xem trước CV. Dùng các nút trên thanh công cụ để thay đổi mức thu phóng.
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2">
            {isPdf && (
              <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                <button
                  type="button"
                  onClick={() => updateZoom(zoom - 0.15)}
                  disabled={zoom <= 0.75}
                  aria-label="Thu nhỏ CV"
                  className="flex size-7 cursor-pointer items-center justify-center rounded-md text-slate-600 transition hover:bg-white hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus size={13} />
                </button>
                <button
                  type="button"
                  onClick={resetView}
                  title="Đặt lại kích thước và vị trí"
                  className="min-w-12 cursor-pointer rounded-md px-1.5 py-1 text-[10px] font-bold text-slate-600 transition hover:bg-white hover:text-emerald-700"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => updateZoom(zoom + 0.15)}
                  disabled={zoom >= 3}
                  aria-label="Phóng to CV"
                  className="flex size-7 cursor-pointer items-center justify-center rounded-md text-slate-600 transition hover:bg-white hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={13} />
                </button>
              </div>
            )}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title="Mở trong tab mới"
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <ArrowSquareOut size={13} />
              Mở tab mới
            </a>
          </div>
        </div>

        {/* Content */}
        <div className="flex min-h-0 flex-1 bg-slate-100">
          {isPdf ? (
            <div
              className={cn(
                "relative h-full w-full touch-none overflow-hidden select-none",
                isDragging ? "cursor-grabbing" : "cursor-grab",
              )}
              onWheel={(event) => {
                event.preventDefault();
                updateZoom(zoom + (event.deltaY < 0 ? 0.1 : -0.1));
              }}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                dragStartRef.current = {
                  pointerX: event.clientX,
                  pointerY: event.clientY,
                  x: position.x,
                  y: position.y,
                };
                setIsDragging(true);
              }}
              onPointerMove={(event) => {
                if (!isDragging) return;
                setPosition({
                  x: dragStartRef.current.x + event.clientX - dragStartRef.current.pointerX,
                  y: dragStartRef.current.y + event.clientY - dragStartRef.current.pointerY,
                });
              }}
              onPointerUp={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }
                setIsDragging(false);
              }}
              onPointerCancel={() => setIsDragging(false)}
              onDoubleClick={resetView}
            >
              <iframe
                src={url.includes("#") ? url : `${url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                title={title}
                className={cn(
                  "absolute inset-0 h-full w-full border-0",
                  isDragging ? "pointer-events-none" : "pointer-events-auto",
                )}
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                  transformOrigin: "center",
                }}
                allow="fullscreen"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/75 px-3 py-1.5 text-[10px] font-medium whitespace-nowrap text-white shadow-lg backdrop-blur-sm"
              >
                Giữ chuột để kéo · Lăn chuột để thu phóng · Nhấp đúp để đặt lại
              </div>
            </div>
          ) : (
            /* Fallback for non-PDF files */
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
              {isWordDocument ? (
                <FileDoc size={48} weight="duotone" className="text-slate-300" />
              ) : (
                <FilePdf size={48} weight="duotone" className="text-slate-300" />
              )}
              <p className="text-sm text-slate-500">
                {isWordDocument
                  ? "Tệp Word không thể xem trực tiếp trên trình duyệt."
                  : "Định dạng tệp này không thể xem trực tiếp trên trình duyệt."}
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
              >
                <ArrowSquareOut size={14} />
                Tải xuống / Mở file
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
