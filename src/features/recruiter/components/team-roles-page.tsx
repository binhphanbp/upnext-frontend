"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import {
  activityLogs,
  permissionRules as fallbackPermissionRules,
  teamTabs,
  type TeamTabId,
} from "@/features/recruiter/data/team-data";
import {
  useInviteCompanyMember,
  useTeamPageData,
  useUpdateCompanyMemberRole,
} from "@/features/recruiter/hooks/use-team-page-data";
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
import {
  type CompanyMember,
  type MemberStatus,
  type RecruiterRoleDefinition,
  type TeamKpi,
} from "@/features/recruiter/types";
import { cn } from "@/shared/lib/cn";

const kpiTone = {
  amber: "bg-amber-50 text-amber-500",
  emerald: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-500",
} as const;

const roleBadgeTone = {
  blue: "border-blue-100 bg-blue-50 text-blue-700",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
  orange: "border-orange-100 bg-orange-50 text-orange-700",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
  violet: "border-violet-100 bg-violet-50 text-violet-700",
} as const;

const roleIconTone = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  orange: "bg-orange-50 text-orange-600",
  slate: "bg-slate-100 text-slate-600",
  violet: "bg-violet-50 text-violet-600",
} as const;

export function TeamRolesPage() {
  const { error, isLoading, kpis, members, refetchMembers, roles } = useTeamPageData();
  const inviteMutation = useInviteCompanyMember();
  const updateRoleMutation = useUpdateCompanyMemberRole();

  const [activeTab, setActiveTab] = useState<TeamTabId>("members");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [rolesDrawerOpen, setRolesDrawerOpen] = useState(false);
  const [detailMember, setDetailMember] = useState<CompanyMember | null>(null);
  const [roleMember, setRoleMember] = useState<CompanyMember | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");

  useEffect(() => {
    function openInviteDialog() {
      setInviteOpen(true);
    }

    window.addEventListener("upnext:open-invite-member", openInviteDialog);
    return () => window.removeEventListener("upnext:open-invite-member", openInviteDialog);
  }, []);

  useEffect(() => {
    function openMemberDetail(event: Event) {
      const memberId =
        event instanceof CustomEvent && typeof event.detail === "string" ? event.detail : null;

      if (!memberId) {
        return;
      }

      setDetailMember(members.find((member) => member.id === memberId) ?? null);
    }

    window.addEventListener("upnext:open-member-detail", openMemberDetail);
    return () => window.removeEventListener("upnext:open-member-detail", openMemberDetail);
  }, [members]);

  useEffect(() => {
    if (!selectedRoleId && roles[0]) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  function openRoleDialog(member: CompanyMember) {
    setSelectedRoleId(member.roleId);
    setRoleMember(member);
  }

  async function handleInviteMember(payload: { email: string; roleId: string }) {
    await inviteMutation.mutateAsync(payload);
    setInviteOpen(false);
  }

  async function handleChangeRole() {
    if (!roleMember || !selectedRoleId) {
      return;
    }

    await updateRoleMutation.mutateAsync({
      memberId: roleMember.id,
      roleId: selectedRoleId,
    });
    setRoleMember(null);
  }

  const pageError = error ? getErrorMessage(error) : null;

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

        {pageError ? (
          <div className="mt-5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {pageError}
          </div>
        ) : null}

        <TeamKpiGrid items={kpis} />

        <TeamTabs activeTab={activeTab} onChange={setActiveTab} />

        <div className="mt-0">
          {activeTab === "members" ? (
            <MembersPanel
              isLoading={isLoading}
              members={members}
              onChangeRole={openRoleDialog}
              onViewDetails={setDetailMember}
              onRefresh={() => {
                void refetchMembers();
              }}
              roles={roles}
            />
          ) : null}
          {activeTab === "activity" ? <ActivityLogTable /> : null}
        </div>
      </section>

      <InviteMemberDialog
        isPending={inviteMutation.isPending}
        onClose={() => setInviteOpen(false)}
        onSubmit={handleInviteMember}
        open={inviteOpen}
        roles={roles}
      />
      <ChangeRoleDialog
        isPending={updateRoleMutation.isPending}
        member={roleMember}
        onClose={() => setRoleMember(null)}
        onSubmit={handleChangeRole}
        roles={roles}
        selectedRoleId={selectedRoleId}
        setSelectedRoleId={setSelectedRoleId}
      />
      <MemberDetailDialog
        member={detailMember}
        onClose={() => setDetailMember(null)}
        roles={roles}
      />
      <RolesRulesDrawer
        fallbackRules={fallbackPermissionRules}
        onClose={() => setRolesDrawerOpen(false)}
        open={rolesDrawerOpen}
        roles={roles}
      />
    </div>
  );
}

function TeamKpiGrid({ items }: { items: TeamKpi[] }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
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
                <UsersRound aria-hidden className="h-6 w-6" />
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
                {item.trend}
              </span>
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

function MembersPanel({
  isLoading,
  members,
  onChangeRole,
  onViewDetails,
  onRefresh,
  roles,
}: {
  isLoading: boolean;
  members: CompanyMember[];
  onChangeRole: (member: CompanyMember) => void;
  onViewDetails: (member: CompanyMember) => void;
  onRefresh: () => void;
  roles: RecruiterRoleDefinition[];
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const normalizedSearch = search.trim().toLowerCase();
      const searchMatch =
        normalizedSearch.length === 0 ||
        member.fullName.toLowerCase().includes(normalizedSearch) ||
        member.email.toLowerCase().includes(normalizedSearch);
      const roleMatch = roleFilter === "ALL" || member.roleId === roleFilter;
      const statusMatch = statusFilter === "ALL" || member.status === statusFilter;

      return searchMatch && roleMatch && statusMatch;
    });
  }, [members, roleFilter, search, statusFilter]);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
      <div className="border-b border-slate-100 p-4">
        <div className="flex flex-wrap gap-3">
          <label className="relative min-w-[260px] flex-[1.5_1_320px]">
            <span className="sr-only">Tìm thành viên</span>
            <input
              aria-label="Tìm thành viên"
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pr-10 pl-4 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm thành viên, email..."
              type="search"
              value={search}
            />
            <Search
              aria-hidden
              className="absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-slate-500"
            />
          </label>
          <FilterButton
            label="Vai trò"
            onChange={setRoleFilter}
            options={[
              { label: "Tất cả", value: "ALL" },
              ...roles.map((role) => ({ label: role.label, value: role.id })),
            ]}
            value={roleFilter}
          />
          <FilterButton
            label="Trạng thái"
            onChange={setStatusFilter}
            options={[
              { label: "Tất cả", value: "ALL" },
              { label: "Hoạt động", value: "ACTIVE" },
              { label: "Chờ xác nhận", value: "PENDING" },
              { label: "Tạm khóa", value: "SUSPENDED" },
            ]}
            value={statusFilter}
          />
          <button
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-700"
            onClick={onRefresh}
            type="button"
          >
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
            {isLoading ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-sm font-semibold text-slate-500"
                  colSpan={8}
                >
                  Đang tải danh sách thành viên...
                </td>
              </tr>
            ) : null}
            {!isLoading && filteredMembers.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-sm font-semibold text-slate-500"
                  colSpan={8}
                >
                  Chưa có thành viên nào khớp bộ lọc hiện tại.
                </td>
              </tr>
            ) : null}
            {!isLoading
              ? filteredMembers.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    onChangeRole={onChangeRole}
                    onViewDetails={onViewDetails}
                    roles={roles}
                  />
                ))
              : null}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4 text-sm font-semibold text-slate-500 lg:flex-row lg:items-center">
        <span>
          Hiển thị {filteredMembers.length === 0 ? 0 : 1}-{filteredMembers.length} trên{" "}
          {members.length} thành viên
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-4 font-bold text-slate-700">
            Tất cả <ChevronDown aria-hidden className="h-4 w-4" />
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
  onViewDetails,
  roles,
}: {
  member: CompanyMember;
  onChangeRole: (member: CompanyMember) => void;
  onViewDetails: (member: CompanyMember) => void;
  roles: RecruiterRoleDefinition[];
}) {
  const isChangeRoleAction = member.actionLabel === "Đổi vai trò";
  const role = findRoleDefinition(roles, member.roleId, member.roleCode, member.roleName);

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
        <RoleBadge role={role} />
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
            aria-label={`${member.actionLabel} cho ${member.fullName}`}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-extrabold whitespace-nowrap text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
            onClick={() => {
              if (isChangeRoleAction) {
                onChangeRole(member);
                return;
              }

              onViewDetails(member);
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

function MemberDetailDialog({
  member,
  onClose,
  roles,
}: {
  member: CompanyMember | null;
  onClose: () => void;
  roles: RecruiterRoleDefinition[];
}) {
  if (!member) {
    return null;
  }

  const role = findRoleDefinition(roles, member.roleId, member.roleCode, member.roleName);

  return (
    <DialogFrame onClose={onClose} title="Chi tiết thành viên">
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-emerald-100 text-sm font-extrabold text-slate-700">
            {member.avatar}
          </span>
          <div>
            <p className="font-extrabold text-slate-950">{member.fullName}</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">{member.email}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-extrabold text-slate-600">Vai trò</p>
            <div className="mt-2">
              <RoleBadge role={role} />
            </div>
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-600">Trạng thái</p>
            <div className="mt-2">
              <StatusBadge status={member.status} />
            </div>
          </div>
          <ReadOnlyField label="Phòng ban" value={member.department} />
          <ReadOnlyField label="Hoạt động cuối" value={member.lastActiveAt} />
          <ReadOnlyField label="Tin phụ trách" value={`${member.assignedJobCount}`} />
          <ReadOnlyField label="Lịch phỏng vấn" value={`${member.interviewCount}`} />
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          className="h-10 rounded-lg bg-emerald-600 px-5 text-sm font-bold text-white shadow-[0_12px_26px_rgba(5,150,105,0.22)]"
          onClick={onClose}
          type="button"
        >
          Đóng
        </button>
      </div>
    </DialogFrame>
  );
}

function RoleBadge({ role }: { role: RecruiterRoleDefinition }) {
  const Icon = role.icon;

  return (
    <span
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-extrabold",
        roleBadgeTone[role.tone],
      )}
    >
      <Icon aria-hidden className="h-3.5 w-3.5" />
      {role.label}
    </span>
  );
}

function StatusBadge({ status }: { status: MemberStatus }) {
  const { label, tone } = getStatusPresentation(status);

  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-2 rounded-lg px-3 text-[11px] font-extrabold before:h-1.5 before:w-1.5 before:rounded-full",
        tone,
      )}
    >
      {label}
    </span>
  );
}

