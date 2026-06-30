"use client";

import {
  CaretDown,
  CircleNotch,
  IdentificationBadge,
  Plus,
  ShieldCheck,
  Trash,
  UsersThree,
  X,
} from "@phosphor-icons/react";
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

import { useTranslations } from "next-intl";

import { getRecruiterAccount } from "@/features/recruiter/api/onboarding";
import {
  createRecruiterRoleWithPermissions,
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

import { RecruiterTableLayout } from "./recruiter-table-layout";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2600,
  timerProgressBar: true,
});

type TeamTab = "members" | "roles" | "permissions";

type RoleLike = { code?: string | null; name?: string | null } | null | undefined;

function isOwnerRole(role: RoleLike) {
  const code = role?.code?.trim().toUpperCase();
  const name = role?.name?.trim().toUpperCase();

  return code === "OWNER" || name === "OWNER";
}

export function RecruiterTeamPage() {
  const router = useRouter();
  const t = useTranslations("Recruiter");

  const [tab, setTab] = useState<TeamTab>("members");
  const [token, setToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<string>("UNVERIFIED");
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [roles, setRoles] = useState<RecruiterRole[]>([]);
  const [permissions, setPermissions] = useState<RecruiterPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [newRoleName, setNewRoleName] = useState("");
  const [newRolePermissionIds, setNewRolePermissionIds] = useState<string[]>([]);

  const getPermissionName = useCallback(
    (code: string) => {
      const key = `team.permissionNames.${code.replace(":", "_")}` as any;
      try {
        return t(key);
      } catch {
        return code;
      }
    },
    [t],
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
            title: t("companyProfile.errors.noProfileTitle"),
            text: t("companyProfile.errors.noProfileText"),
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

        // Synthetically prepend the company creator/owner if not already in the members list
        const currentMemberExists = nextMembers.some((m) => m.recruiterAccount?.id === account.id);
        if (!currentMemberExists) {
          const ownerRole = nextRoles.find((r) => r.code === "OWNER") ?? {
            id: "owner-role-id",
            code: "OWNER",
            name: "Owner",
          };
          const ownerMember: CompanyMember = {
            id: `owner-${account.id}`,
            invitedEmail: account.email,
            status: "ACTIVE",
            joinedAt: new Date().toISOString(),
            recruiterAccount: {
              id: account.id,
              email: account.email,
              status: "ACTIVE",
              profile: account.profile
                ? {
                    fullName: account.profile.fullName,
                    avatarUrl: account.profile.avatarUrl,
                  }
                : null,
            },
            role: {
              id: ownerRole.id,
              code: ownerRole.code,
              name: ownerRole.name,
            },
          };
          nextMembers.unshift(ownerMember);
        }

        setCompanyId(nextCompanyId);
        setVerificationStatus(account.company.verificationStatus);
        setMembers(nextMembers);
        setRoles(nextRoles);
        setPermissions(nextPermissions);
      } catch (error) {
        handleAuthError(error, router);
      } finally {
        setLoading(false);
      }
    },
    [router, t],
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
      void Swal.fire({ icon: "error", title: t("team.inviteDialog.emailLabel") });
      return;
    }

    try {
      setSaving(true);
      await inviteCompanyMember(companyId, inviteEmail.trim(), inviteRoleId, token);
      setInviteEmail("");
      setInviteRoleId("");
      await reload();
      void toast.fire({ icon: "success", title: t("team.messages.inviteSuccess") });
    } catch (error) {
      showActionError(error, t);
    } finally {
      setSaving(false);
    }
  }

  async function changeMemberRole(memberId: string, roleId: string) {
    try {
      await updateCompanyMemberRole(memberId, roleId, token);
      await reload();
      void toast.fire({ icon: "success", title: t("team.messages.roleSaveSuccess") });
    } catch (error) {
      showActionError(error, t);
    }
  }

  async function deleteMember(memberId: string) {
    const result = await Swal.fire({
      icon: "warning",
      title: t("team.messages.deleteMemberConfirm"),
      text: t("team.messages.deleteMemberWarning"),
      showCancelButton: true,
      confirmButtonText: t("team.actions.delete"),
      cancelButtonText: t("team.actions.cancel"),
    });

    if (!result.isConfirmed) return;

    try {
      await removeCompanyMember(memberId, token);
      await reload();
      void toast.fire({ icon: "success", title: t("team.messages.deleteMemberSuccess") });
    } catch (error) {
      showActionError(error, t);
    }
  }

  async function createRole() {
    const roleName = newRoleName.trim();

    if (!roleName || newRolePermissionIds.length === 0) {
      void Swal.fire({ icon: "error", title: t("team.roleDialog.roleNameRequired") });
      return;
    }

    try {
      setSaving(true);
      await createRecruiterRoleWithPermissions({ name: roleName }, newRolePermissionIds, token);
      setNewRoleName("");
      setNewRolePermissionIds([]);
      await reload();
      void toast.fire({ icon: "success", title: t("team.messages.roleSaveSuccess") });
    } catch (error) {
      showActionError(error, t);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center text-sm font-bold text-slate-500">
        <CircleNotch className="mr-2 size-5 animate-spin text-emerald-600" />
        {t("shell.loading")}
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">{t("team.title")}</h1>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-100 bg-teal-50/60 px-4 py-2 text-sm font-bold text-teal-800">
            <UsersThree size={16} className="text-teal-600" />
            {t("team.membersBadge", { count: members.length })}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/60 px-4 py-2 text-sm font-bold text-indigo-800">
            <IdentificationBadge size={16} className="text-indigo-600" />
            {t("team.rolesBadge", { count: roles.length })}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50/60 px-4 py-2 text-sm font-bold text-amber-800">
            <ShieldCheck size={16} className="text-amber-600" />
            {t("team.permissionsBadge", { count: permissions.length })}
          </span>
        </div>
      </header>

      <Card className="upnext-shadow w-full min-w-0 rounded-lg border-slate-200 bg-white">
        <div role="tablist" className="flex flex-wrap border-b border-slate-200">
          <TabButton
            active={tab === "members"}
            icon={<UsersThree size={18} />}
            onClick={() => setTab("members")}
          >
            {t("team.tabs.members")}
          </TabButton>
          <TabButton
            active={tab === "roles"}
            icon={<IdentificationBadge size={18} />}
            onClick={() => setTab("roles")}
          >
            {t("team.tabs.roles")}
          </TabButton>
        </div>

        <div className="w-full min-w-0 p-5">
          {tab === "members" ? (
            <MembersPanel
              isCompanyVerified={verificationStatus === "VERIFIED"}
              verificationStatus={verificationStatus}
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
              accountId={accountId}
              t={t}
            />
          ) : null}
          {tab === "roles" ? (
            <RolesPanel
              permissions={permissions}
              roles={roles}
              saving={saving}
              newRoleName={newRoleName}
              selectedPermissionIds={newRolePermissionIds}
              setNewRoleName={setNewRoleName}
              setSelectedPermissionIds={setNewRolePermissionIds}
              onCreateRole={() => void createRole()}
              isOwner={isOwner}
              t={t}
              getPermissionName={getPermissionName}
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
  isCompanyVerified,
  verificationStatus,
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
  accountId,
  t,
}: {
  isCompanyVerified: boolean;
  verificationStatus: string;
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
  accountId: string;
  t: any;
}) {
  const inviteDisabled = saving || !isOwner || !isCompanyVerified;

  return (
    <div className="space-y-6">
      {!isCompanyVerified ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-amber-200 bg-amber-50/40 p-6 text-center">
          <ShieldCheck size={32} className="mb-2 text-amber-500" />
          <p className="text-sm font-semibold text-amber-800">
            {verificationStatus === "PENDING"
              ? "Hồ sơ công ty của bạn đang chờ phê duyệt. Bạn chỉ có thể mời thành viên sau khi được quản trị viên xác thực."
              : "Công ty của bạn chưa được xác thực. Vui lòng hoàn tất hồ sơ và chờ quản trị viên phê duyệt trước khi thêm thành viên."}
          </p>
        </div>
      ) : (
        <div className="grid w-full min-w-0 gap-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4 lg:grid-cols-[minmax(0,1fr)_260px_auto]">
          <FormInput
            id="invite-email"
            label={t("team.inviteDialog.emailLabel")}
            type="email"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            placeholder="recruiter@company.com"
            disabled={!isOwner}
          />
          <RoleSelect
            label={t("team.inviteDialog.roleLabel")}
            roles={roles}
            value={inviteRoleId}
            onValueChange={setInviteRoleId}
            disabled={!isOwner}
            t={t}
          />
          <div className="flex items-end">
            <Button
              className="w-full gap-2 bg-[#11a77a] font-bold hover:bg-[#0d966d]"
              disabled={inviteDisabled}
              onClick={onInvite}
            >
              <Plus size={16} />
              {t("team.actions.inviteMember")}
            </Button>
          </div>
          {!isOwner ? (
            <p className="text-xs font-semibold text-amber-700 lg:col-span-3">
              {t("team.alerts.inviteOwnerOnly")}
            </p>
          ) : null}
        </div>
      )}

      <RecruiterTableLayout loading={false}>
        <thead>
          <tr>
            <th>{t("team.table.member")}</th>
            <th>{t("team.table.status")}</th>
            <th>{t("team.table.role")}</th>
            <th className="text-right">{t("team.table.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {members.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center">
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-500">
                  <Image
                    src="/assets/icons/empty.png"
                    alt="Empty"
                    width={100}
                    height={100}
                    priority
                    style={{ height: "auto", width: "auto" }}
                    className="opacity-90"
                  />
                  <span className="font-medium">{t("team.table.emptyMembers")}</span>
                </div>
              </td>
            </tr>
          ) : (
            members.map((member) => {
              const email = member.recruiterAccount?.email ?? member.invitedEmail ?? "unknown";
              const name = member.recruiterAccount?.profile?.fullName ?? email;
              const avatarUrl = member.recruiterAccount?.profile?.avatarUrl;

              const isSelf = member.recruiterAccount?.id === accountId;
              const isMemberOwner = isOwnerRole(member.role);
              const disableActions = !isOwner || isSelf || isMemberOwner;

              return (
                <tr key={member.id}>
                  <td className="min-w-[180px]">
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
                  <td>
                    <Badge tone={member.status === "ACTIVE" ? "success" : "warning"}>
                      {member.status === "ACTIVE"
                        ? t("team.status.active")
                        : t("team.status.pending")}
                    </Badge>
                  </td>
                  <td>
                    <RoleSelect
                      label={`${t("team.table.role")} ${email}`}
                      hideLabel
                      roles={roles}
                      value={member.role?.id ?? ""}
                      onValueChange={(roleId) => onRoleChange(member.id, roleId)}
                      size="sm"
                      disabled={disableActions}
                      t={t}
                    />
                  </td>
                  <td className="text-right">
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        "size-8 rounded-lg border-slate-200 text-slate-400 shadow-none transition-all",
                        !disableActions
                          ? "hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                          : "opacity-50 cursor-not-allowed",
                      )}
                      disabled={disableActions}
                      aria-label={`${t("team.actions.delete")} ${name}`}
                      onClick={() => onRemove(member.id)}
                    >
                      <span className="sr-only">
                        {t("team.actions.delete")} {name}
                      </span>
                      <Trash size={15} />
                    </Button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </RecruiterTableLayout>
    </div>
  );
}

function RolesPanel({
  newRoleName,
  onCreateRole,
  permissions,
  roles,
  saving,
  selectedPermissionIds,
  setNewRoleName,
  setSelectedPermissionIds,
  isOwner,
  t,
  getPermissionName,
}: {
  newRoleName: string;
  onCreateRole: () => void;
  permissions: RecruiterPermission[];
  roles: RecruiterRole[];
  saving: boolean;
  selectedPermissionIds: string[];
  setNewRoleName: (value: string) => void;
  setSelectedPermissionIds: React.Dispatch<React.SetStateAction<string[]>>;
  isOwner: boolean;
  t: any;
  getPermissionName: (code: string) => string;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isDropdownDisabled = !isOwner;

  return (
    <div className="grid w-full min-w-0 gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
      <div className="space-y-5">
        <FormCard title={t("team.roleDialog.createTitle")}>
          <FormInput
            id="recruiter-role-name"
            label={t("team.roleDialog.nameLabel")}
            value={newRoleName}
            onChange={(event) => setNewRoleName(event.target.value)}
            placeholder={t("team.roleDialog.namePlaceholder")}
            disabled={!isOwner}
          />

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-bold text-slate-700">
              {t("team.table.permissions")}
            </Label>
            <div className="relative">
              <button
                type="button"
                disabled={isDropdownDisabled}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={cn(
                  "flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-none transition-all hover:bg-slate-50 focus:border-emerald-500 focus:ring-emerald-500/20 disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed",
                  isDropdownOpen && "border-emerald-500 ring-1 ring-emerald-500/20",
                )}
              >
                <span className="truncate font-medium">
                  {selectedPermissionIds.length === 0
                    ? t("team.roleDialog.selectPermissions")
                    : t("team.permissionsBadge", { count: selectedPermissionIds.length })}
                </span>
                <CaretDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </button>

              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    role="presentation"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute right-0 left-0 z-20 mt-1.5 max-h-60 space-y-1.5 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                    {permissions.map((permission) => {
                      return (
                        <label
                          key={permission.id}
                          htmlFor={`assign-permission-${permission.id}`}
                          className="flex cursor-pointer items-start gap-2.5 rounded-md p-2 select-none hover:bg-slate-50"
                        >
                          <Checkbox
                            id={`assign-permission-${permission.id}`}
                            checked={selectedPermissionIds.includes(permission.id)}
                            onCheckedChange={(checked) =>
                              setSelectedPermissionIds((current) =>
                                checked === true
                                  ? Array.from(new Set([...current, permission.id]))
                                  : current.filter((id) => id !== permission.id),
                              )
                            }
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm leading-tight font-bold text-slate-800">
                              {getPermissionName(permission.code)}
                            </span>
                            <span className="mt-0.5 block text-[10px] font-semibold text-slate-400">
                              {permission.code}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {selectedPermissionIds.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500">
                Quyền hạn chuẩn bị gán:
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {selectedPermissionIds.map((id) => {
                  const perm = permissions.find((p) => p.id === id);
                  if (!perm) return null;
                  return (
                    <Badge
                      key={id}
                      tone="info"
                      className="flex items-center gap-1.5 py-0.5 pr-1 text-xs"
                    >
                      {getPermissionName(perm.code)}
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedPermissionIds((curr) => curr.filter((x) => x !== id))
                        }
                        className="cursor-pointer rounded-full p-0.5 transition-colors hover:bg-sky-100 hover:text-sky-800"
                      >
                        <X size={10} />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          <Button
            className="w-full bg-[#11a77a] font-bold hover:bg-[#0d966d]"
            disabled={
              saving || !isOwner || !newRoleName.trim() || selectedPermissionIds.length === 0
            }
            onClick={() => {
              onCreateRole();
              setIsDropdownOpen(false);
            }}
          >
            {saving ? t("team.actions.saving") : t("team.roleDialog.createSubmit")}
          </Button>
          {!isOwner ? (
            <p className="text-xs font-semibold text-amber-700">{t("team.alerts.roleOwnerOnly")}</p>
          ) : null}
        </FormCard>
      </div>

      <div className="min-w-0">
        <RecruiterTableLayout loading={false}>
          <thead>
            <tr>
              <th scope="col">{t("team.table.role")}</th>
              <th scope="col">{t("team.table.permissions")}</th>
            </tr>
          </thead>
          <tbody>
            {roles.length === 0 ? (
              <tr>
                <td colSpan={2} className="text-center">
                  <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-500">
                    <Image
                      src="/assets/icons/empty.png"
                      alt="Empty"
                      width={100}
                      height={100}
                      priority
                      style={{ height: "auto", width: "auto" }}
                      className="opacity-90"
                    />
                    <span className="font-medium">{t("team.table.emptyRoles")}</span>
                  </div>
                </td>
              </tr>
            ) : (
              roles.map((role) => (
                <tr key={role.id} className="align-top">
                  <td>
                    <p className="leading-none font-bold text-slate-900">{role.name}</p>
                    <p className="mt-1.5 min-w-[200px] text-xs leading-relaxed whitespace-normal text-slate-500">
                      {role.description}
                    </p>
                  </td>
                  <td className="whitespace-normal">
                    <div className="flex max-w-xl flex-wrap gap-1.5">
                      {isOwnerRole(role) ? (
                        <Badge tone="success">{t("team.table.allPermissions")}</Badge>
                      ) : (
                        role.rolePermissions?.map(({ recruiterPermission }) => (
                          <Badge key={recruiterPermission.id} tone="info">
                            {getPermissionName(recruiterPermission.code)}
                          </Badge>
                        ))
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </RecruiterTableLayout>
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
  t,
}: {
  hideLabel?: boolean;
  label: string;
  onValueChange: (value: string) => void;
  roles: RecruiterRole[];
  value: string;
  size?: "default" | "sm";
  disabled?: boolean;
  t: any;
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
          <SelectValue placeholder={t("team.table.role")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{t("team.roleDialog.selectRoleFirst")}</SelectItem>
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

function showActionError(error: unknown, t: any) {
  void Swal.fire({
    icon: "error",
    title: t("team.messages.errorTitle"),
    text: getTeamErrorMessage(error, t),
  });
}

function getTeamErrorMessage(error: unknown, t: any) {
  if (error instanceof ApiError) {
    const payload = error.payload as any;
    if (payload && typeof payload === "object") {
      if (Array.isArray(payload.message)) {
        return payload.message.join(", ");
      }
      if (typeof payload.message === "string") {
        return payload.message;
      }
    }
    if (error.message && !error.message.startsWith("Request failed with status")) {
      return error.message;
    }

    if (error.status === 400) return t("onboarding.companyProfile.errors.badData");
    if (error.status === 401) return t("onboarding.companyProfile.errors.sessionExpired");
    if (error.status === 403) return t("onboarding.companyProfile.errors.forbidden");
    if (error.status === 404) return t("onboarding.companyProfile.errors.notFound");
    if (error.status === 409) return t("onboarding.companyProfile.errors.unknown");
  }

  return t("onboarding.companyProfile.errors.unknown");
}

function handleAuthError(error: unknown, router: ReturnType<typeof useRouter>) {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    clearRecruiterSession();
    router.replace("/recruiter/login");
    return;
  }

  // Fallback to static error handler title if router isn't available
  void Swal.fire({
    icon: "error",
    title: "Lỗi hệ thống",
    text: "Hệ thống gặp sự cố. Vui lòng thử lại sau.",
  });
}
