"use client";

import { DotsThree, Eye, MagnifyingGlass, PencilSimple } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import * as React from "react";
import Swal from "sweetalert2";

import { clearAdminSession, getAdminSession } from "@/features/admin/session";
import {
  getSubscriptionPlans,
  updateSubscriptionPlan,
  type SubscriptionPlan,
} from "@/features/recruiter/api/billing";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
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
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";

import { EditPlanDialog } from "./edit-plan-dialog";
import { PlanDetailsDialog } from "./plan-details-dialog";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

function formatPrice(
  priceString: string,
  cycleLabel: (days: number) => string,
  durationDays: number,
) {
  const amount = Number(priceString);
  return (
    <div className="text-right font-medium">
      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)}
      <span className="text-muted-foreground block text-xs font-normal">
        / {cycleLabel(durationDays)}
      </span>
    </div>
  );
}

type GetColumnsArgs = {
  t: ReturnType<typeof useTranslations>;
  onViewDetails: (plan: SubscriptionPlan) => void;
  onEdit: (plan: SubscriptionPlan) => void;
  onToggleStatus: (plan: SubscriptionPlan) => void;
  onTogglePublic: (plan: SubscriptionPlan) => void;
};

function getColumns({
  t,
  onViewDetails,
  onEdit,
  onToggleStatus,
  onTogglePublic,
}: GetColumnsArgs): ColumnDef<SubscriptionPlan>[] {
  return [
    {
      accessorKey: "subscriptionName",
      header: t("planName"),
      cell: ({ row }) => (
        <div>
          <p className="text-foreground font-semibold">{row.original.subscriptionName}</p>
          {row.original.code ? (
            <p className="text-muted-foreground font-mono text-xs">{row.original.code}</p>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "audience",
      header: t("targetAudience"),
      cell: ({ row }) => {
        const isEmployer = row.original.audience === "RECRUITER";
        return (
          <Badge tone={isEmployer ? "brand" : "info"}>
            {t(`targetAudienceOptions.${isEmployer ? "employer" : "candidate"}`)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "price",
      header: () => <div className="text-right">{t("price")}</div>,
      cell: ({ row }) =>
        formatPrice(
          row.original.price,
          (days) => `${days} ${t("daysUnit")}`,
          row.original.durationDays,
        ),
    },
    {
      accessorKey: "isPublic",
      header: t("visibility"),
      cell: ({ row }) => (
        <Badge tone={row.original.isPublic ? "success" : "neutral"}>
          {t(row.original.isPublic ? "visibilityOptions.public" : "visibilityOptions.private")}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: t("status"),
      cell: ({ row }) => {
        const isActive = row.original.status === "ACTIVE";
        return (
          <Badge tone={isActive ? "success" : "neutral"}>
            {t(`statusOptions.${isActive ? "active" : "legacy"}`)}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">{t("actions")}</div>,
      cell: ({ row }) => {
        const plan = row.original;

        return (
          <div className="flex justify-end gap-2 text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">{t("actions")}</span>
                  <DotsThree size={20} weight="bold" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onViewDetails(plan)}>
                  <Eye className="mr-2" size={16} />
                  {t("actionOptions.viewDetails")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(plan)}>
                  <PencilSimple className="mr-2" size={16} />
                  {t("actionOptions.edit")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onTogglePublic(plan)}>
                  {t(
                    plan.isPublic ? "actionOptions.hideFromPricing" : "actionOptions.showOnPricing",
                  )}
                </DropdownMenuItem>
                {plan.status === "INACTIVE" ? (
                  <DropdownMenuItem className="text-success" onClick={() => onToggleStatus(plan)}>
                    {t("actionOptions.publish")}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem className="text-warning" onClick={() => onToggleStatus(plan)}>
                    {t("actionOptions.retire")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}

export function PlansTable() {
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [audienceFilter, setAudienceFilter] = React.useState<string>("all");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedPlan, setSelectedPlan] = React.useState<SubscriptionPlan | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [editingPlan, setEditingPlan] = React.useState<SubscriptionPlan | null>(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);

  const t = useTranslations("Admin.finance.plans.table");
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: plans = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["adminSubscriptionPlans"],
    queryFn: () => {
      const session = getAdminSession();
      const token =
        session?.accessToken ||
        (typeof window !== "undefined"
          ? localStorage.getItem("upnext.admin.accessToken") ||
            localStorage.getItem("adminAccessToken") ||
            localStorage.getItem("accessToken") ||
            ""
          : "");
      return getSubscriptionPlans(token);
    },
  });

  const handleAuthError = React.useCallback(
    (thrown: unknown): boolean => {
      if (thrown instanceof Error && thrown.message === "No session") {
        router.replace("/portal-access");
        return true;
      }
      if (thrown instanceof ApiError && thrown.status === 401) {
        clearAdminSession();
        router.replace("/portal-access");
        return true;
      }
      return false;
    },
    [router],
  );

  const { mutate: toggleStatus } = useMutation({
    mutationFn: async (plan: SubscriptionPlan) => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      const nextStatus = plan.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      return updateSubscriptionPlan(plan.id, { status: nextStatus }, session.accessToken);
    },
    onSuccess: () => {
      void toast.fire({ icon: "success", title: t("toasts.statusUpdated") });
      queryClient.invalidateQueries({ queryKey: ["adminSubscriptionPlans"] });
    },
    onError: (thrown: unknown) => {
      if (handleAuthError(thrown)) return;
      void toast.fire({
        icon: "error",
        title: thrown instanceof ApiError ? thrown.message : t("toasts.genericError"),
      });
    },
  });

  const { mutate: togglePublic } = useMutation({
    mutationFn: async (plan: SubscriptionPlan) => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return updateSubscriptionPlan(plan.id, { isPublic: !plan.isPublic }, session.accessToken);
    },
    onSuccess: () => {
      void toast.fire({ icon: "success", title: t("toasts.visibilityUpdated") });
      queryClient.invalidateQueries({ queryKey: ["adminSubscriptionPlans"] });
    },
    onError: (thrown: unknown) => {
      if (handleAuthError(thrown)) return;
      void toast.fire({
        icon: "error",
        title: thrown instanceof ApiError ? thrown.message : t("toasts.genericError"),
      });
    },
  });

  const filteredData = React.useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return plans.filter((plan) => {
      if (statusFilter !== "all" && plan.status !== statusFilter) return false;
      if (audienceFilter !== "all" && plan.audience !== audienceFilter) return false;
      if (
        keyword &&
        !plan.subscriptionName.toLowerCase().includes(keyword) &&
        !(plan.code ?? "").toLowerCase().includes(keyword)
      ) {
        return false;
      }
      return true;
    });
  }, [plans, statusFilter, audienceFilter, searchTerm]);

  const handleViewDetails = React.useCallback((plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsDetailsOpen(true);
  }, []);

  const handleEdit = React.useCallback((plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setIsEditOpen(true);
  }, []);

  const columns = React.useMemo(
    () =>
      getColumns({
        t,
        onViewDetails: handleViewDetails,
        onEdit: handleEdit,
        onToggleStatus: toggleStatus,
        onTogglePublic: togglePublic,
      }),
    [t, handleViewDetails, handleEdit, toggleStatus, togglePublic],
  );

  React.useEffect(() => {
    // Keep the details/edit dialogs in sync after a mutation invalidates the list.
    if (selectedPlan) {
      const fresh = plans.find((plan) => plan.id === selectedPlan.id);
      if (fresh && fresh !== selectedPlan) setSelectedPlan(fresh);
    }
    if (editingPlan) {
      const fresh = plans.find((plan) => plan.id === editingPlan.id);
      if (fresh && fresh !== editingPlan) setEditingPlan(fresh);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans]);

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  if (error) {
    return <p className="text-destructive text-sm">{t("toasts.loadError")}</p>;
  }

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
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <Select value={audienceFilter} onValueChange={setAudienceFilter}>
            <SelectTrigger className="bg-card h-10 w-full rounded-xl sm:w-[180px]">
              <SelectValue placeholder={t("allAudiences")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allAudiences")}</SelectItem>
              <SelectItem value="RECRUITER">{t("targetAudienceOptions.employer")}</SelectItem>
              <SelectItem value="CANDIDATE">{t("targetAudienceOptions.candidate")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-card h-10 w-full rounded-xl sm:w-[180px]">
              <SelectValue placeholder={t("allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              <SelectItem value="ACTIVE">{t("statusOptions.active")}</SelectItem>
              <SelectItem value="INACTIVE">{t("statusOptions.legacy")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DataTable columns={columns} data={filteredData} />
      </div>

      <PlanDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        plan={selectedPlan}
        t={t}
      />
      <EditPlanDialog open={isEditOpen} onOpenChange={setIsEditOpen} plan={editingPlan} />
    </>
  );
}