function FilterButton({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  const fieldId = `team-filter-${label.toLowerCase().replace(/[^a-z0-9]+/gu, "-")}`;

  return (
    <div className="flex h-11 min-w-[130px] items-center justify-between rounded-lg border border-slate-200 bg-white px-4 text-left text-xs font-bold text-slate-600">
      <label htmlFor={fieldId}>
        <span className="block text-[11px] text-slate-500">{label}</span>
      </label>
      <select
        id={fieldId}
        className="min-w-[82px] bg-transparent text-right text-xs font-bold text-slate-700 outline-none"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FixedRolesCard({ roles }: { roles: RecruiterRoleDefinition[] }) {
  return (
    <SideCard className="overflow-hidden p-0">
      <div className="p-4">
        <h2 className="text-lg font-extrabold text-slate-950">{roles.length} vai trò hiện có</h2>
        <div className="mt-5 space-y-4">
          {roles.map((role) => {
            const Icon = role.icon;

            return (
              <div className="flex items-center gap-4" key={role.id}>
                <span
                  className={cn(
                    "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                    roleIconTone[role.tone],
                  )}
                >
                  <Icon aria-hidden className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-extrabold text-slate-950">{role.label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{role.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
        <LockKey aria-hidden className="h-4 w-4" />
        Các quyền hiện được backend quản lý theo từng vai trò
      </div>
    </SideCard>
  );
}

function PermissionRulesCard({
  fallbackRules,
  roles,
}: {
  fallbackRules: readonly string[];
  roles: RecruiterRoleDefinition[];
}) {
  const permissionLines =
    roles.flatMap((role) => role.permissions.map((permission) => `${role.label}: ${permission}`)) ||
    [];

  const lines = permissionLines.length > 0 ? permissionLines : [...fallbackRules];

  return (
    <SideCard>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-extrabold text-slate-950">Quy tắc phân quyền</h2>
        <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
          Hệ thống kiểm soát
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {lines.map((rule) => (
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

function InviteMemberDialog({
  isPending,
  onClose,
  onSubmit,
  open,
  roles,
}: {
  isPending: boolean;
  onClose: () => void;
  onSubmit: (payload: { email: string; roleId: string }) => Promise<void>;
  open: boolean;
  roles: RecruiterRoleDefinition[];
}) {
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");

  useEffect(() => {
    if (!open) {
      setEmail("");
      setRoleId(roles[0]?.id ?? "");
      return;
    }

    if (!roleId && roles[0]) {
      setRoleId(roles[0].id);
    }
  }, [open, roleId, roles]);

  if (!open) {
    return null;
  }

  async function handleSubmit() {
    if (!email || !roleId) {
      return;
    }

    await onSubmit({
      email,
      roleId,
    });
  }

  return (
    <DialogFrame onClose={onClose} title="Mời thành viên">
      <div className="grid gap-4">
        <TextField
          label="Email *"
          onChange={setEmail}
          placeholder="recruiter@company.com"
          type="email"
          value={email}
        />
        <SelectField
          label="Vai trò *"
          onChange={setRoleId}
          options={roles.map((role) => ({
            label: role.label,
            value: role.id,
          }))}
          value={roleId}
        />
        <p className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-xs leading-5 font-bold text-slate-600">
          Backend hiện hỗ trợ gửi lời mời bằng email và role. Email này cần đã có recruiterAccount
          trước khi mời vào công ty.
        </p>
      </div>
      <DialogActions
        disabled={isPending || !email || !roleId}
        onClose={onClose}
        onSubmit={() => {
          void handleSubmit();
        }}
        primaryLabel={isPending ? "Đang gửi..." : "Gửi lời mời"}
      />
    </DialogFrame>
  );
}

function ChangeRoleDialog({
  isPending,
  member,
  onClose,
  onSubmit,
  roles,
  selectedRoleId,
  setSelectedRoleId,
}: {
  isPending: boolean;
  member: CompanyMember | null;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  roles: RecruiterRoleDefinition[];
  selectedRoleId: string;
  setSelectedRoleId: (roleId: string) => void;
}) {
  if (!member) {
    return null;
  }

  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? roles[0] ?? null;
  const isLastOwner = member.roleCode === "OWNER";

  return (
    <DialogFrame onClose={onClose} title="Đổi vai trò">
      <div className="space-y-4">
        <ReadOnlyField label="Thành viên" value={`${member.fullName} - ${member.email}`} />
        <ReadOnlyField label="Vai trò hiện tại" value={member.roleName} />
        <SelectField
          disabled={isLastOwner}
          label="Vai trò mới"
          onChange={setSelectedRoleId}
          options={roles.map((role) => ({
            label: role.label,
            value: role.id,
          }))}
          value={selectedRoleId}
        />
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-extrabold text-slate-500">Tóm tắt quyền của vai trò mới</p>
          <p className="mt-2 text-sm font-bold text-slate-800">
            {selectedRole?.description ?? "Vai trò tuyển dụng"}
          </p>
        </div>
        {isLastOwner ? (
          <p className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs leading-5 font-bold text-amber-700">
            Không thể đổi role của Owner cuối cùng. Hệ thống luôn yêu cầu ít nhất 1 Owner.
          </p>
        ) : null}
      </div>
      <DialogActions
        disabled={isLastOwner || isPending || !selectedRoleId}
        onClose={onClose}
        onSubmit={() => {
          void onSubmit();
        }}
        primaryLabel={isPending ? "Đang cập nhật..." : "Cập nhật vai trò"}
      />
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
  onSubmit,
  primaryLabel,
}: {
  disabled?: boolean;
  onClose: () => void;
  onSubmit: () => void;
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
        onClick={onSubmit}
        type="button"
      >
        {primaryLabel}
      </button>
    </div>
  );
}

function TextField({
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "email" | "text";
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-extrabold text-slate-600">{label}</span>
      <input
        aria-label={label}
        className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function SelectField({
  disabled,
  label,
  onChange,
  options,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-extrabold text-slate-600">{label}</span>
      <select
        aria-label={label}
        className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
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

function RolesRulesDrawer({
  fallbackRules,
  onClose,
  open,
  roles,
}: {
  fallbackRules: readonly string[];
  onClose: () => void;
  open: boolean;
  roles: RecruiterRoleDefinition[];
}) {
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
              Xem nhanh các vai trò hiện có và các quyền hệ thống đang trả về từ backend.
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
          <FixedRolesCard roles={roles} />
          <PermissionRulesCard fallbackRules={fallbackRules} roles={roles} />
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

function findRoleDefinition(
  roles: RecruiterRoleDefinition[],
  roleId: string,
  roleCode: string,
  roleName: string,
) {
  return (
    roles.find((role) => role.id === roleId) ??
    roles.find((role) => role.code === roleCode) ?? {
      code: roleCode,
      description: "Vai trò tuyển dụng",
      icon: UsersRound,
      id: roleId,
      label: roleName,
      permissions: [],
      tone: "slate" as const,
    }
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Không thể tải dữ liệu thành viên.";
}

function getStatusPresentation(status: MemberStatus) {
  switch (status) {
    case "ACTIVE":
      return {
        label: "Hoạt động",
        tone: "bg-emerald-50 text-emerald-700 before:bg-emerald-500",
      };
    case "PENDING":
      return {
        label: "Chờ xác nhận",
        tone: "bg-amber-50 text-amber-700 before:bg-amber-500",
      };
    default:
      return {
        label: "Tạm khóa",
        tone: "bg-rose-50 text-rose-700 before:bg-rose-500",
      };
  }
}
