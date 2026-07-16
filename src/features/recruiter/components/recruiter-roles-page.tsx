"use client";

import { PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";

import { getRecruiterAccount } from "@/features/recruiter/api/onboarding";
import {
  deleteRecruiterRole,
  getCompanyMembers,
  getRecruiterRoles,
  type RecruiterRole,
  type CompanyMember,
} from "@/features/recruiter/api/team";
import { clearRecruiterSession, getRecruiterSession } from "@/features/recruiter/session";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";

import { RecruiterTableLayout } from "./recruiter-table-layout";

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

function isCompanyCustomRole(role: RecruiterRole, companyId: string) {
  return Boolean(companyId && role.companyId === companyId);
}

export function RecruiterRolesPage() {
  const router = useRouter();
  const t = useTranslations("Recruiter");

  const [token, setToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [roles, setRoles] = useState<RecruiterRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [members, setMembers] = useState<CompanyMember[]>([]);

  const loadRoles = useCallback(
    async (nextAccountId: string, accessToken: string) => {
      try {
        setLoading(true);
        const account = await getRecruiterAccount(nextAccountId, accessToken);

        if (!account.company?.id) {
          void Swal.fire({
            icon: "warning",
            title: t("onboarding.companyProfile.errors.noProfileTitle"),
            text: t("onboarding.companyProfile.errors.noProfileText"),
          });
          router.replace("/recruiter");
          return;
        }

        const nextCompanyId = account.company.id;
        const [nextRoles, membersList] = await Promise.all([
          getRecruiterRoles(accessToken),
          getCompanyMembers(nextCompanyId, accessToken),
        ]);

        const currentMember = membersList.find(
          (member) =>
            (member.recruiterAccount?.id && member.recruiterAccount.id === nextAccountId) ||
            (member.recruiterAccount?.email &&
              member.recruiterAccount.email.toLowerCase() === account.email.toLowerCase()) ||
            (member.invitedEmail &&
              member.invitedEmail.toLowerCase() === account.email.toLowerCase()),
        );

        setCompanyId(nextCompanyId);
        setRoles(nextRoles);
        setMembers(membersList);
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
    void loadRoles(session.user.id, session.accessToken);
  }, [loadRoles, router]);

  const reload = useCallback(async () => {
    await loadRoles(accountId, token);
  }, [accountId, loadRoles, token]);

  const deleteRole = useCallback(
    async (role: RecruiterRole) => {
      if (!isOwner || !isCompanyCustomRole(role, companyId)) return;

      const result = await Swal.fire({
        icon: "warning",
        title: t("team.messages.deleteRoleConfirm"),
        text: t("team.messages.deleteRoleWarning"),
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        confirmButtonText: t("team.actions.delete"),
        cancelButtonText: t("team.actions.cancel"),
      });

      if (!result.isConfirmed) return;

      try {
        setDeletingRoleId(role.id);
        await deleteRecruiterRole(role.id, token);
        await reload();
        void toast.fire({ icon: "success", title: t("team.messages.deleteRoleSuccess") });
      } catch (error) {
        showActionError(error, t);
      } finally {
        setDeletingRoleId(null);
      }
    },
    [companyId, isOwner, reload, t, token],
  );

  const handleBulkDeleteRoles = useCallback(async () => {
    if (!isOwner || !token || selectedRoleIds.length === 0) return;

    // Check if any selected roles are assigned to members
    const assignedRoles = selectedRoleIds.filter((roleId) => {
      const assignedMembers = members.filter((m) => m.role?.id === roleId);
      return assignedMembers.length > 0;
    });

    if (assignedRoles.length > 0) {
      const roleNames = roles
        .filter((r) => assignedRoles.includes(r.id))
        .map((r) => r.name)
        .join(", ");
      void Swal.fire({
        icon: "error",
        title: "Không thể xóa vai trò",
        text: `Một số vai trò (${roleNames}) đang được gán cho thành viên. Vui lòng chuyển vai trò của họ trước khi xóa.`,
      });
      return;
    }

    const result = await Swal.fire({
      icon: "warning",
      title: "Xác nhận xóa nhiều vai trò",
      text: `Bạn có chắc chắn muốn xóa ${selectedRoleIds.length} vai trò đã chọn?`,
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Xóa tất cả",
      cancelButtonText: "Hủy",
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      await Promise.all(selectedRoleIds.map((id) => deleteRecruiterRole(id, token)));
      setSelectedRoleIds([]);
      await reload();
      void toast.fire({ icon: "success", title: "Xóa các vai trò thành công!" });
    } catch (error) {
      showActionError(error, t);
      setLoading(false);
    }
  }, [isOwner, token, selectedRoleIds, members, roles, reload, t]);

  return (
    <div className="w-full min-w-0 space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-outfit text-xl font-bold tracking-wide text-slate-950 sm:text-2xl">
            Vai trò tuyển dụng
          </h1>
        </div>
      </header>

      <RecruiterTableLayout
        loading={loading}
        actionBar={
          isOwner ? (
            <div className="flex gap-2">
              {selectedRoleIds.length > 0 && (
                <Button
                  variant="outline"
                  className="h-10 gap-1.5 border-red-200 bg-red-50 font-bold text-red-700 hover:bg-red-100"
                  onClick={() => void handleBulkDeleteRoles()}
                >
                  <Trash size={15} />
                  <span>Xóa đã chọn ({selectedRoleIds.length})</span>
                </Button>
              )}
              <Button asChild>
                <Link href="/recruiter/team/roles/new">
                  <Plus size={16} weight="bold" />
                  <span>{t("team.actions.addRole")}</span>
                </Link>
              </Button>
            </div>
          ) : (
            <Button disabled>
              <Plus size={16} weight="bold" />
              <span>{t("team.actions.addRole")}</span>
            </Button>
          )
        }
      >
        <thead>
          <tr className="border-b border-slate-300 bg-slate-200">
            <th className="w-12 border-r border-slate-300 px-4 py-3 text-center last:border-r-0">
              <input
                type="checkbox"
                checked={
                  roles.filter((r) => isOwner && isCompanyCustomRole(r, companyId)).length > 0 &&
                  selectedRoleIds.length ===
                    roles.filter((r) => isOwner && isCompanyCustomRole(r, companyId)).length
                }
                onChange={(event) => {
                  if (event.target.checked) {
                    const modifiableRoles = roles.filter(
                      (r) => isOwner && isCompanyCustomRole(r, companyId),
                    );
                    setSelectedRoleIds(modifiableRoles.map((r) => r.id));
                  } else {
                    setSelectedRoleIds([]);
                  }
                }}
                aria-label="Select all roles"
                className="text-primary accent-primary focus:ring-primary size-4 cursor-pointer rounded border border-slate-300 focus:ring-offset-0"
                disabled={
                  roles.filter((r) => isOwner && isCompanyCustomRole(r, companyId)).length === 0
                }
              />
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-center text-xs font-bold text-slate-900 last:border-r-0">
              {t("team.roleDialog.nameLabel")}
            </th>
            <th className="border-r border-slate-300 px-4 py-3 text-center text-xs font-bold text-slate-900 last:border-r-0">
              Vai trò
            </th>
            <th className="w-[120px] px-4 py-3 text-right text-xs font-bold text-slate-900">
              {t("team.table.actions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {roles.length === 0 ? (
            <tr aria-label={loading ? t("shell.loading") : t("team.table.emptyRoles")}>
              <td colSpan={4} className="py-12 text-center text-sm font-medium text-slate-500">
                {loading ? t("shell.loading") : t("team.table.emptyRoles")}
              </td>
            </tr>
          ) : (
            roles.map((role) => {
              const canModifyRole = isOwner && isCompanyCustomRole(role, companyId);

              return (
                <tr
                  key={role.id}
                  className={cn(
                    "border-b border-slate-200 bg-white transition-colors duration-150 last:border-b-0 even:bg-slate-100/50 hover:bg-sky-50/30",
                    selectedRoleIds.includes(role.id) && "bg-primary/5 hover:bg-primary/10",
                  )}
                >
                  <td className="w-12 border-r border-slate-100/50 px-4 py-2.5 text-center last:border-r-0">
                    <input
                      type="checkbox"
                      checked={selectedRoleIds.includes(role.id)}
                      disabled={!canModifyRole}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedRoleIds((current) => [...current, role.id]);
                        } else {
                          setSelectedRoleIds((current) => current.filter((id) => id !== role.id));
                        }
                      }}
                      className={cn(
                        "text-primary accent-primary focus:ring-primary size-4 rounded border border-slate-300 focus:ring-offset-0",
                        canModifyRole ? "cursor-pointer" : "cursor-not-allowed opacity-50",
                      )}
                    />
                  </td>
                  <td
                    className="border-r border-slate-100/50 px-4 py-2.5 last:border-r-0"
                    aria-label={`${t("team.roleDialog.nameLabel")}: ${role.name}`}
                  >
                    {role.name}
                  </td>
                  <td className="border-r border-slate-100/50 px-4 py-2.5 font-bold text-slate-700 last:border-r-0">
                    {members.filter((m) => m.role?.id === role.id).length}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-2">
                      {canModifyRole ? (
                        <Button
                          asChild
                          variant="outline"
                          size="icon"
                          className="size-8"
                          aria-label={`${t("team.actions.edit")} ${role.name}`}
                          title={t("team.actions.edit")}
                        >
                          <Link href={`/recruiter/team/roles/${role.id}/edit`}>
                            <PencilSimple size={14} />
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8"
                          disabled
                          aria-label={`${t("team.actions.edit")} ${role.name}`}
                          title={t("team.actions.edit")}
                        >
                          <PencilSimple size={14} />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        disabled={!canModifyRole || deletingRoleId === role.id}
                        onClick={() => void deleteRole(role)}
                        aria-label={`${t("team.actions.delete")} ${role.name}`}
                        title={t("team.actions.delete")}
                      >
                        <Trash size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </RecruiterTableLayout>

      {!isOwner && (
        <p className="text-xs font-semibold text-amber-700">{t("team.alerts.roleOwnerOnly")}</p>
      )}
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
