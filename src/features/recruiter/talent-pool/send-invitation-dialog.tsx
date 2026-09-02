"use client";

import {
  Briefcase,
  Check,
  CircleNotch,
  EnvelopeSimple,
  Info,
  PaperPlaneTilt,
  Sparkle,
  X,
} from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useId, useState } from "react";
import Swal from "sweetalert2";

import { getRecruiterJobPosts, type RecruiterJobPost } from "@/features/recruiter/job-posts/api";
import { getRecruiterSession } from "@/features/recruiter/session";
import { sendApplicationInvitation } from "@/features/recruiter/talent-pool/api";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";

export type SendInvitationDialogProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  candidateProfileId: string;
  candidateName: string;
  onSuccess: () => void;
}>;

function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<details>[\s\S]*?<\/summary>/gi, "")
    .replace(/<\/details>/gi, "")
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatJobSalary(job: RecruiterJobPost): string {
  if (job.salaryIsNegotiable) return "Thoả thuận";
  const min = job.salaryMin ? Number(job.salaryMin) : null;
  const max = job.salaryMax ? Number(job.salaryMax) : null;
  const currency = job.salaryCurrency || "VND";
  if (!min && !max) return "Thoả thuận";
  if (currency === "VND") {
    if (min && max) {
      return `${Math.round(min / 1_000_000)} - ${Math.round(max / 1_000_000)} triệu VND`;
    }
    if (min) return `Từ ${Math.round(min / 1_000_000)} triệu VND`;
    if (max) return `Lên đến ${Math.round(max / 1_000_000)} triệu VND`;
  }
  return `${min ?? 0} - ${max ?? 0} ${currency}`;
}

function formatJobLocations(job: RecruiterJobPost): string {
  const locs = job.jobPostLocations
    ?.map((l) =>
      [l.jobLocation?.address, l.jobLocation?.district, l.jobLocation?.city]
        .filter(Boolean)
        .join(", "),
    )
    .filter(Boolean);
  if (locs && locs.length > 0) return locs.join("; ");
  return "Việt Nam";
}

function buildInvitationTemplate(
  candidateName: string,
  companyName: string,
  job: RecruiterJobPost,
): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const jobUrl = `${origin}/vi/jobs/${job.id}`;

  const desc = stripHtml(job.description);
  const reqs = job.requirements ? stripHtml(job.requirements) : "";
  const bnf = job.benefits ? stripHtml(job.benefits) : "";
  const salary = formatJobSalary(job);
  const locations = formatJobLocations(job);

  let template = `Chào ${candidateName},

Trước hết, ${companyName} xin lỗi nếu email này làm phiền tới bạn!
Chúng tôi được biết tới bạn qua hồ sơ của bạn trên trang việc làm UpNext.
Hiện tại, ${companyName} đang có nhu cầu tuyển dụng vị trí ${job.title.toUpperCase()}.
Nếu bạn vẫn đang có nhu cầu tìm việc và thấy vị trí này phù hợp, kính mời bạn ứng tuyển cho vị trí này ạ!

1. Mô tả công việc:
${desc || "Trao đổi chi tiết khi phỏng vấn"}
`;

  if (bnf) {
    template += `
2. Quyền lợi:
${bnf}
`;
  }

  if (reqs) {
    template += `
3. Yêu cầu công việc:
${reqs}
`;
  }

  template += `
• Địa điểm làm việc: ${locations}
• Mức lương: ${salary}

Bạn vui lòng truy cập liên kết bên dưới hoặc phản hồi email này để ứng tuyển nhanh:
👉 Link ứng tuyển trực tiếp: ${jobUrl}

${companyName} rất mong sẽ được hợp tác cùng bạn trong thời gian sớm nhất & đồng hành cùng bạn trên con đường sự nghiệp!
Xin chân thành cảm ơn bạn đã dành thời gian cho email này!`;

  return template;
}

