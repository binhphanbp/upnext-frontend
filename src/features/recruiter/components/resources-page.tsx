"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import {
  billingTransactions,
  currentRecruiterPlan,
  planBenefits,
  pricingPlans,
  pricingRows,
  recruiterResources,
  resourceAlerts,
  resourceTopups,
  type BillingTransaction,
  type RecruiterResource,
  type RecruiterResourceKey,
  type RecruiterResourceTone,
  type ResourceTopup,
} from "@/features/recruiter/data/resources-data";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ClipboardCheck,
  Crown,
  Diamond,
  Download,
  Eye,
  FileText,
  RocketLaunch,
  ShoppingCart,
  Sparkles,
  UserPlus,
  UsersRound,
  WarningCircle,
} from "@/features/recruiter/icons";
import type { LucideIcon } from "@/features/recruiter/icons";
import { cn } from "@/shared/lib/cn";

type ResourcesTab = "plans" | "resources" | "transactions";

const resourceIconByKey: Record<RecruiterResourceKey, LucideIcon> = {
  aiJobWriting: Sparkles,
  candidateInvites: UserPlus,
  cvViews: Eye,
  jobBoosts: RocketLaunch,
  jobPosts: FileText,
  teamSeats: UsersRound,
};

const toneClasses: Record<
  RecruiterResourceTone | "red",
  {
    bar: string;
    dot: string;
    icon: string;
    soft: string;
    text: string;
  }
> = {
  blue: {
    bar: "bg-blue-500",
    dot: "bg-blue-500",
    icon: "bg-blue-50 text-blue-600",
    soft: "bg-blue-50 text-blue-700",
    text: "text-blue-600",
  },
  green: {
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
    icon: "bg-emerald-50 text-emerald-600",
    soft: "bg-emerald-50 text-emerald-700",
    text: "text-emerald-600",
  },
  orange: {
    bar: "bg-orange-400",
    dot: "bg-orange-400",
    icon: "bg-orange-50 text-orange-500",
    soft: "bg-orange-50 text-orange-600",
    text: "text-orange-500",
  },
  purple: {
    bar: "bg-violet-600",
    dot: "bg-violet-600",
    icon: "bg-violet-100 text-violet-600",
    soft: "bg-violet-50 text-violet-700",
    text: "text-violet-600",
  },
  red: {
    bar: "bg-rose-500",
    dot: "bg-rose-500",
    icon: "bg-rose-50 text-rose-500",
    soft: "bg-rose-50 text-rose-700",
    text: "text-rose-500",
  },
  rose: {
    bar: "bg-rose-500",
    dot: "bg-rose-500",
    icon: "bg-rose-50 text-rose-500",
    soft: "bg-rose-50 text-rose-700",
    text: "text-rose-500",
  },
  teal: {
    bar: "bg-teal-500",
    dot: "bg-teal-500",
    icon: "bg-teal-50 text-teal-600",
    soft: "bg-teal-50 text-teal-700",
    text: "text-teal-600",
  },
};

const resourcesByKey = new Map(recruiterResources.map((resource) => [resource.key, resource]));

const tabs: Array<{ id: ResourcesTab; label: string }> = [
  { id: "resources", label: "Tài nguyên" },
  { id: "plans", label: "Gói dịch vụ" },
  { id: "transactions", label: "Lịch sử giao dịch" },
];

const transactionFilters = [
  "Tất cả",
  "Gia hạn gói",
  "Mua thêm tài nguyên",
  "Nâng cấp",
  "Trạng thái",
];

function getResource(key: RecruiterResourceKey) {
  const resource = resourcesByKey.get(key);

  if (!resource) {
    throw new Error(`Missing recruiter resource: ${key}`);
  }

  return resource;
}

function getDisplayCount(resource: RecruiterResource) {
  return resource.displayMode === "remaining" ? resource.remaining : resource.used;
}

function getProgressPercent(resource: RecruiterResource) {
  return resource.displayMode === "remaining" ? resource.percentRemaining : resource.percentUsed;
}

function formatMoney(amount: number) {
  return `${new Intl.NumberFormat("vi-VN").format(amount)}đ`;
}

export function RecruiterResourcesPage() {
  return (
    <div className="w-full overflow-x-clip pb-8">
      <ResourcesHeader />
      <ResourcesKpiGrid />

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <CurrentPlanCard />
        <ResourceAlertCard />
      </div>

      <ResourceUsageGrid />
      <ResourcesTabs />
    </div>
  );
}

