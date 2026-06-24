"use client";

import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

const recentTasks = [
  {
    id: "1",
    entity: "Công ty Cổ phần VNG",
    type: "Đăng ký tài khoản",
    status: "pending",
    time: "2 giờ trước",
  },
  {
    id: "2",
    entity: "Senior React Developer",
    type: "Tin tuyển dụng",
    status: "approved",
    time: "3 giờ trước",
  },
  {
    id: "3",
    entity: "FPT Software",
    type: "Đăng ký tài khoản",
    status: "pending",
    time: "5 giờ trước",
  },
  {
    id: "4",
    entity: "Backend Engineer (Go)",
    type: "Tin tuyển dụng",
    status: "rejected",
    time: "1 ngày trước",
  },
  {
    id: "5",
    entity: "Techcombank",
    type: "Nâng cấp gói Pro",
    status: "approved",
    time: "1 ngày trước",
  },
];

export function RecentActivity() {
  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader>
        <CardTitle>Cần xử lý & Hoạt động</CardTitle>
        <CardDescription>
          Các hoạt động mới nhất trên nền tảng cần quản trị viên xem xét.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {recentTasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-foreground text-sm leading-none font-bold">{task.entity}</p>
                <p className="text-muted-foreground text-sm">{task.type}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <Badge
                    tone={
                      task.status === "pending"
                        ? "warning"
                        : task.status === "approved"
                          ? "success"
                          : "error"
                    }
                  >
                    {task.status === "pending"
                      ? "Chờ duyệt"
                      : task.status === "approved"
                        ? "Đã duyệt"
                        : "Từ chối"}
                  </Badge>
                </div>
                <div className="text-muted-foreground hidden min-w-20 text-right text-xs sm:block">
                  {task.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
