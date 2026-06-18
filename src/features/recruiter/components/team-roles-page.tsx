"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import {
  activityLogs,
  permissionRules,
  roleDefinitions,
  roleOrder,
  teamKpis,
  teamMembers,
  teamTabs,
  type CompanyMember,
  type MemberStatus,
  type TeamRole,
  type TeamTabId,
} from "@/features/recruiter/data/team-data";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  Eye,
  LockKey,
  MoreHorizontal,
  PlayCircle,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  UsersRound,
  X,
} from "@/features/recruiter/icons";
import { cn } from "@/shared/lib/cn";

const kpiTone = {
  amber: "bg-amber-50 text-amber-500",
  emerald: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-500",
} as const;

const roleBadgeTone: Record<TeamRole, string> = {
  ADMIN: "border-blue-100 bg-blue-50 text-blue-700",
  INTERVIEWER: "border-orange-100 bg-orange-50 text-orange-700",
  OWNER: "border-violet-100 bg-violet-50 text-violet-700",
  RECRUITER: "border-emerald-100 bg-emerald-50 text-emerald-700",
};

const roleIconTone = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  orange: "bg-orange-50 text-orange-600",
  violet: "bg-violet-50 text-violet-600",
} as const;

const statusCopy: Record<MemberStatus, string> = {
  ACTIVE: "Hoạt động",
  PENDING: "Chờ xác nhận",
  SUSPENDED: "Tạm khóa",
};

const statusTone: Record<MemberStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 before:bg-emerald-500",
  PENDING: "bg-amber-50 text-amber-700 before:bg-amber-500",
  SUSPENDED: "bg-rose-50 text-rose-700 before:bg-rose-500",
};

export function TeamRolesPage() {
  const [activeTab, setActiveTab] = useState<TeamTabId>("members");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [rolesDrawerOpen, setRolesDrawerOpen] = useState(false);
  const [roleMember, setRoleMember] = useState<CompanyMember | null>(null);
  const [selectedRole, setSelectedRole] = useState<TeamRole>("RECRUITER");

  useEffect(() => {
    function openInviteDialog() {
      setInviteOpen(true);
    }

    window.addEventListener("upnext:open-invite-member", openInviteDialog);
    return () => window.removeEventListener("upnext:open-invite-member", openInviteDialog);
  }, []);

  function openRoleDialog(member: CompanyMember) {
    setSelectedRole(member.role);
    setRoleMember(member);
  }

  return (
    <div className="w-full overflow-x-hidden">
      <section className="min-w-0">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[28px] leading-tight font-extrabold text-slate-950">
              Thành viên & phân quyền
            </h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold text-slate-500">
              Quản lý thành viên trong doanh nghiệp và gán vai trò theo bộ quyền cố định của hệ
              thống.
            </p>
          </div>
          <button
            className="inline-flex h-10 w-fit items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-4 text-sm font-extrabold text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-100"
            onClick={() => setRolesDrawerOpen(true)}
            type="button"
          >
            <ShieldCheck aria-hidden className="h-4.5 w-4.5" />
            Xem vai trò và quy tắc
          </button>
        </div>

        <div className="mt-7 flex items-start gap-4 rounded-xl border border-emerald-100 bg-emerald-50/60 px-5 py-4 text-sm font-semibold text-slate-700">
          <ShieldCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <p>
            Quyền truy cập được hệ thống định nghĩa sẵn. Owner/Admin chỉ được gán vai trò, không thể
            chỉnh sửa bộ quyền.
          </p>
        </div>

        <TeamKpiGrid />

        <TeamTabs activeTab={activeTab} onChange={setActiveTab} />

        <div className="mt-0">
          {activeTab === "members" ? <MembersPanel onChangeRole={openRoleDialog} /> : null}
          {activeTab === "activity" ? <ActivityLogTable /> : null}
        </div>
      </section>

      <InviteMemberDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <ChangeRoleDialog
        member={roleMember}
        onClose={() => setRoleMember(null)}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
      />
      <RolesRulesDrawer open={rolesDrawerOpen} onClose={() => setRolesDrawerOpen(false)} />
    </div>
  );
}

function TeamKpiGrid() {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {teamKpis.map((item) => {
        const Icon = item.icon;
        const up = item.trendDirection === "up";
        const down = item.trendDirection === "down";

        return (
          <article
            className="min-h-[120px] rounded-xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)]"
            key={item.label}
          >
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                  kpiTone[item.tone],
                )}
              >
                <Icon aria-hidden className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-600">{item.label}</p>
                <p className="mt-2 text-2xl leading-none font-extrabold text-slate-950">
                  {item.value}
                </p>
              </div>
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-500">
              {up ? <ArrowUp aria-hidden className="h-4 w-4 text-emerald-600" /> : null}
              {down ? <ArrowDown aria-hidden className="h-4 w-4 text-red-500" /> : null}
              {!up && !down ? <span className="text-slate-500">-</span> : null}
              <span className={up ? "text-emerald-600" : down ? "text-red-500" : "text-slate-500"}>
                {item.trend.split(" ")[0]}
              </span>
              <span>{item.trend.split(" ").slice(1).join(" ")}</span>
            </p>
          </article>
        );
      })}
    </div>
  );
}

