"use client";

import {
  ArrowLeft,
  CheckCircle,
  CircleNotch,
  FileArrowDown,
  Info,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import { authHeaders } from "@/features/recruiter/api/client";
import {
  getApplicationAiScore,
  getApplicationCvUrl,
  type ApplicationAiScoreResponse,
  type EducationLevel,
  type EvaluationRubricCriterion,
  type ScoreCriterionKey,
} from "@/features/recruiter/api/cv-screening-api";
import { updateApplicationStatus } from "@/features/recruiter/api/team";
import { clearRecruiterSession, getRecruiterSession } from "@/features/recruiter/session";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";

type CandidateEvaluationPageProps = Readonly<{
  applicationId: string;
}>;

const SCORE_METRICS = [
  { key: "skills", label: "Kỹ năng", fallbackMaximum: 40 },
  { key: "experience", label: "Kinh nghiệm", fallbackMaximum: 30 },
  { key: "projects", label: "Dự án liên quan", fallbackMaximum: 20 },
  { key: "education", label: "Học vấn", fallbackMaximum: 10 },
] as const;

const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  HIGH_SCHOOL: "THPT",
  VOCATIONAL: "Trung cấp",
  COLLEGE: "Cao đẳng",
  BACHELOR: "Đại học",
  POSTGRADUATE: "Sau đại học",
};

