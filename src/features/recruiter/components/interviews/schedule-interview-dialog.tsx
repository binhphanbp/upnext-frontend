"use client";

import { CaretDown, MagnifyingGlass, WarningCircle, X } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import {
  createInterview,
  getRecruiterInterviews,
  type Interview,
  type InterviewType,
} from "@/features/recruiter/api/interviews";
import {
  getCompanyLocations,
  getRecruiterAccount,
  type CompanyLocation,
} from "@/features/recruiter/api/onboarding";
import {
  getCompanyApplications,
  getCompanyMembers,
  isRecruiterMissingCompanyError,
  type Application,
} from "@/features/recruiter/api/team";
import type { RecruiterJobPost } from "@/features/recruiter/job-posts/api";
import { getRecruiterSession } from "@/features/recruiter/session";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { DatePicker } from "@/shared/ui/date-picker";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

/**
 * `<input type="datetime-local">` vẽ lịch bằng widget gốc của trình duyệt —
 * trên máy có OS/trình duyệt ở locale tiếng Anh, lịch đó hiện "August 2026",
 * "Su Mo Tu We Th Fr Sa" dù cả trang đang ở tiếng Việt, vì ngôn ngữ của widget
 * đó do OS quyết định, trang web không chỉnh được. Tách thành `DatePicker`
 * (lịch tự vẽ, luôn tiếng Việt, đã có sẵn trong `shared/ui`) + input giờ riêng
 * để đảm bảo hiển thị đúng tiếng Việt bất kể máy khách cấu hình ngôn ngữ gì.
 * Giá trị gộp lại vẫn giữ đúng định dạng "yyyy-MM-ddTHH:mm" như cũ, nên toàn bộ
 * logic validate/check trùng lịch phía dưới không cần đổi.
 */
function formatDateToLocalValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const TIME_SELECT_HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const TIME_SELECT_MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

/**
 * `<input type="time">` cũng vẽ bằng widget cuộn giờ/phút gốc của trình duyệt —
 * cùng vấn đề với datetime-local (ngôn ngữ theo OS, không theo trang), và popup
 * cuộn đó còn tràn ra ngoài/che các trường khác trong dialog. Thay bằng 2
 * `<select>` giờ/phút tự viết — chỉ là danh sách text do mình tự định nghĩa,
 * không có widget lịch/giờ nào của trình duyệt chèn vào nên không còn 2 vấn đề
 * trên. Bước phút 5 để danh sách không quá dài mà vẫn đủ dùng cho lịch phỏng vấn.
 */
