import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { AdminInvoiceStats } from "@/features/admin/api/invoices";

import { InvoiceKpiCards } from "./invoice-kpi-cards";

describe("InvoiceKpiCards", () => {
  it("renders KPI values formatted in VND", () => {
    const mockStats: AdminInvoiceStats = {
      totalRevenue: 8940000,
      pendingRevenue: 1490000,
      totalCount: 12,
      paidCount: 10,
      pendingCount: 1,
      failedCount: 1,
      refundedCount: 0,
    };

    render(<InvoiceKpiCards stats={mockStats} loading={false} />);

    expect(screen.getByText("Tổng doanh thu")).toBeDefined();
    expect(screen.getByText("Hóa đơn thành công")).toBeDefined();
    expect(screen.getByText("Chờ thanh toán")).toBeDefined();
    expect(screen.getByText("Hóa đơn đã hủy")).toBeDefined();
    expect(screen.getByText("10 giao dịch thành công")).toBeDefined();
  });

  it("handles empty/null stats gracefully", () => {
    render(<InvoiceKpiCards stats={null} loading={false} />);

    expect(screen.getByText("Đang tải dữ liệu...")).toBeDefined();
    expect(screen.getByText("Tỷ lệ 0%")).toBeDefined();
  });
});
