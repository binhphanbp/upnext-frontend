import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";

import { CandidatesTable } from "@/features/admin/components/users/candidates-table";
import { Input } from "@/shared/ui/input";

export default function CandidatesPage() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-foreground text-3xl font-extrabold tracking-tight">Ứng viên</h2>
          <p className="text-muted-foreground mt-1">
            Quản lý hồ sơ ứng viên, trạng thái tìm việc và hỗ trợ kỹ thuật.
          </p>
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
            placeholder="Tìm theo tên ứng viên, email, kỹ năng..."
          />
        </div>
      </div>

      <CandidatesTable />
    </div>
  );
}