export function CandidateEvaluationPage({ applicationId }: CandidateEvaluationPageProps) {
  const router = useRouter();
  const [detail, setDetail] = useState<ApplicationAiScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCriterion, setSelectedCriterion] = useState<ScoreCriterionKey>("skills");

  useEffect(() => {
    const session = getRecruiterSession();
    if (!session) {
      router.replace("/recruiter/login");
      return;
    }

    let active = true;
    void getApplicationAiScore(applicationId, session.accessToken)
      .then((data) => {
        if (active) setDetail(data);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        if (requestError instanceof ApiError && requestError.status === 401) {
          clearRecruiterSession();
          router.replace("/recruiter/login");
          return;
        }
        if (requestError instanceof ApiError && requestError.status === 404) {
          removeStaleRankingResult(applicationId);
          setError(
            "Ứng viên hoặc kết quả đánh giá này không còn tồn tại. Hãy quay lại và chạy lọc xếp hạng lại.",
          );
          return;
        }
        setError("Không thể tải chi tiết đánh giá. Vui lòng thử lại sau.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [applicationId, router]);

  const evaluationRubric = useMemo(
    () => getCompatibleEvaluationRubric(detail?.evaluationRubric ?? []),
    [detail],
  );

  const metrics = useMemo(() => {
    if (!detail) return [];
    return SCORE_METRICS.map((metric) => {
      const rubric = evaluationRubric.find((criterion) => criterion.key === metric.key);
      return {
        key: metric.key,
        label: metric.label,
        maximum: rubric?.maxScore ?? metric.fallbackMaximum,
        score:
          metric.key === "skills"
            ? detail.skillScore
            : metric.key === "experience"
              ? detail.experienceScore
              : metric.key === "projects"
                ? detail.projectScore
                : detail.educationScore,
      };
    });
  }, [detail, evaluationRubric]);

  const selectedMetric = metrics.find((metric) => metric.key === selectedCriterion);
  const rawSelectedBreakdown = detail?.criteriaBreakdown?.find(
    (criterion) => criterion.key === selectedCriterion,
  );
  const selectedBreakdown =
    rawSelectedBreakdown && (selectedCriterion === "education" || selectedCriterion === "projects")
      ? {
          ...rawSelectedBreakdown,
          items: rawSelectedBreakdown.items.filter((item) =>
            selectedCriterion === "education"
              ? item.key === "education-level-match"
              : ["project-relevance", "technical-depth", "impact-evidence"].includes(item.key),
          ),
        }
      : rawSelectedBreakdown;
  const selectedRubric = evaluationRubric.find((criterion) => criterion.key === selectedCriterion);

  function returnToScreeningResults() {
    sessionStorage.setItem("upnext_activeTab", "cv-ranking");
    router.push("/recruiter/candidates?tab=cv-ranking");
  }

  async function handleStatusChange(nextStatus: "REJECTED" | "INTERVIEWING") {
    const session = getRecruiterSession();
    if (!session) {
      router.replace("/recruiter/login");
      return;
    }

    setSaving(true);
    try {
      await updateApplicationStatus(applicationId, nextStatus, session.accessToken);
      setDetail((prev) => (prev ? { ...prev, status: nextStatus } : prev));
      await Swal.fire({
        icon: "success",
        title: nextStatus === "REJECTED" ? "Đã từ chối ứng viên" : "Đã mời phỏng vấn",
        timer: 1500,
        showConfirmButton: false,
      });
      returnToScreeningResults();
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        clearRecruiterSession();
        router.replace("/recruiter/login");
        return;
      }
      void Swal.fire({
        icon: "error",
        title: "Không thể cập nhật ứng viên",
        text: requestError instanceof Error ? requestError.message : "Vui lòng thử lại sau.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleViewCv() {
    if (!detail) return;
    if (detail.cvFileUrl && !detail.cvFileUrl.includes("/applications/")) {
      window.open(detail.cvFileUrl, "_blank", "noopener,noreferrer");
      return;
    }

    const session = getRecruiterSession();
    if (!session) {
      router.replace("/recruiter/login");
      return;
    }

    try {
      const response = await fetch(getApplicationCvUrl(applicationId), {
        headers: authHeaders(session.accessToken),
      });
      if (!response.ok) throw new Error("Không thể tải file CV.");
      const localUrl = URL.createObjectURL(await response.blob());
      window.open(localUrl, "_blank", "noopener,noreferrer");
    } catch (requestError) {
      void Swal.fire({
        icon: "error",
        title: "Không thể mở CV",
        text: requestError instanceof Error ? requestError.message : "Vui lòng thử lại sau.",
      });
    }
  }

  if (loading) {
    return (
      <output className="grid min-h-[420px] place-items-center" aria-live="polite">
        <span className="flex flex-col items-center gap-3 text-sm font-medium text-slate-600">
          <CircleNotch className="size-8 animate-spin text-emerald-600" aria-hidden="true" />
          Đang tải đánh giá chi tiết...
        </span>
      </output>
    );
  }

  if (error || !detail) {
    return (
      <Card className="mx-auto max-w-2xl border-slate-200 shadow-none">
        <CardContent className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
          <span className="mb-4 grid size-14 place-items-center rounded-full bg-amber-50 text-amber-600">
            <WarningCircle size={28} aria-hidden="true" />
          </span>
          <h1 className="text-xl font-semibold text-slate-950">Không tìm thấy đánh giá</h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{error}</p>
          <Button className="mt-6" onClick={returnToScreeningResults}>
            <ArrowLeft aria-hidden="true" />
            Quay lại kết quả AI lọc CV
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 rounded-xl border-slate-200"
            aria-label="Quay lại kết quả AI lọc CV"
            onClick={returnToScreeningResults}
          >
            <ArrowLeft aria-hidden="true" />
          </Button>
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">
              Đánh giá ứng viên
            </p>
            <h1 className="mt-1 truncate text-2xl font-semibold text-slate-950">
              {detail.candidateName}
            </h1>
            <p className="mt-1 truncate text-sm text-slate-500">{detail.jobTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-auto">
          <RubricPopover rubric={evaluationRubric} />
          <Badge
            tone="neutral"
            className={cn(
              "rounded-xl border px-4 py-2.5 text-base font-semibold tabular-nums",
              getScoreColorClass(detail.finalScore),
            )}
          >
            {detail.finalScore}% phù hợp
          </Badge>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="min-w-0 space-y-6" aria-label="Nội dung đánh giá">
          <Card className="border-slate-200 shadow-none">
            <CardContent className="p-5 sm:p-6">
              <h2 className="text-base font-semibold text-slate-950">Tổng quan đánh giá</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{detail.summary}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-none">
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-base font-semibold text-slate-950">Chi tiết điểm</h2>
                <span className="text-xs text-slate-500">Tổng trọng số 100 điểm</span>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {metrics.map((metric) => {
                  const selected = selectedCriterion === metric.key;
                  const percentage = Math.round((metric.score / metric.maximum) * 100);
                  return (
                    <button
                      key={metric.key}
                      type="button"
                      className={cn(
                        "upnext-focus rounded-xl border p-4 text-left transition-colors",
                        selected
                          ? "border-emerald-400 bg-emerald-50/60"
                          : "border-slate-200 bg-white hover:border-slate-300",
                      )}
                      aria-pressed={selected}
                      aria-controls="criterion-explanation"
                      onClick={() => setSelectedCriterion(metric.key)}
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-medium text-slate-500">{metric.label}</span>
                        <span className="text-sm font-semibold text-slate-900 tabular-nums">
                          {metric.score}
                          <span className="font-normal text-slate-400">/{metric.maximum}</span>
                        </span>
                      </span>
                      <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <span
                          className={cn(
                            "block h-full rounded-full",
                            getProgressBarColor(percentage),
                          )}
                          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                        />
                      </span>
                      <span
                        className={cn(
                          "mt-3 block text-[11px] font-medium",
                          selected ? "text-emerald-700" : "text-slate-400",
                        )}
                      >
                        {selected ? "Đang xem lý do" : "Xem lý do chấm điểm"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <CriterionExplanation
                metric={selectedMetric}
                breakdown={selectedBreakdown}
                rubric={selectedRubric}
              />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <ListCard title="Kỹ năng phù hợp" items={detail.matchedSkills} tone="success" />
            <ListCard title="Kỹ năng cần bổ sung" items={detail.missingSkills} tone="neutral" />
            <TextListCard title="Điểm mạnh" items={detail.strengths} tone="success" />
            <TextListCard title="Điểm cần lưu ý" items={detail.weaknesses} tone="warning" />
          </div>

          <Card className="border-indigo-100 bg-indigo-50/60 shadow-none">
            <CardContent className="p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-indigo-900">Khuyến nghị</h2>
              <p className="mt-2 text-sm leading-7 text-slate-700">{detail.recommendation}</p>
            </CardContent>
          </Card>
        </section>

        <aside
          className="space-y-3 xl:sticky xl:top-4 xl:self-start"
          aria-label="Thao tác ứng viên"
        >
          <Card className="border-slate-200 shadow-none">
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="text-xs font-medium text-slate-500">Tổng điểm đánh giá</p>
                <p className="mt-1 text-3xl font-semibold text-slate-950 tabular-nums">
                  {detail.finalScore}
                  <span className="text-base font-normal text-slate-400">/100</span>
                </p>
              </div>
              <Separator />
              <Button variant="outline" className="w-full justify-start" onClick={handleViewCv}>
                <FileArrowDown aria-hidden="true" />
                Xem CV
              </Button>
              {(() => {
                const currentStatus = detail.status;
                const isInterviewing = currentStatus === "INTERVIEWING";
                const isRejected = currentStatus === "REJECTED";
                const isFinalized =
                  currentStatus === "HIRED" ||
                  currentStatus === "WITHDRAWN" ||
                  currentStatus === "OFFERED";

                const canReject = !isRejected && !isFinalized && !saving;
                const canInvite = !isInterviewing && !isRejected && !isFinalized && !saving;

                return (
                  <>
                    <Button
                      variant="destructive"
                      className="w-full justify-start"
                      disabled={!canReject}
                      onClick={() => void handleStatusChange("REJECTED")}
                    >
                      <XCircle aria-hidden="true" />
                      {isRejected ? "Đã từ chối" : "Từ chối"}
                    </Button>
                    <Button
                      className="w-full justify-start"
                      disabled={!canInvite}
                      onClick={() => void handleStatusChange("INTERVIEWING")}
                    >
                      <CheckCircle aria-hidden="true" />
                      {isInterviewing
                        ? "Đã mời phỏng vấn"
                        : isFinalized
                          ? "Đã hoàn tất xử lý"
                          : "Mời phỏng vấn"}
                    </Button>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function RubricPopover({ rubric }: { rubric: EvaluationRubricCriterion[] }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="upnext-focus inline-flex size-11 cursor-pointer items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100"
          aria-label="Xem toàn bộ tiêu chí đánh giá"
        >
          <Info size={21} aria-hidden="true" />
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        closeLabel="Đóng tiêu chí đánh giá"
        className="evaluation-rubric-drawer flex h-dvh w-full flex-col gap-0 overflow-hidden border-l border-slate-200 bg-white p-0 sm:max-w-[680px]"
      >
        <SheetHeader className="shrink-0 border-b border-slate-200 px-5 py-5 pr-14 sm:px-7 sm:py-6 sm:pr-16">
          <SheetTitle className="text-xl font-semibold text-slate-950">
            Toàn bộ tiêu chí đánh giá
          </SheetTitle>
          <SheetDescription className="text-sm leading-6 text-slate-500">
            Tổng 100 điểm. Không có bằng chứng trong CV thì không cộng điểm.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-7">
          <div className="space-y-8">
            {rubric.map((criterion) => (
              <section key={criterion.key} aria-labelledby={`rubric-${criterion.key}`}>
                <div className="mb-3 flex items-center justify-between gap-4">
                  <h3
                    id={`rubric-${criterion.key}`}
                    className="text-base font-semibold text-slate-950"
                  >
                    {criterion.label}
                  </h3>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 tabular-nums">
                    {criterion.maxScore} điểm
                  </span>
                </div>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {criterion.criteria.map((item) => (
                    <li
                      key={item.key}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-sm leading-5 font-semibold text-slate-900">
                          {item.label}
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-emerald-700 tabular-nums">
                          Tối đa {item.maxScore} điểm
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-500">{item.description}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CriterionExplanation({
  metric,
  breakdown,
  rubric,
}: {
  metric: { key: ScoreCriterionKey; label: string; maximum: number; score: number } | undefined;
  breakdown: ApplicationAiScoreResponse["criteriaBreakdown"][number] | undefined;
  rubric: ApplicationAiScoreResponse["evaluationRubric"][number] | undefined;
}) {
  if (!metric || !breakdown) {
    return (
      <div
        id="criterion-explanation"
        className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
      >
        Kết quả này được tạo bằng phiên bản chấm điểm cũ. Hãy chạy lọc xếp hạng lại để xem lý do chi
        tiết.
      </div>
    );
  }

  if (metric.key === "education" && breakdown.items.length === 0) {
    return (
      <div
        id="criterion-explanation"
        className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800"
      >
        Kết quả học vấn này dùng phiên bản chấm điểm cũ. Hãy chạy lọc xếp hạng lại để đối chiếu
        trình độ học vấn theo tiêu chí mới.
      </div>
    );
  }

  return (
    <section
      id="criterion-explanation"
      className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5"
      aria-live="polite"
    >
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">
            Vì sao {metric.label.toLocaleLowerCase("vi")} được {metric.score}/{metric.maximum} điểm?
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">{breakdown.summary}</p>
        </div>
        <Badge tone="neutral" className="w-fit shrink-0 rounded-md tabular-nums">
          Trừ {roundScore(Math.max(0, metric.maximum - metric.score))} điểm
        </Badge>
      </div>

      <div className="space-y-3">
        {breakdown.items.map((item) => {
          const rubricItem = rubric?.criteria.find((criterion) => criterion.key === item.key);
          const maximum = rubricItem?.maxScore ?? item.awardedScore;
          const deduction = roundScore(Math.max(0, maximum - item.awardedScore));
          return (
            <article key={item.key} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    {rubricItem?.label ?? item.key}
                  </h4>
                  <span className="mt-1 block text-xs text-slate-500 tabular-nums">
                    Đạt {item.awardedScore}/{maximum} điểm
                  </span>
                  {item.key === "impact-evidence" && rubricItem?.description ? (
                    <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">
                      {rubricItem.description}
                    </p>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "rounded-md border px-2 py-1 text-xs font-semibold tabular-nums",
                    deduction > 0
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700",
                  )}
                >
                  {deduction > 0 ? `-${deduction} điểm` : "Không bị trừ"}
                </span>
              </div>
              {item.key === "education-level-match" ? (
                <dl className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Yêu cầu tin tuyển dụng</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900">
                      {getEducationLevelLabel(item.requiredEducationLevel, "Không yêu cầu")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Trình độ ứng viên</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900">
                      {getEducationLevelLabel(item.candidateEducationLevel, "Không xác định")}
                    </dd>
                  </div>
                </dl>
              ) : null}
              <p className="mt-3 text-sm leading-6 text-slate-700">
                <strong className="font-semibold text-slate-900">Lý do: </strong>
                {item.reason}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                <strong className="font-semibold text-slate-700">Bằng chứng CV: </strong>
                {item.evidence ?? "Không có thông tin học vấn trong hồ sơ."}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ListCard({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "success" | "neutral";
}) {
  return (
    <Card className="border-slate-200 shadow-none">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <span className="text-xs text-slate-500 tabular-nums">{items.length}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.length > 0 ? (
            items.map((item) => (
              <Badge key={item} tone={tone}>
                {item}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-slate-500">Chưa ghi nhận</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TextListCard({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "success" | "warning";
}) {
  return (
    <Card className="border-slate-200 shadow-none">
      <CardContent className="p-5">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <ul className="mt-4 space-y-2.5">
          {items.length > 0 ? (
            items.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-6 text-slate-600">
                <span
                  className={cn(
                    "mt-2 size-1.5 shrink-0 rounded-full",
                    tone === "success" ? "bg-emerald-500" : "bg-amber-500",
                  )}
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))
          ) : (
            <li className="text-sm text-slate-500">Chưa ghi nhận</li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

function getScoreColorClass(score: number) {
  if (score >= 85) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (score >= 70) return "border-blue-200 bg-blue-50 text-blue-700";
  if (score >= 50) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-rose-200 bg-rose-50 text-rose-700";
}

function getProgressBarColor(score: number) {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-blue-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-rose-500";
}

function roundScore(score: number) {
  return Math.round(score * 100) / 100;
}

function getCompatibleEvaluationRubric(
  rubric: EvaluationRubricCriterion[],
): EvaluationRubricCriterion[] {
  return rubric.map((criterion) =>
    criterion.key === "education" || criterion.key === "projects"
      ? {
          ...criterion,
          criteria: criterion.criteria.filter((item) =>
            criterion.key === "education"
              ? item.key === "education-level-match"
              : ["project-relevance", "technical-depth", "impact-evidence"].includes(item.key),
          ),
        }
      : criterion,
  );
}

function getEducationLevelLabel(level: EducationLevel | null | undefined, fallback: string) {
  return level ? EDUCATION_LEVEL_LABELS[level] : fallback;
}

function removeStaleRankingResult(applicationId: string) {
  const rawResults = sessionStorage.getItem("upnext_rankingResults");
  if (!rawResults) return;
  try {
    const results = JSON.parse(rawResults) as Array<{ applicationId?: string }>;
    const nextResults = results.filter((result) => result.applicationId !== applicationId);
    if (nextResults.length > 0) {
      sessionStorage.setItem("upnext_rankingResults", JSON.stringify(nextResults));
    } else {
      sessionStorage.removeItem("upnext_rankingResults");
      sessionStorage.setItem("upnext_rankingHasFiltered", "false");
    }
  } catch {
    sessionStorage.removeItem("upnext_rankingResults");
  }
}
