"use client";

import { MapPin, Plus, Trash, PencilSimple, CircleNotch } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";

import {
  getCompanyLocations,
  createCompanyLocation,
  updateCompanyLocation,
  deleteCompanyLocation,
  getCompany,
  getRecruiterAccount,
  type CompanyLocation,
  type CompanyDetail,
} from "@/features/recruiter/api/onboarding";
import {
  DRAFT_COMPANY_NAME,
  VIETNAM_PROVINCES,
} from "@/features/recruiter/constants/vietnam-provinces";
import { getRecruiterSession } from "@/features/recruiter/session";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import { RecruiterTableLayout } from "./recruiter-table-layout";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2600,
  timerProgressBar: true,
});

function hasCompletedCompanyProfile(company: CompanyDetail) {
  return Boolean(
    company.name &&
    company.name !== DRAFT_COMPANY_NAME &&
    company.taxCode &&
    company.email &&
    company.phone &&
    company.address &&
    company.companySize &&
    company.description,
  );
}

export function RecruiterCompanyAddressesPage() {
  const router = useRouter();
  const t = useTranslations("Recruiter.onboarding");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [locations, setLocations] = useState<CompanyLocation[]>([]);
  const [provinces, setProvinces] =
    useState<ReadonlyArray<{ code: number; name: string }>>(VIETNAM_PROVINCES);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [officeName, setOfficeName] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [fullAddress, setFullAddress] = useState("");

  const loadData = useCallback(
    async (idOfCompany: string, accessToken: string) => {
      try {
        setLoading(true);
        const list = await getCompanyLocations(idOfCompany, accessToken);
        setLocations(list);
      } catch (err) {
        console.error("Failed to load company locations", err);
        void Swal.fire({
          icon: "error",
          title: t("companyAddresses.errors.loadError"),
          text: t("companyProfile.errors.unknown"),
        });
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    const session = getRecruiterSession();
    if (!session) {
      router.replace("/recruiter/login");
      return;
    }

    setToken(session.accessToken);

    const init = async () => {
      try {
        const account = await getRecruiterAccount(session.user.id, session.accessToken);
        const currentCompanyId = account.company?.id;

        if (!currentCompanyId) {
          const result = await Swal.fire({
            icon: "warning",
            title: t("companyAddresses.errors.noCompanyTitle"),
            text: t("companyAddresses.errors.noCompanyText"),
            confirmButtonColor: "#10a778",
            allowOutsideClick: false,
            allowEscapeKey: false,
          });
          if (result.isConfirmed) {
            router.replace("/recruiter/company-profile");
          }
          return;
        }

        const company = await getCompany(currentCompanyId, session.accessToken);
        if (!hasCompletedCompanyProfile(company)) {
          const result = await Swal.fire({
            icon: "warning",
            title: t("companyAddresses.errors.noCompanyTitle"),
            text: t("companyAddresses.errors.noCompanyText"),
            confirmButtonColor: "#10a778",
            allowOutsideClick: false,
            allowEscapeKey: false,
          });
          if (result.isConfirmed) {
            router.replace("/recruiter/company-profile");
          }
          return;
        }

        setCompanyId(currentCompanyId);
        void loadData(currentCompanyId, session.accessToken);
      } catch (err) {
        console.error("Failed to initialize company session", err);
        router.replace("/recruiter");
      }
    };

    void init();
  }, [loadData, router, t]);

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await fetch("https://provinces.open-api.vn/api/v2/p/");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setProvinces(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch provinces", err);
      }
    };
    void fetchProvinces();
  }, []);

  const handleOpenAddForm = () => {
    setEditingId(null);
    setOfficeName("");
    setSelectedCity("");
    setFullAddress("");
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (loc: CompanyLocation) => {
    setEditingId(loc.id);
    setOfficeName(loc.name || "");
    setSelectedCity(loc.city || "");
    setFullAddress(loc.address || "");
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setOfficeName("");
    setSelectedCity("");
    setFullAddress("");
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !token) return;

    if (!officeName.trim() || !selectedCity.trim() || !fullAddress.trim()) {
      void Swal.fire({
        icon: "warning",
        title: t("companyAddresses.errors.saveError"),
        text: t("companyAddresses.errors.requiredFields"),
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: officeName.trim(),
        workingModel: "ONSITE" as const,
        city: selectedCity.trim(),
        address: fullAddress.trim(),
      };

      if (editingId) {
        await updateCompanyLocation(companyId, editingId, payload, token);
        void toast.fire({
          icon: "success",
          title: t("companyAddresses.success.updated"),
        });
      } else {
        await createCompanyLocation(companyId, payload, token);
        void toast.fire({
          icon: "success",
          title: t("companyAddresses.success.created"),
        });
      }

      handleCloseForm();
      void loadData(companyId, token);
    } catch (err) {
      console.error("Failed to save location", err);
      void Swal.fire({
        icon: "error",
        title: t("companyAddresses.errors.saveError"),
        text: t("companyProfile.errors.unknown"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLocation = async (locId: string) => {
    if (!companyId || !token) return;

    const result = await Swal.fire({
      title: t("companyAddresses.confirmDelete.title"),
      text: t("companyAddresses.confirmDelete.text"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t("companyAddresses.confirmDelete.confirm"),
      cancelButtonText: t("companyAddresses.confirmDelete.cancel"),
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await deleteCompanyLocation(companyId, locId, token);
        void toast.fire({
          icon: "success",
          title: t("companyAddresses.success.deleted"),
        });
        void loadData(companyId, token);
      } catch (err) {
        console.error("Failed to delete location", err);
        void Swal.fire({
          icon: "error",
          title: t("companyAddresses.errors.deleteError"),
          text: t("companyProfile.errors.unknown"),
        });
        setLoading(false);
      }
    }
  };

  return (
    <div className="w-full min-w-0 space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-outfit text-xl font-bold text-slate-950 sm:text-2xl">
            {t("companyAddresses.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t("companyAddresses.description")}</p>
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-100 bg-teal-50/60 px-4 py-2 text-sm font-bold text-teal-800">
            <MapPin size={16} className="text-teal-600" />
            {t("companyAddresses.locationsCount", { count: locations.length })}
          </span>
        </div>
      </header>

      <RecruiterTableLayout
        loading={loading}
        filterBar={<span aria-hidden="true" />}
        actionBar={
          <Button
            onClick={handleOpenAddForm}
            className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 font-bold text-white shadow-none transition-all hover:bg-emerald-700"
          >
            <Plus size={18} weight="bold" />
            <span>{t("companyAddresses.addBtn")}</span>
          </Button>
        }
      >
        <thead>
          <tr className="border-b border-slate-300 bg-slate-200">
            <th className="w-[220px] min-w-[200px] border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0">
              {t("companyAddresses.officeName")}
            </th>
            <th className="w-[220px] min-w-[200px] border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0">
              {t("companyAddresses.city")}
            </th>
            <th className="min-w-[360px] border-r border-slate-300 px-4 py-3 text-left text-xs font-bold text-slate-900 last:border-r-0">
              {t("companyAddresses.address")}
            </th>
            <th className="w-[140px] min-w-[140px] px-4 py-3 text-right text-xs font-bold text-slate-900">
              {t("companyAddresses.actions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {locations.length === 0 ? (
            <tr aria-label="Empty company addresses">
              <td
                colSpan={4}
                aria-label="No company addresses"
                className="!px-6 !py-16 text-center text-sm text-slate-500"
              >
                <div className="flex flex-col items-center justify-center gap-3">
                  <img
                    src="/assets/icons/office-building.png"
                    alt=""
                    className="size-20 object-contain"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-semibold text-slate-700">
                      {t("companyAddresses.emptyState.title")}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {t("companyAddresses.emptyState.description")}
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          ) : (
            locations.map((loc) => (
              <tr
                key={loc.id}
                className="border-b border-slate-200 bg-white transition-colors duration-150 last:border-b-0 even:bg-slate-100/50 hover:bg-sky-50/30"
              >
                <td className="w-[220px] min-w-[200px] border-r border-slate-100/50 px-4 py-2.5 last:border-r-0">
                  <span className="text-sm font-semibold text-slate-800">{loc.name || "-"}</span>
                </td>
                <td className="w-[220px] min-w-[200px] border-r border-slate-100/50 px-4 py-2.5 text-sm text-slate-600 last:border-r-0">
                  {loc.city || "-"}
                </td>
                <td className="min-w-[360px] border-r border-slate-100/50 px-4 py-2.5 text-sm text-slate-600 last:border-r-0">
                  <div className="max-w-[520px] truncate" title={loc.address || ""}>
                    {loc.address || "-"}
                  </div>
                </td>
                <td className="w-[140px] min-w-[140px] px-4 py-2.5 text-right">
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditForm(loc)}
                      aria-label={t("companyAddresses.editBtn")}
                      className="size-8 rounded-full p-0 text-slate-400 hover:text-slate-600"
                    >
                      <PencilSimple size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteLocation(loc.id)}
                      aria-label={t("companyAddresses.deleteBtn")}
                      className="size-8 rounded-full p-0 text-red-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </RecruiterTableLayout>

      {/* Popup Dialog Form */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="overflow-hidden rounded-2xl border-none p-0 sm:max-w-[560px]">
          <form onSubmit={handleSaveLocation}>
            <div className="border-b border-slate-100 p-6 pb-4">
              <DialogTitle className="font-outfit text-xl font-bold tracking-wide text-slate-800">
                {editingId
                  ? t("companyAddresses.dialogTitleEdit")
                  : t("companyAddresses.dialogTitleAdd")}
              </DialogTitle>
            </div>

            <div className="space-y-6 p-6 py-8">
              {/* Row 1: Office Name */}
              <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[140px_1fr] sm:gap-4">
                <Label className="text-[15px] font-bold text-slate-600 sm:pt-3">
                  {t("companyAddresses.officeName")}
                </Label>
                <div className="space-y-1">
                  <Input
                    type="text"
                    maxLength={50}
                    className="h-11 w-full rounded-xl border-slate-200 bg-white text-sm shadow-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500"
                    placeholder={t("companyAddresses.officeNamePlaceholder")}
                    value={officeName}
                    onChange={(e) => setOfficeName(e.target.value.slice(0, 50))}
                    required
                  />
                  <div className="text-right text-xs text-slate-400">
                    {t("companyAddresses.charLimit", { count: officeName.length, max: 50 })}
                  </div>
                </div>
              </div>

              {/* Row 2: Province / City */}
              <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[140px_1fr] sm:gap-4">
                <Label className="text-[15px] font-bold text-slate-600 sm:pt-3">
                  {t("companyAddresses.city")}
                </Label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="upnext-focus h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus-visible:border-blue-500"
                  required
                >
                  <option value="" disabled>
                    {t("companyAddresses.cityPlaceholder")}
                  </option>
                  {provinces.map((p) => (
                    <option key={p.code} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Row 3: Address */}
              <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[140px_1fr] sm:gap-4">
                <Label className="text-[15px] font-bold text-slate-600 sm:pt-3">
                  {t("companyAddresses.address")}
                </Label>
                <div className="space-y-1">
                  <Input
                    type="text"
                    maxLength={120}
                    className="h-11 w-full rounded-xl border-slate-200 bg-white text-sm shadow-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500"
                    placeholder={t("companyAddresses.addressPlaceholder")}
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value.slice(0, 120))}
                    required
                  />
                  <div className="text-right text-xs text-slate-400">
                    {t("companyAddresses.charLimit", { count: fullAddress.length, max: 120 })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-white p-6 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCloseForm}
                disabled={submitting}
                className="h-10 rounded-xl bg-slate-100 px-6 text-sm font-bold text-slate-600 hover:bg-slate-200"
              >
                {t("companyAddresses.cancelBtn")}
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="h-10 rounded-xl px-8 text-sm font-bold"
                disabled={submitting}
              >
                {submitting ? (
                  <CircleNotch className="animate-spin" size={16} />
                ) : editingId ? (
                  t("companyAddresses.save")
                ) : (
                  t("companyAddresses.create")
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
