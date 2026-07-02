"use client";

import { CaretDown, CaretUp, CircleNotch } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import { getRecruiterAccount } from "@/features/recruiter/api/onboarding";
import {
  assignRecruiterRolePermissions,
  createRecruiterRoleWithPermissions,
  getCompanyMembers,
  getRecruiterPermissions,
  getRecruiterRoles,
  updateRecruiterRole,
  type RecruiterPermission,
  type RecruiterRole,
} from "@/features/recruiter/api/team";
import { clearRecruiterSession, getRecruiterSession } from "@/features/recruiter/session";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { FormInput } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2600,
  timerProgressBar: true,
});

interface PermissionGroup {
  id: string;
  name: string;
  permissions: RecruiterPermission[];
}

type RecruiterRoleFormPageProps = Readonly<{
  mode: "create" | "edit";
  roleId?: string;
}>;

function isOwnerRole(role: { code?: string | null; name?: string | null } | null | undefined) {
  const code = role?.code?.trim().toUpperCase();
  const name = role?.name?.trim().toUpperCase();
  return code === "OWNER" || name === "OWNER";
}

function isCompanyCustomRole(role: RecruiterRole, companyId: string) {
  return Boolean(companyId && role.companyId === companyId);
}

const getGroupedPermissions = (perms: RecruiterPermission[]): PermissionGroup[] => {
  const groups: {
    jobs_billing: { name: string; permissions: RecruiterPermission[] };
    candidates_interviews: { name: string; permissions: RecruiterPermission[] };
    company_team: { name: string; permissions: RecruiterPermission[] };
  } = {
    jobs_billing: {
      name: "CHỨC NĂNG ĐĂNG TUYỂN",
      permissions: [],
    },
    candidates_interviews: {
      name: "QUẢN LÝ ỨNG VIÊN",
      permissions: [],
    },
    company_team: {
      name: "QUẢN LÝ DOANH NGHIỆP",
      permissions: [],
    },
  };

  perms.forEach((perm) => {
    const mod = perm.module?.toLowerCase();
    if (mod === "jobs" || mod === "billing") {
      groups.jobs_billing.permissions.push(perm);
    } else if (mod === "applications" || mod === "interviews") {
      groups.candidates_interviews.permissions.push(perm);
    } else {
      groups.company_team.permissions.push(perm);
    }
  });

  return Object.entries(groups)
    .filter(([, group]) => group.permissions.length > 0)
    .map(([key, group]) => ({
      id: key,
      name: group.name,
      permissions: group.permissions,
    }));
};