function ResourcesHeader() {
  return (
    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 className="text-[28px] leading-tight font-extrabold tracking-[-0.01em] text-slate-950">
          Gói & tài nguyên
        </h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Quản lý gói dịch vụ, lượt sử dụng và tài nguyên tuyển dụng của doanh nghiệp.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-extrabold text-slate-700 shadow-[0_10px_28px_rgba(15,23,42,0.04)] transition hover:border-emerald-200 hover:text-emerald-700"
          type="button"
        >
          <ShoppingCart aria-hidden className="h-4.5 w-4.5" />
          Mua thêm tài nguyên
        </button>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(5,150,105,0.22)] transition hover:bg-emerald-700"
          type="button"
        >
          <Crown aria-hidden className="h-4.5 w-4.5" />
          Nâng cấp gói
        </button>
      </div>
    </div>
  );
}

function ResourcesKpiGrid() {
  const jobPosts = getResource("jobPosts");
  const cvViews = getResource("cvViews");

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <ResourceKpiCard
        badge="Đang hoạt động"
        icon={Diamond}
        title="Gói hiện tại"
        tone="purple"
        value={currentRecruiterPlan.name}
      />
      <ResourceKpiCard
        icon={CalendarDays}
        subtext={`Hết hạn: ${currentRecruiterPlan.expiresAt}`}
        title="Ngày còn lại"
        tone="orange"
        value={`${currentRecruiterPlan.daysRemaining} ngày`}
      />
      <ResourceKpiCard
        icon={ClipboardCheck}
        progress={jobPosts.percentRemaining}
        title="Lượt đăng tin còn lại"
        tone="green"
        value={`${jobPosts.remaining} / ${jobPosts.limit}`}
      />
      <ResourceKpiCard
        icon={Eye}
        progress={cvViews.percentUsed}
        title="Lượt xem CV còn lại"
        tone="orange"
        value={`${cvViews.used} / ${cvViews.limit}`}
      />
      <ResourceKpiCard
        icon={WarningCircle}
        linkLabel="Xem chi tiết"
        title="Tài nguyên sắp hết"
        tone="red"
        value="2"
      />
    </div>
  );
}

function ResourceKpiCard({
  badge,
  icon: Icon,
  linkLabel,
  progress,
  subtext,
  title,
  tone,
  value,
}: {
  badge?: string;
  icon: LucideIcon;
  linkLabel?: string;
  progress?: number;
  subtext?: string;
  title: string;
  tone: RecruiterResourceTone | "red";
  value: string;
}) {
  const classes = toneClasses[tone];

  return (
    <article className="min-h-[132px] rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.045)]">
      <div className="flex items-start gap-4">
        <span
          className={cn(
            "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            classes.icon,
          )}
        >
          <Icon aria-hidden className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-500">{title}</p>
          <p className="mt-2 text-[26px] leading-none font-extrabold tracking-[-0.02em] text-slate-950">
            {value}
          </p>
        </div>
      </div>

      {badge ? (
        <span className="mt-5 inline-flex h-7 items-center rounded-lg bg-emerald-50 px-3 text-xs font-extrabold text-emerald-700">
          {badge}
        </span>
      ) : null}
      {subtext ? <p className="mt-5 text-sm font-semibold text-slate-600">{subtext}</p> : null}
      {progress !== undefined ? <ProgressBar percent={progress} tone={tone} /> : null}
      {linkLabel ? (
        <button
          className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold text-emerald-700"
          type="button"
        >
          {linkLabel}
          <ArrowRight aria-hidden className="h-4 w-4" />
        </button>
      ) : null}
    </article>
  );
}