function TimeSelect({
  value,
  onChange,
  ariaLabel,
  hasError,
}: {
  value: string;
  onChange: (time: string) => void;
  ariaLabel: string;
  hasError?: boolean;
}) {
  const [hour = "", minute = ""] = value ? value.split(":") : [];
  const selectClassName = cn(
    "h-12 shrink-0 rounded-xl border border-slate-200 bg-white px-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none",
    hasError && "border-rose-400 focus:border-rose-500",
  );

  const hoursList = useMemo(() => {
    if (hour && !TIME_SELECT_HOURS.includes(hour)) {
      return [...TIME_SELECT_HOURS, hour].sort((a, b) => Number(a) - Number(b));
    }
    return TIME_SELECT_HOURS;
  }, [hour]);

  const minutesList = useMemo(() => {
    if (minute && !TIME_SELECT_MINUTES.includes(minute)) {
      return [...TIME_SELECT_MINUTES, minute].sort((a, b) => Number(a) - Number(b));
    }
    return TIME_SELECT_MINUTES;
  }, [minute]);

  return (
    <div className="flex shrink-0 items-center gap-1">
      <select
        aria-label={`${ariaLabel} — giờ`}
        value={hour}
        onChange={(e) => {
          const newHour = e.target.value;
          if (!newHour) {
            onChange("");
          } else {
            onChange(`${newHour}:${minute || "00"}`);
          }
        }}
        className={selectClassName}
      >
        <option value="">--</option>
        {hoursList.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="text-slate-400">:</span>
      <select
        aria-label={`${ariaLabel} — phút`}
        value={minute}
        onChange={(e) => {
          const newMinute = e.target.value;
          if (!newMinute) {
            if (!hour) onChange("");
            else onChange(`${hour}:00`);
          } else {
            onChange(`${hour || "09"}:${newMinute}`);
          }
        }}
        className={selectClassName}
      >
        <option value="">--</option>
        {minutesList.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2600,
  timerProgressBar: true,
});

type ScheduleInterviewDialogProps = Readonly<{
  token: string | null;
  jobs: RecruiterJobPost[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: {
    applicationId: string;
    interviewRound: number;
    jobId?: string | undefined;
  } | null;
  /** Called with the scheduled application id after the interview is created. */
  onScheduled?: (applicationId: string) => void;
  /**
   * When provided, renders an escape hatch for recruiters who already agreed on
   * a time outside the system. Omit to hide the button entirely.
   */
  onSkipSchedule?: () => void;
  /**
   * Locks the job and candidate pickers so the dialog can only schedule for the
   * application it was opened from. Prevents scheduling for candidate B while
   * the caller applies a side effect to candidate A.
   */
  lockApplication?: boolean;
}>;

export function ScheduleInterviewDialog({
  token,
  jobs,
  open,
  onOpenChange,
  initialValues,
  onScheduled,
  onSkipSchedule,
  lockApplication = false,
}: ScheduleInterviewDialogProps) {
  const t = useTranslations("Recruiter");
  const locale = useLocale();
  const queryClient = useQueryClient();

  const [jobId, setJobId] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [jobDropdownOpen, setJobDropdownOpen] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidateDropdownOpen, setCandidateDropdownOpen] = useState(false);

  const [interviewRound, setInterviewRound] = useState(1);
  const [type, setType] = useState<InterviewType>("ONLINE");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [location, setLocation] = useState("");
  const [recruiterNote, setRecruiterNote] = useState("");
  const [interviewerOptions, setInterviewerOptions] = useState<
    { memberId: string; profileId: string; label: string; accountId: string }[]
  >([]);
  const [recruiterProfileId, setRecruiterProfileId] = useState("");
  const [companyLocations, setCompanyLocations] = useState<CompanyLocation[]>([]);

  const { data: allCompanyInterviews } = useQuery({
    queryKey: ["recruiter", "all-company-interviews"],
    queryFn: () => {
      if (!token) return [] as Interview[];
      return getRecruiterInterviews(token);
    },
    enabled: open && !!token,
  });

  const scheduledApplicationIds = useMemo(() => {
    if (!allCompanyInterviews || allCompanyInterviews.length === 0) {
      return new Set<string>();
    }
    const ids = new Set<string>();
    for (const item of allCompanyInterviews) {
      if (
        item.status === "SCHEDULED" ||
        item.status === "RESCHEDULED" ||
        (item.status !== "CANCELLED" && item.status !== "COMPLETED")
      ) {
        ids.add(item.applicationId);
      }
    }
    return ids;
  }, [allCompanyInterviews]);

  const { data: applications } = useQuery({
    queryKey: [
      "recruiter",
      "company-applications",
      { jobId, initialAppId: initialValues?.applicationId },
    ],
    queryFn: () => {
      if (!token) return Promise.resolve([] as Application[]);
      if (jobId) {
        return getCompanyApplications(token, {
          jobPostId: jobId,
        }).catch((error) => {
          if (isRecruiterMissingCompanyError(error)) {
            return [] as Application[];
          }

          throw error;
        });
      }
      if (initialValues?.applicationId) {
        return getCompanyApplications(token).catch((error) => {
          if (isRecruiterMissingCompanyError(error)) {
            return [] as Application[];
          }

          throw error;
        });
      }
      return Promise.resolve([] as Application[]);
    },
    enabled: open && !!token && (!!jobId || !!initialValues?.applicationId),
  });

  // Only show candidates eligible for interview scheduling who do NOT already have an active/scheduled interview
  const candidateOptions = useMemo(
    () =>
      (applications ?? []).filter(
        (app) =>
          (app.id === initialValues?.applicationId && lockApplication) ||
          ((app.status === "SHORTLISTED" ||
            app.status === "INTERVIEWING" ||
            app.status === "CONSIDERING") &&
            !scheduledApplicationIds.has(app.id)),
      ),
    [applications, initialValues?.applicationId, lockApplication, scheduledApplicationIds],
  );

  const { data: previousInterviews } = useQuery({
    queryKey: ["recruiter", "interviews", { applicationId }],
    queryFn: () => {
      if (!token || !applicationId) return [];
      return getRecruiterInterviews(token, { applicationId });
    },
    enabled: !!token && !!applicationId,
  });

  // Auto-calculate the next interview round for the selected application
  const autoRound = useMemo(() => {
    if (!previousInterviews || previousInterviews.length === 0) return 1;
    const activeInterviews = previousInterviews.filter((i) => i.status !== "CANCELLED");
    if (activeInterviews.length === 0) return 1;
    const maxRound = Math.max(...activeInterviews.map((i) => i.interviewRound), 0);
    // Only advance if the latest round is COMPLETED + PASSED
    const latestRound = activeInterviews.find((i) => i.interviewRound === maxRound);
    if (latestRound?.status === "COMPLETED" && latestRound?.result === "PASSED") {
      return maxRound + 1;
    }
    // Otherwise stay at the current max round (will be rejected by backend if duplicate)
    return maxRound;
  }, [previousInterviews]);

  // Sync auto-round to state when application changes
  useEffect(() => {
    if (!initialValues) {
      setInterviewRound(applicationId ? autoRound : 1);
    }
  }, [autoRound, initialValues, applicationId]);

  // Check if this round is blocked (already exists and can't advance)
  const roundBlocked = useMemo(() => {
    if (!applicationId || !previousInterviews) return false;
    const activeInterviews = previousInterviews.filter((i) => i.status !== "CANCELLED");
    if (activeInterviews.length === 0) return false;
    // Check if a non-cancelled interview already exists for the auto-round
    return activeInterviews.some((i) => i.interviewRound === autoRound);
  }, [applicationId, previousInterviews, autoRound]);

  const filteredJobsForSelect = useMemo(() => {
    const q = jobSearch.toLowerCase().trim();
    if (!q) return jobs;
    return jobs.filter((job) => job.title.toLowerCase().includes(q));
  }, [jobs, jobSearch]);

  const filteredCandidatesForSelect = useMemo(() => {
    const q = candidateSearch.toLowerCase().trim();
    if (!q) return candidateOptions;
    return candidateOptions.filter((application) => {
      const candidateName =
        application.candidateProfile.account.fullName ?? application.candidateProfile.account.email;
      return (
        candidateName.toLowerCase().includes(q) ||
        application.jobPost.title.toLowerCase().includes(q)
      );
    });
  }, [candidateOptions, candidateSearch]);

  useEffect(() => {
    if (!open) {
      setJobId("");
      setApplicationId("");
      setJobSearch("");
      setJobDropdownOpen(false);
      setCandidateSearch("");
      setCandidateDropdownOpen(false);
      setInterviewRound(1);
      setType("ONLINE");
      setStartDate("");
      setStartTime("");
      setEndDate("");
      setEndTime("");
      setMeetingUrl("");
      setLocation("");
      setRecruiterNote("");
      setInterviewerOptions([]);
      setRecruiterProfileId("");
      setCompanyLocations([]);
      return;
    }

    if (initialValues) {
      if (initialValues.jobId) {
        setJobId(initialValues.jobId);
      }
      setApplicationId(initialValues.applicationId);
      setInterviewRound(initialValues.interviewRound);
    }
  }, [open, initialValues]);

  // If jobId was omitted from initialValues, auto-detect jobId from application list once loaded
  useEffect(() => {
    if (open && initialValues?.applicationId && !jobId && applications && applications.length > 0) {
      const match = applications.find((app) => app.id === initialValues.applicationId);
      if (match) {
        setJobId(match.jobPost.id);
      }
    }
  }, [open, initialValues?.applicationId, jobId, applications]);

  useEffect(() => {
    if (!open || !token) return;

    const session = getRecruiterSession();
    if (!session) return;

    let cancelled = false;

    (async () => {
      try {
        const account = await getRecruiterAccount(session.user.id, token);
        if (!account.company?.id) return;

        const [members, locations] = await Promise.all([
          getCompanyMembers(account.company.id, token),
          getCompanyLocations(account.company.id, token).catch(() => []),
        ]);
        if (cancelled) return;

        setCompanyLocations(locations);

        const activeInterviewers = members.flatMap((member) => {
          const profileId = member.recruiterAccount?.profile?.id;
          if (member.status !== "ACTIVE" || !profileId) return [];

          return [
            {
              memberId: member.id,
              profileId,
              label:
                member.recruiterAccount?.profile?.fullName ?? member.recruiterAccount?.email ?? "",
              accountId: member.recruiterAccount?.id ?? "",
            },
          ];
        });
        setInterviewerOptions(activeInterviewers);

        const currentInterviewer = activeInterviewers.find(
          (member) => member.accountId === session.user.id,
        );
        setRecruiterProfileId(currentInterviewer?.profileId ?? "");
      } catch {
        // Backend falls back to the current recruiter when recruiterProfileId is omitted.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, token]);

  useEffect(() => {
    // A locked dialog is seeded with one specific application; clearing it on a
    // job-filter change would wipe the very selection the caller relies on.
    if (lockApplication) return;
    setApplicationId("");
    setCandidateSearch("");
  }, [jobId, lockApplication]);

  useEffect(() => {
    if (!lockApplication && applicationId && scheduledApplicationIds.has(applicationId)) {
      setApplicationId("");
    }
  }, [applicationId, scheduledApplicationIds, lockApplication]);

  const startAt = startDate && startTime ? `${startDate}T${startTime}` : "";
  const endAt = endDate && endTime ? `${endDate}T${endTime}` : "";

  const conflictingInterview = useMemo(() => {
    if (!startAt || !endAt || !allCompanyInterviews || allCompanyInterviews.length === 0)
      return null;
    const startMs = new Date(startAt).getTime();
    const endMs = new Date(endAt).getTime();
    if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) return null;

    return (
      allCompanyInterviews.find((item) => {
        if (item.status === "CANCELLED") return false;

        const isSameInterviewer =
          recruiterProfileId && item.recruiterProfileId === recruiterProfileId;
        const isSameCandidate = applicationId && item.applicationId === applicationId;

        const session = getRecruiterSession();
        const isCurrentRecruiter = session?.user?.id && !recruiterProfileId;

        if (!isSameInterviewer && !isSameCandidate && !isCurrentRecruiter) return false;

        const iStartMs = new Date(item.scheduledStartAt).getTime();
        const iEndMs = new Date(item.scheduledEndAt).getTime();
        if (isNaN(iStartMs) || isNaN(iEndMs)) return false;

        return iStartMs < endMs && iEndMs > startMs;
      }) ?? null
    );
  }, [startAt, endAt, allCompanyInterviews, recruiterProfileId, applicationId]);

  type FormFieldErrors = {
    applicationId?: string | undefined;
    startAt?: string | undefined;
    endAt?: string | undefined;
  };

  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});

  function validateAndSetErrors(sDate: string, sTime: string, eDate: string, eTime: string) {
    setFieldErrors((prev) => {
      const next = { ...prev };

      // Validate startAt if both date and time are provided
      if (sDate && sTime) {
        const startMs = new Date(`${sDate}T${sTime}`).getTime();
        if (isNaN(startMs) || startMs < Date.now() - 60_000) {
          next.startAt =
            locale === "vi"
              ? "Ngày hẹn không hợp lệ. Thời gian phỏng vấn phải ở tương lai."
              : "Invalid date. Interview time must be in the future.";
        } else {
          next.startAt = undefined;
        }
      } else {
        next.startAt = undefined;
      }

      // Validate endAt if both start & end are complete
      if (sDate && sTime && eDate && eTime) {
        const startMs = new Date(`${sDate}T${sTime}`).getTime();
        const endMs = new Date(`${eDate}T${eTime}`).getTime();
        if (isNaN(endMs) || endMs <= startMs) {
          next.endAt =
            locale === "vi"
              ? "Thời gian kết thúc phải sau thời gian bắt đầu."
              : "End time must be after start time.";
        } else {
          next.endAt = undefined;
        }
      } else {
        next.endAt = undefined;
      }

      return next;
    });
  }

  function handleStartDateChange(dateVal: string) {
    setStartDate(dateVal);
    let nextEndDate = endDate;
    if (!endDate || endDate === startDate || (dateVal && endDate < dateVal)) {
      nextEndDate = dateVal;
      setEndDate(dateVal);
    }
    validateAndSetErrors(dateVal, startTime, nextEndDate, endTime);
  }

  function handleStartTimeChange(timeVal: string) {
    setStartTime(timeVal);

    const effectiveStartDate = startDate || formatDateToLocalValue(new Date());
    if (!startDate && timeVal) {
      setStartDate(effectiveStartDate);
    }

    let nextEndDate = endDate || effectiveStartDate;
    if (!endDate && timeVal) {
      setEndDate(effectiveStartDate);
    }

    let nextEndTime = endTime;
    if (timeVal) {
      if (!endTime || (effectiveStartDate === nextEndDate && endTime <= timeVal)) {
        const [hStr = "0", mStr = "00"] = timeVal.split(":");
        const h = Number(hStr);
        if (h === 23) {
          nextEndTime = "23:55";
        } else {
          const nextH = Math.min(23, h + 1);
          nextEndTime = `${String(nextH).padStart(2, "0")}:${mStr.padStart(2, "0")}`;
        }
        setEndTime(nextEndTime);
      }
    }

    validateAndSetErrors(
      startDate || (timeVal ? effectiveStartDate : ""),
      timeVal,
      nextEndDate,
      nextEndTime,
    );
  }

  function handleEndDateChange(dateVal: string) {
    setEndDate(dateVal);
    validateAndSetErrors(startDate, startTime, dateVal, endTime);
  }

  function handleEndTimeChange(timeVal: string) {
    setEndTime(timeVal);
    validateAndSetErrors(startDate, startTime, endDate || startDate, timeVal);
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("No token available");
      const isValidUUID = (v: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
      return createInterview(
        {
          applicationId,
          interviewRound,
          type,
          scheduledStartAt: new Date(startAt).toISOString(),
          scheduledEndAt: new Date(endAt).toISOString(),
          ...(recruiterProfileId && isValidUUID(recruiterProfileId) ? { recruiterProfileId } : {}),
          ...(type === "ONLINE" && meetingUrl ? { meetingUrl } : {}),
          ...(type === "ONSITE" && location ? { location } : {}),
          ...(recruiterNote ? { recruiterNote } : {}),
        },
        token,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recruiter", "interviews"] });
      void queryClient.invalidateQueries({ queryKey: ["recruiter", "company-applications"] });
      void queryClient.invalidateQueries({ queryKey: ["recruiter", "all-company-interviews"] });
      void toast.fire({ icon: "success", title: t("interviews.toasts.scheduleSuccess") });
      onScheduled?.(applicationId);
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error
          ? err.message
          : ((err as { message?: string })?.message ?? t("interviews.toasts.scheduleError"));
      void toast.fire({ icon: "error", title: message });
    },
  });

  const handleSubmit = async () => {
    const newErrors: FormFieldErrors = {};

    if (!applicationId) {
      newErrors.applicationId =
        locale === "vi" ? "Vui lòng chọn ứng viên phỏng vấn" : "Please select a candidate";
    }

    if (!startDate || !startTime) {
      newErrors.startAt =
        locale === "vi" ? "Bắt buộc nhập Ngày Giờ phỏng vấn" : "Interview date & time is required";
    } else {
      const startMs = new Date(`${startDate}T${startTime}`).getTime();
      if (isNaN(startMs) || startMs < Date.now() - 60_000) {
        newErrors.startAt =
          locale === "vi"
            ? "Ngày hẹn không hợp lệ. Thời gian phỏng vấn phải ở tương lai."
            : "Invalid date. Interview time must be in the future.";
      }
    }

    if (!endDate || !endTime) {
      newErrors.endAt =
        locale === "vi" ? "Bắt buộc nhập Ngày Giờ kết thúc" : "End date & time is required";
    } else if (startDate && startTime) {
      const startMs = new Date(`${startDate}T${startTime}`).getTime();
      const endMs = new Date(`${endDate}T${endTime}`).getTime();
      if (isNaN(endMs) || endMs <= startMs) {
        newErrors.endAt =
          locale === "vi"
            ? "Thời gian kết thúc phải sau thời gian bắt đầu."
            : "End time must be after start time.";
      }
    }

    setFieldErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (newErrors.startAt && (!startDate || !startTime)) {
        void toast.fire({
          icon: "error",
          title:
            locale === "vi"
              ? "Bắt buộc nhập Ngày Giờ phỏng vấn"
              : "Interview date & time is required",
        });
      } else if (newErrors.endAt && (!endDate || !endTime)) {
        void toast.fire({
          icon: "error",
          title:
            locale === "vi" ? "Bắt buộc nhập Ngày Giờ kết thúc" : "End date & time is required",
        });
      } else if (newErrors.startAt) {
        void toast.fire({ icon: "error", title: newErrors.startAt });
      } else if (newErrors.endAt) {
        void toast.fire({ icon: "error", title: newErrors.endAt });
      } else if (newErrors.applicationId) {
        void toast.fire({ icon: "error", title: newErrors.applicationId });
      }
      return;
    }

    if (roundBlocked) {
      void toast.fire({
        icon: "error",
        title:
          locale === "vi"
            ? "Vòng phỏng vấn hiện tại chưa hoàn thành hoặc chưa đạt."
            : "Current round not completed or not passed.",
      });
      return;
    }

    if (conflictingInterview) {
      const candName =
        conflictingInterview.application?.candidateProfile?.account?.fullName || "ứng viên khác";
      const startStr = new Date(conflictingInterview.scheduledStartAt).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const endStr = new Date(conflictingInterview.scheduledEndAt).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const dateStr = new Date(conflictingInterview.scheduledStartAt).toLocaleDateString("vi-VN");

      const result = await Swal.fire({
        title: locale === "vi" ? "⚠️ Cảnh báo trùng lịch phỏng vấn" : "⚠️ Schedule Conflict",
        html: `<p class="text-sm text-slate-700 font-medium">Bạn đang có lịch trùng giờ này với <strong>${candName}</strong> (${startStr} - ${endStr} ngày ${dateStr}).</p><p class="mt-2 text-xs text-amber-700 font-semibold">Bạn có chắc chắn muốn tiếp tục lên lịch phỏng vấn?</p>`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#059669",
        cancelButtonColor: "#64748b",
        confirmButtonText: locale === "vi" ? "Tiếp tục đặt lịch" : "Continue anyway",
        cancelButtonText: locale === "vi" ? "Chọn lại giờ" : "Pick another time",
      });

      if (!result.isConfirmed) {
        return;
      }
    }

    mutation.mutate();
  };

  // In locked mode the job/candidate labels come from the selected application
  // itself, so callers do not have to supply the `jobs` list just for a label.
  const lockedApplication = lockApplication
    ? candidateOptions.find((option) => option.id === applicationId)
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[85vh] max-w-lg flex-col overflow-hidden p-0"
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement;
          if (
            target?.closest?.("[data-radix-popper-content-wrapper]") ||
            target?.closest?.("[data-radix-popover-content]") ||
            target?.closest?.(".swal2-container")
          ) {
            return;
          }
          e.preventDefault();
        }}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .popup-scrollbar::-webkit-scrollbar {
                width: 6px;
              }
              .popup-scrollbar::-webkit-scrollbar-track {
                background: transparent;
              }
              .popup-scrollbar::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 99px;
              }
              .popup-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
              }
            `,
          }}
        />
        <DialogHeader className="shrink-0 border-b p-6 pb-4">
          <DialogTitle>{t("interviews.scheduleForm.title")}</DialogTitle>
        </DialogHeader>

        <div className="popup-scrollbar flex-1 space-y-4 overflow-y-auto p-6 pt-0">
          {/* Job Select */}
          <div className="space-y-1.5">
            <Label htmlFor="schedule-job" className="text-xs font-bold text-slate-600">
              {t("interviews.scheduleForm.job")}
            </Label>
            <DropdownMenu
              modal={false}
              open={jobDropdownOpen}
              onOpenChange={(open) => {
                if (lockApplication) return;
                setJobDropdownOpen(open);
                if (!open) setJobSearch("");
              }}
            >
              <DropdownMenuTrigger asChild>
                <button
                  id="schedule-job"
                  type="button"
                  role="combobox"
                  aria-expanded={jobDropdownOpen}
                  disabled={lockApplication}
                  className={cn(
                    "border-input bg-background text-foreground flex h-11 w-full items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium shadow-none transition-colors focus:outline-none",
                    lockApplication
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer hover:bg-slate-50/50",
                  )}
                >
                  <span className={cn("flex-1 truncate text-left", !jobId && "text-slate-400")}>
                    {lockedApplication
                      ? lockedApplication.jobPost.title
                      : jobId
                        ? (jobs.find((j) => j.id === jobId)?.title ??
                          (locale === "vi" ? "Chọn vị trí tuyển dụng" : "Select a job post"))
                        : locale === "vi"
                          ? "Chọn vị trí tuyển dụng"
                          : "Select a job post"}
                  </span>
                  <CaretDown size={16} className="ml-2 shrink-0 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="z-[1040] flex max-h-80 w-[432px] flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
                onWheel={(e) => e.stopPropagation()}
              >
                <div className="relative flex items-center px-1 py-1">
                  <MagnifyingGlass size={16} className="absolute left-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder={locale === "vi" ? "Tìm tin tuyển dụng..." : "Search jobs..."}
                    aria-label={locale === "vi" ? "Tìm tin tuyển dụng" : "Search jobs"}
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    className="focus:border-primary h-9 w-full rounded-lg border border-slate-200 pr-8 pl-9 text-xs font-semibold placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === " ") e.stopPropagation();
                    }}
                  />
                  {jobSearch && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setJobSearch("");
                      }}
                      className="absolute right-3 rounded-full p-0.5 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  {filteredJobsForSelect.map((job) => (
                    <DropdownMenuItem
                      key={job.id}
                      onClick={() => {
                        setJobId(job.id);
                        setApplicationId("");
                        setJobDropdownOpen(false);
                      }}
                      className={cn(
                        "cursor-pointer flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium hover:bg-slate-50",
                        jobId === job.id && "text-emerald-600 bg-emerald-50/30",
                      )}
                    >
                      {job.title}
                    </DropdownMenuItem>
                  ))}
                  {filteredJobsForSelect.length === 0 && (
                    <div className="py-4 text-center text-xs font-medium text-slate-400">
                      {locale === "vi" ? "Không tìm thấy tin tuyển dụng" : "No job posts found"}
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Candidate Select */}
          <div className="space-y-1.5">
            <Label htmlFor="schedule-candidate" className="text-xs font-bold text-slate-600">
              {t("interviews.scheduleForm.candidate")}
            </Label>
            {candidateOptions.length === 0 ? (
              <button
                id="schedule-candidate"
                type="button"
                disabled
                className="border-input bg-background flex h-11 w-full cursor-not-allowed items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium text-slate-400 opacity-50 shadow-none"
              >
                <span className="flex-1 truncate text-left">
                  {!jobId
                    ? locale === "vi"
                      ? "Chọn vị trí tuyển dụng trước"
                      : "Select a job first"
                    : t("interviews.scheduleForm.noCandidates")}
                </span>
                <CaretDown size={16} className="ml-2 shrink-0 text-slate-400" />
              </button>
            ) : (
              <DropdownMenu
                modal={false}
                open={candidateDropdownOpen}
                onOpenChange={(open) => {
                  if (lockApplication) return;
                  setCandidateDropdownOpen(open);
                  if (!open) setCandidateSearch("");
                }}
              >
                <DropdownMenuTrigger asChild>
                  <button
                    id="schedule-candidate"
                    type="button"
                    role="combobox"
                    aria-expanded={candidateDropdownOpen}
                    disabled={lockApplication}
                    className={cn(
                      "border-input bg-background text-foreground flex h-11 w-full items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium shadow-none transition-colors focus:outline-none",
                      lockApplication
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer hover:bg-slate-50/50",
                    )}
                  >
                    <span className="flex-1 truncate text-left">
                      {applicationId
                        ? (() => {
                            const selected = candidateOptions.find((c) => c.id === applicationId);
                            return selected
                              ? `${selected.candidateProfile.account.fullName ?? selected.candidateProfile.account.email} — ${selected.jobPost.title}`
                              : t("interviews.scheduleForm.candidatePlaceholder");
                          })()
                        : t("interviews.scheduleForm.candidatePlaceholder")}
                    </span>
                    <CaretDown size={16} className="ml-2 shrink-0 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="z-[1040] flex max-h-80 w-[432px] flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
                  onWheel={(e) => e.stopPropagation()}
                >
                  <div className="relative flex items-center px-1 py-1">
                    <MagnifyingGlass size={16} className="absolute left-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder={locale === "vi" ? "Tìm ứng viên..." : "Search candidates..."}
                      aria-label={locale === "vi" ? "Tìm ứng viên" : "Search candidates"}
                      value={candidateSearch}
                      onChange={(e) => setCandidateSearch(e.target.value)}
                      className="focus:border-primary h-9 w-full rounded-lg border border-slate-200 pr-8 pl-9 text-xs font-semibold placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === " ") e.stopPropagation();
                      }}
                    />
                    {candidateSearch && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCandidateSearch("");
                        }}
                        className="absolute right-3 rounded-full p-0.5 text-slate-400 hover:text-slate-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    {filteredCandidatesForSelect.map((candidate) => (
                      <DropdownMenuItem
                        key={candidate.id}
                        onClick={() => {
                          setApplicationId(candidate.id);
                          setCandidateDropdownOpen(false);
                        }}
                        className={cn(
                          "cursor-pointer flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium hover:bg-slate-50",
                          applicationId === candidate.id && "text-emerald-600 bg-emerald-50/30",
                        )}
                      >
                        {candidate.candidateProfile.account.fullName ??
                          candidate.candidateProfile.account.email}{" "}
                        — {candidate.jobPost.title}
                      </DropdownMenuItem>
                    ))}
                    {filteredCandidatesForSelect.length === 0 && (
                      <div className="py-4 text-center text-xs font-medium text-slate-400">
                        {locale === "vi" ? "Không tìm thấy ứng viên" : "No candidates found"}
                      </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Interviewer Select */}
          {interviewerOptions.length > 1 && (
            <div className="space-y-1.5">
              <Label htmlFor="schedule-interviewer" className="text-xs font-bold text-slate-600">
                {t("interviews.scheduleForm.interviewer")}
              </Label>
              <Select value={recruiterProfileId} onValueChange={setRecruiterProfileId}>
                <SelectTrigger id="schedule-interviewer" className="shadow-none">
                  <SelectValue placeholder={t("interviews.scheduleForm.interviewerPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {interviewerOptions.map((member) => (
                    <SelectItem key={member.memberId} value={member.profileId}>
                      {member.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Round & Type Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="schedule-round" className="text-xs font-bold text-slate-600">
                {t("interviews.scheduleForm.round")}
              </Label>
              <Input
                id="schedule-round"
                type="number"
                min={1}
                value={interviewRound}
                readOnly
                className="cursor-not-allowed bg-slate-50"
              />
              <p
                className={cn(
                  "mt-1 text-xs",
                  roundBlocked ? "font-semibold text-rose-600" : "text-slate-400",
                )}
              >
                {roundBlocked
                  ? locale === "vi"
                    ? "Vòng hiện tại chưa hoàn thành hoặc chưa đạt."
                    : "Current round not completed or not passed."
                  : locale === "vi"
                    ? "Tự động tính theo lịch sử."
                    : "Auto-calculated from history."}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="schedule-type" className="text-xs font-bold text-slate-600">
                {t("interviews.scheduleForm.type")}
              </Label>
              <Select value={type} onValueChange={(v) => setType(v as InterviewType)}>
                <SelectTrigger id="schedule-type" className="shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONLINE">{t("interviews.type.ONLINE")}</SelectItem>
                  <SelectItem value="ONSITE">{t("interviews.type.ONSITE")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Start & End Date Grid */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="schedule-start-date" className="text-xs font-bold text-slate-600">
                {t("interviews.scheduleForm.startAt")} <span className="text-rose-500">*</span>
              </Label>
              <div className="flex gap-2">
                <DatePicker
                  id="schedule-start-date"
                  className="flex-1"
                  value={startDate || undefined}
                  minDate={formatDateToLocalValue(new Date())}
                  showTodayButton={false}
                  placeholder={locale === "vi" ? "Chọn ngày" : "Pick a date"}
                  onChange={handleStartDateChange}
                />
                <TimeSelect
                  ariaLabel={t("interviews.scheduleForm.startAt")}
                  value={startTime}
                  hasError={Boolean(fieldErrors.startAt)}
                  onChange={handleStartTimeChange}
                />
              </div>
              {fieldErrors.startAt && (
                <p className="mt-1 text-xs font-semibold text-rose-600">* {fieldErrors.startAt}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="schedule-end-date" className="text-xs font-bold text-slate-600">
                {t("interviews.scheduleForm.endAt")} <span className="text-rose-500">*</span>
              </Label>
              <div className="flex gap-2">
                <DatePicker
                  id="schedule-end-date"
                  className="flex-1"
                  value={endDate || undefined}
                  minDate={startDate || formatDateToLocalValue(new Date())}
                  showTodayButton={false}
                  placeholder={locale === "vi" ? "Chọn ngày" : "Pick a date"}
                  onChange={handleEndDateChange}
                />
                <TimeSelect
                  ariaLabel={t("interviews.scheduleForm.endAt")}
                  value={endTime}
                  hasError={Boolean(fieldErrors.endAt)}
                  onChange={handleEndTimeChange}
                />
              </div>
              {fieldErrors.endAt && (
                <p className="mt-1 text-xs font-semibold text-rose-600">* {fieldErrors.endAt}</p>
              )}
            </div>
          </div>

          {/* Conflict Warning Box (TC_EMP_041) */}
          {conflictingInterview && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 shadow-sm">
              <WarningCircle size={20} className="mt-0.5 shrink-0 text-amber-600" weight="fill" />
              <div className="flex-1 space-y-1">
                <p className="text-xs font-bold text-amber-900 sm:text-sm">
                  {locale === "vi"
                    ? "⚠️ Bạn đang có lịch trùng giờ này"
                    : "⚠️ Schedule Conflict Warning"}
                </p>
                <p className="leading-relaxed text-amber-800">
                  {locale === "vi"
                    ? `Đã có lịch phỏng vấn với ứng viên ${conflictingInterview.application?.candidateProfile?.account?.fullName || "khác"} (${conflictingInterview.application?.jobPost?.title || ""}) từ ${new Date(conflictingInterview.scheduledStartAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - ${new Date(conflictingInterview.scheduledEndAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ngày ${new Date(conflictingInterview.scheduledStartAt).toLocaleDateString("vi-VN")}.`
                    : `Conflicting with interview for ${conflictingInterview.application?.candidateProfile?.account?.fullName || "another candidate"} (${conflictingInterview.application?.jobPost?.title || ""}) from ${new Date(conflictingInterview.scheduledStartAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} to ${new Date(conflictingInterview.scheduledEndAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} on ${new Date(conflictingInterview.scheduledStartAt).toLocaleDateString("en-US")}.`}
                </p>
              </div>
            </div>
          )}

          {/* Meeting URL or Location */}
          {type === "ONLINE" ? (
            <div className="space-y-1.5">
              <Label htmlFor="schedule-meeting-url" className="text-xs font-bold text-slate-600">
                {t("interviews.scheduleForm.meetingUrl")}
              </Label>
              <Input
                id="schedule-meeting-url"
                type="url"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="https://meet.google.com/..."
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="schedule-location" className="text-xs font-bold text-slate-600">
                {t("interviews.scheduleForm.location")}
              </Label>
              {companyLocations.length > 0 ? (
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger id="schedule-location" className="shadow-none [&>span]:truncate">
                    <SelectValue placeholder={t("interviews.scheduleForm.locationPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      new Map(
                        companyLocations.map((loc) => [formatCompanyLocation(loc), loc] as const),
                      ).values(),
                    ).map((companyLocation) => {
                      const label = formatCompanyLocation(companyLocation);
                      return (
                        <SelectItem key={companyLocation.id} value={label}>
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="schedule-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              )}
            </div>
          )}

          {/* Recruiter Note */}
          <div className="space-y-1.5">
            <Label htmlFor="schedule-note" className="text-xs font-bold text-slate-600">
              {t("interviews.scheduleForm.recruiterNote")}
            </Label>
            <textarea
              id="schedule-note"
              value={recruiterNote}
              onChange={(e) => setRecruiterNote(e.target.value)}
              rows={3}
              className="upnext-focus border-input bg-background text-foreground placeholder:text-muted-foreground w-full rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
            />
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-3 border-t p-6 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-600"
          >
            {t("interviews.scheduleForm.cancel")}
          </Button>
          {onSkipSchedule ? (
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => {
                onSkipSchedule();
                onOpenChange(false);
              }}
              className="h-10 rounded-lg border-slate-200 px-4 text-sm font-semibold text-slate-600 shadow-none hover:bg-slate-50"
            >
              {t("interviews.scheduleForm.skipSchedule")}
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={mutation.isPending || roundBlocked}
            className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {t("interviews.scheduleForm.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatCompanyLocation(location: CompanyLocation) {
  const address = [location.city, location.district, location.address].filter(Boolean).join(" - ");
  return location.name ? `${location.name}${address ? ` - ${address}` : ""}` : address;
}
