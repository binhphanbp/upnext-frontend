"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeSlash, Spinner } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useState, type FocusEvent } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import Swal, { type SweetAlertIcon } from "sweetalert2";
import { z } from "zod";

import {
  getCompanyInvitationDetails,
  acceptCompanyInvitationAndSetPassword,
  acceptCompanyInvitation,
  type CompanyInvitationDetails,
} from "@/features/recruiter/api/team";
import { RecruiterAuthShell } from "@/features/recruiter/components/login-page";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { Button } from "@/shared/ui/button";
import { FormInput } from "@/shared/ui/input";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3200,
  timerProgressBar: true,
});

function showToast(icon: SweetAlertIcon, title: string) {
  void Toast.fire({ icon, title });
}

const authInputClassName =
  "recruiter-auth-input h-12 rounded-xl border-slate-200 bg-white text-sm shadow-none placeholder:text-slate-400";

function setAuthInputFocusStyle(event: FocusEvent<HTMLInputElement>) {
  event.currentTarget.style.setProperty("border-color", "#10a778", "important");
}

function resetAuthInputFocusStyle(
  event: FocusEvent<HTMLInputElement>,
  register: UseFormRegisterReturn,
) {
  event.currentTarget.style.removeProperty("border-color");
  void register.onBlur(event);
}

type ResetPasswordValues = {
  password: string;
  confirm: string;
};

