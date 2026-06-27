"use client";

import {
  Buildings,
  CircleNotch,
  ImageSquare,
  PencilSimple,
  Sparkle,
  Trash,
  Lightning,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";

import {
  attachRecruiterCompany,
  createCompany,
  deleteCompanyPhoto,
  getCompany,
  getCompanyBusinessLicenseUrl,
  getRecruiterAccount,
  scanCompanyBusinessLicense,
  updateCompany,
  uploadCompanyBusinessLicense,
  uploadCompanyCover,
  uploadCompanyLogo,
  uploadCompanyPhoto,
  type CompanyDetail,
} from "@/features/recruiter/api/onboarding";
import { clearRecruiterSession, getRecruiterSession } from "@/features/recruiter/session";
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
  const t = useTranslations("Recruiter.onboarding.companyProfile");
  const licenseInputRef = useRef<HTMLInputElement>(null);
  const [token, setToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
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

        let currentCompanyId = account.company?.id;

        if (!currentCompanyId) {
          try {
            const draftResult = await createCompany({ name: "Draft Company" }, accessToken);
            currentCompanyId = draftResult.id;
            await attachRecruiterCompany(nextAccountId, currentCompanyId, accessToken);
          } catch (createErr) {
            console.error("Failed to auto-create draft company for profile editing", createErr);
            void Swal.fire({
              icon: "warning",
              title: t("errors.noProfileTitle"),
              text: t("errors.noProfileText"),
            });
            router.replace("/recruiter");
            return;
          }
        }

        const nextCompany = await getCompany(currentCompanyId, accessToken);
        setCompanyId(nextCompany.id);
        setCompany(nextCompany);
        setLogoFile(null);
        setLogoPreviewUrl("");
        setCoverFile(null);
        setCoverPreviewUrl("");
        setLicenseFile(null);
        setForm({
          name: nextCompany.name === "Draft Company" ? "" : nextCompany.name || "",
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
        handleAuthError(error, router, t);
      } finally {
        setLoading(false);
      }
    },
    [router, t],
  );

  useEffect(() => {
    const session = getRecruiterSession();

    if (!session) {
      router.replace("/recruiter/login");
      return;
    }

    setToken(session.accessToken);
    setAccountId(session.user.id);
    void loadCompany(session.user.id, session.accessToken);
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
    const trimmedName = form.name.trim();
    const trimmedTaxCode = form.taxCode.trim();
    const trimmedEmail = form.email.trim();
    const trimmedPhone = form.phone.trim();
    const trimmedAddress = form.address.trim();
    const trimmedCompanySize = form.companySize.trim();
    let trimmedWebsite = form.website.trim();

    // 1. Validate Company Name
    if (!trimmedName || trimmedName.length < 2) {
      void Swal.fire({
        icon: "error",
        title: t("errors.invalidTitle"),
        text: t("errors.nameMin"),
      });
      return;
    }

    // 2. Validate Tax Code
    if (!trimmedTaxCode || trimmedTaxCode.length < 8) {
      void Swal.fire({
        icon: "error",
        title: t("errors.invalidTitle"),
        text: t("errors.taxCodeMin"),
      });
      return;
    }

    // 3. Validate Contact Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      void Swal.fire({
        icon: "error",
        title: t("errors.invalidTitle"),
        text: t("errors.emailInvalid"),
      });
      return;
    }

    // 4. Validate Phone Number
    if (!trimmedPhone || trimmedPhone.length < 4) {
      void Swal.fire({
        icon: "error",
        title: t("errors.invalidTitle"),
        text: t("errors.phoneMin"),
      });
      return;
    }

    // 5. Validate Company Size
    if (!trimmedCompanySize) {
      void Swal.fire({
        icon: "error",
        title: t("errors.invalidTitle"),
        text: t("errors.sizeRequired"),
      });
      return;
    }

    // 6. Validate Address
    if (!trimmedAddress || trimmedAddress.length < 6) {
      void Swal.fire({
        icon: "error",
        title: t("errors.invalidTitle"),
        text: t("errors.addressMin"),
      });
      return;
    }

    // 7. Validate Company Description (strip HTML tags to count actual text characters)
    const cleanDescription = form.description.replace(/<[^>]*>/g, "").trim();
    if (cleanDescription.length < 20) {
      void Swal.fire({
        icon: "error",
        title: t("errors.invalidTitle"),
        text: t("errors.descMin"),
      });
      return;
    }

    // 8. Auto-prepend https:// to Website if needed
    if (trimmedWebsite && !/^https?:\/\//i.test(trimmedWebsite)) {
      trimmedWebsite = `https://${trimmedWebsite}`;
    }

    const payload = {
      ...form,
      name: trimmedName,
      taxCode: trimmedTaxCode,
      email: trimmedEmail,
      phone: trimmedPhone,
      address: trimmedAddress,
      website: trimmedWebsite,
      companySize: trimmedCompanySize,
    };

    try {
      setSaving(true);
      // 1. Lưu thông tin cơ bản
      await updateCompany(companyId, payload, token);

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
      void toast.fire({ icon: "success", title: t("messages.saveSuccess") });
    } catch (error) {
      void Swal.fire({
        icon: "error",
        title: t("errors.saveErrorTitle"),
        text: getCompanyErrorMessage(error, t),
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
        title: t("errors.popupBlockedTitle"),
        text: t("errors.popupBlockedText"),
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
        title: t("errors.openLicenseError"),
        text: getCompanyErrorMessage(error, t),
      });
    }
  }

  async function handleScanLicense() {
    if (!licenseFile) {
      void Swal.fire({
        icon: "warning",
        title: t("errors.noFileSelected"),
        text: t("errors.noFileSelectedText"),
      });
      return;
    }

    try {
      setScanning(true);
      const data = await scanCompanyBusinessLicense(companyId, licenseFile, token);

      const result = await Swal.fire({
        title: t("messages.scanSuccessTitle"),
        html: `
          <div class="text-left space-y-2 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
            <p class="break-words"><strong>${t("messages.scanFields.name")}:</strong> ${data.name || t("errors.notFound")}</p>
            <p class="break-words"><strong>${t("messages.scanFields.taxCode")}:</strong> ${data.taxCode || t("errors.notFound")}</p>
            <p class="break-words"><strong>${t("messages.scanFields.address")}:</strong> ${data.address || t("errors.notFound")}</p>
            ${data.email ? `<p class="break-words"><strong>${t("messages.scanFields.email")}:</strong> ${data.email}</p>` : ""}
            ${data.phone ? `<p class="break-words"><strong>${t("messages.scanFields.phone")}:</strong> ${data.phone}</p>` : ""}
            ${data.website ? `<p class="break-words"><strong>${t("messages.scanFields.website")}:</strong> ${data.website}</p>` : ""}
          </div>
          <p class="mt-4 text-center font-bold text-slate-700">${t("messages.scanSuccessConfirmText")}</p>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: t("messages.agree"),
        cancelButtonText: t("messages.ignore"),
        confirmButtonColor: "#10a778",
      });

      if (result.isConfirmed) {
        setForm((current) => ({
          ...current,
          name: data.name || current.name,
          taxCode: data.taxCode || current.taxCode,
          address: data.address || current.address,
          email: data.email || current.email,
          phone: data.phone || current.phone,
          website: data.website || current.website,
        }));
        void toast.fire({ icon: "success", title: t("messages.autofillSuccess") });
      }
    } catch (error) {
      void Swal.fire({
        icon: "error",
        title: t("errors.scanError"),
        text: getCompanyErrorMessage(error, t),
      });
    } finally {
      setScanning(false);
    }
  }
  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center text-sm font-bold text-slate-500">
        <CircleNotch className="mr-2 size-5 animate-spin text-emerald-600" />
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="upnext-shadow rounded-lg bg-white">
        <div className="border-b border-slate-100 p-5">
          <div className="flex items-center gap-2">
            <Buildings size={20} className="text-emerald-700" />
            <h2 className="text-lg font-extrabold">{t("cardTitle")}</h2>
            <Badge tone={company?.verificationStatus === "VERIFIED" ? "success" : "warning"}>
              {formatVerificationStatus(company?.verificationStatus, t)}
            </Badge>
          </div>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <CompanyBrandSection
            t={t}
            saving={saving}
            logoFile={logoFile}
            displayLogoUrl={displayLogoUrl}
            onSelectLogo={handleLogoSelect}
            coverFile={coverFile}
            displayCoverUrl={displayCoverUrl}
            onSelectCover={handleCoverSelect}
          />

          <CompanyScannerBanner
            t={t}
            licenseFile={licenseFile}
            scanning={scanning}
            triggerSelect={() => licenseInputRef.current?.click()}
            onScanLicense={() => void handleScanLicense()}
            onCancelSelection={() => setLicenseFile(null)}
          />

          <CompanyField
            id="company-name"
            label={t("fields.name")}
            placeholder={t("fields.namePlaceholder")}
            required
            value={form.name}
            onChange={(value) => setForm((current) => ({ ...current, name: value }))}
          />
          <CompanyField
            id="company-tax"
            label={t("fields.taxCode")}
            placeholder={t("fields.taxCodePlaceholder")}
            required
            value={form.taxCode}
            onChange={(value) => setForm((current) => ({ ...current, taxCode: value }))}
          />
          <CompanyField
            id="company-email"
            label={t("fields.email")}
            placeholder={t("fields.emailPlaceholder")}
            type="email"
            required
            value={form.email}
            onChange={(value) => setForm((current) => ({ ...current, email: value }))}
          />
          <CompanyField
            id="company-phone"
            label={t("fields.phone")}
            placeholder={t("fields.phonePlaceholder")}
            required
            value={form.phone}
            onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
          />
          <CompanyField
            id="company-website"
            label={t("fields.website")}
            placeholder={t("fields.websitePlaceholder")}
            value={form.website}
            onChange={(value) => setForm((current) => ({ ...current, website: value }))}
          />
          <CompanyField
            id="company-size"
            label={t("fields.companySize")}
            placeholder={t("fields.companySizePlaceholder")}
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
              {t("fields.description")} <span className="ml-1 text-red-500">*</span>
            </Label>
            <RichTextEditor
              value={form.description}
              onChange={(value) => setForm((current) => ({ ...current, description: value }))}
              placeholder={t("fields.descriptionPlaceholder")}
            />
          </div>
          <CompanyLicenseSection
            t={t}
            licenseFile={licenseFile}
            company={company}
            saving={saving}
            scanning={scanning}
            triggerSelect={() => licenseInputRef.current?.click()}
            onScanLicense={() => void handleScanLicense()}
            openBusinessLicense={() => void openBusinessLicense()}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 p-5">
          <Button variant="outline" onClick={() => void loadCompany(accountId, token)}>
            {t("actions.cancel")}
          </Button>
          <Button
            className="bg-[#11a77a] font-bold hover:bg-[#0d966d]"
            disabled={saving}
            onClick={() => void saveCompany()}
          >
            {saving ? t("actions.saving") : t("actions.save")}
          </Button>
        </div>
      </Card>

      <CompanyAlbumSection
        t={t}
        tempPhotos={tempPhotos}
        onAddPhotos={handlePhotoSelect}
        onDeletePhoto={handlePhotoDelete}
      />

      <input
        ref={licenseInputRef}
        className="hidden"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        aria-label="Tải minh chứng doanh nghiệp"
        onChange={(event) => setLicenseFile(event.target.files?.[0] || null)}
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
  placeholder,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  type?: "email" | "text";
  value: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <FormInput
      id={id}
      label={label}
      type={type}
      required={required || false}
      placeholder={placeholder}
      className="h-11 rounded-lg border-slate-200 bg-white text-sm shadow-none focus:border-emerald-600 focus:outline-none focus-visible:outline-none"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function formatVerificationStatus(
  status: CompanyDetail["verificationStatus"] | undefined,
  t: (key: string) => string,
) {
  if (status === "VERIFIED") return t("status.verified");
  if (status === "PENDING") return t("status.pending");
  if (status === "REJECTED") return t("status.rejected");

  return t("status.unverified");
}

function getCompanyErrorMessage(error: unknown, t: (key: string) => string) {
  if (error instanceof ApiError) {
    if (error.status === 400) return t("errors.badData");
    if (error.status === 401) return t("errors.sessionExpired");
    if (error.status === 403) return t("errors.forbidden");
    if (error.status === 404) return t("errors.notFound");
  }

  return t("errors.unknown");
}

function handleAuthError(
  error: unknown,
  router: ReturnType<typeof useRouter>,
  t: (key: string) => string,
) {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    clearRecruiterSession();
    router.replace("/recruiter/login");
    return;
  }

  void Swal.fire({
    icon: "error",
    title: t("errors.loadError"),
    text: getCompanyErrorMessage(error, t),
  });
}

// Extracted Subcomponents for better cleanliness & readability

interface CompanyBrandSectionProps {
  t: (key: string) => string;
  saving: boolean;
  logoFile: File | null;
  displayLogoUrl: string;
  onSelectLogo: (file: File | undefined) => void;
  coverFile: File | null;
  displayCoverUrl: string;
  onSelectCover: (file: File | undefined) => void;
}

function CompanyBrandSection({
  t,
  saving,
  logoFile,
  displayLogoUrl,
  onSelectLogo,
  coverFile,
  displayCoverUrl,
  onSelectCover,
}: CompanyBrandSectionProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-row items-start justify-around gap-4 border-b border-slate-100/80 pb-6 lg:col-span-2 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-5">
      {/* Logo box */}
      <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
        <button
          type="button"
          className="group relative flex size-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition-all duration-300 hover:border-emerald-500 hover:bg-emerald-50/20 focus:border-emerald-500 focus:outline-none sm:size-24"
          onClick={() => logoInputRef.current?.click()}
          aria-label={t("ariaLabels.logoInput")}
        >
          {displayLogoUrl ? (
            <Image
              src={displayLogoUrl}
              alt={t("logo.title")}
              width={96}
              height={96}
              unoptimized
              className="size-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center text-slate-400 transition-colors group-hover:text-emerald-600">
              <ImageSquare size={28} />
              <span className="mt-1 text-xs font-bold">{t("logo.uploadBtn")}</span>
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
            {t("logo.title")}
          </Label>
          <p className="mt-1 hidden text-xs leading-relaxed font-medium whitespace-pre-line text-slate-500 sm:block">
            {t("logo.helpText")}
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
          aria-label={t("ariaLabels.coverInput")}
        >
          {displayCoverUrl ? (
            <Image
              src={displayCoverUrl}
              alt={t("cover.title")}
              width={160}
              height={96}
              unoptimized
              className="size-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center text-slate-400 transition-colors group-hover:text-emerald-600">
              <ImageSquare size={28} />
              <span className="mt-1 text-xs font-bold">{t("cover.uploadBtn")}</span>
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
            {t("cover.title")}
          </Label>
          <p className="mt-1 hidden text-xs leading-relaxed font-medium whitespace-pre-line text-slate-500 sm:block">
            {t("cover.helpText")}
          </p>
        </div>
      </div>

      <input
        ref={logoInputRef}
        className="hidden"
        type="file"
        accept="image/*"
        aria-label="Tải logo công ty"
        onChange={(event) => onSelectLogo(event.target.files?.[0])}
      />
      <input
        ref={coverInputRef}
        className="hidden"
        type="file"
        accept="image/*"
        aria-label="Tải ảnh bìa công ty"
        onChange={(event) => onSelectCover(event.target.files?.[0])}
      />
    </div>
  );
}

interface CompanyScannerBannerProps {
  t: (key: string) => string;
  licenseFile: File | null;
  scanning: boolean;
  triggerSelect: () => void;
  onScanLicense: () => void;
  onCancelSelection: () => void;
}

function CompanyScannerBanner({
  t,
  licenseFile,
  scanning,
  triggerSelect,
  onScanLicense,
  onCancelSelection,
}: CompanyScannerBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 p-6 shadow-xs transition-all duration-300 lg:col-span-2">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-12 -right-12 size-32 rounded-full bg-emerald-400/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 size-32 rounded-full bg-teal-400/10 blur-2xl" />

      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="animate-pulse-slow flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
            <Sparkle size={22} weight="fill" className="animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="flex items-center gap-2 text-sm font-black text-slate-800 sm:text-base">
              {t("aiScan.title")}
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black tracking-wider text-emerald-800 uppercase">
                {t("aiScan.badgeNew")}
              </span>
            </h4>
            <p className="hidden max-w-xl text-xs leading-relaxed font-semibold text-slate-500 sm:block">
              {t("aiScan.helpText")}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 self-end sm:self-center">
          {!licenseFile ? (
            <button
              type="button"
              onClick={triggerSelect}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-black tracking-wider text-white uppercase shadow-md shadow-emerald-600/15 transition-all duration-300 hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg hover:shadow-emerald-600/25 active:scale-95"
            >
              {t("aiScan.uploadBtn")}
              <Lightning size={14} weight="fill" className="animate-bounce text-yellow-300" />
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <span className="max-w-[150px] truncate rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2 text-xs font-bold text-slate-600 shadow-2xs backdrop-blur-xs sm:max-w-xs">
                📎 {licenseFile.name}
              </span>
              <button
                type="button"
                onClick={onScanLicense}
                disabled={scanning}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-black tracking-wider text-white uppercase shadow-md shadow-blue-600/15 transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-600/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {scanning ? (
                  <>
                    <CircleNotch className="size-3.5 animate-spin" />
                    {t("aiScan.scanning")}
                  </>
                ) : (
                  <>
                    {t("aiScan.startBtn")}
                    <Lightning size={12} weight="fill" className="text-yellow-300" />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onCancelSelection}
                className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-500 shadow-2xs transition-all duration-300 hover:bg-slate-50 hover:text-slate-800"
              >
                {t("aiScan.cancelBtn")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface CompanyLicenseSectionProps {
  t: (key: string, values?: any) => string;
  licenseFile: File | null;
  company: CompanyDetail | null;
  saving: boolean;
  scanning: boolean;
  triggerSelect: () => void;
  onScanLicense: () => void;
  openBusinessLicense: () => void;
}

function CompanyLicenseSection({
  t,
  licenseFile,
  company,
  saving,
  scanning,
  triggerSelect,
  onScanLicense,
  openBusinessLicense,
}: CompanyLicenseSectionProps) {
  return (
    <div className="flex flex-col gap-1.5 lg:col-span-2">
      <Label className="text-sm font-bold text-slate-700">
        {t("fields.license")} <span className="ml-1 text-red-500">*</span>
      </Label>
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1 text-left">
          <span className="text-sm font-semibold text-slate-700">
            {licenseFile
              ? t("licenseSection.selected", { filename: licenseFile.name })
              : company?.businessLicenseFileId
                ? t("licenseSection.uploaded")
                : t("licenseSection.none")}
          </span>
          <span className="text-xs font-medium text-slate-500">{t("licenseSection.helpText")}</span>
        </div>
        <div className="mt-1 flex items-center gap-2 sm:mt-0">
          <Button
            type="button"
            variant="outline"
            className="h-9 cursor-pointer border-slate-200 text-xs font-bold shadow-none hover:bg-slate-100/50"
            onClick={triggerSelect}
            disabled={saving || scanning}
          >
            {t("licenseSection.chooseBtn")}
          </Button>
          {licenseFile && (
            <Button
              type="button"
              variant="secondary"
              className="h-9 cursor-pointer bg-blue-600 text-xs font-bold text-white shadow-none hover:bg-blue-700 focus:outline-none"
              onClick={onScanLicense}
              disabled={scanning || saving}
            >
              {scanning ? (
                <span className="flex items-center gap-1.5">
                  <CircleNotch className="size-4 animate-spin" />
                  {t("licenseSection.scanning")}
                </span>
              ) : (
                <>
                  {t("licenseSection.scanBtn")}
                  <Lightning size={12} weight="fill" className="ml-1 text-yellow-300" />
                </>
              )}
            </Button>
          )}
          {company?.businessLicenseFileId && (
            <Button
              type="button"
              variant="ghost"
              className="h-9 cursor-pointer text-xs font-bold text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
              onClick={openBusinessLicense}
            >
              {t("licenseSection.viewBtn")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface CompanyAlbumSectionProps {
  t: (key: string) => string;
  tempPhotos: TempPhoto[];
  onAddPhotos: (files: FileList | null) => void;
  onDeletePhoto: (photoId: string) => void;
}

function CompanyAlbumSection({
  t,
  tempPhotos,
  onAddPhotos,
  onDeletePhoto,
}: CompanyAlbumSectionProps) {
  const photosInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="upnext-shadow rounded-lg bg-white p-5">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-blue-500 transition-all duration-300">
            <ImageSquare size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-extrabold tracking-tight text-slate-800">
              {t("album.title")}
            </h3>
            <p className="mt-1 text-sm leading-relaxed font-medium text-slate-500">
              {t("album.description")}
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
            aria-label={t("album.addBtn")}
          >
            <ImageSquare size={24} />
            <span className="mt-1 text-[11px] font-bold">{t("album.addBtn")}</span>
          </button>

          {tempPhotos
            .filter((p) => !p.isDeleted)
            .map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-none transition-all duration-200 hover:border-slate-300"
              >
                <Image
                  src={photo.publicUrl}
                  alt={t("album.photoAlt")}
                  width={200}
                  height={200}
                  unoptimized
                  className="size-full object-cover"
                />
                <button
                  type="button"
                  className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-all duration-200 hover:opacity-100"
                  onClick={() => onDeletePhoto(photo.id)}
                  aria-label={t("album.deleteLabel")}
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

      <input
        ref={photosInputRef}
        className="hidden"
        type="file"
        accept="image/*"
        multiple
        aria-label={t("ariaLabels.photosInput")}
        onChange={(event) => onAddPhotos(event.target.files)}
      />
    </Card>
  );
}