export function SendInvitationDialog({
  isOpen,
  onClose,
  candidateProfileId,
  candidateName,
  onSuccess,
}: SendInvitationDialogProps) {
  const selectId = useId();
  const textareaId = useId();
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const jobPostsQuery = useQuery({
    queryKey: ["recruiter", "job-posts"],
    queryFn: async () => {
      const session = getRecruiterSession();
      if (!session) return [];
      return getRecruiterJobPosts(session.accessToken);
    },
    enabled: isOpen,
    staleTime: 60_000,
  });

  const activeJobs = jobPostsQuery.data?.filter((j) => j.status === "PUBLISHED") ?? [];

  // When job is selected, build the template
  const handleSelectJob = (jobId: string) => {
    setSelectedJobId(jobId);
    if (jobId === "custom") {
      setMessage(
        `Chào ${candidateName},\n\nChúng tôi rất ấn tượng với hồ sơ của bạn trên UpNext và trân trọng mời bạn ứng tuyển vào vị trí công việc tại công ty chúng tôi.\n\nTrân trọng!`,
      );
      return;
    }

    const job = activeJobs.find((j) => j.id === jobId);
    if (!job) return;

    const companyName = job.company?.name || "Công ty";
    const generated = buildInvitationTemplate(candidateName, companyName, job);
    setMessage(generated);
  };

  // Reset or pre-select first active job when opening dialog
  useEffect(() => {
    if (isOpen) {
      if (activeJobs.length > 0 && !selectedJobId) {
        const firstJob = activeJobs[0];
        if (firstJob) {
          setSelectedJobId(firstJob.id);
          const companyName = firstJob.company?.name || "Công ty";
          setMessage(buildInvitationTemplate(candidateName, companyName, firstJob));
        }
      } else if (activeJobs.length === 0 && !message) {
        setMessage(
          `Chào ${candidateName},\n\nChúng tôi rất ấn tượng với hồ sơ của bạn trên UpNext và trân trọng mời bạn ứng tuyển vào vị trí công việc tại công ty chúng tôi.\n\nTrân trọng!`,
        );
      }
    }
  }, [isOpen, activeJobs, candidateName, selectedJobId, message]);

  const sendInvitationMutation = useMutation({
    mutationFn: async () => {
      const session = getRecruiterSession();
      if (!session) throw new Error("No recruiter session");
      return sendApplicationInvitation(candidateProfileId, message.trim(), session.accessToken);
    },
    onSuccess: () => {
      onSuccess();
      onClose();
      void Swal.fire({
        icon: "success",
        title: "Đã gửi lời mời",
        text: `Email mời ứng tuyển đã được gửi thành công đến ứng viên ${candidateName}.`,
        confirmButtonColor: "#10a778",
      });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Không thể gửi lời mời ứng tuyển.";
      void Swal.fire({
        icon: "error",
        title: "Gửi thất bại",
        text: msg,
        confirmButtonColor: "#10a778",
      });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:max-w-3xl">
        <DialogHeader className="space-y-2">
          <div className="text-brand flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <EnvelopeSimple size={24} weight="bold" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                Gửi lời mời ứng tuyển
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Mời ứng viên <strong className="text-slate-800">{candidateName}</strong> tham gia
                ứng tuyển vào vị trí công việc của công ty
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Select Job Post */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={selectId} className="text-sm font-bold text-slate-800">
                Chọn tin tuyển dụng (JD)
              </Label>
              {selectedJobId && selectedJobId !== "custom" && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  <Sparkle size={13} weight="fill" />
                  Đã áp dụng thông tin từ JD
                </span>
              )}
            </div>

            {jobPostsQuery.isLoading ? (
              <div className="h-10 w-full animate-pulse rounded-md bg-slate-100" />
            ) : (
              <Select value={selectedJobId} onValueChange={handleSelectJob}>
                <SelectTrigger id={selectId} className="w-full bg-white">
                  <SelectValue placeholder="Chọn tin tuyển dụng để tự động điền mẫu thư..." />
                </SelectTrigger>
                <SelectContent>
                  {activeJobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      <div className="flex items-center gap-2">
                        <Briefcase size={16} className="text-slate-500" />
                        <span className="font-semibold text-slate-800">{job.title}</span>
                        <span className="text-xs text-slate-400">• {formatJobSalary(job)}</span>
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">
                    <span className="text-slate-600 italic">
                      ✍️ Tự soạn nội dung tự do (không theo JD)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}

            {activeJobs.length === 0 && !jobPostsQuery.isLoading && (
              <p className="text-xs text-amber-600">
                Hiện bạn chưa có tin tuyển dụng nào đang ở trạng thái xuất bản (Published). Bạn vẫn
                có thể soạn thư tự do bên dưới.
              </p>
            )}
          </div>

          {/* Editor for Message */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={textareaId} className="text-sm font-bold text-slate-800">
                Nội dung thư mời ứng tuyển
              </Label>
              <span className="text-xs text-slate-400">
                Xem trước & có thể chỉnh sửa trước khi gửi
              </span>
            </div>
            <Textarea
              id={textareaId}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập nội dung thư mời ứng tuyển..."
              rows={13}
              className="font-sans text-sm leading-relaxed text-slate-800 focus-visible:ring-emerald-500"
            />
          </div>

          {/* Helpful note */}
          <div className="flex items-start gap-2.5 rounded-lg border border-slate-200/80 bg-slate-50/80 p-3 text-xs text-slate-600">
            <Info size={18} className="mt-0.5 shrink-0 text-emerald-600" />
            <span>
              Ứng viên sẽ nhận được email này và có thể bấm trực tiếp vào đường link trong thư để
              xem chi tiết JD và ứng tuyển nhanh trên UpNext.
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={sendInvitationMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={() => sendInvitationMutation.mutate()}
            disabled={sendInvitationMutation.isPending || !message.trim()}
            className="bg-brand hover:bg-brand/90 font-semibold text-white"
          >
            {sendInvitationMutation.isPending ? (
              <>
                <CircleNotch size={16} className="mr-2 animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <PaperPlaneTilt size={16} className="mr-2" />
                Gửi lời mời ứng tuyển
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