function CurrentPlanCard() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-extrabold text-slate-950">Gói hiện tại</h2>
        <span className="rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-extrabold text-violet-700">
          {currentRecruiterPlan.name}
        </span>
      </div>

      <div className="mt-5 grid gap-6 xl:grid-cols-[132px_minmax(0,1fr)_minmax(260px,0.9fr)]">
        <div className="flex items-center justify-center xl:justify-start">
          <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <Crown aria-hidden className="h-10 w-10" />
          </span>
        </div>

        <dl className="divide-y divide-slate-200">
          <PlanInfoRow icon={Bell} label="Trạng thái">
            <span className="font-extrabold text-emerald-600">Đang hoạt động</span>
          </PlanInfoRow>
          <PlanInfoRow icon={CalendarDays} label="Chu kỳ">
            30 ngày
          </PlanInfoRow>
          <PlanInfoRow icon={CalendarDays} label="Ngày bắt đầu">
            {currentRecruiterPlan.startedAt}
          </PlanInfoRow>
          <PlanInfoRow icon={CalendarDays} label="Ngày hết hạn">
            {currentRecruiterPlan.expiresAt}
          </PlanInfoRow>
          <PlanInfoRow icon={ArrowRight} label="Tự động gia hạn">
            <span className="inline-flex items-center gap-3">
              Tắt
              <span
                aria-hidden
                className="inline-flex h-5 w-9 items-center rounded-full bg-slate-200 p-0.5"
              >
                <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
              </span>
            </span>
          </PlanInfoRow>
        </dl>

        <div className="border-t border-slate-200 pt-5 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-7">
          <h3 className="text-base font-extrabold text-slate-950">Quyền lợi gói Pro</h3>
          <div className="mt-4 space-y-3">
            {planBenefits.map((benefit) => (
              <p
                className="flex items-center gap-3 text-sm font-semibold text-slate-600"
                key={benefit}
              >
                <Check aria-hidden className="h-4 w-4 shrink-0 text-emerald-600" />
                {benefit}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-extrabold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
          type="button"
        >
          <CalendarDays aria-hidden className="h-4.5 w-4.5" />
          Gia hạn gói
        </button>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(5,150,105,0.2)] transition hover:bg-emerald-700"
          type="button"
        >
          <Crown aria-hidden className="h-4.5 w-4.5" />
          Nâng cấp gói
        </button>
      </div>
    </section>
  );
}

function PlanInfoRow({
  children,
  icon: Icon,
  label,
}: {
  children: ReactNode;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(130px,1fr)_auto] items-center gap-4 py-3 text-sm">
      <dt className="flex items-center gap-3 font-semibold text-slate-500">
        <Icon aria-hidden className="h-4.5 w-4.5 text-slate-500" />
        {label}
      </dt>
      <dd className="text-right font-bold text-slate-700">{children}</dd>
    </div>
  );
}

function ResourceAlertCard() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
      <h2 className="flex items-center gap-3 text-lg font-extrabold text-slate-950">
        <Bell aria-hidden className="h-5 w-5 text-orange-500" />
        Cảnh báo tài nguyên
      </h2>

      <div className="mt-5 rounded-xl border border-slate-200 p-4">
        <div className="space-y-4 divide-y divide-slate-100">
          {resourceAlerts.map((alert) => (
            <div className="py-1 first:pt-0 last:pb-0" key={alert.id}>
              <p className="flex items-center gap-3 text-sm font-bold text-slate-700">
                {alert.tone === "orange" ? (
                  <WarningCircle aria-hidden className="h-4.5 w-4.5 text-orange-500" />
                ) : (
                  <CalendarDays aria-hidden className="h-4.5 w-4.5 text-slate-600" />
                )}
                {alert.label}
              </p>
              {"progress" in alert ? (
                <ProgressBar compact percent={alert.progress} tone="orange" />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <button
        className="mt-7 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-orange-100 bg-orange-50 text-sm font-extrabold text-orange-600 transition hover:bg-orange-100"
        type="button"
      >
        <ShoppingCart aria-hidden className="h-4.5 w-4.5" />
        Mua thêm tài nguyên
      </button>
    </section>
  );
}

function ResourceUsageGrid() {
  return (
    <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_44px_rgba(15,23,42,0.04)] sm:p-5">
      <h2 className="text-lg font-extrabold text-slate-950">Tài nguyên sử dụng</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {recruiterResources.map((resource) => (
          <ResourceUsageCard key={resource.key} resource={resource} />
        ))}
      </div>
    </section>
  );
}

function ResourceUsageCard({ resource }: { resource: RecruiterResource }) {
  const Icon = resourceIconByKey[resource.key];
  const percent = getProgressPercent(resource);
  const classes = toneClasses[resource.tone];

  return (
    <article className="relative flex min-h-[188px] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.035)]">
      <span className={cn("absolute top-4 right-4 h-2 w-2 rounded-full", classes.dot)} />
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            classes.icon,
          )}
        >
          <Icon aria-hidden className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-600">{resource.label}</p>
          <p className="mt-2 text-xl leading-none font-extrabold text-slate-950">
            {getDisplayCount(resource)}
            <span className="text-base font-bold text-slate-500"> / {resource.limit}</span>
          </p>
        </div>
      </div>

      <ProgressBar percent={percent} tone={resource.tone} />
      <p className="mt-auto pt-4 text-xs font-semibold text-slate-600">
        Còn {resource.remaining} {resource.unit}
      </p>
    </article>
  );
}

