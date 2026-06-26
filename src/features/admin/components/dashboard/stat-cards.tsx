"use client";

import {
  Briefcase,
  CurrencyCircleDollar,
  ShieldCheck,
  TrendUp,
  Users,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export function StatCards() {
  const t = useTranslations("Admin.dashboard");

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold">{t("totalRevenue")}</CardTitle>
          <CurrencyCircleDollar className="text-muted-foreground" size={20} />
        </CardHeader>
        <CardContent>
          <div className="text-foreground text-2xl font-extrabold">245.500.000₫</div>
          <p className="text-muted-foreground mt-1 flex items-center text-xs">
            <span className="text-success mr-1 flex items-center">
              <TrendUp className="mr-0.5" size={14} /> +15.5%
            </span>
            {t("comparedToLastMonth")}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold">{t("newUsers")}</CardTitle>
          <Users className="text-muted-foreground" size={20} />
        </CardHeader>
        <CardContent>
          <div className="text-foreground text-2xl font-extrabold">+1.240</div>
          <p className="text-muted-foreground mt-1 flex items-center text-xs">
            <span className="text-success mr-1 flex items-center">
              <TrendUp className="mr-0.5" size={14} /> +8.2%
            </span>
            {t("comparedToLastMonth")}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold">{t("activeJobs")}</CardTitle>
          <Briefcase className="text-muted-foreground" size={20} />
        </CardHeader>
        <CardContent>
          <div className="text-foreground text-2xl font-extrabold">12.234</div>
          <p className="text-muted-foreground mt-1 flex items-center text-xs">
            <span className="text-success mr-1 flex items-center">
              <TrendUp className="mr-0.5" size={14} /> +12%
            </span>
            {t("comparedToLastMonth")}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold">{t("pendingApprovals")}</CardTitle>
          <ShieldCheck className="text-muted-foreground" size={20} />
        </CardHeader>
        <CardContent>
          <div className="text-warning text-2xl font-extrabold">48</div>
          <p className="text-muted-foreground mt-1 text-xs">
            <span className="text-foreground font-bold">12</span> {t("companies")},{" "}
            <span className="text-foreground font-bold">36</span> {t("jobs")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
