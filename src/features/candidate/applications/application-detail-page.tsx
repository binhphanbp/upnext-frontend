"use client";

import {
  ArrowLeft,
  Briefcase,
  CalendarBlank,
  Check,
  CheckCircle,
  Clock,
  FilePdf,
  HourglassMedium,
  MapPin,
  Monitor,
  PaperPlaneTilt,
  Prohibit,
  Star,
  UsersThree,
  UserCircle,
  VideoCamera,
} from "@phosphor-icons/react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

import { applications, statusStyles, type Application } from "./applications-data";

type CandidateApplicationDetailPageProps = Readonly<{
  applicationId: string;
}>;

const statusIconMap = {
  reviewing: HourglassMedium,
  interview: UsersThree,
  offer: Star,
  rejected: Prohibit,
} as const;

export function CandidateApplicationDetailPage({
  applicationId,
}: CandidateApplicationDetailPageProps) {
  const application = applications.find((item) => item.id === applicationId);

  if (!application) {
    return (
      <Card className="rounded-2xl border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <CardContent className="p-6">
          <h1 className="text-xl font-extrabold text-slate-950">Không tìm thấy ứng tuyển</h1>
          <p className="mt-2 text-sm font-medium text-slate-600">
            Hồ sơ ứng tuyển này không tồn tại hoặc đã bị xoá.
          </p>
          <Button asChild className="bg-brand mt-5 rounded-lg font-extrabold shadow-none">
            <Link href="/candidate/applications">Quay lại danh sách</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const style = statusStyles[application.status];
  const StatusIcon = statusIconMap[application.status];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button
          asChild
          variant="ghost"
          className="h-10 w-fit rounded-lg px-0 font-extrabold text-slate-600 hover:bg-transparent hover:text-slate-950"
        >
          <Link href="/candidate/applications">
            <ArrowLeft size={18} />
            Quay lại danh sách
          </Link>
        </Button>
        <Button
          variant="outline"
          className="border-brand text-brand h-11 w-fit rounded-lg bg-white px-5 font-extrabold shadow-none hover:bg-emerald-50 hover:text-emerald-700"
        >
          <PaperPlaneTilt size={18} />
          Gửi tin nhắn cho nhà tuyển dụng
        </Button>
      </div>

      <ApplicationHero application={application} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="space-y-5">
          <Card className="rounded-2xl border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <CardHeader className="flex-row items-center gap-3 space-y-0 p-5 pb-3">
              <span className="text-brand grid size-10 place-items-center rounded-xl bg-emerald-50">
                <Clock size={21} />
              </span>
              <CardTitle className="text-lg">Tiến trình ứng tuyển</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <ol className="space-y-0">
                {application.timeline.map((item, index) => (
                  <li
                    key={`${item.title}-${item.date}`}
                    className="grid grid-cols-[32px_1fr] gap-4"
                  >
                    <div className="relative flex justify-center">
                      <span
                        className={cn(
                          "z-10 mt-1 grid size-5 place-items-center rounded-full border bg-white",
                          item.done
                            ? "border-emerald-200 text-emerald-700"
                            : "border-slate-300 text-slate-400",
                        )}
                      >
                        {item.done ? <Check size={12} weight="bold" /> : null}
                      </span>
                      {index < application.timeline.length - 1 ? (
                        <span className="absolute top-7 bottom-0 w-px bg-slate-200" />
                      ) : null}
                    </div>
                    <div className="pb-6">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <h2 className="font-extrabold text-slate-950">{item.title}</h2>
                        <span className="text-sm font-bold text-slate-500">{item.date}</span>
                      </div>
                      <p className="mt-1 text-sm leading-6 font-medium text-slate-600">
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <CardHeader className="flex-row items-center gap-3 space-y-0 p-5 pb-3">
              <span className="text-brand grid size-10 place-items-center rounded-xl bg-emerald-50">
                <FilePdf size={21} />
              </span>
              <CardTitle className="text-lg">Hồ sơ đã gửi</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 p-5 pt-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <span className="grid size-12 place-items-center rounded-lg bg-white text-red-500 ring-1 ring-slate-200">
                  <FilePdf size={23} weight="fill" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-extrabold text-slate-950">{application.resume}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    CV Backend · Cập nhật 10/06/2025 · 356 KB
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-slate-200 bg-white font-extrabold shadow-none hover:bg-slate-50 hover:text-slate-950"
              >
                Xem CV
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <CardHeader className="flex-row items-center gap-3 space-y-0 p-5 pb-3">
              <span className="text-brand grid size-10 place-items-center rounded-xl bg-emerald-50">
                <CheckCircle size={21} />
              </span>
              <CardTitle className="text-lg">Ghi chú trạng thái</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <p className="text-sm leading-7 font-medium text-slate-600">{application.note}</p>
            </CardContent>
          </Card>
        </main>

        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <Card className="rounded-2xl border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <CardContent className="p-5">
              <h2 className="text-base font-extrabold text-slate-950">Bước tiếp theo</h2>
              <span
                className={cn(
                  "mt-4 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-extrabold ring-1",
                  style.badge,
                )}
              >
                <StatusIcon size={17} weight="bold" />
                {application.statusTitle}
              </span>
              <p className="mt-4 text-sm leading-6 font-medium text-slate-600">
                {application.nextStep ?? application.statusDescription}
              </p>
              <Button className="bg-brand mt-5 h-11 w-full rounded-lg font-extrabold shadow-none hover:bg-emerald-700">
                {application.status === "interview" ? "Chuẩn bị phỏng vấn" : "Cập nhật hồ sơ"}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <CardContent className="p-5">
              <h2 className="text-base font-extrabold text-slate-950">Thông tin ứng tuyển</h2>
              <dl className="mt-4 space-y-4 text-sm">
                <InfoRow
                  label="Ngày ứng tuyển"
                  value={application.appliedAt}
                  icon={CalendarBlank}
                />
                <InfoRow
                  label="Recruiter"
                  value={application.recruiter ?? "Hiring Team"}
                  icon={UserCircle}
                />
                <InfoRow
                  label="Mức lương"
                  value={application.salary ?? "Chưa công bố"}
                  icon={Briefcase}
                />
                <InfoRow
                  label="Độ khớp hồ sơ"
                  value={`${application.matchScore}%`}
                  icon={CheckCircle}
                />
              </dl>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <CardContent className="p-5">
              <h2 className="text-base font-extrabold text-slate-950">Thông tin công ty</h2>
              <div className="mt-4 flex items-center gap-4">
                <CompanyLogo application={application} />
                <div>
                  <p className="font-extrabold text-slate-950">{application.company}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {application.location}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-brand text-brand mt-5 h-11 w-full rounded-lg bg-white font-extrabold shadow-none hover:bg-emerald-50 hover:text-emerald-700"
              >
                Xem công ty
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ApplicationHero({ application }: Readonly<{ application: Application }>) {
  const style = statusStyles[application.status];
  const StatusIcon = statusIconMap[application.status];

  return (
    <Card className="rounded-2xl border-slate-200/80 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]">
      <CardContent className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[92px_minmax(0,1fr)_280px] lg:items-center">
        <CompanyLogo application={application} />
        <div className="min-w-0">
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-extrabold ring-1",
              style.badge,
            )}
          >
            <StatusIcon size={17} weight="bold" />
            {application.statusTitle}
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
            {application.role}
          </h1>
          <p className="mt-2 text-base font-bold text-slate-700">{application.company}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={17} />
              {application.location}
            </span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Monitor size={17} />
              {application.workMode}
            </span>
            {application.interviewAt ? (
              <>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <VideoCamera size={17} />
                  {application.interviewAt}
                </span>
              </>
            ) : null}
          </div>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
          <p className="text-sm font-bold text-slate-600">Độ khớp hồ sơ</p>
          <div className="mt-3 flex items-center gap-4">
            <div
              className="grid size-20 place-items-center rounded-full"
              style={{
                background: `conic-gradient(var(--brand) ${application.matchScore}%, #e2e8f0 0)`,
              }}
            >
              <div className="grid size-14 place-items-center rounded-full bg-white">
                <span className="text-brand text-base font-extrabold">
                  {application.matchScore}%
                </span>
              </div>
            </div>
            <p className="text-sm leading-6 font-semibold text-slate-600">
              Hồ sơ phù hợp với yêu cầu chính của vị trí này.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CompanyLogo({ application }: Readonly<{ application: Application }>) {
  return (
    <div
      className={cn(
        "grid size-20 place-items-center rounded-xl border border-slate-200 bg-white text-lg font-black shadow-sm",
        application.companyTone === "blue" && "text-blue-700",
        application.companyTone === "orange" && "text-orange-600",
        application.companyTone === "green" && "text-emerald-700",
        application.companyTone === "neutral" && "text-slate-950",
      )}
    >
      {application.companyMark}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: Readonly<{
  icon: typeof CalendarBlank;
  label: string;
  value: string;
}>) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="flex items-center gap-2 font-semibold text-slate-500">
        <Icon size={17} />
        {label}
      </dt>
      <dd className="text-right font-extrabold text-slate-950">{value}</dd>
    </div>
  );
}
