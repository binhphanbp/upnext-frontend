import type { ReactNode } from "react";

import { RecruiterSidebar } from "./recruiter-sidebar";
import { RecruiterTopbar } from "./recruiter-topbar";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-clip bg-slate-50 text-slate-950">
      <RecruiterSidebar />

      <div className="min-h-screen min-w-0 lg:pl-[280px]">
        <div className="flex min-h-screen min-w-0 flex-col">
          <RecruiterTopbar />
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