export function RecruiterCompanyInvitationPage() {
  const { id } = useParams();
  const router = useRouter();
  const tAuth = useTranslations("Auth");
  const t = useTranslations("RecruiterAuth");

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<CompanyInvitationDetails | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptingExisting, setAcceptingExisting] = useState(false);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(
      z
        .object({
          password: z.string().min(8, tAuth("validation.passwordMin")),
          confirm: z.string().min(1, tAuth("validation.confirmRequired")),
        })
        .refine((values) => values.password === values.confirm, {
          message: tAuth("validation.passwordMismatch"),
          path: ["confirm"],
        }),
    ),
    defaultValues: { password: "", confirm: "" },
  });

  useEffect(() => {
    // Read local auth storage
    try {
      const token = localStorage.getItem("upnext.recruiter.accessToken");
      const userStr = localStorage.getItem("upnext.recruiter.user");
      if (token && userStr) {
        setAccessToken(token);
        const parsed = JSON.parse(userStr);
        setCurrentUserEmail(parsed?.email || null);
      }
    } catch (e) {
      console.error(e);
    }

    if (!id || typeof id !== "string") {
      setErrorMsg(t("companyInvitation.invalidInvitation"));
      setLoading(false);
      return;
    }

    getCompanyInvitationDetails(id)
      .then((data) => {
        setInvitation(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg(t("companyInvitation.invalidInvitation"));
        setLoading(false);
      });
  }, [id, t]);

  const handleLogoutAndRedirect = () => {
    localStorage.removeItem("upnext.recruiter.accessToken");
    localStorage.removeItem("upnext.recruiter.tokenType");
    localStorage.removeItem("upnext.recruiter.user");
    router.push(`/recruiter/login?redirect=/recruiter/company-invitations/${id}`);
  };

  const handleLoginRedirect = () => {
    router.push(`/recruiter/login?redirect=/recruiter/company-invitations/${id}`);
  };

  const handleAcceptExisting = async () => {
    if (!id || typeof id !== "string" || !accessToken) return;
    setAcceptingExisting(true);
    try {
      await acceptCompanyInvitation(id, accessToken);
      showToast("success", t("companyInvitation.success"));
      router.push("/recruiter");
    } catch (err) {
      console.error(err);
      showToast("error", t("errors.processFailed"));
    } finally {
      setAcceptingExisting(false);
    }
  };

  async function submit(values: ResetPasswordValues) {
    if (!id || typeof id !== "string") return;

    try {
      const response = await acceptCompanyInvitationAndSetPassword(id, values.password);

      localStorage.setItem("upnext.recruiter.accessToken", response.accessToken);
      localStorage.setItem("upnext.recruiter.tokenType", response.tokenType);
      localStorage.setItem("upnext.recruiter.user", JSON.stringify(response.user));

      showToast("success", t("companyInvitation.success"));
      router.push("/recruiter");
    } catch (error) {
      if (error instanceof ApiError) {
        showToast("error", error.message || t("errors.processFailed"));
      } else {
        showToast("error", t("errors.processFailed"));
      }
    }
  }

  // Loader state
  if (loading) {
    return (
      <RecruiterAuthShell basic>
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner className="animate-spin text-emerald-600" size={48} />
          <p className="mt-4 text-sm font-medium text-slate-500">
            {t("emailVerification.loadingDesc")}
          </p>
        </div>
      </RecruiterAuthShell>
    );
  }

  // Error state
  if (errorMsg || !invitation) {
    return (
      <RecruiterAuthShell basic>
        <div className="py-6 text-center">
          <h2 className="text-xl font-bold text-slate-900">
            {t("companyInvitation.invalidInvitation")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            {errorMsg || t("companyInvitation.invalidInvitation")}
          </p>
          <div className="mt-8">
            <Button
              onClick={() => router.push("/recruiter/login")}
              className="h-11 w-full rounded-lg bg-[#11a77a] text-sm font-bold hover:bg-[#0d966d]"
            >
              {t("companyInvitation.backToLogin")}
            </Button>
          </div>
        </div>
      </RecruiterAuthShell>
    );
  }

  const { companyName, roleName, invitedEmail, hasPassword } = invitation;

  // Case 1: User is logged in as a DIFFERENT email than invited email
  if (currentUserEmail && currentUserEmail.toLowerCase() !== invitedEmail.toLowerCase()) {
    return (
      <RecruiterAuthShell basic>
        <div className="py-6 text-center">
          <h2 className="text-xl font-bold text-slate-900">{t("companyInvitation.title")}</h2>
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-left text-sm leading-relaxed text-amber-800">
            <p className="font-semibold">Lưu ý về tài khoản:</p>
            <p className="mt-1">
              Bạn đang đăng nhập bằng <strong>{currentUserEmail}</strong>, nhưng lời mời này được
              gửi cho địa chỉ email <strong>{invitedEmail}</strong>.
            </p>
            <p className="mt-2">
              Vui lòng đăng xuất và đăng nhập bằng tài khoản chính xác để tiếp tục.
            </p>
          </div>
          <div className="mt-8 space-y-3">
            <Button
              onClick={handleLogoutAndRedirect}
              className="h-11 w-full rounded-lg bg-[#11a77a] text-sm font-bold hover:bg-[#0d966d]"
            >
              {t("companyInvitation.logoutAndUseOther")}
            </Button>
            <button
              onClick={() => router.push("/recruiter")}
              className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Vào không gian làm việc hiện tại
            </button>
          </div>
        </div>
      </RecruiterAuthShell>
    );
  }

  // Case 2: User is logged in with the CORRECT email
  if (currentUserEmail && currentUserEmail.toLowerCase() === invitedEmail.toLowerCase()) {
    return (
      <RecruiterAuthShell basic>
        <div className="py-6 text-center">
          <h2 className="text-xl font-bold text-slate-900">
            {t("companyInvitation.alreadyLoggedInTitle")}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            {t("companyInvitation.alreadyLoggedInDesc", {
              email: currentUserEmail,
              companyName,
            })}
          </p>
          {roleName && (
            <p className="mt-2 inline-block rounded border bg-slate-50 p-2 text-xs font-semibold text-slate-500">
              Vai trò đề xuất: {roleName}
            </p>
          )}
          <div className="mt-8 space-y-3">
            <Button
              disabled={acceptingExisting}
              onClick={handleAcceptExisting}
              className="h-11 w-full rounded-lg bg-[#11a77a] text-sm font-bold hover:bg-[#0d966d]"
            >
              {acceptingExisting
                ? t("companyInvitation.submitting")
                : t("companyInvitation.acceptCta")}
            </Button>
            <button
              onClick={handleLogoutAndRedirect}
              className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              {t("companyInvitation.logoutAndUseOther")}
            </button>
          </div>
        </div>
      </RecruiterAuthShell>
    );
  }

  // Case 3: User is not logged in, but already has a password set on the account
  if (hasPassword) {
    return (
      <RecruiterAuthShell basic>
        <div className="py-6 text-center">
          <h2 className="text-xl font-bold text-slate-900">{t("companyInvitation.title")}</h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            Tài khoản ứng với email <strong>{invitedEmail}</strong> đã tồn tại trên hệ thống.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Vui lòng đăng nhập để chấp nhận lời mời gia nhập <strong>{companyName}</strong>.
          </p>
          <div className="mt-8">
            <Button
              onClick={handleLoginRedirect}
              className="h-11 w-full rounded-lg bg-[#11a77a] text-sm font-bold hover:bg-[#0d966d]"
            >
              {t("companyInvitation.backToLogin")}
            </Button>
          </div>
        </div>
      </RecruiterAuthShell>
    );
  }

  // Case 4: User is not logged in and has NO password set (setup password flow)
  return (
    <RecruiterAuthShell basic>
      <div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900">
            {t("companyInvitation.setPasswordTitle")}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Bạn được mời gia nhập <strong>{companyName}</strong>
            {roleName ? ` với vai trò ${roleName}` : ""}.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Vui lòng thiết lập mật khẩu của bạn để kích hoạt tài khoản và chấp nhận lời mời.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={form.handleSubmit(submit)} noValidate>
          <FormInput
            id="recruiter-invitation-password"
            label={t("companyInvitation.passwordLabel")}
            className={`${authInputClassName} pr-10`}
            type={showPassword ? "text" : "password"}
            placeholder={t("companyInvitation.passwordPlaceholder")}
            autoComplete="new-password"
            {...form.register("password")}
            onBlur={(event) => resetAuthInputFocusStyle(event, form.register("password"))}
            onFocus={setAuthInputFocusStyle}
            suffix={
              <button
                type="button"
                className="upnext-focus rounded text-slate-400 hover:text-slate-700"
                aria-label={
                  showPassword ? tAuth("common.hidePassword") : tAuth("common.showPassword")
                }
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          <FormInput
            id="recruiter-invitation-confirm"
            label={t("companyInvitation.confirmLabel")}
            className={`${authInputClassName} pr-10`}
            type={showConfirm ? "text" : "password"}
            placeholder={t("companyInvitation.confirmPlaceholder")}
            autoComplete="new-password"
            {...form.register("confirm")}
            onBlur={(event) => resetAuthInputFocusStyle(event, form.register("confirm"))}
            onFocus={setAuthInputFocusStyle}
            suffix={
              <button
                type="button"
                className="upnext-focus rounded text-slate-400 hover:text-slate-700"
                aria-label={
                  showConfirm ? tAuth("common.hidePassword") : tAuth("common.showPassword")
                }
                onClick={() => setShowConfirm((value) => !value)}
              >
                {showConfirm ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          <div className="pt-2">
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="h-11 w-full rounded-lg bg-[#11a77a] text-sm font-bold hover:bg-[#0d966d]"
            >
              {form.formState.isSubmitting
                ? t("companyInvitation.submitting")
                : t("companyInvitation.submit")}
            </Button>
          </div>
        </form>
      </div>
    </RecruiterAuthShell>
  );
}
