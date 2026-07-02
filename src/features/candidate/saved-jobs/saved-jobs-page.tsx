"use client";

import {
  ArrowRight,
  BookmarkSimple,
  Briefcase,
  CalendarBlank,
  CaretRight,
  Coins,
  FilePdf,
  MagnifyingGlass,
  MapPin,
  Monitor,
  Question,
  Sparkle,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getPublicJobs } from "@/features/public/home/api";
import { PublicFooter } from "@/features/public/shared/public-footer";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";

import { useSavedJobsStore } from "./store";

// Local static fallback jobs (matching jobs-page static lists)
const staticJobs = [
  {
    id: "fpt-java-fresher",
    title: "Fresher Java Developer",
    company: "FPT Software",
    logo: "/assets/marketing/home/companies/fpt.png",
    logoColor: "#2563eb",
    verified: true,
    salary: "10 - 15 triệu/tháng",
    location: "Hà Nội",
    mode: "Hybrid",
    level: "Fresher",
    posted: "2 ngày trước",
    tags: ["Java", "Spring Boot", "SQL"],
  },
  {
    id: "vnpay-senior-frontend",
    title: "Senior Frontend Developer (React)",
    company: "VNPAY",
    logo: "/assets/marketing/home/companies/vnpay.png",
    logoColor: "#00b14f",
    verified: true,
    salary: "25 - 40 triệu/tháng",
    location: "TP. Hồ Chí Minh",
    mode: "Onsite",
    level: "Senior",
    posted: "1 ngày trước",
    tags: ["React", "TypeScript", "Tailwind CSS"],
  },
  {
    id: "viettel-devops-engineer",
    title: "DevOps Engineer (Cloud/Kubernetes)",
    company: "Viettel Group",
    logo: "/assets/marketing/home/companies/viettel.png",
    logoColor: "#ef4444",
    verified: true,
    salary: "30 - 50 triệu/tháng",
    location: "Hà Nội",
    mode: "Hybrid",
    level: "Senior",
    posted: "3 ngày trước",
    tags: ["AWS", "Docker", "Kubernetes"],
  },
];

const sortOptions = ["Mới nhất", "Cũ nhất", "Công ty A-Z"] as const;

