"use client";

import {
  CircleNotch,
  IdentificationBadge,
  PencilSimple,
  Plus,
  ShieldCheck,
  Trash,
  UsersThree,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import { getRecruiterAccount } from "@/features/recruiter/api/onboarding";
import {
  assignRecruiterRolePermissions,
  createRecruiterPermission,
  createRecruiterRole,
  deleteRecruiterPermission,
  deleteRecruiterRole,
  getCompanyMembers,
  getRecruiterPermissions,
  getRecruiterRoles,
  inviteCompanyMember,
  removeCompanyMember,
  updateCompanyMemberRole,
  updateRecruiterPermission,
  updateRecruiterRole,
  type CompanyMember,
  type PermissionPayload,
  type RecruiterPermission,
  type RecruiterRole,
  type RolePayload,
} from "@/features/recruiter/api/team";
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

type StoredRecruiterUser = Readonly<{
  id: string;
  email: string;
}>;

const emptyRoleForm: RolePayload = {
  code: "",
  name: "",
  description: "",
};

const emptyPermissionForm: PermissionPayload = {
  code: "",
  module: "",
  action: "",
  description: "",
};

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
  const [roleForm, setRoleForm] = useState<RolePayload>(emptyRoleForm);
  const [editingRoleId, setEditingRoleId] = useState("");
  const [permissionForm, setPermissionForm] = useState<PermissionPayload>(emptyPermissionForm);
  const [editingPermissionId, setEditingPermissionId] = useState("");
  const [assignRoleId, setAssignRoleId] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === assignRoleId) ?? null,
    [assignRoleId, roles],
  );

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
    const accessToken = localStorage.getItem("upnext.recruiter.accessToken");
    const rawUser = localStorage.getItem("upnext.recruiter.user");

    if (!accessToken || !rawUser) {
      router.replace("/recruiter/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(rawUser) as StoredRecruiterUser;
      setToken(accessToken);
      setAccountId(parsedUser.id);
      void loadTeamData(parsedUser.id, accessToken);
    } catch {
      router.replace("/recruiter/login");
    }
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

  async function saveRole() {
    if (!roleForm.code.trim() || !roleForm.name.trim()) {
      void Swal.fire({ icon: "error", title: "Code và tên vai trò là bắt buộc." });
      return;
    }

    try {
      setSaving(true);
      if (editingRoleId) {
        await updateRecruiterRole(editingRoleId, roleForm, token);
      } else {
        await createRecruiterRole(roleForm, token);
      }

      setRoleForm(emptyRoleForm);
      setEditingRoleId("");
      await reload();
      void toast.fire({ icon: "success", title: "Đã lưu vai trò." });
    } catch (error) {
      showActionError(error);
    } finally {
      setSaving(false);
    }
  }

  async function removeRole(roleId: string) {
    try {
      await deleteRecruiterRole(roleId, token);
      if (assignRoleId === roleId) setAssignRoleId("");
      await reload();
      void toast.fire({ icon: "success", title: "Đã xóa vai trò." });
    } catch (error) {
      showActionError(error);
    }
  }

  async function savePermission() {
    if (
      !permissionForm.code.trim() ||
      !permissionForm.module.trim() ||
      !permissionForm.action.trim()
    ) {
      void Swal.fire({ icon: "error", title: "Code, module và action là bắt buộc." });
      return;
    }

    try {
      setSaving(true);
      if (editingPermissionId) {
        await updateRecruiterPermission(editingPermissionId, permissionForm, token);
      } else {
        await createRecruiterPermission(permissionForm, token);
      }

      setPermissionForm(emptyPermissionForm);
      setEditingPermissionId("");
      await reload();
      void toast.fire({ icon: "success", title: "Đã lưu quyền." });
    } catch (error) {
      showActionError(error);
    } finally {
      setSaving(false);
    }
  }

  async function removePermission(permissionId: string) {
    try {
      await deleteRecruiterPermission(permissionId, token);
      setSelectedPermissionIds((current) => current.filter((id) => id !== permissionId));
      await reload();
      void toast.fire({ icon: "success", title: "Đã xóa quyền." });
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
    <div className="space-y-6">
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

      <Card className="upnext-shadow rounded-lg border-slate-200 bg-white">
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
          <TabButton
            active={tab === "permissions"}
            icon={<ShieldCheck size={18} />}
            onClick={() => setTab("permissions")}
          >
            Quyền hạn
          </TabButton>
        </div>

        <div className="p-5">
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
            />
          ) : null}
          {tab === "roles" ? (
            <RolesPanel
              assignRoleId={assignRoleId}
              editingRoleId={editingRoleId}
              permissions={permissions}
              roleForm={roleForm}
              roles={roles}
              saving={saving}
              selectedPermissionIds={selectedPermissionIds}
              selectedRole={selectedRole}
              setAssignRoleId={setAssignRoleId}
              setEditingRoleId={setEditingRoleId}
              setRoleForm={setRoleForm}
              setSelectedPermissionIds={setSelectedPermissionIds}
              onAssign={() => void assignPermissions()}
              onDelete={(roleId) => void removeRole(roleId)}
              onSave={() => void saveRole()}
            />
          ) : null}
          {tab === "permissions" ? (
            <PermissionsPanel
              editingPermissionId={editingPermissionId}
              permissionForm={permissionForm}
              permissions={permissions}
              saving={saving}
              setEditingPermissionId={setEditingPermissionId}
              setPermissionForm={setPermissionForm}
              onDelete={(permissionId) => void removePermission(permissionId)}
              onSave={() => void savePermission()}
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
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4 lg:grid-cols-[1fr_260px_auto]">
        <FormInput
          id="invite-email"
          label="Email thành viên"
          type="email"
          value={inviteEmail}
          onChange={(event) => setInviteEmail(event.target.value)}
          placeholder="recruiter@company.com"
        />
        <RoleSelect
          label="Vai trò"
          roles={roles}
          value={inviteRoleId}
          onValueChange={setInviteRoleId}
        />
        <div className="flex items-end">
          <Button
            className="w-full gap-2 bg-[#11a77a] font-bold hover:bg-[#0d966d]"
            disabled={saving}
            onClick={onInvite}
          >
            <Plus size={16} />
            Mời thành viên
          </Button>
        </div>
      </div>

      <DataTable>
        <thead className="bg-slate-50 text-left text-xs font-extrabold tracking-wide text-slate-500 uppercase">
          <tr>
            <th className="px-5 py-3">Thành viên</th>
            <th className="px-5 py-3">Trạng thái</th>
            <th className="px-5 py-3">Vai trò</th>
            <th className="px-5 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {members.map((member) => {
            const email = member.recruiterAccount?.email ?? member.invitedEmail ?? "unknown";
            const name = member.recruiterAccount?.profile?.fullName ?? email;

            return (
              <tr key={member.id} className="even:bg-slate-50">
                <td className="px-5 py-4">
                  <p className="font-extrabold text-slate-950">{name}</p>
                  <p className="text-xs text-slate-500">{email}</p>
                </td>
                <td className="px-5 py-4">
                  <Badge tone={member.status === "ACTIVE" ? "success" : "warning"}>
                    {member.status}
                  </Badge>
                </td>
                <td className="px-5 py-4">
                  <RoleSelect
                    label={`Vai trò của ${email}`}
                    hideLabel
                    roles={roles}
                    value={member.role?.id ?? ""}
                    onValueChange={(roleId) => onRoleChange(member.id, roleId)}
                  />
                </td>
                <td className="px-5 py-4 text-right">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 text-red-600 hover:border-red-600 hover:bg-red-50"
                    aria-label={`Xóa thành viên ${name}`}
                    onClick={() => onRemove(member.id)}
                  >
                    <span className="sr-only">Xóa thành viên {name}</span>
                    <Trash size={15} />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>
    </div>
  );
}

function RolesPanel({
  assignRoleId,
  editingRoleId,
  onAssign,
  onDelete,
  onSave,
  permissions,
  roleForm,
  roles,
  saving,
  selectedPermissionIds,
  selectedRole,
  setAssignRoleId,
  setEditingRoleId,
  setRoleForm,
  setSelectedPermissionIds,
}: {
  assignRoleId: string;
  editingRoleId: string;
  onAssign: () => void;
  onDelete: (roleId: string) => void;
  onSave: () => void;
  permissions: RecruiterPermission[];
  roleForm: RolePayload;
  roles: RecruiterRole[];
  saving: boolean;
  selectedPermissionIds: string[];
  selectedRole: RecruiterRole | null;
  setAssignRoleId: (value: string) => void;
  setEditingRoleId: (value: string) => void;
  setRoleForm: (value: RolePayload) => void;
  setSelectedPermissionIds: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const assignedIds = new Set(
    selectedRole?.rolePermissions?.map(({ recruiterPermission }) => recruiterPermission.id) ?? [],
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
      <div className="space-y-5">
        <FormCard title={editingRoleId ? "Sửa vai trò" : "Tạo vai trò"}>
          <FormInput
            id="role-code"
            label="Code"
            value={roleForm.code}
            onChange={(event) => setRoleForm({ ...roleForm, code: event.target.value })}
            placeholder="hr_manager"
          />
          <FormInput
            id="role-name"
            label="Tên vai trò"
            value={roleForm.name}
            onChange={(event) => setRoleForm({ ...roleForm, name: event.target.value })}
            placeholder="HR Manager"
          />
          <FormInput
            id="role-description"
            label="Mô tả"
            value={roleForm.description ?? ""}
            onChange={(event) => setRoleForm({ ...roleForm, description: event.target.value })}
            placeholder="Quản lý tuyển dụng"
          />
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-[#11a77a] font-bold hover:bg-[#0d966d]"
              disabled={saving}
              onClick={onSave}
            >
              {editingRoleId ? "Lưu vai trò" : "Tạo vai trò"}
            </Button>
            {editingRoleId ? (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingRoleId("");
                  setRoleForm(emptyRoleForm);
                }}
              >
                Hủy
              </Button>
            ) : null}
          </div>
        </FormCard>

        <FormCard title="Gán quyền cho vai trò">
          <RoleSelect
            label="Vai trò"
            roles={roles}
            value={assignRoleId}
            onValueChange={setAssignRoleId}
          />
          <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
            {permissions.map((permission) => (
              <label
                key={permission.id}
                htmlFor={`assign-permission-${permission.id}`}
                className="flex items-start gap-2 rounded-md p-2 hover:bg-slate-50"
              >
                <Checkbox
                  id={`assign-permission-${permission.id}`}
                  checked={selectedPermissionIds.includes(permission.id)}
                  disabled={assignedIds.has(permission.id)}
                  onCheckedChange={(checked) =>
                    setSelectedPermissionIds((current) =>
                      checked === true
                        ? Array.from(new Set([...current, permission.id]))
                        : current.filter((id) => id !== permission.id),
                    )
                  }
                />
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-800">{permission.code}</span>
                  <span className="block text-xs text-slate-500">
                    {assignedIds.has(permission.id)
                      ? "Đã gán"
                      : `${permission.module} / ${permission.action}`}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <Button
            className="w-full bg-[#11a77a] font-bold hover:bg-[#0d966d]"
            disabled={saving}
            onClick={onAssign}
          >
            Gán quyền
          </Button>
        </FormCard>
      </div>

      <DataTable>
        <thead className="bg-slate-50 text-left text-xs font-extrabold tracking-wide text-slate-500 uppercase">
          <tr>
            <th className="px-5 py-3" scope="col">
              Vai trò
            </th>
            <th className="px-5 py-3" scope="col">
              Quyền
            </th>
            <th className="px-5 py-3 text-right" scope="col">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {roles.map((role) => (
            <tr key={role.id} className="align-top even:bg-slate-50">
              <td className="px-5 py-4">
                <p className="font-extrabold text-slate-950">{role.name}</p>
                <p className="text-xs font-semibold text-emerald-700">{role.code}</p>
                <p className="mt-1 text-xs text-slate-500">{role.description}</p>
              </td>
              <td className="px-5 py-4">
                <div className="flex max-w-xl flex-wrap gap-1.5">
                  {role.rolePermissions?.map(({ recruiterPermission }) => (
                    <Badge key={recruiterPermission.id} tone="info">
                      {recruiterPermission.code}
                    </Badge>
                  ))}
                </div>
              </td>
              <td className="px-5 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                    aria-label={`Sửa vai trò ${role.name}`}
                    onClick={() => {
                      setEditingRoleId(role.id);
                      setRoleForm({
                        code: role.code,
                        name: role.name,
                        description: role.description ?? "",
                      });
                    }}
                  >
                    <span className="sr-only">Sửa vai trò {role.name}</span>
                    <PencilSimple size={15} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 text-red-600 hover:border-red-600 hover:bg-red-50"
                    aria-label={`Xóa vai trò ${role.name}`}
                    onClick={() => onDelete(role.id)}
                  >
                    <span className="sr-only">Xóa vai trò {role.name}</span>
                    <Trash size={15} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </div>
  );
}

function PermissionsPanel({
  editingPermissionId,
  onDelete,
  onSave,
  permissionForm,
  permissions,
  saving,
  setEditingPermissionId,
  setPermissionForm,
}: {
  editingPermissionId: string;
  onDelete: (permissionId: string) => void;
  onSave: () => void;
  permissionForm: PermissionPayload;
  permissions: RecruiterPermission[];
  saving: boolean;
  setEditingPermissionId: (value: string) => void;
  setPermissionForm: (value: PermissionPayload) => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
      <FormCard title={editingPermissionId ? "Sửa quyền" : "Tạo quyền"}>
        <FormInput
          id="permission-code"
          label="Code"
          value={permissionForm.code}
          onChange={(event) => setPermissionForm({ ...permissionForm, code: event.target.value })}
          placeholder="job_posts:create"
        />
        <FormInput
          id="permission-module"
          label="Module"
          value={permissionForm.module}
          onChange={(event) => setPermissionForm({ ...permissionForm, module: event.target.value })}
          placeholder="job_posts"
        />
        <FormInput
          id="permission-action"
          label="Action"
          value={permissionForm.action}
          onChange={(event) => setPermissionForm({ ...permissionForm, action: event.target.value })}
          placeholder="create"
        />
        <FormInput
          id="permission-description"
          label="Mô tả"
          value={permissionForm.description ?? ""}
          onChange={(event) =>
            setPermissionForm({ ...permissionForm, description: event.target.value })
          }
          placeholder="Cho phép tạo tin tuyển dụng"
        />
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-[#11a77a] font-bold hover:bg-[#0d966d]"
            disabled={saving}
            onClick={onSave}
          >
            {editingPermissionId ? "Lưu quyền" : "Tạo quyền"}
          </Button>
          {editingPermissionId ? (
            <Button
              variant="outline"
              onClick={() => {
                setEditingPermissionId("");
                setPermissionForm(emptyPermissionForm);
              }}
            >
              Hủy
            </Button>
          ) : null}
        </div>
      </FormCard>

      <DataTable>
        <thead className="bg-slate-50 text-left text-xs font-extrabold tracking-wide text-slate-500 uppercase">
          <tr>
            <th className="px-5 py-3" scope="col">
              Quyền
            </th>
            <th className="px-5 py-3" scope="col">
              Module
            </th>
            <th className="px-5 py-3" scope="col">
              Action
            </th>
            <th className="px-5 py-3 text-right" scope="col">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {permissions.map((permission) => (
            <tr key={permission.id} className="even:bg-slate-50">
              <td className="px-5 py-4">
                <p className="font-extrabold text-slate-950">{permission.code}</p>
                <p className="text-xs text-slate-500">{permission.description}</p>
              </td>
              <td className="px-5 py-4">
                <Badge tone="neutral">{permission.module}</Badge>
              </td>
              <td className="px-5 py-4">
                <Badge tone="info">{permission.action}</Badge>
              </td>
              <td className="px-5 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                    aria-label={`Sửa quyền ${permission.code}`}
                    onClick={() => {
                      setEditingPermissionId(permission.id);
                      setPermissionForm({
                        code: permission.code,
                        module: permission.module,
                        action: permission.action,
                        description: permission.description ?? "",
                      });
                    }}
                  >
                    <span className="sr-only">Sửa quyền {permission.code}</span>
                    <PencilSimple size={15} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 text-red-600 hover:border-red-600 hover:bg-red-50"
                    aria-label={`Xóa quyền ${permission.code}`}
                    onClick={() => onDelete(permission.id)}
                  >
                    <span className="sr-only">Xóa quyền {permission.code}</span>
                    <Trash size={15} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </div>
  );
}

function RoleSelect({
  hideLabel,
  label,
  onValueChange,
  roles,
  value,
}: {
  hideLabel?: boolean;
  label: string;
  onValueChange: (value: string) => void;
  roles: RecruiterRole[];
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {hideLabel ? null : <Label className="text-sm font-bold text-slate-700">{label}</Label>}
      <Select
        value={value || "none"}
        onValueChange={(next) => onValueChange(next === "none" ? "" : next)}
      >
        <SelectTrigger
          aria-label={label}
          className="h-10 rounded-lg border-slate-200 bg-white shadow-none"
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
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">{children}</table>
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
    localStorage.removeItem("upnext.recruiter.accessToken");
    localStorage.removeItem("upnext.recruiter.tokenType");
    localStorage.removeItem("upnext.recruiter.user");
    router.replace("/recruiter/login");
    return;
  }

  showActionError(error);
}
