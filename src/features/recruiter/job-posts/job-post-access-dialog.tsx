"use client";

import { CircleNotch, Info, ShieldCheck, UserCircle } from "@phosphor-icons/react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import {
  getJobPostAccessMembers,
  type JobPostAccessMember,
  updateJobPostMemberAccess,
} from "@/features/recruiter/job-posts/api";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";

type JobPostAccessDialogProps = Readonly<{
  currentRecruiterId: string;
  jobPost: {
    id: string;
    title: string;
  } | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  token: string;
}>;

export function JobPostAccessDialog({
  currentRecruiterId,
  jobPost,
  onOpenChange,
  open,
  token,
}: JobPostAccessDialogProps) {
  const [members, setMembers] = useState<JobPostAccessMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [updatingRecruiterId, setUpdatingRecruiterId] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    if (!jobPost || !token) return;

    setLoading(true);
    setError("");
    try {
      const response = await getJobPostAccessMembers(jobPost.id, token);
      setMembers(response.members);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Không thể tải danh sách quyền truy cập.",
      );
    } finally {
      setLoading(false);
    }
  }, [jobPost, token]);

  useEffect(() => {
    if (!open) {
      setAnnouncement("");
      setError("");
      return;
    }
    void loadMembers();
  }, [loadMembers, open]);

  async function toggleAccess(member: JobPostAccessMember) {
    if (!jobPost) return;

    const nextHasAccess = !member.hasAccess;
    setUpdatingRecruiterId(member.recruiterAccountId);
    setError("");
    try {
      await updateJobPostMemberAccess(jobPost.id, member.recruiterAccountId, nextHasAccess, token);
      setMembers((currentMembers) =>
        currentMembers.map((currentMember) =>
          currentMember.recruiterAccountId === member.recruiterAccountId
            ? {
                ...currentMember,
                hasAccess: nextHasAccess,
                revokedAt: nextHasAccess ? null : new Date().toISOString(),
              }
            : currentMember,
        ),
      );
      setAnnouncement(
        nextHasAccess
          ? `Đã cấp lại quyền truy cập cho ${member.fullName}.`
          : `Đã thu hồi quyền truy cập của ${member.fullName}.`,
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : "Không thể cập nhật quyền truy cập.",
      );
    } finally {
      setUpdatingRecruiterId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl">
        <DialogHeader className="border-b border-slate-200 px-5 py-5 text-left sm:px-6 sm:text-left">
          <DialogTitle className="text-lg font-semibold text-slate-900">
            Quản lý thành viên được quyền truy cập tin tuyển dụng
          </DialogTitle>
          {/* <DialogDescription className="line-clamp-1 pr-8 text-sm text-slate-500">
            {jobPost?.title}
          </DialogDescription> */}
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
            <Info
              className="mt-0.5 size-5 shrink-0 text-blue-600"
              weight="fill"
              aria-hidden="true"
            />
            <p>
              Mọi thành viên trong công ty mặc định có quyền truy cập tin này. Quyền thao tác như
              chỉnh sửa tin hoặc quản lý ứng viên vẫn phụ thuộc vào vai trò của từng thành viên.
            </p>
          </div>

          <p className="sr-only" aria-live="polite">
            {announcement}
          </p>

          {error ? (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              <span>{error}</span>
              <Button
                type="button"
                variant="outline"
                onClick={() => void loadMembers()}
                className="shrink-0 border-rose-200 bg-white text-rose-700 hover:bg-rose-100"
              >
                Thử lại
              </Button>
            </div>
          ) : null}

          {loading ? (
            <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-slate-500">
              <CircleNotch className="size-5 animate-spin text-emerald-600" aria-hidden="true" />
              Đang tải danh sách thành viên...
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                  <thead className="bg-slate-100 text-xs font-semibold text-slate-600">
                    <tr>
                      <th scope="col" className="px-4 py-3">
                        Người dùng
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Vai trò
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Tình trạng
                      </th>
                      <th scope="col" className="px-4 py-3 text-right">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {members.map((member) => {
                      const isCurrentRecruiter = member.recruiterAccountId === currentRecruiterId;
                      const isAccountActive =
                        member.memberStatus === "ACTIVE" && member.accountStatus === "ACTIVE";
                      const updatePending = updatingRecruiterId === member.recruiterAccountId;

                      return (
                        <tr key={member.companyMemberId} className="bg-white">
                          <td aria-label={`Thành viên ${member.fullName}`} className="px-4 py-3.5">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-500">
                                {member.avatarUrl ? (
                                  <Image
                                    src={member.avatarUrl}
                                    alt={`Ảnh đại diện của ${member.fullName}`}
                                    height={36}
                                    width={36}
                                    unoptimized
                                    className="size-full object-cover"
                                  />
                                ) : (
                                  <UserCircle size={26} aria-hidden="true" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-slate-900">
                                  {member.fullName}
                                  {isCurrentRecruiter ? (
                                    <span className="ml-1 text-xs font-normal text-slate-400">
                                      (Bạn)
                                    </span>
                                  ) : null}
                                </p>
                                <p className="truncate text-xs text-slate-500">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-1.5 text-slate-700">
                              <span
                                className="size-2 rounded-full bg-blue-500"
                                aria-hidden="true"
                              />
                              {member.role?.name ?? "Chưa có vai trò"}
                            </span>
                            {member.isJobCreator ? (
                              <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-700">
                                <ShieldCheck size={14} aria-hidden="true" />
                                Người tạo tin
                              </span>
                            ) : null}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                                !member.hasAccess
                                  ? "bg-rose-50 text-rose-700"
                                  : isAccountActive
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-50 text-amber-700",
                              )}
                            >
                              {!member.hasAccess
                                ? "Đã thu hồi"
                                : isAccountActive
                                  ? "Đang hoạt động"
                                  : "Tạm khóa"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            {member.isJobCreator || isCurrentRecruiter ? (
                              <span className="text-xs text-slate-400">
                                {member.isJobCreator ? "Quyền mặc định" : "Tài khoản của bạn"}
                              </span>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                disabled={updatePending}
                                onClick={() => void toggleAccess(member)}
                                className={cn(
                                  "min-w-28 font-medium shadow-none",
                                  member.hasAccess
                                    ? "border-rose-300 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                    : "border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800",
                                )}
                              >
                                {updatePending ? (
                                  <CircleNotch
                                    size={16}
                                    className="mr-1 animate-spin"
                                    aria-hidden="true"
                                  />
                                ) : null}
                                {member.hasAccess ? "Thu hồi quyền" : "Cấp lại quyền"}
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {members.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-slate-500">
                  Chưa có thành viên nào trong công ty.
                </p>
              ) : null}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
