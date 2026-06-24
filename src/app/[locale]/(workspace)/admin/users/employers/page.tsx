import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";

import { AddEmployerDialog } from "@/features/admin/components/users/add-employer-dialog";
import { EmployersTable } from "@/features/admin/components/users/employers-table";
import { Input } from "@/shared/ui/input";

export default function EmployersPage() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-foreground text-3xl font-extrabold tracking-tight">Nhà tuyển dụng</h2>
          <p className="text-muted-foreground mt-1">
            Quản lý tài khoản công ty, duyệt hồ sơ KYC và phân quyền gói dịch vụ.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <AddEmployerDialog />
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <MagnifyingGlass
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
            size={18}
          />
          <Input
            className="bg-muted h-10 rounded-xl pl-10"
            placeholder="Tìm theo tên công ty, email..."
          />
        </div>
      </div>

      <EmployersTable />
    </div>
  );
}
