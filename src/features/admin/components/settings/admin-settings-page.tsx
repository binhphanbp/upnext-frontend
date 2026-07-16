"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

export function AdminSettingsPage() {
  const t = useTranslations("Admin");

  return (
    <div className="flex w-full flex-col p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cài đặt & Hồ sơ</h1>
        <p className="mt-1 text-sm text-slate-500">
          Quản lý thông tin cá nhân và các tùy chọn bảo mật của tài khoản Admin.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full max-w-4xl space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="profile">Hồ sơ cá nhân</TabsTrigger>
          <TabsTrigger value="security">Bảo mật</TabsTrigger>
          <TabsTrigger value="preferences">Tùy chọn</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
              <CardDescription>
                Cập nhật thông tin định danh hiển thị trên hệ thống.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Họ và tên lót</Label>
                  <Input id="firstName" defaultValue="Admin" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Tên</Label>
                  <Input id="lastName" defaultValue="Super" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email liên hệ</Label>
                <Input id="email" type="email" defaultValue="admin.super@upnext.dev" disabled />
                <p className="text-[13px] text-slate-500">Email đăng nhập không thể thay đổi.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Vai trò hệ thống</Label>
                <Input
                  id="role"
                  defaultValue="Super Administrator"
                  disabled
                  className="bg-slate-50 font-medium text-slate-600"
                />
              </div>
              <div className="pt-4">
                <Button>Lưu thông tin</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Đổi mật khẩu</CardTitle>
              <CardDescription>
                Bảo vệ tài khoản bằng mật khẩu mạnh ít nhất 8 ký tự.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">Mật khẩu hiện tại</Label>
                <Input id="current" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">Mật khẩu mới</Label>
                <Input id="new" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Xác nhận mật khẩu mới</Label>
                <Input id="confirm" type="password" />
              </div>
              <div className="pt-4">
                <Button>Cập nhật mật khẩu</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bảo mật 2 lớp (2FA)</CardTitle>
              <CardDescription>
                Tăng cường bảo mật tài khoản bằng ứng dụng Authenticator hoặc SMS.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Xác thực 2 yếu tố</Label>
                  <p className="text-sm text-slate-500">
                    Bảo vệ tài khoản khỏi các truy cập trái phép.
                  </p>
                </div>
                <Checkbox id="2fa-toggle" className="scale-125" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt giao diện & ngôn ngữ</CardTitle>
              <CardDescription>
                Tùy chỉnh trải nghiệm của bạn trên bảng điều khiển UpNext.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Giao diện tối (Dark Mode)</Label>
                  <p className="text-sm text-slate-500">
                    Sử dụng nền tối để bảo vệ mắt khi làm việc buổi tối.
                  </p>
                </div>
                <Checkbox id="dark-mode" className="scale-125" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông báo hệ thống</CardTitle>
              <CardDescription>Chọn các loại thông báo bạn muốn nhận qua Email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Cảnh báo hệ thống</Label>
                  <p className="text-sm text-slate-500">
                    Nhận email khi có lỗi server hoặc tài nguyên quá tải.
                  </p>
                </div>
                <Checkbox id="system-alerts" defaultChecked className="scale-125" />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Báo cáo vi phạm</Label>
                  <p className="text-sm text-slate-500">
                    Nhận thông báo khi có nhà tuyển dụng bị report hàng loạt.
                  </p>
                </div>
                <Checkbox id="report-alerts" defaultChecked className="scale-125" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