function ResourcesTabs() {
  const [activeTab, setActiveTab] = useState<ResourcesTab>("resources");

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
      <div
        aria-label="Gói và tài nguyên"
        className="flex gap-8 overflow-x-auto border-b border-slate-200 px-4"
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            aria-controls={`resources-panel-${tab.id}`}
            aria-selected={activeTab === tab.id}
            className={cn(
              "h-12 min-w-max border-b-2 text-sm font-extrabold transition",
              activeTab === tab.id
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-600 hover:text-slate-950",
            )}
            id={`resources-tab-${tab.id}`}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "resources" ? <ResourceTopupSection /> : null}
      {activeTab === "plans" ? <PricingComparison /> : null}
      {activeTab === "transactions" ? <TransactionsPanel /> : null}
    </section>
  );
}

function ResourceTopupSection() {
  return (
    <div
      aria-labelledby="resources-tab-resources"
      className="min-w-0 p-4 sm:p-5"
      id="resources-panel-resources"
      role="tabpanel"
    >
      <h3 className="text-base font-extrabold text-slate-950">Mua thêm tài nguyên</h3>
      <p className="mt-2 text-sm font-semibold text-slate-500">
        Mua thêm lượt sử dụng khi tài nguyên của bạn sắp hết.
      </p>
      <button
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700"
        type="button"
      >
        Xem hướng dẫn
        <span aria-hidden>ⓘ</span>
      </button>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {resourceTopups.map((topup) => (
          <TopupCard key={topup.id} topup={topup} />
        ))}
      </div>
    </div>
  );
}

function TopupCard({ topup }: { topup: ResourceTopup }) {
  const resource = getResource(topup.resourceKey);
  const Icon = resourceIconByKey[topup.resourceKey];
  const classes = toneClasses[resource.tone];

  return (
    <article className="flex min-h-[228px] min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <span
        className={cn("inline-flex h-11 w-11 items-center justify-center rounded-xl", classes.icon)}
      >
        <Icon aria-hidden className="h-5 w-5" />
      </span>
      <h4 className="mt-4 text-base leading-6 font-extrabold text-slate-950">{topup.name}</h4>
      <p className="mt-2 min-h-[48px] text-sm leading-5 font-semibold text-slate-500">
        {topup.description}
      </p>
      <div className="mt-auto pt-5">
        <span className="block min-w-0 text-lg font-extrabold text-emerald-600">
          {formatMoney(topup.price)}
        </span>
        <button
          aria-label={`Mua ${topup.name}`}
          className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-extrabold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
          type="button"
        >
          <ShoppingCart aria-hidden className="h-4 w-4" />
          Mua thêm
        </button>
      </div>
    </article>
  );
}

