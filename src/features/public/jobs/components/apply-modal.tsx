"use client";

import {
  ArrowSquareOut,
  CheckCircle,
  Eye,
  FileDoc,
  FilePdf,
  SpinnerGap,
  UploadSimple,
  Warning,
  X,
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
const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

function keepFocusInDialog(event: React.KeyboardEvent<HTMLElement>) {
  if (event.key !== "Tab") return;

  const focusableElements = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(focusableSelector),
  ).filter((element) => !element.hasAttribute("aria-hidden"));

  if (focusableElements.length === 0) {
    event.preventDefault();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements.at(-1);

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement?.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement?.focus();
  }
}

export function ApplyModal({ isOpen, onClose, job }: ApplyModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewObjectUrlRef = useRef<string | null>(null);
  const previewTriggerRef = useRef<HTMLElement | null>(null);
  const applicationDialogRef = useRef<HTMLDialogElement>(null);

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

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !mounted) return;

    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    window.requestAnimationFrame(() => applicationDialogRef.current?.focus());

    return () => {
      previousFocus?.focus();
    };
  }, [isOpen, mounted]);

  useEffect(() => {
    if (!isOpen || previewCv) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, previewCv]);

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

  const hasApplied = alreadyApplied || appliedData?.applied === true;
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

  const selectedCvVersionId = useMemo(() => {
    const selectedCv = cvsData?.items.find((cv) => cv.id === selectedCvId);
    if (!selectedCv) return null;

    return (
      [...selectedCv.versions].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      )[0]?.id ?? null
    );
  }, [cvsData, selectedCvId]);

  const hasValidPhoneNumber = isValidPhoneNumber(phoneNumber);
  const phoneError = phoneTouched
    ? phoneNumber.trim()
      ? hasValidPhoneNumber
        ? null
        : "Kiểm tra lại số điện thoại. Với số quốc tế, hãy thêm mã quốc gia, ví dụ +1 415 555 2671."
      : "Vui lòng nhập số điện thoại để nhà tuyển dụng liên hệ."
    : null;

  const closePreview = () => {
    const previewTrigger = previewTriggerRef.current;
    setPreviewCv(null);
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
    window.requestAnimationFrame(() => previewTrigger?.focus());
  };

  const handlePreviewCv = async (cv: CandidateCvApi) => {
    if (!session) return;

    previewTriggerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const latestVersion = getLatestCandidateCvVersion(cv);

    if (!latestVersion) {
      setErrorMessage("CV này chưa có phiên bản để xem.");
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

  if (!isOpen || !mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Đóng biểu mẫu ứng tuyển"
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <dialog
        open
        ref={applicationDialogRef}
        aria-modal="true"
        aria-label="Biểu mẫu ứng tuyển"
        aria-hidden={previewCv ? true : undefined}
        tabIndex={-1}
        onKeyDown={keepFocusInDialog}
        className="relative z-50 m-0 flex max-h-[calc(100dvh-12px)] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-100 bg-white shadow-2xl transition-all outline-none sm:max-h-[min(780px,calc(100dvh-32px))] sm:w-[min(640px,calc(100vw-32px))] sm:rounded-2xl"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          aria-label="Đóng"
        >
          <X size={18} />
        </button>

        {isCheckingApplied ? (
          /* Loading state while checking applied status */
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
            <p className="mt-3 text-xs text-slate-500">Đang kiểm tra trạng thái ứng tuyển...</p>
          </div>
        ) : isSuccess ? (
          /* Success Screen View */
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
            <span className="mb-5 flex h-16 w-16 animate-bounce items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle size={36} weight="fill" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">Nộp hồ sơ thành công!</h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500">
              CV của bạn đã được gửi đến nhà tuyển dụng của <b>{job.company}</b>. Bạn có thể theo
              dõi tiến độ xét duyệt hồ sơ bất cứ lúc nào.
            </p>

            <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                onClick={() => {
                  onClose();
                  router.push("/candidate/applications");
                }}
                className="w-full cursor-pointer rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
              >
                Theo dõi đơn tuyển dụng
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full cursor-pointer rounded-xl border-slate-200 py-2.5 text-xs font-bold text-slate-700"
              >
                Tìm thêm việc làm
              </Button>
            </div>
          </div>
        ) : hasApplied ? (
          /* Already Applied Screen View */
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
            <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-500">
              <Warning size={36} weight="fill" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">Bạn đã ứng tuyển vị trí này</h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500">
              Hồ sơ của bạn đã được gửi đến <b>{job.company}</b>. Hãy theo dõi tiến độ xét duyệt
              trong trang quản lý đơn ứng tuyển.
            </p>

            <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                onClick={() => {
                  onClose();
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
                onClick={onClose}
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
            <div className="shrink-0 border-b border-slate-100 px-5 py-4 pr-12 sm:px-6 sm:py-5 sm:pr-14">
              <p className="text-[11px] font-semibold tracking-wide text-emerald-700 uppercase">
                Ứng tuyển việc làm
              </p>
              <h2
                id="apply-modal-title"
                className="mt-1 text-lg leading-snug font-bold text-slate-900 sm:text-xl"
              >
                Ứng tuyển vị trí <span className="text-emerald-600">{job.title}</span>
              </h2>
              <p className="mt-1 text-xs text-slate-500">Tại {job.company}</p>
            </div>

            {/* Scrollable Form Body */}
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
              {/* Error Message */}
              {errorMessage && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900"
                >
                  <Warning size={17} weight="fill" className="mt-0.5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-semibold">Cần bạn lưu ý</p>
                    <p className="mt-0.5 leading-relaxed text-amber-800">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Contact Details Grid */}
              <section aria-labelledby="apply-contact-heading">
                <div className="mb-3">
                  <h3 id="apply-contact-heading" className="text-sm font-bold text-slate-800">
                    Thông tin liên hệ
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Nhà tuyển dụng sẽ dùng thông tin này để liên hệ với bạn.
                  </p>
                </div>
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
                      type="text"
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
                      type="email"
                      value={session?.user?.email || ""}
                      readOnly
                      className="h-10 cursor-not-allowed rounded-lg border-slate-200 bg-slate-50/60 text-xs text-slate-500"
                    />
                  </div>
                </div>
              </section>

              {/* Phone number */}
              <div className="-mt-2">
                <label
                  htmlFor="apply-phone"
                  className="mb-1.5 block text-xs font-bold text-slate-700"
                >
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <Input
                  id="apply-phone"
                  type="tel"
                  required
                  value={phoneNumber}
                  inputMode="tel"
                  autoComplete="tel"
                  aria-describedby={phoneError ? "apply-phone-error" : undefined}
                  aria-invalid={Boolean(phoneError)}
                  onBlur={() => setPhoneTouched(true)}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setPhoneTouched(true);
                  }}
                  placeholder="Ví dụ: +1 415 555 2671 hoặc 0912 345 678"
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
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Dùng số Việt Nam hoặc số quốc tế kèm mã quốc gia. Số này sẽ được lưu vào hồ sơ.
                  </p>
                )}
              </div>

              {/* CV Selector */}
              <section aria-labelledby="apply-cv-heading">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <h3 id="apply-cv-heading" className="text-sm font-bold text-slate-800">
                      CV ứng tuyển <span className="text-red-500">*</span>
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      Chọn CV phù hợp nhất với vị trí này.
                    </p>
                  </div>
                  {selectedCvId ? (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                      Đã chọn
                    </span>
                  ) : null}
                </div>

                {isLoadingCvs ? (
                  <div className="flex h-24 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
                  </div>
                ) : cvsData?.items && cvsData.items.length > 0 ? (
                  <div className="max-h-64 space-y-2 overflow-y-auto overscroll-contain pr-1">
                    {cvsData.items.map((cv) => {
                      const isSelected = selectedCvId === cv.id;
                      const isUnavailable = unavailableCvIds.has(cv.id);
                      return (
                        <div
                          key={cv.id}
                          className={cn(
                            "flex min-h-[76px] items-center rounded-xl border p-2 transition",
                            isSelected
                              ? "border-emerald-500 bg-emerald-50/60 shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60",
                          )}
                        >
                          <input
                            id={`apply-cv-${cv.id}`}
                            type="radio"
                            name="application-cv"
                            value={cv.id}
                            checked={isSelected}
                            aria-label={`Chọn CV ${cv.title}`}
                            onChange={() => {
                              setSelectedCvId(cv.id);
                              setErrorMessage(null);
                            }}
                            className="peer sr-only"
                          />
                          <label
                            htmlFor={`apply-cv-${cv.id}`}
                            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-lg p-1 text-left outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500 peer-focus-visible:ring-offset-2"
                          >
                            <span
                              className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-lg",
                                isSelected ? "bg-white" : "bg-slate-50",
                              )}
                            >
                              <FilePdf size={18} weight="fill" className="text-red-500" />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-bold text-slate-800">
                                {cv.title}
                              </span>
                              <span className="mt-0.5 block text-[11px] text-slate-500">
                                Cập nhật {new Date(cv.updatedAt).toLocaleDateString("vi-VN")}
                              </span>
                              {isUnavailable ? (
                                <span className="mt-1 block text-[10px] font-semibold text-amber-700">
                                  Chưa thể xem trước — hãy chọn CV khác hoặc tải lại tệp.
                                </span>
                              ) : null}
                            </span>
                          </label>
                          <div className="ml-2 flex shrink-0 items-center gap-1 sm:gap-2">
                            {isSelected ? (
                              <span className="hidden items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white sm:flex">
                                <CheckCircle size={12} weight="fill" />
                                Đang chọn
                              </span>
                            ) : cv.isDefault ? (
                              <span className="hidden rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 sm:block">
                                Mặc định
                              </span>
                            ) : null}
                            <button
                              type="button"
                              disabled={previewingCvId === cv.id}
                              onClick={() => void handlePreviewCv(cv)}
                              className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:cursor-wait disabled:opacity-70 sm:h-auto sm:w-auto sm:gap-1 sm:px-2 sm:py-1.5 sm:text-[11px] sm:font-semibold"
                              aria-label={`Xem trước CV ${cv.title}`}
                              title="Xem trước CV"
                            >
                              {previewingCvId === cv.id ? (
                                <SpinnerGap size={15} className="animate-spin text-emerald-600" />
                              ) : (
                                <Eye size={15} />
                              )}
                              <span className="hidden sm:inline">Xem trước</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center">
                    <FilePdf size={24} weight="duotone" className="mx-auto text-slate-400" />
                    <p className="mt-2 text-xs font-semibold text-slate-700">
                      Bạn chưa có CV để ứng tuyển
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                      Tải lên CV ở bên dưới để tiếp tục.
                    </p>
                  </div>
                )}

                {/* Upload zone */}
                <div className="mt-3">
                  <input
                    type="file"
                    aria-label="Tải lên CV"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-3 text-xs font-bold text-slate-600 transition hover:border-emerald-500 hover:bg-emerald-50/30 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
                        Đang tải lên file CV...
                      </>
                    ) : (
                      <>
                        <UploadSimple size={16} />
                        Tải lên CV mới (.pdf, .doc, .docx)
                      </>
                    )}
                  </button>
                </div>
              </section>

              {/* Cover Letter */}
              <section aria-labelledby="apply-letter-heading">
                <label
                  htmlFor="apply-letter"
                  id="apply-letter-heading"
                  className="block text-sm font-bold text-slate-800"
                >
                  Thư giới thiệu{" "}
                  <span className="text-xs font-normal text-slate-500">(không bắt buộc)</span>
                </label>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Nêu ngắn gọn điểm phù hợp của bạn với vị trí này.
                </p>
                <textarea
                  id="apply-letter"
                  aria-labelledby="apply-letter-heading"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Viết một lời chào ngắn hoặc chia sẻ thêm kỹ năng, kinh nghiệm phù hợp để thu hút nhà tuyển dụng..."
                  className="mt-3 min-h-24 w-full resize-y rounded-xl border border-slate-200 p-3 text-xs leading-relaxed text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </section>
            </div>

            {/* Footer buttons */}
            <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:px-6">
              <Button
                variant="outline"
                type="button"
                onClick={onClose}
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
      </dialog>

      {/* CV Preview Modal */}
      {previewCv && (
        <CvPreviewModal
          title={previewCv.title}
          url={previewCv.url}
          mimeType={previewCv.mimeType}
          onClose={closePreview}
        />
      )}
    </div>
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
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.requestAnimationFrame(() => dialogRef.current?.focus());

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Đóng bản xem trước CV"
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <dialog
        open
        ref={dialogRef}
        aria-modal="true"
        aria-labelledby="cv-preview-title"
        tabIndex={-1}
        onKeyDown={keepFocusInDialog}
        className="relative z-[61] m-0 flex h-[calc(100dvh-16px)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl outline-none sm:h-[min(920px,calc(100dvh-32px))]"
      >
        {/* Top bar */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
              <FilePdf size={19} weight="fill" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                Xem CV
              </p>
              <h2
                id="cv-preview-title"
                className="truncate text-sm font-bold text-slate-800"
                title={title}
              >
                {title}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title="Mở CV trong tab mới"
              aria-label="Mở CV trong tab mới"
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none sm:px-3"
            >
              <ArrowSquareOut size={15} />
              <span className="hidden sm:inline">Mở tab mới</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
              aria-label="Đóng xem CV"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex min-h-0 flex-1 bg-slate-100 p-1 sm:p-2">
          {isPdf ? (
            <iframe
              src={url.includes("#") ? url : `${url}#view=FitH`}
              title={`Bản xem trước ${title}`}
              className="h-full w-full rounded-lg border-0 bg-white"
              allow="fullscreen"
            />
          ) : (
            /* Fallback for non-PDF files */
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
              {isWordDocument ? (
                <FileDoc size={48} weight="duotone" className="text-slate-300" />
              ) : (
                <FilePdf size={48} weight="duotone" className="text-slate-300" />
              )}
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Tệp này cần được mở bằng ứng dụng phù hợp
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {isWordDocument
                    ? "Trình duyệt không thể hiển thị trực tiếp tệp Word. Hãy mở tệp trong tab mới hoặc tải về thiết bị."
                    : "Định dạng tệp này không thể xem trực tiếp trên trình duyệt. Hãy mở tệp trong tab mới hoặc tải về thiết bị."}
                </p>
              </div>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
              >
                <ArrowSquareOut size={14} />
                Mở hoặc tải tệp
              </a>
            </div>
          )}
        </div>
      </dialog>
    </div>
  );
}
