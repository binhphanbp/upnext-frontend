"use client";

import { Buildings, CircleNotch, ImageSquare, PencilSimple, Trash } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";

import {
  deleteCompanyPhoto,
  getCompany,
  getCompanyBusinessLicenseUrl,
  getRecruiterAccount,
  updateCompany,
  uploadCompanyBusinessLicense,
  uploadCompanyCover,
  uploadCompanyLogo,
  uploadCompanyPhoto,
  type CompanyDetail,
} from "@/features/recruiter/api/onboarding";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { AddressSelector } from "@/shared/ui/address-selector";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { FormInput } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { RichTextEditor } from "@/shared/ui/rich-text-editor";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2600,
  timerProgressBar: true,
});

type StoredRecruiterUser = Readonly<{
  id: string;
  email: string;
}>;

type CompanyForm = {
  name: string;
  taxCode: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  companySize: string;
  description: string;
};

const emptyForm: CompanyForm = {
  name: "",
  taxCode: "",
  address: "",
  email: "",
  phone: "",
  website: "",
  companySize: "",
  description: "",
};

type TempPhoto = {
  id: string;
  publicUrl: string;
  file?: File;
  isDeleted?: boolean;
};

export function RecruiterCompanyProfilePage() {
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);
  const [token, setToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tempPhotos, setTempPhotos] = useState<TempPhoto[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>("");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  const displayLogoUrl = logoPreviewUrl || company?.logoFile?.publicUrl || "";
  const displayCoverUrl = coverPreviewUrl || company?.coverFile?.publicUrl || "";

  const loadCompany = useCallback(
    async (nextAccountId: string, accessToken: string) => {
      try {
        setLoading(true);
        const account = await getRecruiterAccount(nextAccountId, accessToken);

        if (!account.company?.id) {
          void Swal.fire({
            icon: "warning",
            title: "Chưa có hồ sơ công ty",
            text: "Vui lòng hoàn tất onboarding trước khi chỉnh sửa hồ sơ công ty.",
          });
          router.replace("/recruiter");
          return;
        }

        const nextCompany = await getCompany(account.company.id, accessToken);
        setCompanyId(nextCompany.id);
        setCompany(nextCompany);
        setLogoFile(null);
        setLogoPreviewUrl("");
        setCoverFile(null);
        setCoverPreviewUrl("");
        setLicenseFile(null);
        setForm({
          name: nextCompany.name || "",
          taxCode: nextCompany.taxCode || "",
          address: nextCompany.address || "",
          email: nextCompany.email || "",
          phone: nextCompany.phone || "",
          website: nextCompany.website || "",
          companySize: nextCompany.companySize || "",
          description: nextCompany.description || "",
        });
        setTempPhotos((current) => {
          current.forEach((p) => {
            if (p.file) {
              URL.revokeObjectURL(p.publicUrl);
            }
          });
          return (nextCompany.photos || []).map((p) => ({
            id: p.id,
            publicUrl: p.publicUrl,
          }));
        });
      } catch (error) {
        handleAuthError(error, router);
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    const accessToken = localStorage.getItem("upnext.recruiter.accessToken");
    const rawUser = localStorage.getItem("upnext.recruiter.user");

    if (!accessToken || !rawUser) {
      router.replace("/recruiter/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(rawUser) as StoredRecruiterUser;
      setToken(accessToken);
      setAccountId(parsedUser.id);
      void loadCompany(parsedUser.id, accessToken);
    } catch {
      router.replace("/recruiter/login");
    }
  }, [loadCompany, router]);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl && logoPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
      if (coverPreviewUrl && coverPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
    };
  }, [logoPreviewUrl, coverPreviewUrl]);

  async function saveCompany() {
    if (!form.name.trim()) {
      void Swal.fire({
        icon: "error",
        title: "Thiếu tên công ty",
        text: "Tên công ty là thông tin bắt buộc.",
      });
      return;
    }

    try {
      setSaving(true);
      // 1. Lưu thông tin cơ bản
      await updateCompany(companyId, form, token);

      // Upload Logo if selected
      if (logoFile) {
        await uploadCompanyLogo(companyId, logoFile, token);
      }

      // Upload Cover if selected
      if (coverFile) {
        await uploadCompanyCover(companyId, coverFile, token);
      }

      // Upload License if selected
      if (licenseFile) {
        await uploadCompanyBusinessLicense(companyId, licenseFile, token);
      }

      // 2. Tải lên ảnh mới (tuần tự)
      const toUpload = tempPhotos.filter((p) => p.file && !p.isDeleted);
      for (const p of toUpload) {
        if (p.file) {
          await uploadCompanyPhoto(companyId, p.file, token);
        }
      }

      // 3. Xóa ảnh được đánh dấu xóa (tuần tự)
      const toDelete = tempPhotos.filter((p) => p.isDeleted);
      for (const p of toDelete) {
        await deleteCompanyPhoto(companyId, p.id, token);
      }

      await loadCompany(accountId, token);
      void toast.fire({ icon: "success", title: "Đã lưu hồ sơ công ty." });
    } catch (error) {
      void Swal.fire({
        icon: "error",
        title: "Không thể lưu hồ sơ",
        text: getCompanyErrorMessage(error),
      });
    } finally {
      setSaving(false);
    }
  }

  function handleLogoSelect(file: File | undefined) {
    if (!file) return;
    setLogoFile(file);
    setLogoPreviewUrl(URL.createObjectURL(file));
  }

  function handleCoverSelect(file: File | undefined) {
    if (!file) return;
    setCoverFile(file);
    setCoverPreviewUrl(URL.createObjectURL(file));
  }

  function handlePhotoSelect(files: FileList | null) {
    if (!files || files.length === 0) return;
    const newItems: TempPhoto[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file) {
        newItems.push({
          id: `local-${Math.random().toString(36).substr(2, 9)}`,
          publicUrl: URL.createObjectURL(file),
          file,
        });
      }
    }
    setTempPhotos((current) => [...current, ...newItems]);
  }

  function handlePhotoDelete(photoId: string) {
    setTempPhotos((current) => {
      return current
        .map((p) => {
          if (p.id === photoId) {
            if (p.file) {
              URL.revokeObjectURL(p.publicUrl);
              return null;
            } else {
              return { ...p, isDeleted: true };
            }
          }
          return p;
        })
        .filter((p): p is TempPhoto => p !== null);
    });
  }

  async function openBusinessLicense() {
    const newWindow = window.open("", "_blank");
    if (!newWindow) {
      void Swal.fire({
        icon: "warning",
        title: "Popup bị chặn",
        text: "Vui lòng cho phép hiển thị popup để xem file minh chứng.",
      });
      return;
    }

    try {
      const response = await getCompanyBusinessLicenseUrl(companyId, token);
      newWindow.location.href = response.url;
      newWindow.opener = null;
    } catch (error) {
      newWindow.close();
      void Swal.fire({
        icon: "error",
        title: "Không thể mở minh chứng",
        text: getCompanyErrorMessage(error),
      });
    }
  }

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center text-sm font-bold text-slate-500">
        <CircleNotch className="mr-2 size-5 animate-spin text-emerald-600" />
        Đang tải hồ sơ công ty...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="upnext-shadow rounded-lg bg-white">
        <div className="border-b border-slate-100 p-5">
          <div className="flex items-center gap-2">
            <Buildings size={20} className="text-emerald-700" />
            <h2 className="text-lg font-extrabold">Thông tin doanh nghiệp</h2>
            <Badge tone={company?.verificationStatus === "VERIFIED" ? "success" : "warning"}>
              {formatVerificationStatus(company?.verificationStatus)}
            </Badge>
          </div>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-2">
          {/* Logo & Cover brand section */}
          <div className="flex flex-row items-start justify-around gap-4 border-b border-slate-100/80 pb-6 lg:col-span-2 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-5">
            {/* Logo box */}
            <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
              <button
                type="button"
                className="group relative flex size-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition-all duration-300 hover:border-emerald-500 hover:bg-emerald-50/20 focus:border-emerald-500 focus:outline-none sm:size-24"
                onClick={() => logoInputRef.current?.click()}
                aria-label="Tải lên logo công ty"
              >
                {displayLogoUrl ? (
                  <img src={displayLogoUrl} alt="Logo công ty" className="size-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-slate-400 transition-colors group-hover:text-emerald-600">
                    <ImageSquare size={28} />
                    <span className="mt-1 text-xs font-bold">Tải logo</span>
                  </div>
                )}

                {saving && logoFile && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                    <CircleNotch className="size-6 animate-spin text-emerald-600" />
                  </div>
                )}

                {displayLogoUrl && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-all duration-300 group-hover:opacity-100">
                    <PencilSimple size={20} className="text-white" />
                  </div>
                )}
              </button>

              <div>
                <Label className="text-xs font-bold text-slate-700 sm:text-base sm:font-extrabold sm:text-slate-800">
                  Logo thương hiệu
                </Label>
                <p className="mt-1 hidden text-xs leading-relaxed font-medium text-slate-500 sm:block">
                  Hiển thị trên tin tuyển dụng & trang hồ sơ.
                  <br />
                  Định dạng JPG, PNG, tối đa 2MB.
                </p>
              </div>
            </div>

            <div className="hidden h-16 w-px bg-slate-100/80 lg:block" />

            {/* Cover box */}
            <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
              <button
                type="button"
                className="group relative flex h-20 w-32 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition-all duration-300 hover:border-emerald-500 hover:bg-emerald-50/20 focus:border-emerald-500 focus:outline-none sm:h-24 sm:w-40"
                onClick={() => coverInputRef.current?.click()}
                aria-label="Tải lên ảnh bìa công ty"
              >
                {displayCoverUrl ? (
                  <img
                    src={displayCoverUrl}
                    alt="Ảnh bìa công ty"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-400 transition-colors group-hover:text-emerald-600">
                    <ImageSquare size={28} />
                    <span className="mt-1 text-xs font-bold">Tải ảnh bìa</span>
                  </div>
                )}

                {saving && coverFile && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                    <CircleNotch className="size-6 animate-spin text-emerald-600" />
                  </div>
                )}

                {displayCoverUrl && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-all duration-300 group-hover:opacity-100">
                    <PencilSimple size={20} className="text-white" />
                  </div>
                )}
              </button>

              <div>
                <Label className="text-xs font-bold text-slate-700 sm:text-base sm:font-extrabold sm:text-slate-800">
                  Ảnh bìa doanh nghiệp
                </Label>
                <p className="mt-1 hidden text-xs leading-relaxed font-medium text-slate-500 sm:block">
                  Hiển thị trên trang chi tiết công ty.
                  <br />
                  Định dạng JPG, PNG, tỷ lệ 16:9.
                </p>
              </div>
            </div>
          </div>
          <CompanyField
            id="company-name"
            label="Tên công ty"
            required
            value={form.name}
            onChange={(value) => setForm((current) => ({ ...current, name: value }))}
          />
          <CompanyField
            id="company-tax"
            label="Mã số thuế"
            required
            value={form.taxCode}
            onChange={(value) => setForm((current) => ({ ...current, taxCode: value }))}
          />
          <CompanyField
            id="company-email"
            label="Email liên hệ"
            type="email"
            required
            value={form.email}
            onChange={(value) => setForm((current) => ({ ...current, email: value }))}
          />
          <CompanyField
            id="company-phone"
            label="Số điện thoại"
            required
            value={form.phone}
            onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
          />
          <CompanyField
            id="company-website"
            label="Website"
            value={form.website}
            onChange={(value) => setForm((current) => ({ ...current, website: value }))}
          />
          <CompanyField
            id="company-size"
            label="Quy mô công ty"
            required
            value={form.companySize}
            onChange={(value) => setForm((current) => ({ ...current, companySize: value }))}
          />
          <div className="lg:col-span-2">
            <AddressSelector
              value={form.address}
              onChange={(value) => setForm((current) => ({ ...current, address: value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <Label className="text-sm font-bold text-slate-700">
              Giới thiệu công ty <span className="ml-1 text-red-500">*</span>
            </Label>
            <RichTextEditor
              value={form.description}
              onChange={(value) => setForm((current) => ({ ...current, description: value }))}
              placeholder="Giới thiệu chi tiết về công ty..."
            />
          </div>
          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <Label className="text-sm font-bold text-slate-700">
              Minh chứng doanh nghiệp <span className="ml-1 text-red-500">*</span>
            </Label>
            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1 text-left">
                <span className="text-sm font-semibold text-slate-700">
                  {licenseFile
                    ? `Đã chọn: ${licenseFile.name}`
                    : company?.businessLicenseFileId
                      ? "Đã tải lên giấy phép kinh doanh."
                      : "Chưa có file minh chứng"}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  Chấp nhận PDF, JPG, PNG tối đa 5MB.
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 sm:mt-0">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 cursor-pointer border-slate-200 text-xs font-bold shadow-none hover:bg-slate-100/50"
                  onClick={() => licenseInputRef.current?.click()}
                  disabled={saving}
                >
                  Chọn file
                </Button>
                {company?.businessLicenseFileId && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 cursor-pointer text-xs font-bold text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                    onClick={() => void openBusinessLicense()}
                  >
                    Xem file đã tải
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 p-5">
          <Button variant="outline" onClick={() => void loadCompany(accountId, token)}>
            Hủy bỏ
          </Button>
          <Button
            className="bg-[#11a77a] font-bold hover:bg-[#0d966d]"
            disabled={saving}
            onClick={() => void saveCompany()}
          >
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </Card>

      <Card className="upnext-shadow rounded-lg bg-white p-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-blue-500 transition-all duration-300">
              <ImageSquare size={22} />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-base font-extrabold tracking-tight text-slate-800">
                Album ảnh công ty
              </h3>
              <p className="mt-1 text-sm leading-relaxed font-medium text-slate-500">
                Tải lên hình ảnh về văn phòng, hoạt động hoặc sản phẩm. Nhấn lưu thay đổi để cập
                nhật.
              </p>
            </div>
          </div>

          {/* Thumbnail grid */}
          <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {/* Upload Box button */}
            <button
              type="button"
              className="relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 transition-all duration-300 hover:border-blue-500 hover:bg-blue-50/20 hover:text-blue-600 focus:border-blue-500 focus:outline-none"
              onClick={() => photosInputRef.current?.click()}
              aria-label="Thêm ảnh công ty"
            >
              <ImageSquare size={24} />
              <span className="mt-1 text-[11px] font-bold">Thêm ảnh</span>
            </button>

            {tempPhotos
              .filter((p) => !p.isDeleted)
              .map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-none transition-all duration-200 hover:border-slate-300"
                >
                  <img src={photo.publicUrl} alt="Ảnh công ty" className="size-full object-cover" />
                  <button
                    type="button"
                    className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-all duration-200 hover:opacity-100"
                    onClick={() => handlePhotoDelete(photo.id)}
                    aria-label="Xóa ảnh"
                  >
                    <Trash
                      size={18}
                      className="transform text-white transition-transform hover:scale-110 hover:text-red-400"
                    />
                  </button>
                </div>
              ))}
          </div>
        </div>
      </Card>

      <input
        ref={logoInputRef}
        className="hidden"
        type="file"
        accept="image/*"
        aria-label="Tải logo công ty"
        onChange={(event) => handleLogoSelect(event.target.files?.[0])}
      />
      <input
        ref={coverInputRef}
        className="hidden"
        type="file"
        accept="image/*"
        aria-label="Tải ảnh bìa công ty"
        onChange={(event) => handleCoverSelect(event.target.files?.[0])}
      />
      <input
        ref={licenseInputRef}
        className="hidden"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        aria-label="Tải minh chứng doanh nghiệp"
        onChange={(event) => setLicenseFile(event.target.files?.[0] || null)}
      />
      <input
        ref={photosInputRef}
        className="hidden"
        type="file"
        accept="image/*"
        multiple
        aria-label="Tải ảnh công ty"
        onChange={(event) => handlePhotoSelect(event.target.files)}
      />
    </div>
  );
}

function CompanyField({
  id,
  label,
  onChange,
  type = "text",
  value,
  required,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  type?: "email" | "text";
  value: string;
  required?: boolean;
}) {
  return (
    <FormInput
      id={id}
      label={label}
      type={type}
      required={required || false}
      className="h-11 rounded-lg border-slate-200 bg-white text-sm shadow-none focus:border-emerald-600 focus:outline-none focus-visible:outline-none"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function formatVerificationStatus(status: CompanyDetail["verificationStatus"] | undefined) {
  if (status === "VERIFIED") return "Đã xác thực";
  if (status === "PENDING") return "Chờ xác thực";
  if (status === "REJECTED") return "Bị từ chối";

  return "Chưa xác thực";
}

function getCompanyErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 400) return "Dữ liệu chưa hợp lệ hoặc file không đúng định dạng.";
    if (error.status === 401) return "Phiên đăng nhập đã hết hạn.";
    if (error.status === 403) return "Bạn không có quyền quản lý công ty này.";
    if (error.status === 404) return "Không tìm thấy công ty.";
  }

  return "Hệ thống chưa thể xử lý yêu cầu. Vui lòng thử lại.";
}

function handleAuthError(error: unknown, router: ReturnType<typeof useRouter>) {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    localStorage.removeItem("upnext.recruiter.accessToken");
    localStorage.removeItem("upnext.recruiter.tokenType");
    localStorage.removeItem("upnext.recruiter.user");
    router.replace("/recruiter/login");
    return;
  }

  void Swal.fire({
    icon: "error",
    title: "Không thể tải dữ liệu",
    text: getCompanyErrorMessage(error),
  });
}
