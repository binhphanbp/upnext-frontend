"use client";

import { CircleNotch, IdentificationBadge, Plus, Trash, UsersThree } from "@phosphor-icons/react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import { cn } from "@/shared/lib/cn";

const getAvatarStyle = (char: string) => {
  const code = char.toUpperCase().charCodeAt(0) || 0;
  if (code >= 65 && code <= 69) return "bg-teal-50 text-teal-700 border border-teal-100";
  if (code >= 70 && code <= 74) return "bg-indigo-50 text-indigo-700 border border-indigo-100";
  if (code >= 75 && code <= 79) return "bg-amber-50 text-amber-700 border border-amber-100";
  if (code >= 80 && code <= 84) return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  return "bg-rose-50 text-rose-700 border border-rose-100";
};

import { getRecruiterAccount } from "@/features/recruiter/api/onboarding";
import {
  assignRecruiterRolePermissions,
  getCompanyMembers,
  getRecruiterPermissions,
  getRecruiterRoles,
  inviteCompanyMember,
  removeCompanyMember,
  updateCompanyMemberRole,
  type CompanyMember,
  type RecruiterPermission,
  type RecruiterRole,
} from "@/features/recruiter/api/team";
import { clearRecruiterSession, getRecruiterSession } from "@/features/recruiter/session";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { FormInput } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2600,
  timerProgressBar: true,
});

type TeamTab = "members" | "roles" | "permissions";

const PERMISSION_NAMES: Record<string, string> = {
  "jobs:manage": "Quản lý tin tuyển dụng",
  "applications:manage": "Quản lý tất cả hồ sơ ứng viên & pipeline",
  "applications:review_assigned": "Đánh giá ứng viên được phân công",
  "interviews:manage": "Quản lý lịch phỏng vấn",
  "interviews:review_assigned": "Đánh giá phỏng vấn được phân công",
  "company:manage": "Quản lý thông tin công ty",
  "members:manage": "Quản lý thành viên & phân quyền",
  "billing:manage": "Quản lý thanh toán & gói dịch vụ",
};

type RoleLike = { code?: string | null; name?: string | null } | null | undefined;

function isOwnerRole(role: RoleLike) {
  const code = role?.code?.trim().toUpperCase();
  const name = role?.name?.trim().toUpperCase();

  return code === "OWNER" || name === "OWNER";
}

