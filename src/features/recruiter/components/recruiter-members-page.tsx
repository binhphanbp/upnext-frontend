"use client";

import {
  ArrowsLeftRight,
  CircleNotch,
  Crown,
  DownloadSimple,
  MagnifyingGlass,
  Lock,
  LockOpen,
  Plus,
  Trash,
  UsersThree,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import { getRecruiterAccount } from "@/features/recruiter/api/onboarding";
import {
  getCompanyMembers,
  getRecruiterRoles,
  inviteCompanyMember,
  removeCompanyMember,
  updateCompanyMemberRole,
  updateCompanyMemberStatus,
  type CompanyMember,
  type RecruiterRole,
} from "@/features/recruiter/api/team";
import { clearRecruiterSession, getRecruiterSession } from "@/features/recruiter/session";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { FormInput, Input } from "@/shared/ui/input";
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

const getAvatarStyle = (char: string) => {
  const code = char.toUpperCase().charCodeAt(0) || 0;
  if (code >= 65 && code <= 69) return "bg-teal-50 text-teal-700 border border-teal-100";
  if (code >= 70 && code <= 74) return "bg-indigo-50 text-indigo-700 border border-indigo-100";
  if (code >= 75 && code <= 79) return "bg-amber-50 text-amber-700 border border-amber-100";
  if (code >= 80 && code <= 84) return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  return "bg-rose-50 text-rose-700 border border-rose-100";
};

function isOwnerRole(role: { code?: string | null; name?: string | null } | null | undefined) {
  const code = role?.code?.trim().toUpperCase();
  const name = role?.name?.trim().toUpperCase();
  return code === "OWNER" || name === "OWNER";
}

function getOwnerRole(roles: RecruiterRole[]) {
  return (
    roles.find((role) => isOwnerRole(role)) ?? {
      id: "owner-role-id",
      code: "OWNER",
      name: "Owner",
      description: "Owner role",
    }
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function exportToCsv(data: CompanyMember[], t: any) {
  const headers = [
    t("team.table.member") || "Member",
    "Email",
    t("team.table.status") || "Status",
    t("team.table.role") || "Role",
    "Joined At",
  ];

  const rows = data.map((member) => {
    const email = member.recruiterAccount?.email ?? member.invitedEmail ?? "";
    const name = member.recruiterAccount?.profile?.fullName ?? email;
    const status = member.status;
    const role = member.role?.name ?? "";
    const joinedAt = member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : "";
    return [name, email, status, role, joinedAt].map((val) => `"${val.replace(/"/g, '""')}"`);
  });

  const csvContent = "\ufeff" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `recruiter_members_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function RecruiterMembersPage() {
  const router = useRouter();
  const t = useTranslations("Recruiter");

  const [token, setToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [roles, setRoles] = useState<RecruiterRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [inviteEmailError, setInviteEmailError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Table row selection state
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const [isOwner, setIsOwner] = useState(false);

  const assignableRoles = useMemo(() => roles.filter((role) => !isOwnerRole(role)), [roles]);

  const loadTeamData = useCallback(
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
        const [nextMembers, nextRoles] = await Promise.all([
          getCompanyMembers(nextCompanyId, accessToken),
          getRecruiterRoles(accessToken),
        ]);

        const currentMemberIndex = nextMembers.findIndex(
          (member) =>
            member.recruiterAccount?.id === account.id ||
            (member.recruiterAccount?.email &&
              member.recruiterAccount.email.toLowerCase() === account.email.toLowerCase()) ||
            (member.invitedEmail &&
              member.invitedEmail.toLowerCase() === account.email.toLowerCase()),
        );
        const ownerRole = getOwnerRole(nextRoles);
        let userRole: any = null;

        if (currentMemberIndex === -1) {
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
          userRole = ownerMember.role;
        } else {
          const existingMember = nextMembers[currentMemberIndex];
          if (existingMember && !existingMember.role) {
            nextMembers[currentMemberIndex] = {
              ...existingMember,
              role: {
                id: ownerRole.id,
                code: ownerRole.code,
                name: ownerRole.name,
              },
            };
            userRole = nextMembers[currentMemberIndex].role;
          } else {
            userRole = existingMember?.role;
          }
        }

        setCompanyId(nextCompanyId);
        setMembers(nextMembers);
        setRoles(nextRoles);
        setIsOwner(isOwnerRole(userRole) || !userRole);
      } catch (error) {
        handleAuthError(error, router, t);
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

  const inviteMember = async () => {
    if (!isOwner) {
      void Swal.fire({ icon: "error", title: t("team.alerts.inviteOwnerOnly") });
      return;
    }

    const nextEmail = inviteEmail.trim();
    if (!nextEmail) {
      setInviteEmailError(t("team.inviteDialog.emailLabel"));
      return;
    }

    if (!isValidEmail(nextEmail)) {
      setInviteEmailError(t("team.inviteDialog.emailInvalid"));
      return;
    }

    try {
      setSaving(true);
      await inviteCompanyMember(companyId, nextEmail, inviteRoleId, token);
      setInviteEmail("");
      setInviteRoleId("");
      setInviteEmailError("");
      setInviteDialogOpen(false);
      await reload();
      void toast.fire({ icon: "success", title: t("team.messages.inviteSuccess") });
    } catch (error) {
      showActionError(error, t);
    } finally {
      setSaving(false);
    }
  };

  const changeMemberRole = async (memberId: string, roleId: string) => {
    try {
      await updateCompanyMemberRole(memberId, roleId, token);
      await reload();
      void toast.fire({ icon: "success", title: t("team.messages.roleSaveSuccess") });
    } catch (error) {
      showActionError(error, t);
    }
  };

  const handleTransferOwnership = async (member: CompanyMember) => {
    const ownerRole = roles.find((r) => isOwnerRole(r));
    if (!ownerRole) {
      void Swal.fire({
        icon: "error",
        title: "Không tìm thấy vai trò Owner",
        text: "Không thể thực hiện chuyển quyền vào lúc này.",
      });
      return;
    }

    const name =
      member.recruiterAccount?.profile?.fullName ??
      member.recruiterAccount?.email ??
      member.invitedEmail;

    const result = await Swal.fire({
      icon: "warning",
      title: "Chuyển quyền Chủ sở hữu?",
      text: `Bạn có chắc chắn muốn chuyển quyền Owner cho ${name} không? Tài khoản của bạn sẽ bị hạ xuống vai trò HR.`,
      showCancelButton: true,
      confirmButtonText: "Đồng ý chuyển",
      cancelButtonText: t("team.actions.cancel"),
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      await updateCompanyMemberRole(member.id, ownerRole.id, token);
      await reload();
      void toast.fire({ icon: "success", title: "Đã chuyển quyền sở hữu thành công." });
    } catch (error) {
      showActionError(error, t);
    } finally {
      setLoading(false);
    }
  };

  const toggleMemberStatus = async (member: CompanyMember) => {
    const nextStatus = member.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    const statusText = nextStatus === "SUSPENDED" ? "khóa" : "mở khóa";
    const result = await Swal.fire({
      icon: "warning",
      title: `${nextStatus === "SUSPENDED" ? "Khóa" : "Mở khóa"} tài khoản này?`,
      text: `Bạn có chắc chắn muốn ${statusText} tài khoản của ${member.recruiterAccount?.profile?.fullName ?? member.invitedEmail}?`,
      showCancelButton: true,
      confirmButtonText: "Đồng ý",
      cancelButtonText: t("team.actions.cancel"),
    });

    if (!result.isConfirmed) return;

    try {
      await updateCompanyMemberStatus(member.id, nextStatus, token);
      await reload();
      void toast.fire({ icon: "success", title: `Đã ${statusText} thành viên thành công.` });
    } catch (error) {
      showActionError(error, t);
    }
  };

  const deleteMember = async (memberId: string) => {
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
  };

  // Filtered members list
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const query = searchQuery.toLowerCase().trim();
    return members.filter((member) => {
      const email = (member.recruiterAccount?.email ?? member.invitedEmail ?? "").toLowerCase();
      const name = (member.recruiterAccount?.profile?.fullName ?? email).toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [members, searchQuery]);

  // Selected member IDs
  const selectedMemberIds = useMemo(() => {
    return Object.keys(rowSelection).filter((id) => rowSelection[id]);
  }, [rowSelection]);

  // Modifiable selected member IDs (can't lock or delete self or Owner)
  const selectedModifiableMemberIds = useMemo(() => {
    return selectedMemberIds.filter((id) => {
      const m = members.find((member) => member.id === id);
      if (!m) return false;
      const isSelf = m.recruiterAccount?.id === accountId;
      const isMemberOwner = isOwnerRole(m.role);
      return !isSelf && !isMemberOwner;
    });
  }, [selectedMemberIds, members, accountId]);

  // Bulk actions handlers
  const handleBulkDelete = async () => {
    if (selectedModifiableMemberIds.length === 0) return;

    const result = await Swal.fire({
      icon: "warning",
      title: "Xóa các thành viên đã chọn?",
      text: `Hành động này sẽ xóa vĩnh viễn ${selectedModifiableMemberIds.length} thành viên tuyển dụng đã chọn.`,
      showCancelButton: true,
      confirmButtonText: t("team.actions.delete"),
      cancelButtonText: t("team.actions.cancel"),
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      await Promise.all(selectedModifiableMemberIds.map((id) => removeCompanyMember(id, token)));
      setRowSelection({});
      await reload();
      void toast.fire({ icon: "success", title: "Đã xóa các thành viên thành công." });
    } catch (error) {
      showActionError(error, t);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkLock = async (status: "ACTIVE" | "SUSPENDED") => {
    if (selectedModifiableMemberIds.length === 0) return;

    const actionText = status === "SUSPENDED" ? "Khóa" : "Mở khóa";
    const result = await Swal.fire({
      icon: "warning",
      title: `${actionText} các tài khoản đã chọn?`,
      text: `Bạn có chắc chắn muốn ${actionText.toLowerCase()} ${selectedModifiableMemberIds.length} tài khoản thành viên tuyển dụng này?`,
      showCancelButton: true,
      confirmButtonText: "Đồng ý",
      cancelButtonText: t("team.actions.cancel"),
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      await Promise.all(
        selectedModifiableMemberIds.map((id) => updateCompanyMemberStatus(id, status, token)),
      );
      setRowSelection({});
      await reload();
      void toast.fire({
        icon: "success",
        title: `Đã ${actionText.toLowerCase()} các thành viên thành công.`,
      });
    } catch (error) {
      showActionError(error, t);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRoleChange = async (roleId: string) => {
    if (selectedModifiableMemberIds.length === 0 || !roleId) return;

    const selectedRole = roles.find((r) => r.id === roleId);
    if (!selectedRole) return;

    const result = await Swal.fire({
      icon: "warning",
      title: "Thay đổi vai trò tuyển dụng?",
      text: `Bạn có chắc chắn muốn đổi vai trò của ${selectedModifiableMemberIds.length} thành viên đã chọn thành "${selectedRole.name}"?`,
      showCancelButton: true,
      confirmButtonText: "Đồng ý",
      cancelButtonText: t("team.actions.cancel"),
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      await Promise.all(
        selectedModifiableMemberIds.map((id) => updateCompanyMemberRole(id, roleId, token)),
      );
      setRowSelection({});
      await reload();
      void toast.fire({
        icon: "success",
        title: "Đã thay đổi vai trò các thành viên thành công.",
      });
    } catch (error) {
      showActionError(error, t);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const dataToExport =
      selectedMemberIds.length > 0
        ? members.filter((m) => selectedMemberIds.includes(m.id))
        : filteredMembers;
    exportToCsv(dataToExport, t);
  };

  const canModifyMember = (member: CompanyMember) => {
    const isSelf = member.recruiterAccount?.id === accountId;
    const isMemberOwner = isOwnerRole(member.role);
    return isOwner && !isSelf && !isMemberOwner;
  };

  const selectableFilteredMembers = filteredMembers.filter(canModifyMember);
  const allSelectableRowsSelected =
    selectableFilteredMembers.length > 0 &&
    selectableFilteredMembers.every((member) => rowSelection[member.id]);

  const toggleAllVisibleRows = (checked: boolean) => {
    setRowSelection((current) => {
      const next = { ...current };
      selectableFilteredMembers.forEach((member) => {
        if (checked) {
          next[member.id] = true;
        } else {
          delete next[member.id];
        }
      });
      return next;
    });
  };

  const toggleRowSelection = (memberId: string, checked: boolean) => {
    setRowSelection((current) => {
      const next = { ...current };
      if (checked) {
        next[memberId] = true;
      } else {
        delete next[memberId];
      }
      return next;
    });
  };
  const inviteDisabled = saving || !isOwner;

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
          <Button
            type="button"
            className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 font-bold text-white shadow-none transition-all hover:bg-emerald-700"
            disabled={!isOwner}
            onClick={() => {
              setInviteEmailError("");
              setInviteDialogOpen(true);
            }}
          >
            <Plus size={18} weight="bold" />
            <span>{t("team.actions.inviteMember")}</span>
          </Button>
        </div>
      </header>

      <RecruiterTableLayout
        loading={false}
        filterBar={
          <div className="relative w-full flex-1 sm:max-w-xs">
            <MagnifyingGlass
              size={18}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
            />
            <Input
              placeholder={t("team.actions.search") || "Tìm kiếm..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 rounded-lg pl-10 text-sm"
            />
          </div>
        }
        actionBar={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {selectedMemberIds.length > 0 && isOwner && (
              <>
                <Button
                  variant="outline"
                  className="h-10 gap-1.5 rounded-full border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                  onClick={() => void handleBulkLock("SUSPENDED")}
                  disabled={selectedModifiableMemberIds.length === 0}
                >
                  <Lock size={15} />
                  <span>{t("team.actions.lock")}</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-10 gap-1.5 rounded-full border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                  onClick={() => void handleBulkLock("ACTIVE")}
                  disabled={selectedModifiableMemberIds.length === 0}
                >
                  <LockOpen size={15} />
                  <span>{t("team.actions.unlock")}</span>
                </Button>

                <Button
                  variant="ghost"
                  className="h-10 gap-1.5 rounded-full border border-red-200 bg-red-50 font-bold text-red-700 hover:border-red-300 hover:bg-red-100 hover:text-red-800"
                  onClick={() => void handleBulkDelete()}
                  disabled={selectedModifiableMemberIds.length === 0}
                >
                  <Trash size={15} />
                  <span>{t("team.actions.delete")}</span>
                </Button>
              </>
            )}

            <Button
              variant="outline"
              onClick={handleExport}
              className="h-10 gap-1.5 rounded-full border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
            >
              <DownloadSimple size={16} />
              <span>{t("team.actions.export")}</span>
            </Button>
          </div>
        }
      >
        <thead>
          <tr className="border-b border-slate-300 bg-slate-200">
            <th className="w-12 border-r border-slate-300 px-4 py-3 text-center last:border-r-0">
              <input
                type="checkbox"
                checked={allSelectableRowsSelected}
                onChange={(event) => toggleAllVisibleRows(event.target.checked)}
                aria-label="Select all members"
                className="text-primary accent-primary focus:ring-primary size-4 cursor-pointer rounded border border-slate-300 focus:ring-offset-0"
                disabled={selectableFilteredMembers.length === 0}
              />
            </th>
            <th className="w-[280px] min-w-[240px] border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0">
              {t("team.table.member")}
            </th>
            <th className="w-[150px] min-w-[140px] border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0">
              {t("team.table.status")}
            </th>
            <th className="w-[180px] min-w-[170px] border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0">
              {t("team.table.role")}
            </th>
            <th className="w-[120px] min-w-[110px] px-4 py-3 !text-center text-xs font-bold text-slate-900">
              {t("team.table.actions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredMembers.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 !py-12 text-center text-sm text-slate-500">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="relative h-28 w-28 shrink-0">
                    <Image
                      src="/assets/icons/page-not-found.png"
                      alt="Not Found"
                      fill
                      className="object-contain opacity-75"
                    />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    {searchQuery.trim()
                      ? t("team.table.emptyMembersSearch") ||
                        "Không tìm thấy thành viên nào phù hợp."
                      : t("team.table.emptyMembers")}
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            filteredMembers.map((member) => {
              const email = member.recruiterAccount?.email ?? member.invitedEmail ?? "unknown";
              const name = member.recruiterAccount?.profile?.fullName ?? email;
              const avatarUrl = member.recruiterAccount?.profile?.avatarUrl;
              const memberCanBeModified = canModifyMember(member);
              let tone: "success" | "warning" | "error" = "success";
              let label = t("team.status.active");

              if (member.status === "INVITED") {
                tone = "warning";
                label = t("team.status.pending");
              } else if (member.status === "SUSPENDED") {
                tone = "error";
                label = t("team.status.suspended") || "Bị khóa";
              }

              return (
                <tr
                  key={member.id}
                  className={cn(
                    "border-b border-slate-200 bg-white transition-colors duration-150 last:border-b-0 even:bg-slate-100/50 hover:bg-sky-50/30",
                    rowSelection[member.id] && "bg-primary/5 hover:bg-primary/10",
                  )}
                >
                  <td className="w-12 border-r border-slate-100/50 px-4 py-2.5 text-center last:border-r-0">
                    <input
                      type="checkbox"
                      checked={!!rowSelection[member.id]}
                      onChange={(event) => toggleRowSelection(member.id, event.target.checked)}
                      aria-label={`Select ${email}`}
                      className="text-primary accent-primary focus:ring-primary size-4 cursor-pointer rounded border border-slate-300 focus:ring-offset-0"
                      disabled={!memberCanBeModified}
                    />
                  </td>
                  <td className="w-[280px] min-w-[240px] border-r border-slate-100/50 px-4 py-2.5 last:border-r-0">
                    <div className="flex items-center gap-3">
                      {avatarUrl ? (
                        <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-100">
                          <Image
                            src={avatarUrl}
                            alt={name}
                            width={36}
                            height={36}
                            className="aspect-square h-full w-full object-cover"
                          />
                        </span>
                      ) : (
                        <span
                          className={cn(
                            "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold uppercase",
                            getAvatarStyle(name.charAt(0)),
                          )}
                        >
                          {name.charAt(0)}
                        </span>
                      )}
                      <div>
                        <p className="text-sm leading-none font-semibold text-slate-800">{name}</p>
                        <p className="mt-1 text-xs text-slate-500">{email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="w-[150px] min-w-[140px] border-r border-slate-100/50 px-4 py-2.5 last:border-r-0">
                    <Badge tone={tone}>{label}</Badge>
                  </td>
                  <td className="w-[180px] min-w-[170px] border-r border-slate-100/50 px-4 py-2.5 last:border-r-0">
                    {isOwnerRole(member.role) ? (
                      <div className="flex items-center justify-start">
                        <div
                          className="flex items-center gap-1 rounded-full border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700"
                          title="Chủ sở hữu công ty"
                        >
                          <Crown size={12} weight="fill" className="text-amber-500" />
                          <span>Owner</span>
                        </div>
                      </div>
                    ) : (
                      <RoleSelect
                        label={`${t("team.table.role")} ${email}`}
                        hideLabel
                        roles={assignableRoles}
                        value={member.role?.id ?? ""}
                        onValueChange={(roleId) => changeMemberRole(member.id, roleId)}
                        size="sm"
                        disabled={!memberCanBeModified}
                        t={t}
                      />
                    )}
                  </td>
                  <td className="w-[120px] min-w-[110px] px-4 py-2.5">
                    <div className="flex items-center justify-center gap-2">
                      {isOwnerRole(member.role) ? (
                        <span className="font-medium text-slate-400">-</span>
                      ) : (
                        <>
                          {isOwner && member.status === "ACTIVE" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Transfer ownership to ${email}`}
                              className="size-8 rounded-full border border-slate-200 bg-white text-slate-400 shadow-none transition-all hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600"
                              onClick={() => void handleTransferOwnership(member)}
                              title="Chuyển quyền Owner"
                            >
                              <ArrowsLeftRight size={14} />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={
                              member.status === "SUSPENDED" ? `Unlock ${email}` : `Lock ${email}`
                            }
                            className={cn(
                              "size-8 rounded-full border border-slate-200 bg-white text-slate-400 shadow-none transition-all",
                              memberCanBeModified
                                ? "hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                                : "cursor-not-allowed opacity-50",
                            )}
                            disabled={!memberCanBeModified}
                            onClick={() => void toggleMemberStatus(member)}
                            title={member.status === "SUSPENDED" ? "Mở khóa" : "Khóa tài khoản"}
                          >
                            {member.status === "SUSPENDED" ? (
                              <LockOpen size={14} />
                            ) : (
                              <Lock size={14} />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${email}`}
                            className={cn(
                              "size-8 rounded-full border border-slate-200 bg-white text-slate-400 shadow-none transition-all",
                              memberCanBeModified
                                ? "hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                : "cursor-not-allowed opacity-50",
                            )}
                            disabled={!memberCanBeModified}
                            onClick={() => void deleteMember(member.id)}
                            title="Xóa thành viên"
                          >
                            <Trash size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </RecruiterTableLayout>

      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{t("team.actions.inviteMember")}</DialogTitle>
            <DialogDescription>{t("team.inviteDialog.description")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <FormInput
              id="invite-member-email"
              label={t("team.inviteDialog.emailLabel")}
              type="email"
              value={inviteEmail}
              onChange={(event) => {
                setInviteEmail(event.target.value);
                setInviteEmailError("");
              }}
              onBlur={() => {
                if (inviteEmail.trim() && !isValidEmail(inviteEmail)) {
                  setInviteEmailError(t("team.inviteDialog.emailInvalid"));
                }
              }}
              placeholder="recruiter@company.com"
              error={inviteEmailError}
              required
              disabled={!isOwner || saving}
            />
            <RoleSelect
              label={t("team.inviteDialog.roleLabel")}
              roles={assignableRoles}
              value={inviteRoleId}
              onValueChange={setInviteRoleId}
              disabled={!isOwner || saving}
              t={t}
            />
            {!isOwner && (
              <p className="text-xs font-semibold text-amber-700">
                {t("team.alerts.inviteOwnerOnly")}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              className="font-bold"
              disabled={saving}
              onClick={() => setInviteDialogOpen(false)}
            >
              {t("team.actions.cancel")}
            </Button>
            <Button
              type="button"
              className="gap-2 bg-[#11a77a] font-bold hover:bg-[#0d966d]"
              disabled={inviteDisabled}
              onClick={() => void inviteMember()}
            >
              {saving ? <CircleNotch size={16} className="animate-spin" /> : <Plus size={16} />}
              {t("team.actions.inviteMember")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

function handleAuthError(error: unknown, router: ReturnType<typeof useRouter>, t: any) {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    clearRecruiterSession();
    router.replace("/recruiter/login");
    return;
  }
  void Swal.fire({
    icon: "error",
    title: t("onboarding.companyProfile.errors.saveErrorTitle") || "Lỗi hệ thống",
    text:
      t("onboarding.companyProfile.errors.unknown") || "Hệ thống gặp sự cố. Vui lòng thử lại sau.",
  });
}
