import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type CompanyMemberApiItem,
  getCompanyMembers,
  inviteCompanyMember,
  updateCompanyMemberRole,
} from "@/features/recruiter/api/company-members";
import {
  getRecruiterAccounts,
  type RecruiterAccountApiItem,
} from "@/features/recruiter/api/recruiter-accounts";
import {
  getRecruiterRoles,
  type RecruiterRoleApiItem,
} from "@/features/recruiter/api/recruiter-roles";
import {
  BriefcaseBusiness,
  Crown,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "@/features/recruiter/icons";
import {
  type CompanyMember,
  type MemberStatus,
  type RecruiterRoleDefinition,
  type TeamKpi,
} from "@/features/recruiter/types";
import { formatRelativeTime } from "@/shared/lib/date";
import { env } from "@/shared/lib/env";

const teamMembersQueryKey = (companyId: string) => ["company-members", companyId] as const;
const recruiterAccountsQueryKey = ["recruiter-accounts"] as const;
const recruiterRolesQueryKey = ["recruiter-roles"] as const;

const fallbackRoleVisuals = {
  ADMIN: {
    description: "Quản lý vận hành tuyển dụng",
    icon: ShieldCheck,
    tone: "blue",
  },
  INTERVIEWER: {
    description: "Xem lịch và đánh giá phỏng vấn",
    icon: UsersRound,
    tone: "orange",
  },
  OWNER: {
    description: "Toàn quyền hệ thống",
    icon: Crown,
    tone: "violet",
  },
  RECRUITER: {
    description: "Quản lý tin và ứng viên",
    icon: UserRound,
    tone: "emerald",
  },
} as const;

export function useTeamPageData() {
  const companyId = env.NEXT_PUBLIC_RECRUITER_COMPANY_ID;

  const rolesQuery = useQuery({
    queryKey: recruiterRolesQueryKey,
    queryFn: getRecruiterRoles,
  });

  const membersQuery = useQuery({
    queryKey: teamMembersQueryKey(companyId),
    queryFn: () => getCompanyMembers(companyId),
  });

  const accountsQuery = useQuery({
    queryKey: recruiterAccountsQueryKey,
    queryFn: getRecruiterAccounts,
  });

  const roles = mapRecruiterRoles(rolesQuery.data ?? []);
  const members = mapCompanyMembers(membersQuery.data ?? [], accountsQuery.data?.items ?? []);
  const kpis = buildTeamKpis(members);

  return {
    companyId,
    error: rolesQuery.error ?? membersQuery.error ?? accountsQuery.error ?? null,
    isLoading: rolesQuery.isLoading || membersQuery.isLoading || accountsQuery.isLoading,
    kpis,
    members,
    refetchMembers: membersQuery.refetch,
    roles,
  };
}

export function useInviteCompanyMember() {
  const queryClient = useQueryClient();
  const companyId = env.NEXT_PUBLIC_RECRUITER_COMPANY_ID;

  return useMutation({
    mutationFn: (payload: { email: string; roleId: string }) =>
      inviteCompanyMember(companyId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: teamMembersQueryKey(companyId),
      });
    },
  });
}

export function useUpdateCompanyMemberRole() {
  const queryClient = useQueryClient();
  const companyId = env.NEXT_PUBLIC_RECRUITER_COMPANY_ID;

  return useMutation({
    mutationFn: ({ memberId, roleId }: { memberId: string; roleId: string }) =>
      updateCompanyMemberRole(memberId, { roleId }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: teamMembersQueryKey(companyId),
        }),
        queryClient.invalidateQueries({
          queryKey: recruiterAccountsQueryKey,
        }),
      ]);
    },
  });
}