function PricingComparison() {
  return (
    <div
      aria-labelledby="resources-tab-plans"
      className="p-4 sm:p-5"
      id="resources-panel-plans"
      role="tabpanel"
    >
      <div className="mb-4">
        <h3 className="text-base font-extrabold text-slate-950">So sánh gói dịch vụ</h3>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Chọn gói phù hợp theo quy mô tuyển dụng hiện tại của doanh nghiệp.
        </p>
      </div>
      <div className="overflow-x-auto overscroll-x-contain rounded-xl border border-slate-200">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600">
              <th className="px-4 py-3 text-xs font-extrabold">Quyền lợi</th>
              {pricingPlans.map((plan) => (
                <th className="px-4 py-3" key={plan.name}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-950">{plan.name}</span>
                    {plan.featured ? (
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-extrabold text-emerald-700">
                        Hiện tại
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-500">{plan.price}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pricingRows.map((row) => (
              <tr key={row}>
                <th className="px-4 py-3 text-xs font-extrabold text-slate-600">{row}</th>
                {pricingPlans.map((plan) => (
                  <td className="px-4 py-3 font-bold text-slate-700" key={`${plan.name}-${row}`}>
                    {plan.values[row]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TransactionsPanel() {
  return (
    <div
      aria-labelledby="resources-tab-transactions"
      className="p-4 sm:p-5"
      id="resources-panel-transactions"
      role="tabpanel"
    >
      <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-950">Lịch sử giao dịch</h3>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Theo dõi giao dịch gói dịch vụ, tài nguyên mua thêm và hóa đơn.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {transactionFilters.map((filter) => (
            <button
              className={cn(
                "h-9 rounded-lg border px-3 text-xs font-extrabold",
                filter === "Tất cả"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-600",
              )}
              key={filter}
              type="button"
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
      <TransactionsTable transactions={billingTransactions} />
    </div>
  );
}

function TransactionsTable({ transactions }: { transactions: BillingTransaction[] }) {
  return (
    <>
      <div className="grid gap-3 sm:hidden">
        {transactions.map((transaction) => (
          <article
            className="rounded-xl border border-slate-100 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.035)]"
            key={transaction.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold text-slate-500">{transaction.code}</p>
                <p className="mt-1 text-sm font-extrabold text-slate-950">
                  {transaction.typeLabel}
                </p>
              </div>
              <span className="inline-flex h-7 items-center rounded-lg bg-emerald-50 px-3 text-[11px] font-extrabold text-emerald-700">
                Thành công
              </span>
            </div>
            <div className="mt-4 grid grid-cols-[1fr_auto] gap-3 text-sm">
              <div>
                <p className="text-xs font-bold text-slate-500">Gói/Tài nguyên</p>
                <p className="mt-1 font-bold text-slate-700">{transaction.itemName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-500">Số tiền</p>
                <p className="mt-1 font-extrabold text-slate-950">
                  {formatMoney(transaction.amount)}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <span className="text-xs font-bold text-slate-500">{transaction.paidAt}</span>
              <button
                aria-label={`Tải hóa đơn ${transaction.code}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 hover:text-emerald-700"
                type="button"
              >
                <Download aria-hidden className="h-4.5 w-4.5" />
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden max-w-full min-w-0 overflow-x-auto overscroll-x-contain rounded-xl border border-slate-100 sm:block">
        <table className="w-full min-w-[820px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-white text-slate-500">
              <th className="px-4 py-3 font-extrabold">Mã giao dịch</th>
              <th className="px-3 py-3 font-extrabold">Loại giao dịch</th>
              <th className="px-3 py-3 font-extrabold">Gói/Tài nguyên</th>
              <th className="px-3 py-3 font-extrabold">Số tiền</th>
              <th className="px-3 py-3 font-extrabold">Ngày thanh toán</th>
              <th className="px-3 py-3 font-extrabold">Trạng thái</th>
              <th className="px-3 py-3 text-right font-extrabold">
                <span className="sr-only">Hóa đơn</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((transaction) => (
              <tr className="text-slate-700" key={transaction.id}>
                <td className="px-4 py-3.5 font-bold text-slate-800">{transaction.code}</td>
                <td className="px-3 py-3.5 font-semibold">{transaction.typeLabel}</td>
                <td className="px-3 py-3.5 font-semibold">{transaction.itemName}</td>
                <td className="px-3 py-3.5 font-extrabold">{formatMoney(transaction.amount)}</td>
                <td className="px-3 py-3.5 font-semibold">{transaction.paidAt}</td>
                <td className="px-3 py-3.5">
                  <span className="inline-flex h-7 items-center rounded-lg bg-emerald-50 px-3 text-[11px] font-extrabold text-emerald-700">
                    Thành công
                  </span>
                </td>
                <td className="px-3 py-3.5 text-right">
                  <button
                    aria-label={`Tải hóa đơn ${transaction.code}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 hover:text-emerald-700"
                    type="button"
                  >
                    <Download aria-hidden className="h-4.5 w-4.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ProgressBar({
  compact = false,
  percent,
  tone,
}: {
  compact?: boolean;
  percent: number;
  tone: RecruiterResourceTone | "red";
}) {
  return (
    <div className={cn("flex items-center gap-3", compact ? "mt-3" : "mt-5")}>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
        <span
          className={cn("block h-full rounded-full", toneClasses[tone].bar)}
          style={{ width: `${percent}%` }}
        />
      </span>
      {!compact ? <span className="text-xs font-extrabold text-slate-500">{percent}%</span> : null}
    </div>
  );
}