export function RecruiterTeamPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TeamTab>("members");
  const [token, setToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [roles, setRoles] = useState<RecruiterRole[]>([]);
  const [permissions, setPermissions] = useState<RecruiterPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [assignRoleId, setAssignRoleId] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === assignRoleId) ?? null,
    [assignRoleId, roles],
  );

  const currentMember = useMemo(
    () => members.find((m) => m.recruiterAccount?.id === accountId) ?? null,
    [members, accountId],
  );
  const isOwner = isOwnerRole(currentMember?.role);

  const loadTeamData = useCallback(
    async (nextAccountId: string, accessToken: string) => {
      try {
        setLoading(true);
        const account = await getRecruiterAccount(nextAccountId, accessToken);

        if (!account.company?.id) {
          void Swal.fire({
            icon: "warning",
            title: "Chưa có công ty",
            text: "Tài khoản cần gắn với công ty trước khi quản lý đội ngũ.",
          });
          router.replace("/recruiter");
          return;
        }

        const nextCompanyId = account.company.id;
        const [nextMembers, nextRoles, nextPermissions] = await Promise.all([
          getCompanyMembers(nextCompanyId, accessToken),
          getRecruiterRoles(accessToken),
          getRecruiterPermissions(accessToken),
        ]);

        setCompanyId(nextCompanyId);
        setMembers(nextMembers);
        setRoles(nextRoles);
        setPermissions(nextPermissions);
      } catch (error) {
        handleAuthError(error, router);
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    const session = getRecruiterSession();

    if (!session) {
      router.replace("/recruiter/login");
      return;
    }

    setToken(session.accessToken);
    setAccountId(session.user.id);
    void loadTeamData(session.user.id, session.accessToken);
  }, [loadTeamData, router]);

  async function reload() {
    await loadTeamData(accountId, token);
  }

  async function inviteMember() {
    if (!inviteEmail.trim()) {
      void Swal.fire({ icon: "error", title: "Vui lòng nhập email thành viên." });
      return;
    }

    try {
      setSaving(true);
      await inviteCompanyMember(companyId, inviteEmail.trim(), inviteRoleId, token);
      setInviteEmail("");
      setInviteRoleId("");
      await reload();
      void toast.fire({ icon: "success", title: "Đã gửi lời mời thành viên." });
    } catch (error) {
      showActionError(error);
    } finally {
      setSaving(false);
    }
  }

  async function changeMemberRole(memberId: string, roleId: string) {
    try {
      await updateCompanyMemberRole(memberId, roleId, token);
      await reload();
      void toast.fire({ icon: "success", title: "Đã cập nhật vai trò thành viên." });
    } catch (error) {
      showActionError(error);
    }
  }

  async function deleteMember(memberId: string) {
    const result = await Swal.fire({
      icon: "warning",
      title: "Xóa thành viên?",
      text: "Thành viên sẽ bị gỡ khỏi công ty.",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (!result.isConfirmed) return;

    try {
      await removeCompanyMember(memberId, token);
      await reload();
      void toast.fire({ icon: "success", title: "Đã xóa thành viên." });
    } catch (error) {
      showActionError(error);
    }
  }

  async function assignPermissions() {
    if (!assignRoleId || selectedPermissionIds.length === 0) {
      void Swal.fire({ icon: "error", title: "Chọn vai trò và ít nhất một quyền." });
      return;
    }

    try {
      setSaving(true);
      await assignRecruiterRolePermissions(assignRoleId, selectedPermissionIds, token);
      setSelectedPermissionIds([]);
      await reload();
      void toast.fire({ icon: "success", title: "Đã gán quyền cho vai trò." });
    } catch (error) {
      showActionError(error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center text-sm font-bold text-slate-500">
        <CircleNotch className="mr-2 size-5 animate-spin text-emerald-600" />
        Đang tải đội ngũ và phân quyền...
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-950">Đội ngũ & quyền</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="neutral">{members.length} thành viên</Badge>
          <Badge tone="neutral">{roles.length} vai trò</Badge>
          <Badge tone="neutral">{permissions.length} quyền</Badge>
        </div>
      </header>

      <Card className="upnext-shadow w-full min-w-0 rounded-lg border-slate-200 bg-white">
        <div role="tablist" className="flex flex-wrap border-b border-slate-200">
          <TabButton
            active={tab === "members"}
            icon={<UsersThree size={18} />}
            onClick={() => setTab("members")}
          >
            Thành viên công ty
          </TabButton>
          <TabButton
            active={tab === "roles"}
            icon={<IdentificationBadge size={18} />}
            onClick={() => setTab("roles")}
          >
            Vai trò
          </TabButton>
        </div>

        <div className="w-full min-w-0 p-5">
          {tab === "members" ? (
            <MembersPanel
              inviteEmail={inviteEmail}
              inviteRoleId={inviteRoleId}
              members={members}
              roles={roles}
              saving={saving}
              setInviteEmail={setInviteEmail}
              setInviteRoleId={setInviteRoleId}
              onInvite={() => void inviteMember()}
              onRemove={(memberId) => void deleteMember(memberId)}
              onRoleChange={(memberId, roleId) => void changeMemberRole(memberId, roleId)}
              isOwner={isOwner}
            />
          ) : null}
          {tab === "roles" ? (
            <RolesPanel
              assignRoleId={assignRoleId}
              permissions={permissions}
              roles={roles}
              saving={saving}
              selectedPermissionIds={selectedPermissionIds}
              selectedRole={selectedRole}
              setAssignRoleId={setAssignRoleId}
              setSelectedPermissionIds={setSelectedPermissionIds}
              onAssign={() => void assignPermissions()}
              isOwner={isOwner}
            />
          ) : null}
        </div>
      </Card>
    </div>
  );
}

function TabButton({
  active,
  children,
  icon,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={`flex items-center gap-2 border-b-2 px-5 py-4 text-sm font-bold transition ${
        active
          ? "border-emerald-600 text-emerald-700"
          : "border-transparent text-slate-500 hover:text-slate-900"
      }`}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}

function MembersPanel({
  inviteEmail,
  inviteRoleId,
  members,
  onInvite,
  onRemove,
  onRoleChange,
  roles,
  saving,
  setInviteEmail,
  setInviteRoleId,
  isOwner,
}: {
  inviteEmail: string;
  inviteRoleId: string;
  members: CompanyMember[];
  onInvite: () => void;
  onRemove: (memberId: string) => void;
  onRoleChange: (memberId: string, roleId: string) => void;
  roles: RecruiterRole[];
  saving: boolean;
  setInviteEmail: (value: string) => void;
  setInviteRoleId: (value: string) => void;
  isOwner: boolean;
}) {
  const inviteDisabled = saving || !isOwner;

  return (
    <div className="space-y-6">
      <div className="grid w-full min-w-0 gap-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4 lg:grid-cols-[minmax(0,1fr)_260px_auto]">
        <FormInput
          id="invite-email"
          label="Email thành viên"
          type="email"
          value={inviteEmail}
          onChange={(event) => setInviteEmail(event.target.value)}
          placeholder="recruiter@company.com"
          disabled={!isOwner}
        />
        <RoleSelect
          label="Vai trò"
          roles={roles}
          value={inviteRoleId}
          onValueChange={setInviteRoleId}
          disabled={!isOwner}
        />
        <div className="flex items-end">
          <Button
            className="w-full gap-2 bg-[#11a77a] font-bold hover:bg-[#0d966d]"
            disabled={inviteDisabled}
            onClick={onInvite}
          >
            <Plus size={16} />
            Mời thành viên
          </Button>
        </div>
        {!isOwner ? (
          <p className="text-xs font-semibold text-amber-700 lg:col-span-3">
            Chỉ Owner của công ty mới có quyền gửi lời mời thành viên.
          </p>
        ) : null}
      </div>

      <DataTable>
        <thead>
          <tr className="border-b border-slate-200">
            <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">Thành viên</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">Trạng thái</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">Vai trò</th>
            <th className="px-4 py-2 text-right text-sm font-semibold text-slate-700">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {members.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-500">
                <div className="flex flex-col items-center justify-center gap-3">
                  <Image
                    src="/assets/icons/empty.png"
                    alt="Empty"
                    width={100}
                    height={100}
                    priority
                    style={{ height: "auto", width: "auto" }}
                    className="opacity-90"
                  />
                  <span className="font-medium text-slate-500">Không tìm thấy thành viên nào.</span>
                </div>
              </td>
            </tr>
          ) : (
            members.map((member) => {
              const email = member.recruiterAccount?.email ?? member.invitedEmail ?? "unknown";
              const name = member.recruiterAccount?.profile?.fullName ?? email;
              const avatarUrl = member.recruiterAccount?.profile?.avatarUrl;

              return (
                <tr
                  key={member.id}
                  className="border-b border-slate-200 bg-white transition-colors last:border-b-0 hover:bg-slate-50/40"
                >
                  <td className="min-w-[180px] px-4 py-2">
                    <div className="flex w-full flex-nowrap items-center gap-2">
                      {avatarUrl ? (
                        <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-100">
                          <Image
                            src={avatarUrl}
                            alt={name}
                            width={40}
                            height={40}
                            className="aspect-square h-full w-full object-cover"
                          />
                        </span>
                      ) : (
                        <span
                          className={cn(
                            "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold uppercase",
                            getAvatarStyle(name.charAt(0)),
                          )}
                        >
                          {name.charAt(0)}
                        </span>
                      )}
                      <div>
                        <p className="text-sm leading-none font-medium text-slate-900">{name}</p>
                        <p className="mt-1 text-xs text-slate-500">{email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <Badge tone={member.status === "ACTIVE" ? "success" : "warning"}>
                      {member.status === "ACTIVE" ? "Hoạt động" : "Đang mời"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    <RoleSelect
                      label={`Vai trò của ${email}`}
                      hideLabel
                      roles={roles}
                      value={member.role?.id ?? ""}
                      onValueChange={(roleId) => onRoleChange(member.id, roleId)}
                      size="sm"
                      disabled={!isOwner}
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        "size-8 rounded-lg border-slate-200 text-slate-400 shadow-none transition-all",
                        isOwner
                          ? "hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                          : "opacity-50 cursor-not-allowed",
                      )}
                      disabled={!isOwner}
                      aria-label={`Xóa thành viên ${name}`}
                      onClick={() => onRemove(member.id)}
                    >
                      <span className="sr-only">Xóa thành viên {name}</span>
                      <Trash size={15} />
                    </Button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </DataTable>
    </div>
  );
}

function RolesPanel({
  assignRoleId,
  onAssign,
  permissions,
  roles,
  saving,
  selectedPermissionIds,
  selectedRole,
  setAssignRoleId,
  setSelectedPermissionIds,
  isOwner,
}: {
  assignRoleId: string;
  onAssign: () => void;
  permissions: RecruiterPermission[];
  roles: RecruiterRole[];
  saving: boolean;
  selectedPermissionIds: string[];
  selectedRole: RecruiterRole | null;
  setAssignRoleId: (value: string) => void;
  setSelectedPermissionIds: React.Dispatch<React.SetStateAction<string[]>>;
  isOwner: boolean;
}) {
  const assignedIds = new Set(
    selectedRole?.rolePermissions?.map(({ recruiterPermission }) => recruiterPermission.id) ?? [],
  );

  const isOwnerRoleSelected = isOwnerRole(selectedRole);

  return (
    <div className="grid w-full min-w-0 gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
      <div className="space-y-5">
        <FormCard title="Gán quyền cho vai trò">
          <RoleSelect
            label="Vai trò"
            roles={roles}
            value={assignRoleId}
            onValueChange={setAssignRoleId}
            disabled={!isOwner}
          />
          <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
            {isOwnerRoleSelected ? (
              <div className="p-4 text-center text-sm font-semibold text-slate-600">
                Vai trò Owner mặc định sở hữu toàn bộ các quyền hạn trong hệ thống và không thể thay
                đổi.
              </div>
            ) : (
              permissions.map((permission) => (
                <label
                  key={permission.id}
                  htmlFor={`assign-permission-${permission.id}`}
                  className="flex items-start gap-2 rounded-md p-2 hover:bg-slate-50"
                >
                  <Checkbox
                    id={`assign-permission-${permission.id}`}
                    checked={selectedPermissionIds.includes(permission.id)}
                    disabled={assignedIds.has(permission.id) || !isOwner || isOwnerRoleSelected}
                    onCheckedChange={(checked) =>
                      setSelectedPermissionIds((current) =>
                        checked === true
                          ? Array.from(new Set([...current, permission.id]))
                          : current.filter((id) => id !== permission.id),
                      )
                    }
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-slate-800">
                      {PERMISSION_NAMES[permission.code] || permission.code}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {assignedIds.has(permission.id) ? "Đã gán" : permission.code}
                    </span>
                  </span>
                </label>
              ))
            )}
          </div>
          <Button
            className="w-full bg-[#11a77a] font-bold hover:bg-[#0d966d]"
            disabled={saving || !isOwner || isOwnerRoleSelected}
            onClick={onAssign}
          >
            {isOwnerRoleSelected ? "Quyền Owner mặc định" : "Gán quyền"}
          </Button>
        </FormCard>
      </div>

      <div className="min-w-0">
        <DataTable>
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700" scope="col">
                Vai trò
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700" scope="col">
                Quyền
              </th>
            </tr>
          </thead>
          <tbody>
            {roles.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-12 text-center text-sm text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Image
                      src="/assets/icons/empty.png"
                      alt="Empty"
                      width={100}
                      height={100}
                      priority
                      style={{ height: "auto", width: "auto" }}
                      className="opacity-90"
                    />
                    <span className="font-medium text-slate-500">Không tìm thấy vai trò nào.</span>
                  </div>
                </td>
              </tr>
            ) : (
              roles.map((role) => (
                <tr
                  key={role.id}
                  className="border-b border-slate-200 bg-white align-top transition-colors last:border-b-0 hover:bg-slate-50/40"
                >
                  <td className="px-4 py-2">
                    <p className="leading-none font-bold text-slate-900">{role.name}</p>
                    {/* <p className="mt-1 text-xs font-semibold text-emerald-700">{role.code}</p> */}
                    <p className="mt-1.5 min-w-[200px] text-xs leading-relaxed whitespace-normal text-slate-500">
                      {role.description}
                    </p>
                  </td>
                  <td className="px-4 py-2 whitespace-normal">
                    <div className="flex max-w-xl flex-wrap gap-1.5">
                      {isOwnerRole(role) ? (
                        <Badge tone="success">Tất cả quyền</Badge>
                      ) : (
                        role.rolePermissions?.map(({ recruiterPermission }) => (
                          <Badge key={recruiterPermission.id} tone="info">
                            {PERMISSION_NAMES[recruiterPermission.code] || recruiterPermission.code}
                          </Badge>
                        ))
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </DataTable>
      </div>
    </div>
  );
}

function RoleSelect({
  hideLabel,
  label,
  onValueChange,
  roles,
  value,
  size = "default",
  disabled,
}: {
  hideLabel?: boolean;
  label: string;
  onValueChange: (value: string) => void;
  roles: RecruiterRole[];
  value: string;
  size?: "default" | "sm";
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {hideLabel ? null : <Label className="text-sm font-bold text-slate-700">{label}</Label>}
      <Select
        value={value || "none"}
        onValueChange={(next) => onValueChange(next === "none" ? "" : next)}
        disabled={!!disabled}
      >
        <SelectTrigger
          aria-label={label}
          className={cn(
            "rounded-lg border-slate-200 bg-white shadow-none font-medium text-slate-800 transition-all focus:ring-emerald-500/20 focus:border-emerald-500",
            size === "sm" ? "h-8 text-xs px-2.5 w-[140px]" : "h-10 text-sm px-3",
          )}
        >
          <SelectValue placeholder="Chọn vai trò" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Chưa chọn</SelectItem>
          {roles.map((role) => (
            <SelectItem key={role.id} value={role.id}>
              {role.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function FormCard({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <Card className="space-y-4 rounded-lg border-slate-200 bg-white p-4 shadow-none">
      <h2 className="text-base font-extrabold text-slate-950">{title}</h2>
      {children}
    </Card>
  );
}

function DataTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-x-auto rounded-md border border-slate-200 bg-white">
      <table className="w-full min-w-full border-collapse text-sm whitespace-nowrap">
        {children}
      </table>
    </div>
  );
}

function showActionError(error: unknown) {
  void Swal.fire({
    icon: "error",
    title: "Không thể xử lý",
    text: getTeamErrorMessage(error),
  });
}

function getTeamErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 400) return "Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại.";
    if (error.status === 401) return "Phiên đăng nhập đã hết hạn.";
    if (error.status === 403) return "Bạn không có quyền thực hiện thao tác này.";
    if (error.status === 404) return "Không tìm thấy dữ liệu cần thao tác.";
    if (error.status === 409) return "Dữ liệu đã tồn tại hoặc đang bị ràng buộc.";
  }

  return "Hệ thống chưa thể xử lý yêu cầu. Vui lòng thử lại.";
}

function handleAuthError(error: unknown, router: ReturnType<typeof useRouter>) {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    clearRecruiterSession();
    router.replace("/recruiter/login");
    return;
  }

  showActionError(error);
}