function TeamTabs({
  activeTab,
  onChange,
}: {
  activeTab: TeamTabId;
  onChange: (tab: TeamTabId) => void;
}) {
  return (
    <div className="mt-6 flex gap-8 overflow-x-auto border-b border-slate-200">
      {teamTabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;

        return (
          <button
            className={cn(
              "flex h-12 min-w-max items-center gap-2 border-b-2 text-sm font-extrabold transition",
              active ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-600",
            )}
            key={tab.id}
            onClick={() => onChange(tab.id)}
            type="button"
          >
            <Icon aria-hidden className="h-4.5 w-4.5" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function MembersPanel({ onChangeRole }: { onChangeRole: (member: CompanyMember) => void }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
      <div className="border-b border-slate-100 p-4">
        <div className="flex flex-wrap gap-3">
          <label className="relative min-w-[260px] flex-[1.5_1_320px]">
            <span className="sr-only">Tìm thành viên</span>
            <input
              aria-label="Tìm thành viên"
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pr-10 pl-4 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
              placeholder="Tìm thành viên, email..."
              type="search"
            />
            <Search
              aria-hidden
              className="absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-slate-500"
            />
          </label>
          <FilterButton label="Vai trò" />
          <FilterButton label="Trạng thái" />
          <FilterButton label="Phòng ban" />
          <button className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-700">
            <RefreshCw aria-hidden className="h-4 w-4" />
            Làm mới
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-600">
              <th className="px-4 py-3">Thành viên</th>
              <th className="px-3 py-3">Vai trò</th>
              <th className="px-3 py-3">Phòng ban</th>
              <th className="px-3 py-3">Trạng thái</th>
              <th className="px-3 py-3 text-center">Tin phụ trách</th>
              <th className="px-3 py-3 text-center">Lịch PV</th>
              <th className="px-3 py-3">Hoạt động cuối</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {teamMembers.map((member) => (
              <MemberRow key={member.id} member={member} onChangeRole={onChangeRole} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4 text-sm font-semibold text-slate-500 lg:flex-row lg:items-center">
        <span>Hiển thị 1-5 trên 12 thành viên</span>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-4 font-bold text-slate-700">
            10 / trang <ChevronDown aria-hidden className="h-4 w-4" />
          </button>
          <PageButton ariaLabel="Trang trước">
            <ArrowLeft aria-hidden className="h-4 w-4" />
          </PageButton>
          <button
            aria-label="Trang 1"
            className="h-9 w-9 rounded-lg border border-emerald-500 bg-emerald-50 text-sm font-extrabold text-emerald-700"
            type="button"
          >
            1
          </button>
          <button
            aria-label="Trang 2"
            className="h-9 w-9 rounded-lg border border-slate-200 bg-white text-sm font-extrabold text-slate-700"
            type="button"
          >
            2
          </button>
          <PageButton ariaLabel="Trang sau">
            <ArrowRight aria-hidden className="h-4 w-4" />
          </PageButton>
        </div>
      </div>
    </section>
  );
}

function MemberRow({
  member,
  onChangeRole,
}: {
  member: CompanyMember;
  onChangeRole: (member: CompanyMember) => void;
}) {
  const isChangeRoleAction = member.actionLabel === "Đổi vai trò";

  return (
    <tr className="align-middle text-slate-800">
      <td className="min-w-[230px] px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-emerald-100 text-xs font-extrabold text-slate-700">
            {member.avatar}
          </span>
          <div>
            <p className="font-extrabold text-slate-950">{member.fullName}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{member.email}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <RoleBadge role={member.role} />
      </td>
      <td className="px-3 py-3 font-bold">{member.department}</td>
      <td className="px-3 py-3">
        <StatusBadge status={member.status} />
      </td>
      <td className="px-3 py-3 text-center font-extrabold">{member.assignedJobCount}</td>
      <td className="px-3 py-3 text-center font-extrabold">{member.interviewCount}</td>
      <td className="min-w-[130px] px-3 py-3 font-semibold text-slate-600">
        {member.lastActiveAt}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-extrabold whitespace-nowrap text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
            onClick={() => {
              if (isChangeRoleAction) {
                onChangeRole(member);
              }
            }}
            type="button"
          >
            {member.actionLabel === "Xem chi tiết" ? <Eye aria-hidden className="h-4 w-4" /> : null}
            {member.actionLabel === "Đổi vai trò" ? (
              <UsersRound aria-hidden className="h-4 w-4" />
            ) : null}
            {member.actionLabel === "Gửi lại lời mời" ? (
              <Send aria-hidden className="h-4 w-4" />
            ) : null}
            {member.actionLabel === "Kích hoạt" ? (
              <PlayCircle aria-hidden className="h-4 w-4" />
            ) : null}
            {member.actionLabel}
          </button>
          <button
            aria-label={`Thao tác thêm cho ${member.fullName}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-50"
            type="button"
          >
            <MoreHorizontal aria-hidden className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function RoleBadge({ role }: { role: TeamRole }) {
  const definition = roleDefinitions[role];
  const Icon = definition.icon;

  return (
    <span
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-extrabold",
        roleBadgeTone[role],
      )}
    >
      <Icon aria-hidden className="h-3.5 w-3.5" />
      {definition.label}
    </span>
  );
}

function StatusBadge({ status }: { status: MemberStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-2 rounded-lg px-3 text-[11px] font-extrabold before:h-1.5 before:w-1.5 before:rounded-full",
        statusTone[status],
      )}
    >
      {statusCopy[status]}
    </span>
  );
}

function FilterButton({ label }: { label: string }) {
  return (
    <button className="flex h-11 min-w-[130px] items-center justify-between rounded-lg border border-slate-200 bg-white px-4 text-left text-xs font-bold text-slate-600">
      <span>
        <span className="block text-[11px] text-slate-500">{label}</span>
        Tất cả
      </span>
      <ChevronDown aria-hidden className="h-4 w-4 text-slate-500" />
    </button>
  );
}

function FixedRolesCard() {
  return (
    <SideCard className="overflow-hidden p-0">
      <div className="p-4">
        <h2 className="text-lg font-extrabold text-slate-950">4 vai trò cố định</h2>
        <div className="mt-5 space-y-4">
          {roleOrder.map((role) => {
            const item = roleDefinitions[role];
            const Icon = item.icon;

            return (
              <div className="flex items-center gap-4" key={role}>
                <span
                  className={cn(
                    "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                    roleIconTone[item.tone],
                  )}
                >
                  <Icon aria-hidden className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-extrabold text-slate-950">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
        <LockKey aria-hidden className="h-4 w-4" />
        Không thể tùy chỉnh quyền theo từng vai trò
      </div>
    </SideCard>
  );
}

function PermissionRulesCard() {
  return (
    <SideCard>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-extrabold text-slate-950">Quy tắc phân quyền</h2>
        <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
          Hệ thống kiểm soát
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {permissionRules.map((rule) => (
          <p
            className="flex items-start gap-2 text-xs leading-5 font-bold text-slate-600"
            key={rule}
          >
            <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-emerald-500 text-emerald-600">
              <Check aria-hidden className="h-3 w-3" />
            </span>
            {rule}
          </p>
        ))}
      </div>
    </SideCard>
  );
}

function ActivityLogTable() {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
      <div className="border-b border-slate-100 p-5">
        <h2 className="text-lg font-extrabold text-slate-950">Lịch sử hoạt động</h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Theo dõi các thay đổi vai trò, lời mời và trạng thái tài khoản.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-600">
              <th className="px-5 py-3">Thời gian</th>
              <th className="px-4 py-3">Người thao tác</th>
              <th className="px-4 py-3">Hành động</th>
              <th className="px-4 py-3">Đối tượng</th>
              <th className="px-4 py-3">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activityLogs.map((log) => (
              <tr key={`${log.time}-${log.action}`}>
                <td className="px-5 py-4 font-bold text-slate-600">{log.time}</td>
                <td className="px-4 py-4 font-extrabold text-slate-950">{log.actor}</td>
                <td className="px-4 py-4 font-bold text-emerald-700">{log.action}</td>
                <td className="px-4 py-4 font-bold text-slate-700">{log.target}</td>
                <td className="px-4 py-4 font-semibold text-slate-500">{log.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function InviteMemberDialog({ onClose, open }: { onClose: () => void; open: boolean }) {
  if (!open) {
    return null;
  }

  return (
    <DialogFrame onClose={onClose} title="Mời thành viên">
      <div className="grid gap-4">
        <TextField label="Email *" placeholder="name@company.com" type="email" />
        <TextField label="Họ tên" placeholder="Nhập họ tên" />
        <SelectField label="Vai trò *" />
        <TextField label="Phòng ban" placeholder="HR, Engineering..." />
        <TextField label="Gán tin tuyển dụng" placeholder="Frontend Developer, Backend..." />
        <label className="block">
          <span className="text-xs font-extrabold text-slate-600">Lời nhắn</span>
          <textarea
            aria-label="Lời nhắn"
            className="mt-2 min-h-20 w-full resize-none rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
            placeholder="Thêm lời nhắn cho thành viên mới"
          />
        </label>
        <p className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-xs leading-5 font-bold text-slate-600">
          Vai trò sử dụng bộ quyền cố định của hệ thống. Bạn chỉ có thể chọn vai trò, không thể
          chỉnh quyền chi tiết.
        </p>
      </div>
      <DialogActions onClose={onClose} primaryLabel="Gửi lời mời" />
    </DialogFrame>
  );
}

function ChangeRoleDialog({
  member,
  onClose,
  selectedRole,
  setSelectedRole,
}: {
  member: CompanyMember | null;
  onClose: () => void;
  selectedRole: TeamRole;
  setSelectedRole: (role: TeamRole) => void;
}) {
  if (!member) {
    return null;
  }

  const isLastOwner = member.role === "OWNER";

  return (
    <DialogFrame onClose={onClose} title="Đổi vai trò">
      <div className="space-y-4">
        <ReadOnlyField label="Thành viên" value={`${member.fullName} - ${member.email}`} />
        <ReadOnlyField label="Vai trò hiện tại" value={roleDefinitions[member.role].label} />
        <label className="block">
          <span className="text-xs font-extrabold text-slate-600">Vai trò mới</span>
          <select
            aria-label="Vai trò mới"
            className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
            disabled={isLastOwner}
            onChange={(event) => setSelectedRole(event.target.value as TeamRole)}
            value={selectedRole}
          >
            {roleOrder.map((role) => (
              <option key={role} value={role}>
                {roleDefinitions[role].label}
              </option>
            ))}
          </select>
        </label>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-extrabold text-slate-500">Tóm tắt quyền của vai trò mới</p>
          <p className="mt-2 text-sm font-bold text-slate-800">
            {roleDefinitions[selectedRole].description}
          </p>
        </div>
        {isLastOwner ? (
          <p className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs leading-5 font-bold text-amber-700">
            Không thể đổi role của Owner cuối cùng. Hệ thống luôn yêu cầu ít nhất 1 Owner.
          </p>
        ) : null}
      </div>
      <DialogActions disabled={isLastOwner} onClose={onClose} primaryLabel="Cập nhật vai trò" />
    </DialogFrame>
  );
}

function DialogFrame({
  children,
  onClose,
  title,
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 py-6">
      <section className="w-full max-w-[520px] rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-950">{title}</h2>
          <button
            aria-label="Đóng"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function DialogActions({
  disabled,
  onClose,
  primaryLabel,
}: {
  disabled?: boolean;
  onClose: () => void;
  primaryLabel: string;
}) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <button
        className="h-10 rounded-lg border border-slate-200 px-5 text-sm font-bold text-slate-700"
        onClick={onClose}
        type="button"
      >
        Hủy
      </button>
      <button
        className="h-10 rounded-lg bg-emerald-600 px-5 text-sm font-bold text-white shadow-[0_12px_26px_rgba(5,150,105,0.22)] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        disabled={disabled}
        onClick={onClose}
        type="button"
      >
        {primaryLabel}
      </button>
    </div>
  );
}

function TextField({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder: string;
  type?: "email" | "text";
}) {
  return (
    <label className="block">
      <span className="text-xs font-extrabold text-slate-600">{label}</span>
      <input
        aria-label={label}
        className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
}

function SelectField({ label }: { label: string }) {
  return (
    <label className="block">
      <span className="text-xs font-extrabold text-slate-600">{label}</span>
      <select
        aria-label={label}
        className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
      >
        {roleOrder.map((role) => (
          <option key={role} value={role}>
            {roleDefinitions[role].label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-extrabold text-slate-600">{label}</p>
      <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function SideCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

function RolesRulesDrawer({ onClose, open }: { onClose: () => void; open: boolean }) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30">
      <div className="h-full w-full max-w-[420px] overflow-y-auto border-l border-slate-200 bg-slate-50 p-4 shadow-[-24px_0_60px_rgba(15,23,42,0.14)] sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950">Vai trò và quy tắc</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Xem nhanh 4 vai trò cố định và các quy tắc hệ thống.
            </p>
          </div>
          <button
            aria-label="Đóng panel vai trò và quy tắc"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <FixedRolesCard />
          <PermissionRulesCard />
        </div>
      </div>
    </div>
  );
}

function PageButton({ ariaLabel, children }: { ariaLabel: string; children: ReactNode }) {
  return (
    <button
      aria-label={ariaLabel}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700"
      type="button"
    >
      {children}
    </button>
  );
}
