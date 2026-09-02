"use client";

import { ShieldCheck, Users } from "@phosphor-icons/react";
import * as React from "react";

import { AdminAccountsTable } from "@/features/admin/components/system/admins/admin-accounts-table";
import { RolesTable } from "@/features/admin/components/system/roles/roles-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

export default function AdminRolesPage() {
  const [activeTab, setActiveTab] = React.useState("admins");

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-2xl font-bold tracking-tight">
          Quản lý Phân quyền & Tài khoản Admin
        </h1>
        <p className="text-muted-foreground text-sm">
          Quản lý danh sách tài khoản quản trị viên, cấu hình vai trò và ma trận phân quyền hệ thống
          theo từng module.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:w-[420px]">
          <TabsTrigger value="admins" className="flex items-center gap-2">
            <Users size={16} weight="bold" />
            Tài khoản Admin
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <ShieldCheck size={16} weight="bold" />
            Vai trò & Quyền hạn
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admins" className="mt-6">
          <AdminAccountsTable />
        </TabsContent>

        <TabsContent value="roles" className="mt-6">
          <RolesTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
