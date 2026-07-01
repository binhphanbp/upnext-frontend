"use client";

import { CaretDown, CaretUp, CircleNotch } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import { getRecruiterAccount } from "@/features/recruiter/api/onboarding";
import {
  createRecruiterRoleWithPermissions,
  getCompanyMembers,
  getRecruiterPermissions,
  type RecruiterPermission,
} from "@/features/recruiter/api/team";
import { clearRecruiterSession, getRecruiterSession } from "@/features/recruiter/session";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { FormInput } from "@/shared/ui/input";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2600,
  timerProgressBar: true,
});

function isOwnerRole(role: { code?: string | null; name?: string | null } | null | undefined) {
  const code = role?.code?.trim().toUpperCase();
  const name = role?.name?.trim().toUpperCase();
  return code === "OWNER" || name === "OWNER";
}

interface PermissionGroup {
  id: string;
  name: string;
  permissions: RecruiterPermission[];
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
    .filter(([_, group]) => group.permissions.length > 0)
    .map(([key, group]) => ({
      id: key,
      name: group.name,
      permissions: group.permissions,
    }));
};

export function RecruiterRolesPage() {
  const router = useRouter();
  const t = useTranslations("Recruiter");

  const [token, setToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [permissions, setPermissions] = useState<RecruiterPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRolePermissionIds, setNewRolePermissionIds] = useState<string[]>([]);

  // Expanded collapsible sections
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
        const [nextPermissions, membersList] = await Promise.all([
          getRecruiterPermissions(accessToken),
          getCompanyMembers(nextCompanyId, accessToken),
        ]);

        setPermissions(nextPermissions);

        const currentMember = membersList.find(
          (m) =>
            (m.recruiterAccount?.id && m.recruiterAccount.id === nextAccountId) ||
            (m.recruiterAccount?.email &&
              m.recruiterAccount.email.toLowerCase() === account.email.toLowerCase()) ||
            (m.invitedEmail && m.invitedEmail.toLowerCase() === account.email.toLowerCase()),
        );
        setIsOwner(isOwnerRole(currentMember?.role) || !currentMember?.role);
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

  const reload = async () => {
    await loadTeamData(accountId, token);
  };

  const createRole = async () => {
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
  };

  // Grouped permissions
  const groupedPermissions = useMemo(() => {
    return getGroupedPermissions(permissions);
  }, [permissions]);

  // Master checkbox logic per group
  const isGroupAllSelected = useCallback(
    (group: PermissionGroup) => {
      return group.permissions.every((p) => newRolePermissionIds.includes(p.id));
    },
    [newRolePermissionIds],
  );

  const handleGroupCheckboxChange = useCallback((group: PermissionGroup, checked: boolean) => {
    const permIds = group.permissions.map((p) => p.id);
    if (checked) {
      setNewRolePermissionIds((current) => Array.from(new Set([...current, ...permIds])));
    } else {
      setNewRolePermissionIds((current) => current.filter((id) => !permIds.includes(id)));
    }
  }, []);

  // Accordion open/close toggle actions
  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((curr) => ({
      ...curr,
      [groupId]: !curr[groupId],
    }));
  }, []);

  const allGroupsClosed = useMemo(() => {
    return Object.values(expandedGroups).every((v) => !v);
  }, [expandedGroups]);

  const toggleAllGroups = useCallback(() => {
    const nextValue = allGroupsClosed;
    setExpandedGroups({
      jobs_billing: nextValue,
      candidates_interviews: nextValue,
      company_team: nextValue,
    });
  }, [allGroupsClosed]);

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
            Vai trò tuyển dụng
          </h1>
        </div>
      </header>

      {/* Top Section: Create Role Card */}
      <Card className="upnext-shadow space-y-6 rounded-xl border-slate-200 bg-white p-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-950">{t("team.roleDialog.createTitle")}</h2>
        </div>

        {/* Role Name Input */}
        <div className="max-w-xl">
          <FormInput
            id="recruiter-role-name"
            label={t("team.roleDialog.nameLabel")}
            value={newRoleName}
            onChange={(event) => setNewRoleName(event.target.value)}
            placeholder={t("team.roleDialog.namePlaceholder")}
            disabled={!isOwner}
          />
        </div>

        {/* Collapsible Permissions Checklist */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-sm font-bold text-slate-700">Gán quyền hạn</span>
            <button
              type="button"
              disabled={!isOwner}
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
                  className="overflow-hidden rounded-xl border border-slate-200/80 shadow-xs"
                >
                  {/* Accordion Group Header */}
                  <div
                    onClick={() => toggleGroup(group.id)}
                    className="flex cursor-pointer items-center justify-between bg-slate-50/70 p-3.5 transition-colors select-none hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        id={`group-chk-${group.id}`}
                        checked={allSelected}
                        onCheckedChange={(checked) => handleGroupCheckboxChange(group, !!checked)}
                        disabled={!isOwner}
                      />
                      <label
                        htmlFor={`group-chk-${group.id}`}
                        className="cursor-pointer text-sm font-bold text-slate-800 uppercase select-none"
                      >
                        {group.name}
                      </label>
                    </div>
                    <div className="text-slate-400 hover:text-slate-600">
                      {isExpanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
                    </div>
                  </div>

                  {/* Accordion Group Content */}
                  {isExpanded && (
                    <div className="space-y-3.5 divide-y divide-slate-100 border-t border-slate-100 bg-white p-4">
                      {group.permissions.map((permission) => {
                        const isChecked = newRolePermissionIds.includes(permission.id);
                        return (
                          <label
                            key={permission.id}
                            htmlFor={`permission-${permission.id}`}
                            className="flex cursor-pointer items-start gap-3 rounded-lg p-1 select-none hover:bg-slate-50/50"
                          >
                            <Checkbox
                              id={`permission-${permission.id}`}
                              checked={isChecked}
                              onCheckedChange={(checked) =>
                                setNewRolePermissionIds((current) =>
                                  checked === true
                                    ? Array.from(new Set([...current, permission.id]))
                                    : current.filter((id) => id !== permission.id),
                                )
                              }
                              disabled={!isOwner}
                            />
                            <span className="flex-1">
                              <span className="block text-sm font-bold text-slate-700">
                                {getPermissionName(permission.code)}
                              </span>
                              {permission.description && (
                                <span className="mt-1 block text-xs font-medium text-slate-400">
                                  {permission.description}
                                </span>
                              )}
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

        {/* Submit Button */}
        <div className="flex justify-start">
          <Button
            className="w-full bg-[#11a77a] font-bold hover:bg-[#0d966d] sm:w-48"
            disabled={
              saving || !isOwner || !newRoleName.trim() || newRolePermissionIds.length === 0
            }
            onClick={() => void createRole()}
          >
            {saving ? t("team.actions.saving") : t("team.roleDialog.createSubmit")}
          </Button>
        </div>

        {!isOwner && (
          <p className="text-xs font-semibold text-amber-700">{t("team.alerts.roleOwnerOnly")}</p>
        )}
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
