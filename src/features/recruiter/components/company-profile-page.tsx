"use client";

import { useState } from "react";

import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  FileWarning,
  Globe2,
  Info,
  Link2,
  MapPin,
  MessageCircle,
  NotePencil,
  ShieldCheck,
  Star,
  UsersRound,
  WarningCircle,
  Plus,
  X,
  LockKey,
} from "@/features/recruiter/icons";
import { cn } from "@/shared/lib/cn";

export function CompanyProfilePage() {
  const [activeTab, setActiveTab] = useState("Tổng quan");
  const tabs = ["Tổng quan", "Hồ sơ công ty", "Xác thực", "Uy tín tuyển dụng", "Cài đặt hiển thị"];

  // Checklist for completeness
  const [completedItems, setCompletedItems] = useState({
    cover: false,
    benefits: true,
    email: false,
    culture: true,
  });

  // Calculate dynamic completeness score
  // Base is 78%, each item checked adds 5.5% (max 100%)
  const checkedCount = Object.values(completedItems).filter(Boolean).length;
  const completenessScore = 78 + (checkedCount - 2) * 11; // If 2 checked -> 78%, 3 -> 89%, 4 -> 100%, 1 -> 67%, 0 -> 56%
  const finalCompleteness = Math.min(100, Math.max(0, completenessScore));
  const missingCount = Object.values(completedItems).filter((v) => !v).length;

  // Company details state
  const [companyDetails, setCompanyDetails] = useState({
    name: "UpNext Studio",
    industry: "Công nghệ thông tin",
    size: "50 - 100 nhân sự",
    location: "Hà Nội, Việt Nam",
    website: "upnext.vn",
    description:
      "UpNext Studio là đơn vị đi đầu trong lĩnh vực cung cấp các giải pháp công nghệ tuyển dụng chuyên nghiệp, xây dựng cầu nối tin cậy giữa doanh nghiệp và nhân tài công nghệ toàn cầu.",
  });

  // Benefits state
  const [benefits, setBenefits] = useState([
    "Lương tháng 13",
    "Thưởng hiệu suất",
    "Làm việc hybrid",
    "Đào tạo nội bộ",
    "Bảo hiểm cao cấp",
    "Du lịch hàng năm",
  ]);
  const [newBenefit, setNewBenefit] = useState("");

  // Office images state
  const [officePhotos, setOfficePhotos] = useState([
    { id: 1, path: "/assets/company-profile/office1.png", label: "Không gian làm việc chung" },
    { id: 2, path: "/assets/company-profile/office2.png", label: "Phòng họp sáng tạo" },
    { id: 3, path: "/assets/company-profile/office3.png", label: "Khu vực Pantry & Giải trí" },
  ]);

  // Display settings state
  const [displaySettings, setDisplaySettings] = useState({
    showSize: true,
    showAddress: true,
    showEmail: false,
    allowCandidateReviews: true,
    emailNotifications: true,
  });

  // Save profile success state
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleToggleChecklist = (key: "cover" | "benefits" | "email" | "culture") => {
    setCompletedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleAddBenefit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBenefit.trim() && !benefits.includes(newBenefit.trim())) {
      setBenefits((prev) => [...prev, newBenefit.trim()]);
      setNewBenefit("");
    }
  };

  const handleRemoveBenefit = (benefitToRemove: string) => {
    setBenefits((prev) => prev.filter((b) => b !== benefitToRemove));
  };

  const handleSaveProfile = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-[26px] font-extrabold tracking-tight text-slate-900">
            Hồ sơ & uy tín
            <ShieldCheck className="h-6 w-6 fill-emerald-50 text-emerald-600" />
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Quản lý thông tin doanh nghiệp, xác thực hồ sơ và theo dõi điểm uy tín tuyển dụng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition hover:bg-slate-50 hover:text-slate-900"
            type="button"
            onClick={() => setActiveTab("Tổng quan")}
          >
            <Eye className="h-4.5 w-4.5 text-slate-500" />
            Xem hồ sơ công khai
          </button>
          <button
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(5,150,105,0.2)] transition hover:bg-emerald-700"
            type="button"
            onClick={() => setActiveTab("Hồ sơ công ty")}
          >
            <NotePencil className="h-4.5 w-4.5" />
            Cập nhật hồ sơ
          </button>
        </div>
      </div>

      {/* Top 5 KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* KPI 1: Điểm uy tín */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">Điểm uy tín</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-950">
                86<span className="text-xs font-bold text-slate-400">/100</span>
              </p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Star className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-extrabold text-emerald-700">
              Uy tín tốt
            </span>
            <div className="flex items-center">
              {/* Sparkline Graph */}
              <svg viewBox="0 0 60 20" className="h-6 w-16 overflow-visible">
                <path
                  d="M 2,15 Q 15,3 30,12 T 58,5"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="58" cy="5" r="2" fill="#10b981" />
              </svg>
            </div>
          </div>
        </div>

        {/* KPI 2: Hồ sơ hoàn thiện */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">Hồ sơ hoàn thiện</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-950">{finalCompleteness}%</p>
            </div>
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                finalCompleteness === 100
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-orange-50 text-orange-600",
              )}
            >
              <Building2 className="h-5 w-5" />
            </span>
          </div>
          <p
            className={cn(
              "mt-4 text-[11px] font-bold transition-colors",
              finalCompleteness === 100 ? "text-emerald-600" : "text-orange-600",
            )}
          >
            {finalCompleteness === 100
              ? "Hồ sơ đã hoàn thiện 100%"
              : `Còn ${missingCount} mục cần bổ sung`}
          </p>
        </div>

        {/* KPI 3: Trạng thái xác thực */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">Trạng thái xác thực</p>
              <p className="mt-2 text-2xl font-extrabold text-emerald-600">Đã xác thực</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-4 text-[11px] font-bold text-slate-500">Xác thực ngày 12/12/2024</p>
        </div>

        {/* KPI 4: Tỷ lệ phản hồi */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">Tỷ lệ phản hồi</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-950">92%</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <MessageCircle className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-4 text-[11px] font-bold text-slate-500">Phản hồi trong 48h</p>
        </div>

        {/* KPI 5: Đánh giá trung bình (Replaced warning KPI) */}
        <div className="flex flex-col justify-between rounded-2xl border border-amber-100 bg-amber-50/20 p-5 shadow-[0_12px_30px_rgba(245,158,11,0.02)] transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-amber-800">Đánh giá trung bình</p>
              <p className="mt-2 text-2xl font-extrabold text-amber-700">4.8/5</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
            </span>
          </div>
          <button
            className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 transition hover:underline"
            type="button"
            onClick={() => setActiveTab("Tổng quan")}
          >
            Đánh giá rất tốt (24 đánh giá)
          </button>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="mb-6 flex scrollbar-none gap-8 overflow-x-auto border-b border-slate-200/80">
        {tabs.map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              className={cn(
                "pb-3 text-sm font-bold border-b-2 transition duration-200 whitespace-nowrap",
                active
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-slate-500 hover:text-slate-800",
              )}
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === "Tổng quan" ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left + Middle Column (Main Content Area) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Reputation breakdown & company profile preview row */}
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Section 1: Large Reputation Score Card */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                    Điểm uy tín doanh nghiệp
                    <Info className="h-4 w-4 text-slate-400" />
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Được tính toán tự động dựa trên độ hoàn thiện của hồ sơ và các chỉ số hoạt động.
                  </p>

                  {/* Circular & Label */}
                  <div className="mt-6 flex flex-col items-center gap-5 sm:flex-row">
                    <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
                      <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                        <circle
                          className="text-slate-100"
                          cx="50"
                          cy="50"
                          fill="transparent"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                        />
                        <circle
                          className="text-emerald-500 transition-all duration-1000 ease-out"
                          cx="50"
                          cy="50"
                          fill="transparent"
                          r="40"
                          stroke="currentColor"
                          strokeDasharray={251.2}
                          strokeDashoffset={251.2 - (251.2 * 86) / 100}
                          strokeLinecap="round"
                          strokeWidth="8"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-2xl font-extrabold text-slate-950">86</span>
                        <span className="-mt-0.5 block text-[10px] font-bold text-slate-400">
                          /100
                        </span>
                      </div>
                    </div>

                    <div className="min-w-0 text-center sm:text-left">
                      <span className="inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-700 shadow-sm">
                        Uy tín tốt
                      </span>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">
                        Hồ sơ của bạn được đánh giá tích cực bởi hệ thống UpNext.
                      </p>
                    </div>
                  </div>

                  {/* Breakdown list */}
                  <div className="mt-6 space-y-3.5">
                    {/* Item 1 */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-slate-400" />
                          Xác thực doanh nghiệp
                        </span>
                        <span>30/30</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: "100%" }}
                        />
                      </div>
                    </div>

                    {/* Item 2 */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          Hoàn thiện hồ sơ
                        </span>
                        <span>
                          {finalCompleteness === 100 ? "20/20" : `${16 + (checkedCount - 2)}/20`}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${finalCompleteness}%` }}
                        />
                      </div>
                    </div>

                    {/* Item 3 */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-slate-400" />
                          Tỷ lệ phản hồi
                        </span>
                        <span>22/25</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: "88%" }}
                        />
                      </div>
                    </div>

                    {/* Item 4 */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-slate-400" />
                          Chất lượng tin đăng
                        </span>
                        <span>12/15</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: "80%" }}
                        />
                      </div>
                    </div>

                    {/* Item 5: Replaced Vi phạm/Báo cáo with Tuân thủ quy định */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-slate-400" />
                          Tuân thủ quy định
                        </span>
                        <span>9/10</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: "90%" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  className="mt-6 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-emerald-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/50"
                  type="button"
                  onClick={() => setActiveTab("Uy tín tuyển dụng")}
                >
                  Xem cách cải thiện điểm <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Section 2: Public Company Profile Preview */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Xem trước hồ sơ công khai
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Cách mà ứng viên nhìn thấy công ty của bạn trên trang tìm kiếm việc làm UpNext.
                  </p>

                  <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 shadow-sm">
                    {/* Cover Photo */}
                    <div className="relative h-24 w-full overflow-hidden bg-slate-200 shadow-inner">
                      {completedItems.cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src="/assets/company-profile/cover.png"
                          alt="Cover Banner"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-emerald-400 to-teal-500">
                          <p className="text-[10px] font-bold text-white opacity-80">
                            Chưa tải ảnh bìa riêng
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Logo & Info Panel */}
                    <div className="relative px-4 pt-10 pb-4">
                      {/* Logo square */}
                      <div className="absolute -top-8 left-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white p-0.5 shadow-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/assets/company-profile/logo.png"
                          alt="Logo"
                          className="h-full w-full rounded-lg object-contain"
                        />
                      </div>

                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">
                          {companyDetails.name}
                        </h3>
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                          <BriefcaseBusiness className="h-3.5 w-3.5 text-slate-400" />
                          {companyDetails.industry}
                        </p>

                        <div className="mt-3 grid grid-cols-2 gap-y-1.5 text-[10px] font-bold text-slate-600">
                          <span className="flex items-center gap-1">
                            <UsersRound className="h-3.5 w-3.5 text-slate-400" />
                            {companyDetails.size}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {companyDetails.location}
                          </span>
                          <span className="col-span-2 flex items-center gap-1">
                            <Globe2 className="h-3.5 w-3.5 text-slate-400" />
                            {companyDetails.website}
                          </span>
                        </div>

                        {/* Benefit Chips */}
                        <div className="mt-4 flex flex-wrap gap-1">
                          {benefits.slice(0, 4).map((b) => (
                            <span
                              key={b}
                              className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700"
                            >
                              {b}
                            </span>
                          ))}
                          {benefits.length > 4 && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-700">
                              +{benefits.length - 4} phúc lợi khác
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  className="mt-6 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-emerald-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/50"
                  type="button"
                  onClick={() => setActiveTab("Hồ sơ công ty")}
                >
                  Xem hồ sơ công khai <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Lower section grid: Đánh giá ứng viên, Trải nghiệm, Chất lượng */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Card 1: Replaced Cảnh báo with Đánh giá từ ứng viên & nhân viên */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                    <Star className="h-4.5 w-4.5 fill-amber-400 text-amber-400" />
                    Đánh giá từ ứng viên
                  </h2>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Phản hồi mới nhất về môi trường và quy trình phỏng vấn của công ty.
                  </p>

                  <div className="mt-4 space-y-3">
                    <div className="flex flex-col gap-1.5 rounded-xl border border-slate-100 bg-slate-50/40 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-900">
                          Senior React Dev
                        </span>
                        <div className="flex text-amber-400">
                          <Star className="h-3 w-3 fill-current" />
                          <Star className="h-3 w-3 fill-current" />
                          <Star className="h-3 w-3 fill-current" />
                          <Star className="h-3 w-3 fill-current" />
                          <Star className="h-3 w-3 fill-current" />
                        </div>
                      </div>
                      <p className="text-[10px] leading-relaxed text-slate-600 italic">
                        &ldquo;Văn phòng rất đẹp, quy trình tuyển dụng nhanh chóng và chuyên
                        nghiệp.&rdquo;
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5 rounded-xl border border-slate-100 bg-slate-50/40 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-900">
                          UI/UX Designer
                        </span>
                        <div className="flex text-amber-400">
                          <Star className="h-3 w-3 fill-current" />
                          <Star className="h-3 w-3 fill-current" />
                          <Star className="h-3 w-3 fill-current" />
                          <Star className="h-3 w-3 fill-current" />
                          <Star className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <p className="text-[10px] leading-relaxed text-slate-600 italic">
                        &ldquo;Người phỏng vấn thân thiện, tuy nhiên thời gian phản hồi kết quả hơi
                        muộn.&rdquo;
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  className="mt-6 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 transition hover:underline"
                  type="button"
                  onClick={() => setActiveTab("Uy tín tuyển dụng")}
                >
                  Xem tất cả đánh giá <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Card 2: Trải nghiệm ứng viên */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">Trải nghiệm ứng viên</h2>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">
                    Chỉ số đo lường mức độ tương tác của nhà tuyển dụng.
                  </p>

                  <div className="mt-5 space-y-3.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600">Xem CV trung bình</span>
                      <span className="font-extrabold text-slate-900">18h</span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-600">Phản hồi trong 48h</span>
                        <span className="font-extrabold text-emerald-600">92%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: "92%" }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs">
                      <span className="font-bold text-slate-600">Đã phản hồi</span>
                      <span className="font-extrabold text-slate-900">128</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600">Chưa phản hồi</span>
                      <span className="font-extrabold text-slate-900">11</span>
                    </div>
                  </div>
                </div>

                <button
                  className="mt-6 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 transition hover:underline"
                  type="button"
                  onClick={() => setActiveTab("Uy tín tuyển dụng")}
                >
                  Xem chi tiết trải nghiệm <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Card 3: Chất lượng tin tuyển dụng */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    Chất lượng tin tuyển dụng
                  </h2>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">
                    Chỉ số kiểm duyệt và phản hồi của tin tuyển dụng đã đăng.
                  </p>

                  <div className="mt-5 space-y-3.5">
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-600">Tỷ lệ tin đạt chuẩn</span>
                        <span className="font-extrabold text-emerald-600">96%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: "96%" }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs">
                      <span className="font-bold text-slate-600">Tin được duyệt</span>
                      <span className="font-extrabold text-slate-900">12</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600">Tin cần chỉnh sửa</span>
                      <span className="font-extrabold text-amber-600">1</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600">Tin bị từ chối</span>
                      <span className="font-extrabold text-slate-900">0</span>
                    </div>
                  </div>
                </div>

                <button
                  className="mt-6 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 transition hover:underline"
                  type="button"
                >
                  Xem chi tiết chất lượng <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Bottom section: Recent activity table */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
              <h2 className="mb-4 text-base font-extrabold text-slate-900">Hoạt động gần đây</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 font-bold text-slate-500">
                      <th className="px-4 py-2.5">Thời gian</th>
                      <th className="px-4 py-2.5">Nội dung hoạt động</th>
                      <th className="px-4 py-2.5">Người thực hiện</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="text-slate-700">
                      <td className="px-4 py-3.5 font-semibold whitespace-nowrap text-slate-500">
                        12/12/2024 14:30
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            <Check className="h-3 w-3" />
                          </span>
                          <span className="font-bold">Hồ sơ doanh nghiệp đã được xác thực</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">UpNext Admin</td>
                    </tr>
                    <tr className="text-slate-700">
                      <td className="px-4 py-3.5 font-semibold whitespace-nowrap text-slate-500">
                        10/12/2024 09:15
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <NotePencil className="h-3 w-3" />
                          </span>
                          <span className="font-bold">Bạn đã cập nhật mô tả công ty</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">Nguyễn Thu Linh</td>
                    </tr>
                    <tr className="text-slate-700">
                      <td className="px-4 py-3.5 font-semibold whitespace-nowrap text-slate-500">
                        08/12/2024 11:20
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                            <Building2 className="h-3 w-3" />
                          </span>
                          <div>
                            <p className="font-bold">Bạn đã đăng tải bộ ảnh văn phòng mới</p>
                            <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                              3 hình ảnh góc làm việc, phòng họp và pantry.
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">Nguyễn Thu Linh</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-center">
                <button
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 transition hover:underline"
                  type="button"
                >
                  Xem tất cả hoạt động <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar Columns (KPI Side Cards + Support) */}
          <div className="space-y-6">
            {/* Card 1: Hồ sơ hoàn thiện progress checklist */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">Hồ sơ hoàn thiện</h2>
                <div className="mt-4 flex items-center gap-4">
                  {/* Radial progress */}
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                    <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                      <circle
                        className="text-slate-100"
                        cx="50"
                        cy="50"
                        fill="transparent"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="10"
                      />
                      <circle
                        className="text-emerald-500 transition-all duration-500"
                        cx="50"
                        cy="50"
                        fill="transparent"
                        r="40"
                        stroke="currentColor"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * finalCompleteness) / 100}
                        strokeLinecap="round"
                        strokeWidth="10"
                      />
                    </svg>
                    <span className="absolute text-sm font-extrabold text-slate-950">
                      {finalCompleteness}%
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {finalCompleteness === 100
                        ? "Hồ sơ đã đạt 100%"
                        : `Còn ${missingCount} mục cần bổ sung`}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      Bổ sung để tăng khả năng hiển thị hồ sơ tuyển dụng trước các ứng viên tiềm
                      năng.
                    </p>
                  </div>
                </div>

                {/* Checklist */}
                <ul className="mt-5 space-y-3 text-xs font-bold text-slate-600">
                  <li className="flex items-center justify-between">
                    <button
                      className="flex items-center gap-2 text-left"
                      onClick={() => handleToggleChecklist("cover")}
                      type="button"
                    >
                      <span
                        className={cn(
                          "flex h-4.5 w-4.5 items-center justify-center rounded-md border text-white transition-colors",
                          completedItems.cover
                            ? "bg-emerald-600 border-emerald-600"
                            : "border-slate-200",
                        )}
                      >
                        {completedItems.cover && <Check className="h-3 w-3 stroke-[3]" />}
                      </span>
                      Thêm ảnh bìa
                    </button>
                    {!completedItems.cover && (
                      <WarningCircle className="h-4.5 w-4.5 text-amber-500" />
                    )}
                  </li>
                  <li className="flex items-center justify-between">
                    <button
                      className="flex items-center gap-2 text-left"
                      onClick={() => handleToggleChecklist("benefits")}
                      type="button"
                    >
                      <span
                        className={cn(
                          "flex h-4.5 w-4.5 items-center justify-center rounded-md border text-white transition-colors",
                          completedItems.benefits
                            ? "bg-emerald-600 border-emerald-600"
                            : "border-slate-200",
                        )}
                      >
                        {completedItems.benefits && <Check className="h-3 w-3 stroke-[3]" />}
                      </span>
                      Thêm phúc lợi công ty
                    </button>
                    {!completedItems.benefits && (
                      <WarningCircle className="h-4.5 w-4.5 text-amber-500" />
                    )}
                  </li>
                  <li className="flex items-center justify-between">
                    <button
                      className="flex items-center gap-2 text-left"
                      onClick={() => handleToggleChecklist("email")}
                      type="button"
                    >
                      <span
                        className={cn(
                          "flex h-4.5 w-4.5 items-center justify-center rounded-md border text-white transition-colors",
                          completedItems.email
                            ? "bg-emerald-600 border-emerald-600"
                            : "border-slate-200",
                        )}
                      >
                        {completedItems.email && <Check className="h-3 w-3 stroke-[3]" />}
                      </span>
                      Xác thực email domain
                    </button>
                    {!completedItems.email && (
                      <WarningCircle className="h-4.5 w-4.5 text-amber-500" />
                    )}
                  </li>
                  <li className="flex items-center justify-between">
                    <button
                      className="flex items-center gap-2 text-left"
                      onClick={() => handleToggleChecklist("culture")}
                      type="button"
                    >
                      <span
                        className={cn(
                          "flex h-4.5 w-4.5 items-center justify-center rounded-md border text-white transition-colors",
                          completedItems.culture
                            ? "bg-emerald-600 border-emerald-600"
                            : "border-slate-200",
                        )}
                      >
                        {completedItems.culture && <Check className="h-3 w-3 stroke-[3]" />}
                      </span>
                      Thêm mô tả văn hóa
                    </button>
                    {!completedItems.culture && (
                      <WarningCircle className="h-4.5 w-4.5 text-amber-500" />
                    )}
                  </li>
                </ul>
              </div>

              <button
                className="mt-6 w-full rounded-xl border border-emerald-600 bg-white py-2.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50/50"
                type="button"
                onClick={() => {
                  setCompletedItems({ cover: true, benefits: true, email: true, culture: true });
                }}
              >
                Hoàn thiện ngay
              </button>
            </div>

            {/* Card 2: Cải thiện uy tín */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                  <Star className="h-4.5 w-4.5 fill-amber-100 text-amber-500" />
                  Cải thiện uy tín
                </h2>
                <p className="mt-1 text-[11px] text-slate-500">
                  Gợi ý hoạt động để nâng cao độ tin cậy và thứ hạng tìm kiếm.
                </p>

                <ul className="mt-4 space-y-3.5 text-xs font-bold text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-extrabold text-emerald-600">
                      +5
                    </span>
                    <span>Xác thực doanh nghiệp thành công</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-extrabold text-emerald-600">
                      +3
                    </span>
                    <span>Xử lý hồ sơ ứng viên quá hạn</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-extrabold text-emerald-600">
                      +2
                    </span>
                    <span>Bổ sung tối thiểu 3 ảnh văn phòng</span>
                  </li>
                </ul>
              </div>

              <button
                className="mt-6 flex items-center justify-center gap-1 text-xs font-bold text-emerald-700 transition hover:underline"
                type="button"
                onClick={() => setActiveTab("Uy tín tuyển dụng")}
              >
                Xem chi tiết gợi ý <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Card 3: Replaced Tin tuyển dụng with Thư viện ảnh văn phòng & hoạt động */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">Hình ảnh văn phòng</h2>
                <p className="mt-1 text-[11px] text-slate-500">
                  Không gian làm việc và hoạt động nội bộ của doanh nghiệp.
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {officePhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.path}
                        alt={photo.label}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="mt-6 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 transition hover:underline"
                type="button"
                onClick={() => setActiveTab("Hồ sơ công ty")}
              >
                Xem & quản lý hình ảnh <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Mascot Support Card */}
            <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-500/5 to-teal-500/10 p-5 shadow-[0_18px_46px_rgba(16,185,129,0.04)]">
              <div className="pr-16">
                <h3 className="text-sm font-extrabold text-slate-900">Cần hỗ trợ?</h3>
                <p className="mt-2 text-xs leading-relaxed font-semibold text-slate-500">
                  Chúng tôi luôn sẵn sàng giúp bạn cải thiện hồ sơ và uy tín tuyển dụng của công ty.
                </p>
                <button
                  className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white shadow-md transition hover:bg-emerald-700"
                  type="button"
                >
                  Liên hệ hỗ trợ
                </button>
              </div>

              {/* Headset Mascot Peeking SVG */}
              <div className="pointer-events-none absolute -right-2 -bottom-2 h-28 w-28">
                <svg
                  viewBox="0 0 160 160"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-full w-full"
                >
                  <ellipse cx="80" cy="140" rx="45" ry="10" fill="#000000" fillOpacity="0.05" />
                  <path
                    d="M40 90C40 50 60 35 80 35C100 35 120 50 120 90C120 125 105 140 80 140C55 140 40 125 40 90Z"
                    fill="url(#mascotGradientRight)"
                  />
                  <path
                    d="M52 100C52 75 65 65 80 65C95 65 108 75 108 100C108 122 98 135 80 135C62 135 52 122 52 100Z"
                    fill="#FFFFFF"
                    fillOpacity="0.9"
                  />
                  <circle cx="68" cy="85" r="5" fill="#0f172a" />
                  <circle cx="66.5" cy="83.5" r="1.5" fill="#FFFFFF" />
                  <circle cx="92" cy="85" r="5" fill="#0f172a" />
                  <circle cx="90.5" cy="83.5" r="1.5" fill="#FFFFFF" />
                  <circle cx="60" cy="93" r="4" fill="#f43f5e" fillOpacity="0.4" />
                  <circle cx="100" cy="93" r="4" fill="#f43f5e" fillOpacity="0.4" />
                  <path
                    d="M75 93C75 93 80 97 85 93"
                    stroke="#0f172a"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M36 85C36 50 50 25 80 25C110 25 124 50 124 85"
                    stroke="#1e293b"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <rect x="28" y="75" width="12" height="26" rx="6" fill="#1e293b" />
                  <rect x="34" y="80" width="4" height="16" rx="2" fill="#64748b" />
                  <rect x="120" y="75" width="12" height="26" rx="6" fill="#1e293b" />
                  <rect x="122" y="80" width="4" height="16" rx="2" fill="#64748b" />
                  <path
                    d="M34 95C34 108 48 116 58 116"
                    stroke="#475569"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="58" cy="116" r="4" fill="#0f172a" />
                  <defs>
                    <linearGradient
                      id="mascotGradientRight"
                      x1="80"
                      y1="35"
                      x2="80"
                      y2="140"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#34d399" />
                      <stop offset="1" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === "Hồ sơ công ty" ? (
        /* Detailed Tab 2: Hồ sơ công ty */
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h2 className="text-lg font-extrabold text-slate-900">Chi tiết hồ sơ doanh nghiệp</h2>
            <p className="mt-1 text-xs text-slate-500">
              Cập nhật thông tin công ty để ứng viên nắm bắt văn hóa và phúc lợi rõ nét nhất.
            </p>
          </div>

          <div className="space-y-6">
            {/* Input fields */}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700">
                  Tên doanh nghiệp
                </label>
                <input
                  type="text"
                  value={companyDetails.name}
                  onChange={(e) => setCompanyDetails({ ...companyDetails, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700">
                  Lĩnh vực hoạt động
                </label>
                <input
                  type="text"
                  value={companyDetails.industry}
                  onChange={(e) =>
                    setCompanyDetails({ ...companyDetails, industry: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700">
                  Quy mô nhân sự
                </label>
                <select
                  value={companyDetails.size}
                  onChange={(e) => setCompanyDetails({ ...companyDetails, size: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-emerald-500 focus:outline-none"
                >
                  <option>10 - 50 nhân sự</option>
                  <option>50 - 100 nhân sự</option>
                  <option>100 - 500 nhân sự</option>
                  <option>500+ nhân sự</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700">
                  Địa chỉ trụ sở
                </label>
                <input
                  type="text"
                  value={companyDetails.location}
                  onChange={(e) =>
                    setCompanyDetails({ ...companyDetails, location: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-bold text-slate-700">Website</label>
                <input
                  type="text"
                  value={companyDetails.website}
                  onChange={(e) =>
                    setCompanyDetails({ ...companyDetails, website: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-bold text-slate-700">
                  Giới thiệu công ty
                </label>
                <textarea
                  value={companyDetails.description}
                  onChange={(e) =>
                    setCompanyDetails({ ...companyDetails, description: e.target.value })
                  }
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Benefits Manager */}
            <div className="border-t border-slate-100 pt-6">
              <label className="mb-2 block text-xs font-bold text-slate-700">
                Phúc lợi công ty
              </label>
              <form onSubmit={handleAddBenefit} className="mb-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Thêm phúc lợi mới (ví dụ: Ăn trưa miễn phí)..."
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  className="max-w-md flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow hover:bg-emerald-700"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </form>

              <div className="flex flex-wrap gap-2">
                {benefits.map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 py-1.5 pr-2 pl-3 text-xs font-bold text-emerald-800"
                  >
                    {b}
                    <button
                      type="button"
                      onClick={() => handleRemoveBenefit(b)}
                      className="flex h-4.5 w-4.5 items-center justify-center rounded-full text-emerald-600 hover:bg-emerald-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Images Manager */}
            <div className="border-t border-slate-100 pt-6">
              <label className="mb-2 block text-xs font-bold text-slate-700">
                Hình ảnh văn phòng ({officePhotos.length}/6)
              </label>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {officePhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.path}
                      alt={photo.label}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() =>
                          setOfficePhotos(officePhotos.filter((p) => p.id !== photo.id))
                        }
                        className="rounded-full bg-white/20 p-1.5 text-white transition hover:bg-white/40"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
                {officePhotos.length < 6 && (
                  <button
                    type="button"
                    className="flex aspect-video flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition hover:border-slate-400 hover:text-slate-600"
                  >
                    <Plus className="mb-1 h-6 w-6" />
                    <span className="text-[10px] font-bold">Thêm ảnh mới</span>
                  </button>
                )}
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
              {saveSuccess && (
                <span className="animate-pulse rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600">
                  Đã lưu thay đổi thành công!
                </span>
              )}
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                onClick={() => {
                  setCompanyDetails((prev) => ({ ...prev, name: "UpNext Studio" }));
                  setActiveTab("Tổng quan");
                }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      ) : activeTab === "Xác thực" ? (
        /* Detailed Tab 3: Xác thực */
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
          <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
                Trạng thái xác minh doanh nghiệp
                <ShieldCheck className="h-5.5 w-5.5 fill-emerald-50 text-emerald-600" />
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Xác thực hồ sơ để gia tăng độ tin cậy và đạt được huy hiệu chính thức trên UpNext.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-emerald-100 px-3.5 py-1.5 text-xs font-extrabold text-emerald-800 sm:self-auto">
              <CheckCircle2 className="h-4 w-4" />
              Đã xác thực chính thức
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <h3 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                Danh mục các bước xác thực
              </h3>

              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50/20 px-5 py-3">
                <div className="flex items-start justify-between py-3.5">
                  <div className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                      <Check className="h-5 w-5 stroke-[3]" />
                    </span>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">
                        Giấy phép Đăng ký kinh doanh (GPKD)
                      </h4>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        Xác thực pháp lý doanh nghiệp hoạt động hợp pháp.
                      </p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-600">
                    Đã phê duyệt
                  </span>
                </div>

                <div className="flex items-start justify-between py-3.5">
                  <div className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                      <Check className="h-5 w-5 stroke-[3]" />
                    </span>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">
                        Xác thực Số điện thoại & Người đại diện
                      </h4>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        Đã xác minh liên hệ chính chủ của HR Manager hoặc CEO.
                      </p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-600">
                    Đã xác thực
                  </span>
                </div>

                <div className="flex items-start justify-between py-3.5">
                  <div className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                      <Check className="h-5 w-5 stroke-[3]" />
                    </span>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">
                        Địa điểm văn phòng thực tế
                      </h4>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        Xác minh địa chỉ trụ sở trùng khớp với đăng ký hoạt động.
                      </p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-600">
                    Đã đối chiếu
                  </span>
                </div>

                <div className="flex items-start justify-between py-3.5">
                  <div className="flex gap-3">
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                        completedItems.email
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-amber-100 text-amber-600",
                      )}
                    >
                      {completedItems.email ? (
                        <Check className="h-5 w-5 stroke-[3]" />
                      ) : (
                        <WarningCircle className="h-5 w-5" />
                      )}
                    </span>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">
                        Email tên miền riêng doanh nghiệp
                      </h4>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        Đăng ký tài khoản tuyển dụng với email đuôi `@upnext.vn`.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleChecklist("email")}
                    className={cn(
                      "text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition-colors border",
                      completedItems.email
                        ? "text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100"
                        : "text-amber-700 bg-amber-50 border-amber-100 hover:bg-amber-100",
                    )}
                  >
                    {completedItems.email ? "Đã liên kết" : "Xác thực ngay"}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/20 p-5">
              <h3 className="text-xs font-extrabold text-slate-900">Lợi ích khi được xác thực</h3>
              <ul className="space-y-3 text-xs font-semibold text-slate-600">
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-50 text-emerald-600">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <span>Được hiển thị huy hiệu xanh lá uy tín trên mọi tin tuyển dụng.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-50 text-emerald-600">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <span>
                    Ưu tiên xuất hiện hàng đầu trên bảng tin tìm kiếm việc làm của ứng viên.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-50 text-emerald-600">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <span>
                    Mở khóa chức năng lọc và chủ động liên hệ trực tiếp với ứng viên tiềm năng.
                  </span>
                </li>
              </ul>
              <div className="border-t border-slate-200/80 pt-4">
                <button
                  type="button"
                  className="w-full rounded-xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Cập nhật tài liệu pháp lý
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === "Uy tín tuyển dụng" ? (
        /* Detailed Tab 4: Uy tín tuyển dụng */
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h2 className="text-lg font-extrabold text-slate-900">
              Lịch sử điểm uy tín nhà tuyển dụng
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Biểu đồ thể hiện sự cải thiện và chất lượng tương tác của doanh nghiệp trong 6 tháng
              qua.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Dynamic Line Chart using SVG */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                    Xu hướng điểm uy tín
                  </h3>
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600">
                    +6 điểm kể từ tháng 1
                  </span>
                </div>
                <div className="relative h-44 w-full">
                  <svg viewBox="0 0 500 150" className="h-full w-full overflow-visible">
                    {/* Grid Lines */}
                    <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="40" x2="500" y2="40" stroke="#f1f5f9" strokeWidth="1" />

                    {/* Curved line chart */}
                    <path
                      d="M 20,120 Q 100,105 180,95 T 340,60 T 480,45"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Chart Dots & tooltips */}
                    {/* Jan: 80 */}
                    <circle
                      cx="20"
                      cy="120"
                      r="5"
                      fill="#FFFFFF"
                      stroke="#10b981"
                      strokeWidth="3"
                    />
                    <text
                      x="20"
                      y="140"
                      fill="#64748b"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      Thg 1 (80)
                    </text>

                    {/* Feb: 81 */}
                    <circle
                      cx="110"
                      cy="108"
                      r="5"
                      fill="#FFFFFF"
                      stroke="#10b981"
                      strokeWidth="3"
                    />
                    <text
                      x="110"
                      y="128"
                      fill="#64748b"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      Thg 2 (81)
                    </text>

                    {/* Mar: 82 */}
                    <circle
                      cx="200"
                      cy="98"
                      r="5"
                      fill="#FFFFFF"
                      stroke="#10b981"
                      strokeWidth="3"
                    />
                    <text
                      x="200"
                      y="118"
                      fill="#64748b"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      Thg 3 (82)
                    </text>

                    {/* Apr: 84 */}
                    <circle
                      cx="290"
                      cy="80"
                      r="5"
                      fill="#FFFFFF"
                      stroke="#10b981"
                      strokeWidth="3"
                    />
                    <text
                      x="290"
                      y="100"
                      fill="#64748b"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      Thg 4 (84)
                    </text>

                    {/* May: 85 */}
                    <circle
                      cx="380"
                      cy="55"
                      r="5"
                      fill="#FFFFFF"
                      stroke="#10b981"
                      strokeWidth="3"
                    />
                    <text
                      x="380"
                      y="75"
                      fill="#64748b"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      Thg 5 (85)
                    </text>

                    {/* Jun: 86 */}
                    <circle
                      cx="480"
                      cy="45"
                      r="6"
                      fill="#10b981"
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                    />
                    <text
                      x="480"
                      y="25"
                      fill="#0f172a"
                      fontSize="11"
                      fontWeight="extrabold"
                      textAnchor="middle"
                    >
                      Thg 6 (86)
                    </text>
                  </svg>
                </div>
              </div>

              {/* Badges / Achievements section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                  Huy hiệu thương hiệu tuyển dụng
                </h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <ShieldCheck className="h-6 w-6" />
                    </span>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">Xác thực chính chủ</h4>
                      <p className="mt-0.5 text-[9px] font-semibold text-slate-500">
                        Doanh nghiệp đã xác minh
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Clock3 className="h-6 w-6" />
                    </span>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">Phản hồi siêu tốc</h4>
                      <p className="mt-0.5 text-[9px] font-semibold text-slate-500">
                        Trả lời CV trong 24h
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 opacity-60">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                      <Star className="h-6 w-6" />
                    </span>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-700">Top Employer</h4>
                      <p className="mt-0.5 text-[9px] font-semibold text-slate-400">
                        Cần thêm 14 điểm
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Calculations Rules Card */}
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/20 p-5">
              <h3 className="text-xs font-extrabold text-slate-900">Công thức tính uy tín</h3>
              <p className="text-[11px] leading-relaxed font-semibold text-slate-500">
                Điểm uy tín được cấu thành từ 5 tiêu chuẩn cốt lõi:
              </p>

              <div className="space-y-3 text-[11px] font-semibold text-slate-600">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span>1. Xác thực doanh nghiệp</span>
                  <span className="font-extrabold text-slate-900">+30 điểm tối đa</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span>2. Mức độ hoàn thiện hồ sơ</span>
                  <span className="font-extrabold text-slate-900">+20 điểm tối đa</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span>3. Tốc độ & Tỷ lệ phản hồi CV</span>
                  <span className="font-extrabold text-slate-900">+25 điểm tối đa</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span>4. Chất lượng mô tả tin tuyển dụng</span>
                  <span className="font-extrabold text-slate-900">+15 điểm tối đa</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span>5. Tuân thủ quy định đăng tin</span>
                  <span className="font-extrabold text-slate-900">+10 điểm tối đa</span>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-[10px] leading-relaxed font-semibold text-emerald-800">
                <strong>Tip:</strong> Duy trì phản hồi toàn bộ hồ sơ ứng viên trong vòng 48h để tối
                ưu hóa 25 điểm tương tác.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Detailed Tab 5: Cài đặt hiển thị */
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
              <LockKey className="h-5.5 w-5.5 text-slate-700" />
              Cài đặt hiển thị và quyền riêng tư
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Cấu hình các chỉ số và thông tin sẽ hiển thị công khai trước mắt các ứng viên tiềm
              năng.
            </p>
          </div>

          <div className="max-w-2xl space-y-6">
            <div className="space-y-4">
              {/* Option 1 */}
              <div className="flex items-center justify-between py-1">
                <div className="pr-4">
                  <h3 className="text-xs font-extrabold text-slate-900">Hiển thị quy mô nhân sự</h3>
                  <p className="mt-1 text-[10px] leading-relaxed font-semibold text-slate-500">
                    Cho phép ứng viên nhìn thấy quy mô công ty (ví dụ: 50 - 100 nhân sự) trên trang
                    xem trước công khai.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDisplaySettings({ ...displaySettings, showSize: !displaySettings.showSize })
                  }
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    displaySettings.showSize ? "bg-emerald-600" : "bg-slate-200",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      displaySettings.showSize ? "translate-x-5" : "translate-x-0",
                    )}
                  />
                </button>
              </div>

              {/* Option 2 */}
              <div className="flex items-center justify-between border-t border-slate-100 py-1 pt-4">
                <div className="pr-4">
                  <h3 className="text-xs font-extrabold text-slate-900">
                    Hiển thị địa chỉ văn phòng chi tiết
                  </h3>
                  <p className="mt-1 text-[10px] leading-relaxed font-semibold text-slate-500">
                    Công khai địa chỉ cụ thể của các chi nhánh văn phòng phục vụ cho việc nộp đơn
                    ứng tuyển của ứng viên.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDisplaySettings({
                      ...displaySettings,
                      showAddress: !displaySettings.showAddress,
                    })
                  }
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    displaySettings.showAddress ? "bg-emerald-600" : "bg-slate-200",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      displaySettings.showAddress ? "translate-x-5" : "translate-x-0",
                    )}
                  />
                </button>
              </div>

              {/* Option 3 */}
              <div className="flex items-center justify-between border-t border-slate-100 py-1 pt-4">
                <div className="pr-4">
                  <h3 className="text-xs font-extrabold text-slate-900">
                    Công khai email liên hệ của nhà tuyển dụng
                  </h3>
                  <p className="mt-1 text-[10px] leading-relaxed font-semibold text-slate-500">
                    Hiển thị địa chỉ email nhận hồ sơ công khai. (Khuyên dùng: tắt để tránh các
                    email rác).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDisplaySettings({
                      ...displaySettings,
                      showEmail: !displaySettings.showEmail,
                    })
                  }
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    displaySettings.showEmail ? "bg-emerald-600" : "bg-slate-200",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      displaySettings.showEmail ? "translate-x-5" : "translate-x-0",
                    )}
                  />
                </button>
              </div>

              {/* Option 4 */}
              <div className="flex items-center justify-between border-t border-slate-100 py-1 pt-4">
                <div className="pr-4">
                  <h3 className="text-xs font-extrabold text-slate-900">
                    Cho phép ứng viên đánh giá phỏng vấn
                  </h3>
                  <p className="mt-1 text-[10px] leading-relaxed font-semibold text-slate-500">
                    Bật nhận xét phỏng vấn. Các đánh giá sẽ xuất hiện công khai trên trang điểm uy
                    tín để nâng cao minh bạch.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDisplaySettings({
                      ...displaySettings,
                      allowCandidateReviews: !displaySettings.allowCandidateReviews,
                    })
                  }
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    displaySettings.allowCandidateReviews ? "bg-emerald-600" : "bg-slate-200",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      displaySettings.allowCandidateReviews ? "translate-x-5" : "translate-x-0",
                    )}
                  />
                </button>
              </div>

              {/* Option 5 */}
              <div className="flex items-center justify-between border-t border-slate-100 py-1 pt-4">
                <div className="pr-4">
                  <h3 className="text-xs font-extrabold text-slate-900">
                    Nhận thông báo qua email khi điểm uy tín thay đổi
                  </h3>
                  <p className="mt-1 text-[10px] leading-relaxed font-semibold text-slate-500">
                    Hệ thống sẽ gửi email báo cáo chi tiết khi công ty nhận được đánh giá mới hoặc
                    bị giảm điểm uy tín.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDisplaySettings({
                      ...displaySettings,
                      emailNotifications: !displaySettings.emailNotifications,
                    })
                  }
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    displaySettings.emailNotifications ? "bg-emerald-600" : "bg-slate-200",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      displaySettings.emailNotifications ? "translate-x-5" : "translate-x-0",
                    )}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
              {saveSuccess && (
                <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600">
                  Cài đặt đã được lưu!
                </span>
              )}
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                onClick={() =>
                  setDisplaySettings({
                    showSize: true,
                    showAddress: true,
                    showEmail: false,
                    allowCandidateReviews: true,
                    emailNotifications: true,
                  })
                }
              >
                Đặt lại mặc định
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700"
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