export function CandidateSavedJobsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<(typeof sortOptions)[number]>("Mới nhất");

  const { savedJobIds, unsaveJob } = useSavedJobsStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: apiJobsData } = useQuery({
    queryKey: ["public-jobs"],
    queryFn: getPublicJobs,
    enabled: mounted,
  });

  // Merge dynamic public API jobs and static fallbacks
  const allJobs = useMemo(() => {
    if (!apiJobsData) return staticJobs;

    const apiMapped = apiJobsData.map((job) => {
      return {
        id: job.id,
        title: job.title,
        company: job.company?.name || "UpNext Partner",
        logo: job.company?.logoUrl || "/assets/marketing/home/companies/fpt.png",
        logoColor: "#059669",
        verified: true,
        salary: job.salaryIsVisible
          ? `${(job.salaryMin || 0) / 1000000} - ${(job.salaryMax || 0) / 1000000} triệu/tháng`
          : "Thỏa thuận",
        location: job.jobPostLocations?.[0]?.jobLocation.city || "Hà Nội",
        mode: job.employmentType?.name || "Full-time",
        level: job.experienceLevel?.name || "Middle",
        posted: "Vừa đăng",
        tags: job.description
          ? [job.jobCategory?.name || "IT", job.experienceLevel?.name || "Middle"]
          : ["Tech"],
      };
    });

    // Merge without duplicates
    const combined = [...apiMapped];
    staticJobs.forEach((sj) => {
      if (!combined.some((item) => item.id === sj.id)) {
        combined.push(sj);
      }
    });

    return combined;
  }, [apiJobsData]);

  // Filter list of saved jobs
  const savedJobs = useMemo(() => {
    if (!mounted) return [];
    return allJobs.filter((job) => savedJobIds.includes(job.id));
  }, [allJobs, savedJobIds, mounted]);

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return savedJobs
      .filter((job) => {
        if (!normalizedQuery) return true;
        return [job.title, job.company, job.location]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .toSorted((a, b) => {
        if (sort === "Công ty A-Z") return a.company.localeCompare(b.company);
        // Fallback simple sorting (just ID order or name)
        return sort === "Mới nhất"
          ? b.title.localeCompare(a.title)
          : a.title.localeCompare(b.title);
      });
  }, [savedJobs, query, sort]);

  if (!mounted) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Breadcrumbs & Title */}
      <div>
        <Breadcrumb
          className="mb-4"
          items={[{ label: "Trang chủ", href: "/" }, { label: "Việc làm đã lưu" }]}
        />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Việc làm đã lưu</h1>
            <p className="mt-2 text-sm text-slate-500">
              Quản lý danh sách các công việc bạn đã quan tâm và lưu lại để ứng tuyển sau.
            </p>
          </div>
          <Button
            asChild
            className="cursor-pointer rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold whitespace-nowrap text-white shadow-sm transition hover:bg-emerald-700"
          >
            <a href="/vi/jobs" className="flex items-center gap-1.5">
              Khám phá thêm việc làm
              <ArrowRight size={14} />
            </a>
          </Button>
        </div>
      </div>

      {/* Main Content & Sidebar Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Job Cards List */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Search Controls */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <MagnifyingGlass
                className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <Input
                id="candidate-saved-jobs-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-11 rounded-xl border-slate-200 bg-white pl-11 text-xs shadow-sm outline-none focus:border-emerald-500"
                placeholder="Tìm kiếm việc làm, công ty..."
              />
            </div>
            <div className="flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Sắp xếp: {sort}
                    <CaretRight size={14} className="rotate-90" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[160px] rounded-xl border-slate-100 bg-white p-1 shadow-md"
                >
                  {sortOptions.map((option) => (
                    <DropdownMenuItem
                      key={option}
                      onClick={() => setSort(option)}
                      className={cn(
                        "cursor-pointer rounded-lg px-3 py-2 text-xs text-slate-700 transition hover:bg-slate-50",
                        sort === option &&
                          "bg-emerald-50 font-bold text-emerald-600 hover:bg-emerald-50",
                      )}
                    >
                      {option}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Jobs List */}
          <section className="flex flex-col gap-4" aria-label="Danh sách việc đã lưu">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  className="group relative flex cursor-pointer flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition duration-200 hover:border-emerald-500 hover:shadow-lg sm:flex-row sm:items-center"
                >
                  {/* Company Logo */}
                  <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
                    <Image
                      src={job.logo}
                      alt={`Logo ${job.company}`}
                      width={40}
                      height={40}
                      className="rounded-lg object-contain"
                    />
                  </div>

                  {/* Job Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="truncate text-base font-bold text-slate-900 transition group-hover:text-emerald-600">
                          {job.title}
                        </h3>
                        <p className="mt-0.5 text-sm font-semibold text-slate-600">{job.company}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          unsaveJob(job.id);
                        }}
                        className="p-1.5 text-emerald-600 transition hover:text-emerald-800"
                        title="Bỏ lưu việc làm này"
                        aria-label="Bỏ lưu"
                      >
                        <BookmarkSimple size={20} weight="fill" />
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Monitor size={14} /> {job.mode}
                      </span>
                      <span className="flex items-center gap-1">
                        <Coins size={14} /> {job.salary}
                      </span>
                    </div>

                    {/* Skill Tags Cloud (pill design matching detail tags) */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {job.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex min-h-[24px] items-center justify-center rounded-full border border-slate-100 bg-slate-50 px-3 text-[11px] font-semibold text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions column on the right */}
                  <div className="mt-3 flex flex-col justify-center border-t border-slate-100 pt-3 sm:mt-0 sm:w-[150px] sm:items-end sm:border-t-0 sm:pt-0">
                    <Button
                      size="sm"
                      className="w-full cursor-pointer rounded-xl bg-emerald-600 text-xs font-bold text-white transition hover:bg-emerald-700 sm:w-auto"
                    >
                      Ứng tuyển
                    </Button>
                    <span className="mt-2.5 text-[10px] text-slate-400">Đăng {job.posted}</span>
                  </div>
                </div>
              ))
            ) : (
              <Card className="rounded-2xl border-dashed border-slate-300 bg-white shadow-none">
                <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
                  <span className="grid size-14 place-items-center rounded-2xl bg-slate-50 text-slate-400">
                    <BookmarkSimple size={26} />
                  </span>
                  <h2 className="mt-4 text-base font-bold text-slate-800">
                    Chưa có việc làm nào được lưu
                  </h2>
                  <p className="mt-2 max-w-sm text-xs leading-6 font-medium text-slate-500">
                    Hãy bấm nút lưu tin (hình Bookmark) tại các trang chi tiết công việc để lưu
                    chúng lại đây.
                  </p>
                  <Button
                    onClick={() => router.push("/jobs")}
                    className="mt-6 cursor-pointer rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    Tìm việc ngay
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <Question size={16} /> Tìm hiểu thêm về quy trình tuyển dụng?{" "}
            <a href="#" className="font-semibold text-emerald-600 hover:underline">
              Trung tâm trợ giúp
            </a>
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          {/* Active resume */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Hồ sơ của bạn</h3>
              <button
                type="button"
                onClick={() => router.push("/candidate/profile")}
                className="flex cursor-pointer items-center gap-0.5 text-xs font-semibold text-emerald-600 hover:underline"
              >
                Xem chi tiết <CaretRight size={12} />
              </button>
            </div>
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xl text-emerald-600">
                <FilePdf size={20} weight="fill" className="text-red-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-800">CV_NguyenQuocVuong.pdf</h4>
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-700 uppercase">
                    Mặc định
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">Cập nhật lần cuối: 10/06/2025</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push("/candidate/cv-builder")}
              className="w-full cursor-pointer rounded-xl border border-emerald-600 py-2.5 text-xs font-bold text-emerald-600 transition hover:bg-emerald-50/40"
            >
              Quản lý hồ sơ
            </button>
          </div>

          {/* Job Search Tips Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
              <Sparkle className="text-amber-500" size={18} weight="fill" />
              Mẹo tìm việc hiệu quả
            </h3>
            <ul className="flex flex-col gap-3 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-600" />
                <span>
                  Nên lưu lại các việc làm phù hợp để nộp đơn hàng loạt giúp tiết kiệm thời gian.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-600" />
                <span>
                  Kiểm tra lại CV mặc định để chắc chắn thông tin liên hệ và kỹ năng đã được cập
                  nhật.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-600" />
                <span>
                  Nộp đơn ứng tuyển sớm trong vòng 3-5 ngày đầu tiên khi tin đăng để nâng cao cơ
                  hội.
                </span>
              </li>
            </ul>
          </div>

          {/* Support CTA card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-2 text-base font-bold text-slate-900">Bạn cần hỗ trợ?</h3>
            <p className="mb-5 text-xs leading-relaxed text-slate-500">
              Đội ngũ tư vấn UpNext luôn sẵn sàng giải đáp thắc mắc và hỗ trợ kết nối nhà tuyển
              dụng.
            </p>
            <button
              type="button"
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Liên hệ chúng tôi
            </button>
          </div>
        </aside>
      </div>

      <PublicFooter navigate={(path) => router.push(path)} />
    </div>
  );
}
