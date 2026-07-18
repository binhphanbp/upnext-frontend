"use client";

import { DotsThree, MagnifyingGlass, UserCirclePlus } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import * as React from "react";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DataTable } from "@/shared/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/shared/ui/sheet";

import {
  ChatThread,
  mockSupportThreads,
  mockAdmins,
  adminUser,
} from "../../../../recruiter/api/chat";
import { ChatWindow } from "../../../../recruiter/components/chat/chat-window";

export function SupportTable() {
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [threads, setThreads] = React.useState<ChatThread[]>(mockSupportThreads);

  // Sheet state for chatting
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [selectedTicket, setSelectedTicket] = React.useState<ChatThread | undefined>(undefined);

  const t = useTranslations("Admin.content.support.table");

  // Keep synced with mock array changes from recruiter side (if any)
  React.useEffect(() => {
    // In a real app this would be a socket or query invalidation
    const interval = setInterval(() => {
      setThreads([...mockSupportThreads]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAssignTicket = (ticketId: string, assigneeId: string) => {
    const ticketIndex = mockSupportThreads.findIndex((t) => t.id === ticketId);
    if (ticketIndex > -1) {
      const t = mockSupportThreads[ticketIndex];
      if (t) t.assigneeId = assigneeId;
      setThreads([...mockSupportThreads]);
    }
  };

  const filteredData = React.useMemo(() => {
    if (statusFilter === "all") return threads;
    return threads.filter((item) => {
      if (statusFilter === "Mở") return item.ticketStatus === "open";
      if (statusFilter === "Đang xử lý") return item.ticketStatus === "resolved"; // Wait, 'Đang xử lý' should be open/inProgress. We mapped resolved to closed in previous mock? Actually ticketStatus is open | resolved | closed.
      if (statusFilter === "Đã đóng")
        return item.ticketStatus === "closed" || item.ticketStatus === "resolved";
      return true;
    });
  }, [statusFilter, threads]);

  const columns = React.useMemo<ColumnDef<ChatThread>[]>(
    () => [
      {
        accessorKey: "ticketSubject",
        header: t("subject"),
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.ticketSubject}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-muted-foreground text-xs">{row.original.id}</span>
              {row.original.ticketCategory && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                  {row.original.ticketCategory}
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        id: "user",
        header: t("user"),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium">{row.original.participants[0]?.name}</span>
            <span className="text-muted-foreground text-xs capitalize">
              {row.original.participants[0]?.role}
            </span>
          </div>
        ),
      },
      {
        id: "assignee",
        header: "Người phụ trách",
        cell: ({ row }) => {
          const assigneeId = row.original.assigneeId;
          const assignee = mockAdmins.find((a) => a.id === assigneeId);

          return assignee ? (
            <div className="flex items-center gap-1.5 text-sm text-slate-700">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                {assignee.name.charAt(0)}
              </div>
              {assignee.name}
            </div>
          ) : (
            <span className="text-sm text-slate-400 italic">Chưa phân công</span>
          );
        },
      },
      {
        accessorKey: "ticketStatus",
        header: t("status"),
        cell: ({ row }) => {
          const status = row.original.ticketStatus;
          const tone =
            status === "open" ? "warning" : status === "resolved" ? "success" : "success";

          const label = status === "open" ? "Đang xử lý" : "Đã đóng";
          return <Badge tone={tone}>{label}</Badge>;
        },
      },
      {
        id: "createdDate",
        header: t("createdDate"),
        cell: ({ row }) => {
          const timestamp = row.original.lastMessage?.timestamp;
          if (!timestamp) return null;
          return (
            <div className="text-sm text-slate-600">
              {new Date(timestamp).toLocaleDateString("vi-VN")}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">{t("actions")}</div>,
        cell: ({ row }) => {
          const ticket = row.original;

          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Mở menu thao tác</span>
                    <DotsThree size={20} weight="bold" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setIsSheetOpen(true);
                    }}
                  >
                    {t("actionOptions.viewDetails")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />

                  {/* Assign Sub-menu */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <UserCirclePlus size={16} className="mr-2" />
                      Phân công (Assign)
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {mockAdmins.map((admin) => (
                          <DropdownMenuItem
                            key={admin.id}
                            onClick={() => handleAssignTicket(ticket.id, admin.id)}
                          >
                            {admin.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />

                  {ticket.ticketStatus === "open" && (
                    <DropdownMenuItem
                      className="text-success"
                      onClick={() => {
                        const ticketIndex = mockSupportThreads.findIndex((t) => t.id === ticket.id);
                        if (ticketIndex > -1) {
                          const t = mockSupportThreads[ticketIndex];
                          if (t) t.ticketStatus = "resolved";
                          setThreads([...mockSupportThreads]);
                        }
                      }}
                    >
                      {t("actionOptions.close")}
                    </DropdownMenuItem>
                  )}
                  {ticket.ticketStatus !== "open" && (
                    <DropdownMenuItem
                      onClick={() => {
                        const ticketIndex = mockSupportThreads.findIndex((t) => t.id === ticket.id);
                        if (ticketIndex > -1) {
                          const t = mockSupportThreads[ticketIndex];
                          if (t) t.ticketStatus = "open";
                          setThreads([...mockSupportThreads]);
                        }
                      }}
                    >
                      {t("actionOptions.reopen")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [t],
  );

  return (
    <>
      <div className="mt-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[350px]">
            <MagnifyingGlass
              className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
              size={18}
            />
            <Input
              className="bg-muted h-10 rounded-xl pl-10"
              placeholder={t("searchPlaceholder")}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-card h-10 w-full rounded-xl sm:w-[180px]">
              <SelectValue placeholder={t("allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              <SelectItem value="Mở">Đang xử lý</SelectItem>
              <SelectItem value="Đã đóng">Đã đóng</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DataTable columns={columns} data={filteredData} />
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="flex w-full flex-col gap-0 border-l-0 p-0 sm:max-w-md lg:max-w-lg">
          <SheetHeader className="hidden border-b border-slate-200 p-4">
            <SheetTitle>Chi tiết Ticket</SheetTitle>
            <SheetDescription>Phản hồi yêu cầu hỗ trợ</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-hidden">
            {selectedTicket ? (
              <ChatWindow thread={selectedTicket} currentUserId="admin-1" currentUserRole="admin" />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">
                Đang tải...
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
