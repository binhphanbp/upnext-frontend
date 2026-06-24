"use client";

import {
  Briefcase,
  CurrencyCircleDollar,
  ShieldCheck,
  TrendUp,
  Users,
} from "@phosphor-icons/react";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export function StatCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold">Tổng doanh thu</CardTitle>
          <CurrencyCircleDollar className="text-muted-foreground" size={20} />
        </CardHeader>
        <CardContent>
          <div className="text-foreground text-2xl font-extrabold">245.500.000₫</div>
          <p className="text-muted-foreground mt-1 flex items-center text-xs">
            <span className="text-success mr-1 flex items-center">
              <TrendUp className="mr-0.5" size={14} /> +15.5%
            </span>
            so với tháng trước
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold">Người dùng mới</CardTitle>
          <Users className="text-muted-foreground" size={20} />
        </CardHeader>
        <CardContent>
          <div className="text-foreground text-2xl font-extrabold">+1.240</div>
          <p className="text-muted-foreground mt-1 flex items-center text-xs">
            <span className="text-success mr-1 flex items-center">
              <TrendUp className="mr-0.5" size={14} /> +8.2%
            </span>
            so với tháng trước
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold">Tin đang hoạt động</CardTitle>
          <Briefcase className="text-muted-foreground" size={20} />
        </CardHeader>
        <CardContent>
          <div className="text-foreground text-2xl font-extrabold">12.234</div>
          <p className="text-muted-foreground mt-1 flex items-center text-xs">
            <span className="text-success mr-1 flex items-center">
              <TrendUp className="mr-0.5" size={14} /> +12%
            </span>
            so với tháng trước
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold">Chờ kiểm duyệt</CardTitle>
          <ShieldCheck className="text-muted-foreground" size={20} />
        </CardHeader>
        <CardContent>
          <div className="text-warning text-2xl font-extrabold">48</div>
          <p className="text-muted-foreground mt-1 text-xs">
            <span className="text-foreground font-bold">12</span> công ty,{" "}
            <span className="text-foreground font-bold">36</span> tin đăng
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