export function RecruiterRoleFormPage({ mode, roleId }: RecruiterRoleFormPageProps) {
  const router = useRouter();
  const t = useTranslations("Recruiter");

  const [token, setToken] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [permissions, setPermissions] = useState<RecruiterPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [rolePermissionIds, setRolePermissionIds] = useState<string[]>([]);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    jobs_billing: true,
    candidates_interviews: true,
    company_team: true,
  });

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

  const loadFormData = useCallback(
    async (accountId: string, accessToken: string) => {
      try {
        setLoading(true);
        const account = await getRecruiterAccount(accountId, accessToken);

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
        const [nextPermissions, roles, membersList] = await Promise.all([
          getRecruiterPermissions(accessToken),
          getRecruiterRoles(accessToken),
          getCompanyMembers(nextCompanyId, accessToken),
        ]);

        const currentMember = membersList.find(
          (member) =>
            (member.recruiterAccount?.id && member.recruiterAccount.id === accountId) ||
            (member.recruiterAccount?.email &&
              member.recruiterAccount.email.toLowerCase() === account.email.toLowerCase()) ||
            (member.invitedEmail &&
              member.invitedEmail.toLowerCase() === account.email.toLowerCase()),
        );
        const owner = isOwnerRole(currentMember?.role) || !currentMember?.role;

        setPermissions(nextPermissions);
        setIsOwner(owner);

        if (!owner) {
          void Swal.fire({
            icon: "warning",
            title: t("team.messages.errorTitle"),
            text: t("team.alerts.roleOwnerOnly"),
          });
          router.replace("/recruiter/team/roles");
          return;
        }

        if (mode === "edit") {
          const role = roles.find((item) => item.id === roleId);
          if (!role || !isCompanyCustomRole(role, nextCompanyId)) {
            void Swal.fire({
              icon: "warning",
              title: t("team.messages.errorTitle"),
              text: t("team.alerts.roleOwnerOnly"),
            });
            router.replace("/recruiter/team/roles");
            return;
          }

          setRoleName(role.name);
          setRoleDescription(role.description ?? "");
          setRolePermissionIds(
            role.rolePermissions?.map((item) => item.recruiterPermission.id) ?? [],
          );
        }
      } catch (error) {
        handleAuthError(error, router);
      } finally {
        setLoading(false);
      }
    },
    [mode, roleId, router, t],
  );

  useEffect(() => {
    const session = getRecruiterSession();

    if (!session) {
      router.replace("/recruiter/login");
      return;
    }

    setToken(session.accessToken);
    void loadFormData(session.user.id, session.accessToken);
  }, [loadFormData, router]);

  const groupedPermissions = useMemo(() => getGroupedPermissions(permissions), [permissions]);

  const isGroupAllSelected = useCallback(
    (group: PermissionGroup) => group.permissions.every((p) => rolePermissionIds.includes(p.id)),
    [rolePermissionIds],
  );

  const handleGroupCheckboxChange = useCallback((group: PermissionGroup, checked: boolean) => {
    const permissionIds = group.permissions.map((permission) => permission.id);
    if (checked) {
      setRolePermissionIds((current) => Array.from(new Set([...current, ...permissionIds])));
      return;
    }

    setRolePermissionIds((current) => current.filter((id) => !permissionIds.includes(id)));
  }, []);

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }));
  }, []);

  const allGroupsClosed = useMemo(
    () => Object.values(expandedGroups).every((value) => !value),
    [expandedGroups],
  );

  const toggleAllGroups = useCallback(() => {
    const nextValue = allGroupsClosed;
    setExpandedGroups({
      jobs_billing: nextValue,
      candidates_interviews: nextValue,
      company_team: nextValue,
    });
  }, [allGroupsClosed]);

  const submitRole = async () => {
    const name = roleName.trim();
    const description = roleDescription.trim();

    if (!name || rolePermissionIds.length === 0) {
      void Swal.fire({ icon: "error", title: t("team.roleDialog.roleNameRequired") });
      return;
    }

    try {
      setSaving(true);
      if (mode === "edit" && roleId) {
        await updateRecruiterRole(roleId, { name, description }, token);
        await assignRecruiterRolePermissions(roleId, rolePermissionIds, token);
      } else {
        await createRecruiterRoleWithPermissions({ name, description }, rolePermissionIds, token);
      }

      void toast.fire({ icon: "success", title: t("team.messages.roleSaveSuccess") });
      router.replace("/recruiter/team/roles");
    } catch (error) {
      showActionError(error, t);
    } finally {
      setSaving(false);
    }
  };

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
          <h1 className="font-outfit text-xl font-bold tracking-wide text-slate-950 sm:text-2xl">
            {mode === "edit" ? t("team.roleDialog.editTitle") : t("team.roleDialog.createTitle")}
          </h1>
        </div>
      </header>

      <Card className="upnext-shadow space-y-6 rounded-xl border-slate-200 bg-white p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <FormInput
            id="recruiter-role-name"
            label={t("team.roleDialog.nameLabel")}
            value={roleName}
            onChange={(event) => setRoleName(event.target.value)}
            placeholder={t("team.roleDialog.namePlaceholder")}
            disabled={!isOwner || saving}
          />

          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <Label
              htmlFor="recruiter-role-description"
              className="text-sm font-bold text-slate-700"
            >
              {t("team.roleDialog.descLabel")}
            </Label>
            <textarea
              id="recruiter-role-description"
              aria-label={t("team.roleDialog.descLabel")}
              value={roleDescription}
              onChange={(event) => setRoleDescription(event.target.value)}
              placeholder={t("team.roleDialog.descPlaceholder")}
              disabled={!isOwner || saving}
              className="upnext-focus min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium shadow-none focus:border-emerald-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-sm font-bold text-slate-700">
              {t("team.roleDialog.permissionsLabel")}
            </span>
            <button
              type="button"
              disabled={!isOwner || saving}
              onClick={toggleAllGroups}
              className="flex items-center gap-1 text-sm font-bold text-blue-600 transition-colors hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {allGroupsClosed ? "Mở tất cả" : "Đóng tất cả"}
              {allGroupsClosed ? <CaretDown size={14} /> : <CaretUp size={14} />}
            </button>
          </div>

          <div className="space-y-3">
            {groupedPermissions.map((group) => {
              const isExpanded = !!expandedGroups[group.id];
              const allSelected = isGroupAllSelected(group);

              return (
                <div
                  key={group.id}
                  className="overflow-hidden rounded-xl border border-slate-200/80"
                >
                  <div className="flex items-center justify-between bg-slate-50/70 p-3.5 transition-colors select-none hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`group-chk-${group.id}`}
                        checked={allSelected}
                        onCheckedChange={(checked) => handleGroupCheckboxChange(group, !!checked)}
                        disabled={!isOwner || saving}
                      />
                      <label
                        htmlFor={`group-chk-${group.id}`}
                        className="cursor-pointer text-sm font-bold text-slate-800 uppercase select-none"
                      >
                        {group.name}
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className="flex size-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                      aria-expanded={isExpanded}
                      aria-controls={`permission-group-${group.id}`}
                      aria-label={isExpanded ? `Đóng ${group.name}` : `Mở ${group.name}`}
                    >
                      {isExpanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div
                      id={`permission-group-${group.id}`}
                      className="space-y-3.5 divide-y divide-slate-100 border-t border-slate-100 bg-white p-4"
                    >
                      {group.permissions.map((permission) => {
                        const isChecked = rolePermissionIds.includes(permission.id);
                        return (
                          <label
                            key={permission.id}
                            htmlFor={`permission-${permission.id}`}
                            className="flex cursor-pointer items-center gap-3 rounded-lg p-1 py-2 select-none hover:bg-slate-50/50"
                          >
                            <Checkbox
                              id={`permission-${permission.id}`}
                              checked={isChecked}
                              onCheckedChange={(checked) =>
                                setRolePermissionIds((current) =>
                                  checked === true
                                    ? Array.from(new Set([...current, permission.id]))
                                    : current.filter((id) => id !== permission.id),
                                )
                              }
                              disabled={!isOwner || saving}
                            />
                            <span className="flex-1">
                              <span className="block text-sm font-bold text-slate-700">
                                {getPermissionName(permission.code)}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => router.push("/recruiter/team/roles")}
          >
            {t("team.actions.cancel")}
          </Button>
          <Button
            className="bg-[#11a77a] hover:bg-[#0d966d]"
            disabled={saving || !isOwner || !roleName.trim() || rolePermissionIds.length === 0}
            onClick={() => void submitRole()}
          >
            {saving && <CircleNotch size={16} className="animate-spin" />}
            <span>{saving ? t("team.actions.saving") : t("team.roleDialog.submit")}</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}

function showActionError(error: unknown, t: any) {
  void Swal.fire({
    icon: "error",
    title: t("team.messages.errorTitle") || "Có lỗi xảy ra",
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
  }
  return t("onboarding.companyProfile.errors.unknown") || "Hệ thống gặp lỗi. Vui lòng thử lại.";
}

function handleAuthError(error: unknown, router: ReturnType<typeof useRouter>) {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    clearRecruiterSession();
    router.replace("/recruiter/login");
    return;
  }
  void Swal.fire({
    icon: "error",
    title: "Lỗi hệ thống",
    text: "Hệ thống gặp sự cố. Vui lòng thử lại sau.",
  });
}
