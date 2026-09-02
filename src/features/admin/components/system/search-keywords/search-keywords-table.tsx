"use client";

import { ArrowsClockwise, MagnifyingGlass, TrendDown, TrendUp } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
  getKeywordOverview,
  getKeywordTrend,
  getSupplyGap,
  getTopKeywords,
  getZeroResultKeywords,
  type KeywordSummary,
} from "@/features/admin/api/search-keywords";
import { getAdminSession } from "@/features/admin/session";
import { ApiError } from "@/shared/api/http";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { KeywordTrendChart } from "./keyword-trend-chart";

const RANGES = [
  { value: "7", label: "7 ngày" },
  { value: "30", label: "30 ngày" },
  { value: "90", label: "90 ngày" },
] as const;

const SOURCES = [
  { value: "all", label: "Mọi nơi tìm kiếm" },
  { value: "main_search", label: "Trang việc làm" },
  { value: "posts_hero", label: "Trang bài viết" },
] as const;

function formatDateTime(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Phần trăm thay đổi so với kỳ trước. `null` khi kỳ trước bằng 0 — chia cho 0 không nói được gì. */
function changeRatio(current: number, previous: number) {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  const ratio = changeRatio(current, previous);

  if (ratio === null) {
    return (
      <span className="text-xs text-slate-400">
        {previous === 0 && current > 0 ? "mới" : "kỳ trước không có dữ liệu"}
      </span>
    );
  }

  const rounded = Math.round(ratio);
  if (rounded === 0) {
    return <span className="text-xs text-slate-400">không đổi</span>;
  }

  const isUp = rounded > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        isUp ? "text-emerald-600" : "text-slate-500"
      }`}
    >
      {isUp ? <TrendUp size={13} /> : <TrendDown size={13} />}
      {isUp ? "+" : ""}
      {rounded}% so với kỳ trước
    </span>
  );
}

function StatTile({
  label,
  value,
  previous,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: number;
  previous?: number;
  hint?: string;
  tone?: "neutral" | "alert";
}) {
  return (
    <Card className="border border-slate-200">
      <CardHeader className="pb-1">
        <CardTitle className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <span
          className={`text-3xl font-bold tabular-nums ${
            tone === "alert" && value > 0 ? "text-error" : "text-slate-900"
          }`}
        >
          {value.toLocaleString("vi-VN")}
        </span>
        {previous === undefined ? (
          hint ? (
            <span className="text-xs text-slate-400">{hint}</span>
          ) : null
        ) : (
          <DeltaBadge current={value} previous={previous} />
        )}
      </CardContent>
    </Card>
  );
}

function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-slate-500">
        {children}
      </td>
    </tr>
  );
}

const TH =
  "border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500";
const TD = "border-b border-slate-100 px-4 py-2.5 text-sm text-slate-700";

export function SearchKeywordsTable() {
  const [token, setToken] = useState<string | null>(null);
  const [days, setDays] = useState<string>("30");
  const [source, setSource] = useState<string>("all");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    setToken(getAdminSession()?.accessToken ?? null);
  }, []);

  const params = {
    days: Number(days),
    ...(source === "all" ? {} : { source }),
  };
  const enabled = Boolean(token);
  const keyBase = [days, source] as const;

  const overview = useQuery({
    enabled,
    queryKey: ["admin-keyword-overview", ...keyBase],
    queryFn: () => getKeywordOverview(token!, params),
  });
  const trend = useQuery({
    enabled,
    queryKey: ["admin-keyword-trend", ...keyBase],
    queryFn: () => getKeywordTrend(token!, params),
  });
  const top = useQuery({
    enabled,
    queryKey: ["admin-keyword-top", ...keyBase],
    queryFn: () =>
      getTopKeywords(token!, {
        range: days === "7" ? "week" : days === "90" ? "year" : "month",
        limit: 50,
        ...(source === "all" ? {} : { source }),
      }),
  });
  const zeroResults = useQuery({
    enabled,
    queryKey: ["admin-keyword-zero", ...keyBase],
    queryFn: () => getZeroResultKeywords(token!, { ...params, limit: 50 }),
  });
  const supplyGap = useQuery({
    enabled,
    queryKey: ["admin-keyword-gap", ...keyBase],
    queryFn: () => getSupplyGap(token!, { ...params, limit: 50 }),
  });

  const queries = [overview, trend, top, zeroResults, supplyGap];
  const isLoading = queries.some((query) => query.isPending);
  const forbidden = queries.find(
    (query) => query.error instanceof ApiError && query.error.status === 403,
  );

  function refetchAll() {
    for (const query of queries) void query.refetch();
  }

  const term = filter.trim().toLowerCase();
  const match = (value: string) => !term || value.toLowerCase().includes(term);

  const topItems = (top.data?.items ?? []).filter((item) => match(item.keyword));
  const zeroItems = (zeroResults.data?.items ?? []).filter((item) => match(item.keyword));
  const gapItems = (supplyGap.data?.items ?? []).filter((item) => match(item.keyword));

  if (!token) {
    return (
      <Card className="flex h-40 items-center justify-center border border-slate-200 text-sm text-slate-500">
        Vui lòng đăng nhập lại bằng tài khoản quản trị.
      </Card>
    );
  }

  if (forbidden) {
    return (
      <Card className="flex h-48 flex-col items-center justify-center gap-2 border border-slate-200 p-6 text-center">
        <p className="font-semibold text-slate-900">
          Tài khoản của bạn chưa có quyền xem báo cáo này.
        </p>
        <p className="max-w-md text-sm text-slate-500">
          Cần quyền <code className="rounded bg-slate-100 px-1">analytics:view</code>. Nhờ Super
          Admin cấp quyền này cho vai trò của bạn.
        </p>
      </Card>
    );
  }

  const current: KeywordSummary = overview.data?.current ?? {
    searchCount: 0,
    uniqueVisitors: 0,
    distinctKeywords: 0,
    zeroResultSearches: 0,
  };
  const previous = overview.data?.previous;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="bg-card h-10 w-full rounded-xl sm:w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGES.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="bg-card h-10 w-full rounded-xl sm:w-[210px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOURCES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative w-full sm:w-[260px]">
          <MagnifyingGlass
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
          />
          <Input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Lọc trong kết quả đã tải…"
            className="h-10 rounded-xl pl-9"
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full border-slate-200 p-0 text-slate-600"
          onClick={refetchAll}
          aria-label="Tải lại báo cáo"
        >
          <ArrowsClockwise size={17} />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Lượt tìm kiếm"
              value={current.searchCount}
              {...(previous ? { previous: previous.searchCount } : {})}
            />
            <StatTile
              label="Người tìm kiếm"
              value={current.uniqueVisitors}
              {...(previous ? { previous: previous.uniqueVisitors } : {})}
            />
            <StatTile
              label="Từ khóa khác nhau"
              value={current.distinctKeywords}
              {...(previous ? { previous: previous.distinctKeywords } : {})}
            />
            <StatTile
              label="Tìm không ra kết quả"
              value={current.zeroResultSearches}
              tone="alert"
              hint="Mỗi lượt là một nhu cầu chưa được đáp ứng"
            />
          </div>

          <Card className="border border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Lượt tìm theo ngày</CardTitle>
            </CardHeader>
            <CardContent>
              <KeywordTrendChart points={trend.data?.points ?? []} />
            </CardContent>
          </Card>

          <Tabs defaultValue="top">
            <TabsList className="grid w-full max-w-[560px] grid-cols-3">
              <TabsTrigger value="top">Top từ khóa</TabsTrigger>
              <TabsTrigger value="zero">Không ra kết quả</TabsTrigger>
              <TabsTrigger value="gap">Cầu vượt cung</TabsTrigger>
            </TabsList>

            <TabsContent value="top" className="mt-4">
              <Card className="overflow-hidden border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse">
                    <thead>
                      <tr>
                        <th className={`${TH} text-left`}>Từ khóa</th>
                        <th className={`${TH} text-left`}>Gom nhóm</th>
                        <th className={`${TH} text-right`}>Lượt tìm</th>
                        <th className={`${TH} text-right`}>Người tìm</th>
                        <th className={`${TH} text-left`}>Lần gần nhất</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topItems.length === 0 ? (
                        <EmptyRow colSpan={5}>Chưa có lượt tìm nào trong khoảng này.</EmptyRow>
                      ) : (
                        topItems.map((item) => (
                          <tr key={item.canonicalKeyword} className="hover:bg-slate-50/60">
                            <td className={`${TD} font-medium text-slate-900`}>{item.keyword}</td>
                            <td className={`${TD} font-mono text-xs text-slate-500`}>
                              {item.canonicalKeyword}
                            </td>
                            <td className={`${TD} text-right tabular-nums`}>{item.searchCount}</td>
                            <td className={`${TD} text-right tabular-nums`}>{item.uniqueUsers}</td>
                            <td className={`${TD} text-slate-500`}>
                              {formatDateTime(item.lastSearchedAt)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="zero" className="mt-4 space-y-3">
              <p className="text-sm text-slate-500">
                Ứng viên tìm những từ này nhưng không có tin tuyển dụng nào khớp. Đây là danh sách
                việc cho đội nội dung và đội tuyển dụng.
              </p>
              <Card className="overflow-hidden border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] border-collapse">
                    <thead>
                      <tr>
                        <th className={`${TH} text-left`}>Từ khóa</th>
                        <th className={`${TH} text-right`}>Lượt tìm</th>
                        <th className={`${TH} text-right`}>Người tìm</th>
                        <th className={`${TH} text-left`}>Lần gần nhất</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zeroItems.length === 0 ? (
                        <EmptyRow colSpan={4}>
                          Không có từ khóa nào ra 0 kết quả trong khoảng này.
                        </EmptyRow>
                      ) : (
                        zeroItems.map((item) => (
                          <tr key={item.canonicalKeyword} className="hover:bg-slate-50/60">
                            <td className={`${TD} font-medium text-slate-900`}>{item.keyword}</td>
                            <td className={`${TD} text-right tabular-nums`}>{item.searchCount}</td>
                            <td className={`${TD} text-right tabular-nums`}>
                              {item.uniqueVisitors}
                            </td>
                            <td className={`${TD} text-slate-500`}>
                              {formatDateTime(item.lastSearchedAt)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="gap" className="mt-4 space-y-3">
              <p className="text-sm text-slate-500">
                Từ khóa nhiều lượt tìm nhưng ít tin đang mở. Chỉ những dòng ghép được với một kỹ
                năng mới đọc được số tin — dòng không ghép được ghi rõ ở cột cuối.
              </p>
              <Card className="overflow-hidden border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse">
                    <thead>
                      <tr>
                        <th className={`${TH} text-left`}>Từ khóa</th>
                        <th className={`${TH} text-right`}>Lượt tìm</th>
                        <th className={`${TH} text-right`}>Tin đang mở</th>
                        <th className={`${TH} text-left`}>Kỹ năng ghép được</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gapItems.length === 0 ? (
                        <EmptyRow colSpan={4}>Chưa đủ dữ liệu để đối chiếu.</EmptyRow>
                      ) : (
                        gapItems.map((item) => (
                          <tr key={item.canonicalKeyword} className="hover:bg-slate-50/60">
                            <td className={`${TD} font-medium text-slate-900`}>{item.keyword}</td>
                            <td className={`${TD} text-right tabular-nums`}>{item.searchCount}</td>
                            <td className={`${TD} text-right tabular-nums`}>
                              {item.matchedSkill ? (
                                <span
                                  className={item.openJobs === 0 ? "text-error font-semibold" : ""}
                                >
                                  {item.openJobs}
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className={TD}>
                              {item.matchedSkill ? (
                                <Badge tone="neutral">{item.matchedSkill}</Badge>
                              ) : (
                                <span className="text-xs text-slate-400">
                                  không khớp kỹ năng nào
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