function buildTeamKpis(members: CompanyMember[]): TeamKpi[] {
  const activeMembers = members.filter((member) => member.status === "ACTIVE").length;
  const pendingMembers = members.filter((member) => member.status === "PENDING").length;
  const suspendedMembers = members.filter((member) => isSuspendedStatus(member.status)).length;

  return [
    {
      label: "Tổng thành viên",
      tone: "emerald",
      trend: "Dữ liệu thời gian thực",
      trendDirection: "flat",
      value: `${members.length}`,
    },
    {
      label: "Đang hoạt động",
      tone: "emerald",
      trend: "Theo trạng thái account",
      trendDirection: "flat",
      value: `${activeMembers}`,
    },
    {
      label: "Chờ xác nhận",
      tone: "amber",
      trend: "Theo trạng thái member",
      trendDirection: "flat",
      value: `${pendingMembers}`,
    },
    {
      label: "Tạm khóa",
      tone: "rose",
      trend: "Theo trạng thái account",
      trendDirection: "flat",
      value: `${suspendedMembers}`,
    },
  ];
}

function mapCompanyMembers(
  members: CompanyMemberApiItem[],
  recruiterAccounts: RecruiterAccountApiItem[],
): CompanyMember[] {
  return members.map((member) => {
    const recruiterAccount = recruiterAccounts.find(
      (account) => account.id === member.recruiterAccountId,
    );
    const fullName =
      recruiterAccount?.profile?.fullName ??
      member.recruiterAccount.profile?.fullName ??
      member.recruiterAccount.email;

    return {
      actionLabel: getActionLabel(member.role.code, member.status, recruiterAccount?.status),
      assignedJobCount: 0,
      avatar: buildAvatarText(fullName),
      department: "-",
      email: recruiterAccount?.email ?? member.recruiterAccount.email,
      fullName,
      id: member.id,
      interviewCount: 0,
      lastActiveAt: recruiterAccount?.updatedAt
        ? formatRelativeTime(recruiterAccount.updatedAt)
        : formatRelativeTime(member.updatedAt),
      recruiterAccountId: member.recruiterAccountId,
      roleCode: member.role.code,
      roleId: member.role.id,
      roleName: member.role.name,
      status: normalizeMemberStatus(member.status, recruiterAccount?.status),
    };
  });
}

function mapRecruiterRoles(roles: RecruiterRoleApiItem[]): RecruiterRoleDefinition[] {
  return roles.map((role) => {
    const fallback = fallbackRoleVisuals[role.code as keyof typeof fallbackRoleVisuals];

    return {
      code: role.code,
      description: role.description ?? fallback?.description ?? "Vai trò tuyển dụng",
      icon: fallback?.icon ?? BriefcaseBusiness,
      id: role.id,
      label: role.name,
      permissions:
        role.rolePermissions
          ?.map((item) => item.permission?.name ?? item.permission?.code)
          .filter((permission): permission is string => Boolean(permission)) ?? [],
      tone: fallback?.tone ?? "slate",
    };
  });
}

function buildAvatarText(fullName: string) {
  const parts = fullName.split(/\s+/u).filter(Boolean).slice(0, 2);

  if (parts.length === 0) {
    return "NA";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function getActionLabel(roleCode: string, memberStatus: string, accountStatus?: string) {
  if (memberStatus === "PENDING") {
    return "Gửi lại lời mời";
  }

  if (isSuspendedStatus(accountStatus ?? memberStatus)) {
    return "Kích hoạt";
  }

  if (roleCode === "OWNER") {
    return "Xem chi tiết";
  }

  return "Đổi vai trò";
}

function isSuspendedStatus(status?: string) {
  return (
    status === "SUSPENDED" ||
    status === "INACTIVE" ||
    status === "DEACTIVATED" ||
    status === "LOCKED"
  );
}

function normalizeMemberStatus(memberStatus: string, accountStatus?: string): MemberStatus {
  if (memberStatus === "PENDING") {
    return "PENDING";
  }

  if (isSuspendedStatus(accountStatus ?? memberStatus)) {
    return "SUSPENDED";
  }

  return "ACTIVE";
}
