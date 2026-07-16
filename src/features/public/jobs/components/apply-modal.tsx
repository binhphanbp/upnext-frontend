"use client";

import {
  BookmarkSimple,
  CheckCircle,
  FilePdf,
  PaperPlaneTilt,
  Sparkle,
  UploadSimple,
  X,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  createCandidateCv,
  getMyCandidateCvs,
  getMyCandidateProfile,
  submitApplication,
  uploadCandidateCvFile,
} from "@/features/candidate/api/profile";
import { getCandidateSession } from "@/features/candidate/session";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
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

  const [mounted, setMounted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState("");

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const session = useMemoSession();

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Auto-select default CV
  useEffect(() => {
    if (cvsData?.items) {
      const defaultCv = cvsData.items.find((cv) => cv.isDefault);
      if (defaultCv) {
        setSelectedCvId(defaultCv.id);
      } else if (cvsData.items.length > 0 && cvsData.items[0]) {
        setSelectedCvId(cvsData.items[0].id);
      }
    }
  }, [cvsData]);

  // Prefill candidate details when profile loads
  useEffect(() => {
    if (profileData) {
      if (profileData.account?.fullName) {
        setFullName(profileData.account.fullName);
      }
      if (profileData.phoneNumber) {
        setPhoneNumber(profileData.phoneNumber);
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

    if (!looseUuidPattern.test(job.id)) {
      setErrorMessage(
        "Tin tuyển dụng này không còn khả dụng. Vui lòng chọn một tin tuyển dụng khác.",
      );
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await submitApplication(session.accessToken, {
        jobPostId: job.id,
        cvVersionId: selectedCvVersionId,
        coverLetter: coverLetter || null,
      });
      setIsSuccess(true);
    } catch (err) {
      console.error("Failed to submit application", err);
      setErrorMessage("Không thể nộp hồ sơ. Vui lòng kiểm tra lại thông tin và thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper hook to prevent SSR error
  function useMemoSession() {
    return useMemo(() => {
      if (typeof window === "undefined") return null;
      return getCandidateSession();
    }, []);
  }

  if (!isOpen || !mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-50 flex max-h-[90vh] w-[min(540px,calc(100vw-32px))] flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl transition-all">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
          aria-label="Đóng"
        >
          <X size={18} />
        </button>

        {isSuccess ? (
          /* Success Screen View */
          <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
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
        ) : (
          /* Application Form View */
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            {/* Header info */}
            <div className="mb-5 pr-8">
              <h2 className="text-lg leading-snug font-bold text-slate-900">
                Ứng tuyển vị trí <span className="text-emerald-600">{job.title}</span>
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">Công ty: {job.company}</p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 rounded-xl bg-red-50 p-3.5 text-xs font-medium text-red-600">
                {errorMessage}
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
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nhập họ và tên của bạn"
                    className="h-10 rounded-lg border-slate-200 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    Địa chỉ email
                  </label>
                  <Input
                    type="email"
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
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Nhập số điện thoại để nhà tuyển dụng liên hệ"
                  className="h-10 rounded-lg border-slate-200 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              {/* CV Selector */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Chọn CV ứng tuyển <span className="text-red-500">*</span>
                </label>

                {isLoadingCvs ? (
                  <div className="flex h-16 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cvsData?.items && cvsData.items.length > 0 ? (
                      cvsData.items.map((cv) => (
                        <div
                          key={cv.id}
                          onClick={() => setSelectedCvId(cv.id)}
                          className={cn(
                            "flex cursor-pointer items-center justify-between rounded-xl border p-3 transition",
                            selectedCvId === cv.id
                              ? "border-emerald-500 bg-emerald-50/20"
                              : "border-slate-200 bg-white hover:bg-slate-50/40",
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <FilePdf
                              size={20}
                              weight="fill"
                              className="flex-shrink-0 text-red-500"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-slate-800">
                                {cv.title}
                              </p>
                              <p className="mt-0.5 text-[10px] text-slate-400">
                                Cập nhật: {new Date(cv.updatedAt).toLocaleDateString("vi-VN")}
                              </p>
                            </div>
                          </div>
                          {cv.isDefault && (
                            <span className="rounded bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 uppercase">
                              Mặc định
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500 italic">
                        Bạn chưa tải lên CV nào. Vui lòng chọn tải lên bên dưới.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Upload zone */}
              <div className="mt-3">
                <input
                  type="file"
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
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Viết một lời chào ngắn hoặc chia sẻ thêm kỹ năng, kinh nghiệm phù hợp để thu hút nhà tuyển dụng..."
                  className="min-h-[90px] w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Footer buttons */}
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
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
                  submitting || uploading || !selectedCvVersionId || !phoneNumber || !fullName
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
      </div>
    </div>
  );
}
