"use client";

import { ChartLineUp, Clock, Funnel, MagnifyingGlass, Users } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";

import { apiRequest } from "@/shared/api/http";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";

type SearchKeywordItem = {
  keyword: string;
  normalizedKeyword: string;
  canonicalKeyword: string;
  searchCount: number;
  uniqueUsers: number;
  lastSearchedAt: string;
};

type ApiResponse = {
  range: string;
  from: string;
  to: string;
  items: SearchKeywordItem[];
};

export function SearchKeywordsTable() {
  const [range, setRange] = useState("week");
  const [limit, setLimit] = useState("10");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `/search-keywords/top?limit=${limit}`;

      if (range === "custom") {
        if (from && to) {
          url += `&from=${from}&to=${to}`;
        } else {
          // If custom is selected but dates aren't filled yet, don't query
          setLoading(false);
          return;
        }
      } else {
        url += `&range=${range}`;
      }

      const response = await apiRequest<ApiResponse>(url, {
        headers: {
          "x-bypass-auth": "true",
        },
      });

      setData(response);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Không thể tải dữ liệu phân tích từ khóa");
    } finally {
      setLoading(false);
    }
  }, [limit, range, from, to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client-side text filter on returned items
  const filteredItems =
    data?.items.filter((item) =>
      item.keyword.toLowerCase().includes(searchTerm.trim().toLowerCase()),
    ) ?? [];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Search statistics summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-slate-100 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
              Tổng lượt tìm kiếm
            </CardTitle>
            <ChartLineUp size={22} className="text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800">
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                data?.items.reduce((acc, curr) => acc + curr.searchCount, 0) || 0
              )}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">Trong khoảng thời gian đã chọn</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
              Từ khóa độc nhất
            </CardTitle>
            <Funnel size={22} className="text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800">
              {loading ? <Skeleton className="h-8 w-20" /> : data?.items.length || 0}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Số lượng từ khóa tìm kiếm phân biệt
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
              Khoảng thời gian
            </CardTitle>
            <Clock size={22} className="text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm leading-none font-bold tracking-tight text-slate-800">
              {loading ? (
                <Skeleton className="h-6 w-full" />
              ) : data ? (
                <div className="flex flex-col gap-1">
                  <span>Từ: {new Date(data.from).toLocaleDateString("vi-VN")}</span>
                  <span>Đến: {new Date(data.to).toLocaleDateString("vi-VN")}</span>
                </div>
              ) : (
                "-"
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card className="border border-slate-100 bg-white shadow-sm">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <MagnifyingGlass
                size={18}
                className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
              />
              <Input
                placeholder="Lọc từ khóa tìm kiếm..."
                className="rounded-xl border border-slate-200 pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Select controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium whitespace-nowrap text-slate-500">
                  Thời gian:
                </span>
                <Select value={range} onValueChange={setRange}>
                  <SelectTrigger className="w-[160px] rounded-xl border-slate-200">
                    <SelectValue placeholder="Chọn khoảng thời gian" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="today">Hôm nay</SelectItem>
                    <SelectItem value="week">7 ngày gần nhất</SelectItem>
                    <SelectItem value="month">30 ngày gần nhất</SelectItem>
                    <SelectItem value="year">365 ngày gần nhất</SelectItem>
                    <SelectItem value="custom">Tùy chỉnh</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium whitespace-nowrap text-slate-500">
                  Hiển thị:
                </span>
                <Select value={limit} onValueChange={setLimit}>
                  <SelectTrigger className="w-[90px] rounded-xl border-slate-200">
                    <SelectValue placeholder="Giới hạn" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                onClick={fetchData}
                disabled={loading}
                className="rounded-xl border-slate-200"
              >
                Làm mới
              </Button>
            </div>
          </div>

          {/* Date Picker Custom Fields */}
          {range === "custom" && (
            <div className="flex flex-col gap-3 border-t border-dashed border-slate-100 pt-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Từ ngày:</span>
                <Input
                  type="date"
                  className="h-9 w-[160px] rounded-xl border-slate-200 text-xs"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Đến ngày:</span>
                <Input
                  type="date"
                  className="h-9 w-[160px] rounded-xl border-slate-200 text-xs"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
              {(!from || !to) && (
                <span className="text-xs font-medium text-amber-500">
                  Vui lòng chọn đầy đủ ngày Bắt đầu và Kết thúc
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Table Card */}
      <Card className="overflow-hidden border border-slate-100 bg-white shadow-sm">
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  <th className="w-[80px] px-6 py-4 text-center">STT</th>
                  <th className="px-6 py-4">Từ khóa hiển thị</th>
                  <th className="px-6 py-4">Chuẩn hóa (Normalized)</th>
                  <th className="px-6 py-4">Gom nhóm (Canonical)</th>
                  <th className="w-[120px] px-6 py-4 text-center">Lượt tìm</th>
                  <th className="w-[120px] px-6 py-4 text-center">Unique Users</th>
                  <th className="w-[180px] px-6 py-4">Lần tìm gần nhất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="px-6 py-4">
                        <Skeleton className="mx-auto h-4 w-6" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-36" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="mx-auto h-4 w-12" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="mx-auto h-4 w-12" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-32" />
                      </td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center font-medium text-rose-500">
                      {error}
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center font-medium text-slate-400">
                      Chưa có dữ liệu từ khóa tìm kiếm nào được ghi nhận.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, index) => (
                    <tr
                      key={item.canonicalKeyword}
                      className="text-sm text-slate-700 transition-colors hover:bg-slate-50/50"
                    >
                      <td className="px-6 py-4 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{item.keyword}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {item.normalizedKeyword}
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded border border-indigo-100 bg-indigo-50/50 px-1.5 py-0.5 font-mono text-xs text-indigo-600">
                          {item.canonicalKeyword}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-blue-600">
                        {item.searchCount}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-slate-600">
                          <Users size={16} className="text-slate-400" />
                          <span>{item.uniqueUsers || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {formatDate(item.lastSearchedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
