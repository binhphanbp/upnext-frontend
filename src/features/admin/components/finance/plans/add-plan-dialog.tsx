"use client";

import { Plus } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

export function AddPlanDialog() {
  const [open, setOpen] = useState(false);
  const [audience, setAudience] = useState<"employer" | "candidate">("employer");

  const tPlans = useTranslations("Admin.finance.plans");
  const t = useTranslations("Admin.finance.plans.dialog");

  const handleResetAndClose = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary">
          <Plus className="mr-2" weight="bold" />
          {tPlans("addPlan")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-6 py-4 md:grid-cols-2">
          <div className="flex flex-col gap-2.5 md:col-span-2">
            <Label htmlFor="planName" className="font-semibold">
              {t("fields.planName")}
            </Label>
            <Input id="planName" placeholder={t("fields.planNamePlaceholder")} />
          </div>
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="targetAudience" className="font-semibold">
              {t("fields.targetAudience")}
            </Label>
            <Select value={audience} onValueChange={(val: any) => setAudience(val)}>
              <SelectTrigger>
                <SelectValue placeholder={t("fields.targetAudiencePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employer">
                  {tPlans("table.targetAudienceOptions.employer")}
                </SelectItem>
                <SelectItem value="candidate">
                  {tPlans("table.targetAudienceOptions.candidate")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="price" className="font-semibold">
              {t("fields.price")}
            </Label>
            <Input id="price" type="number" placeholder={t("fields.pricePlaceholder")} />
          </div>
          <div className="flex flex-col gap-2.5 md:col-span-2">
            <Label htmlFor="billingCycle" className="font-semibold">
              {t("fields.billingCycle")}
            </Label>
            <Select defaultValue="month">
              <SelectTrigger>
                <SelectValue placeholder={t("fields.billingCyclePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">{t("billingCycleOptions.weekly")}</SelectItem>
                <SelectItem value="month">{t("billingCycleOptions.monthly")}</SelectItem>
                <SelectItem value="quarterly">{t("billingCycleOptions.quarterly")}</SelectItem>
                <SelectItem value="biannual">{t("billingCycleOptions.biannual")}</SelectItem>
                <SelectItem value="year">{t("billingCycleOptions.yearly")}</SelectItem>
                <SelectItem value="one-time">{t("billingCycleOptions.oneTime")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted/30 mt-4 rounded-xl border p-5 md:col-span-2">
            <h3 className="text-foreground mb-5 border-b pb-3 text-lg font-semibold">
              {audience === "employer"
                ? t("fields.featuresEmployer")
                : t("fields.featuresCandidate")}
            </h3>

            {audience === "employer" ? (
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                {/* Giới hạn đăng tin */}
                <div className="flex flex-col gap-3 md:col-span-2">
                  <Label className="text-primary font-semibold">
                    {t("fields.empPostingLimit")}
                  </Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">Được đăng</span>
                    <Input type="number" className="h-9 w-20" defaultValue={10} min={0} />
                    <span className="text-sm font-medium">tin/tháng</span>
                    <span className="ml-2 text-sm font-medium">(Thời hạn:</span>
                    <Input type="number" className="h-9 w-20" defaultValue={30} min={0} />
                    <span className="text-sm font-medium">ngày/tin)</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Checkbox id="unlimitedPosting" />
                    <Label htmlFor="unlimitedPosting" className="cursor-pointer text-sm">
                      Không giới hạn đăng tin
                    </Label>
                  </div>
                </div>

                {/* Hiển thị */}
                <div className="flex flex-col gap-3">
                  <Label className="text-primary font-semibold">{t("fields.empVisibility")}</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" className="h-9 w-16" defaultValue={3} min={0} />
                    <span className="text-sm font-medium">tin nổi bật/tháng</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="number" className="h-9 w-16" defaultValue={1} min={0} />
                    <span className="text-sm font-medium">nhãn tuyển gấp</span>
                  </div>
                </div>

                {/* Tương tác ứng viên */}
                <div className="flex flex-col gap-3">
                  <Label className="text-primary font-semibold">{t("fields.empInteraction")}</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" className="h-9 w-16" defaultValue={150} min={0} />
                    <span className="text-sm font-medium">lượt xem CV/tháng</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="number" className="h-9 w-16" defaultValue={80} min={0} />
                    <span className="text-sm font-medium">lượt liên hệ/tháng</span>
                  </div>
                </div>

                {/* Giới hạn AI */}
                <div className="flex flex-col gap-3">
                  <Label className="text-primary font-semibold">{t("fields.empAiLimit")}</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" className="h-9 w-16" defaultValue={500} min={0} />
                    <span className="text-sm font-medium">lượt chấm điểm CV</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="number" className="h-9 w-16" defaultValue={100} min={0} />
                    <span className="text-sm font-medium">lượt gợi ý Ứng viên</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="number" className="h-9 w-16" defaultValue={50} min={0} />
                    <span className="text-sm font-medium">lượt AI viết JD</span>
                  </div>
                </div>

                {/* Hệ thống */}
                <div className="flex flex-col gap-3">
                  <Label className="text-primary font-semibold">{t("fields.empSystem")}</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" className="h-9 w-16" defaultValue={3} min={1} />
                    <span className="text-sm font-medium">tài khoản HR</span>
                  </div>
                  <Select defaultValue="pipeline">
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Chọn quyền hệ thống" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Thống kê cơ bản</SelectItem>
                      <SelectItem value="pipeline">Pipeline & Thống kê</SelectItem>
                      <SelectItem value="advanced">Pipeline, Báo cáo & Branding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                {/* Chức năng cốt lõi */}
                <div className="flex flex-col gap-3 md:col-span-2">
                  <Label className="text-primary font-semibold">
                    {t("fields.canCoreFunctions")}
                  </Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Checkbox id="canCore" defaultChecked />
                    <Label htmlFor="canCore" className="cursor-pointer text-sm">
                      Tiêu chuẩn (Tạo hồ sơ, CV, ứng tuyển)
                    </Label>
                  </div>
                </div>

                {/* Giới hạn AI CV */}
                <div className="flex flex-col gap-3">
                  <Label className="text-primary font-semibold">{t("fields.canAiLimit")}</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" className="h-9 w-16" defaultValue={10} min={0} />
                    <span className="text-sm font-medium">lần phân tích CV/tháng</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="number" className="h-9 w-16" defaultValue={5} min={0} />
                    <span className="text-sm font-medium">CV viết theo JD</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="number" className="h-9 w-16" defaultValue={5} min={0} />
                    <span className="text-sm font-medium">Cover Letter</span>
                  </div>
                </div>

                {/* Luyện phỏng vấn */}
                <div className="flex flex-col gap-3">
                  <Label className="text-primary font-semibold">{t("fields.canInterview")}</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" className="h-9 w-16" defaultValue={5} min={0} />
                    <span className="text-sm font-medium">buổi Mock Interview</span>
                  </div>
                  <Select defaultValue="feedback">
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Mức độ hỗ trợ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demo">Chỉ phỏng vấn thử (Demo)</SelectItem>
                      <SelectItem value="feedback">Có Feedback tiêu chuẩn</SelectItem>
                      <SelectItem value="pro">Feedback nâng cao & Sửa lỗi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Hiển thị & Tối ưu hóa */}
                <div className="flex flex-col gap-3 md:col-span-2">
                  <Label className="text-primary font-semibold">Quyền lợi nâng cao</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox id="canOpt" defaultChecked />
                    <Label htmlFor="canOpt" className="cursor-pointer text-sm">
                      Tối ưu CV bởi chuyên gia AI
                    </Label>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Checkbox id="canVis" />
                    <Label htmlFor="canVis" className="cursor-pointer text-sm">
                      Ưu tiên hiển thị với Nhà tuyển dụng (Badge Pro)
                    </Label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleResetAndClose}>
            {t("buttons.cancel")}
          </Button>
          <Button variant="primary" onClick={handleResetAndClose}>
            {t("buttons.createDraft")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
