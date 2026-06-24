"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CaretLeft, CaretRight, Eye, EyeSlash } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState, type FocusEvent } from "react";
import { useForm, type FieldErrors, type UseFormRegisterReturn } from "react-hook-form";
import Swal, { type SweetAlertIcon } from "sweetalert2";
import { z } from "zod";

import { createLoginSchema, type LoginValues } from "@/features/auth/schemas/auth-schema";
import {
  confirmRecruiterPasswordReset,
  loginRecruiter,
  registerRecruiter,
  requestRecruiterPasswordReset,
} from "@/features/recruiter/api/auth";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { FormInput } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";

import "./login-page.css";

type RecruiterRegisterValues = {
  email: string;
  password: string;
  confirm: string;
};

type ForgotPasswordValues = {
  email: string;
};

type ResetPasswordValues = {
  password: string;
  confirm: string;
};

const authInputClassName =
  "recruiter-auth-input h-11 rounded-lg border-slate-200 bg-white text-sm shadow-none placeholder:text-slate-400";

const passwordResetMessages = {
  invalidEmail: "Email không hợp lệ",
  passwordMin: "Mật khẩu tối thiểu 8 ký tự",
  passwordRequired: "Vui lòng nhập mật khẩu",
  confirmRequired: "Vui lòng nhập lại mật khẩu",
  passwordMismatch: "Mật khẩu nhập lại không khớp",
  tokenRequired: "Link đặt lại mật khẩu không hợp lệ hoặc thiếu token.",
};

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

function getAuthErrorMessage(
  error: unknown,
  context: "login" | "register" | "forgot-password" | "reset-password",
) {
  if (!(error instanceof ApiError)) {
    return "Không thể kết nối đến hệ thống. Vui lòng thử lại sau.";
  }

  if (error.status === 400) {
    return "Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.";
  }

  if (error.status === 401) {
    return context === "reset-password"
      ? "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."
      : "Email hoặc mật khẩu không đúng.";
  }

  if (error.status === 409) {
    return "Email này đã được dùng cho tài khoản nhà tuyển dụng.";
  }

  if (error.status >= 500) {
    return "Hệ thống đang gặp sự cố. Vui lòng thử lại sau ít phút.";
  }

  return "Không thể xử lý yêu cầu. Vui lòng thử lại.";
}

function getFirstErrorMessage(errors: FieldErrors): string {
  for (const error of Object.values(errors)) {
    if (!error) continue;

    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }

    if (typeof error === "object") {
      const nested: string = getFirstErrorMessage(error as FieldErrors);

      if (nested) return nested;
    }
  }

  return "Vui lòng kiểm tra lại thông tin.";
}

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

export function RecruiterLoginPage() {
  const router = useRouter();
  const t = useTranslations("Auth");
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginValues>({
    resolver: zodResolver(
      createLoginSchema({
        invalidEmail: t("validation.invalidEmail"),
        passwordRequired: t("validation.passwordRequired"),
        fullNameMin: t("validation.fullNameMin"),
        passwordMin: t("validation.passwordMin"),
        confirmRequired: t("validation.confirmRequired"),
        passwordMismatch: t("validation.passwordMismatch"),
      }),
    ),
    defaultValues: { email: "", password: "" },
  });

  async function submit(values: LoginValues) {
    try {
      const response = await loginRecruiter(values);

      localStorage.setItem("upnext.recruiter.accessToken", response.accessToken);
      localStorage.setItem("upnext.recruiter.tokenType", response.tokenType);
      localStorage.setItem("upnext.recruiter.user", JSON.stringify(response.user));
      showToast("success", "Đăng nhập thành công.");
      router.push("/recruiter");
    } catch (error) {
      showToast("error", getAuthErrorMessage(error, "login"));
    }
  }

  return (
    <RecruiterAuthShell>
      <AuthHeader title="Chào mừng bạn đã quay trở lại" />
      <SocialButtons mode="login" />
      <AuthDivider label="Hoặc đăng nhập bằng email" />

      <form
        className="mt-8 space-y-5"
        onSubmit={form.handleSubmit(submit, (errors) =>
          showToast("error", getFirstErrorMessage(errors)),
        )}
        noValidate
      >
        <EmailField inputId="recruiter-email" register={form.register("email")} />

        <PasswordField
          autoComplete="current-password"
          inputId="recruiter-password"
          label="Mật khẩu"
          placeholder="Nhập mật khẩu của bạn"
          setVisible={setShowPassword}
          visible={showPassword}
          register={form.register("password")}
          action={
            <button
              type="button"
              className="upnext-focus rounded text-xs font-bold text-emerald-700 hover:text-emerald-800"
              onClick={() => router.push("/recruiter/forgot-password")}
            >
              Quên mật khẩu?
            </button>
          }
        />

        <div className="flex items-center gap-2">
          <Checkbox
            id="remember-recruiter"
            defaultChecked
            className="size-5 rounded-[5px] border-emerald-600 data-[state=checked]:bg-emerald-600"
          />
          <Label
            htmlFor="remember-recruiter"
            className="cursor-pointer text-sm font-medium text-slate-600"
          >
            Duy trì đăng nhập
          </Label>
        </div>

        <SubmitButton pending={form.formState.isSubmitting} pendingLabel="Đang đăng nhập...">
          Đăng nhập
        </SubmitButton>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        Chưa có tài khoản?{" "}
        <button
          type="button"
          className="upnext-focus ml-1 rounded font-extrabold text-emerald-700 hover:text-emerald-800"
          onClick={() => router.push("/recruiter/register")}
        >
          Đăng ký ngay
        </button>
      </p>
    </RecruiterAuthShell>
  );
}

export function RecruiterRegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const form = useForm<RecruiterRegisterValues>({
    resolver: zodResolver(
      z
        .object({
          email: z.email(passwordResetMessages.invalidEmail),
          password: z.string().min(8, passwordResetMessages.passwordMin),
          confirm: z.string().min(1, passwordResetMessages.confirmRequired),
        })
        .refine((values) => values.password === values.confirm, {
          message: passwordResetMessages.passwordMismatch,
          path: ["confirm"],
        }),
    ),
    defaultValues: { email: "", password: "", confirm: "" },
  });

  async function submit(values: RecruiterRegisterValues) {
    try {
      const response = await registerRecruiter({
        email: values.email,
        password: values.password,
      });

      localStorage.setItem("upnext.recruiter.accessToken", response.accessToken);
      localStorage.setItem("upnext.recruiter.tokenType", response.tokenType);
      localStorage.setItem("upnext.recruiter.user", JSON.stringify(response.user));
      showToast("success", "Đăng ký thành công.");
      router.push("/recruiter");
    } catch (error) {
      showToast("error", getAuthErrorMessage(error, "register"));
    }
  }

  return (
    <RecruiterAuthShell>
      <AuthHeader title="Tạo tài khoản nhà tuyển dụng" />
      <SocialButtons mode="register" />
      <AuthDivider label="Hoặc đăng ký bằng email" />

      <form
        className="mt-8 space-y-5"
        onSubmit={form.handleSubmit(submit, (errors) =>
          showToast("error", getFirstErrorMessage(errors)),
        )}
        noValidate
      >
        <EmailField inputId="recruiter-register-email" register={form.register("email")} />

        <PasswordField
          autoComplete="new-password"
          inputId="recruiter-register-password"
          label="Mật khẩu"
          placeholder="Nhập mật khẩu của bạn"
          setVisible={setShowPassword}
          visible={showPassword}
          register={form.register("password")}
        />

        <PasswordField
          autoComplete="new-password"
          inputId="recruiter-register-confirm"
          label="Nhập lại mật khẩu"
          placeholder="Nhập lại mật khẩu của bạn"
          setVisible={setShowConfirm}
          visible={showConfirm}
          register={form.register("confirm")}
        />

        <SubmitButton pending={form.formState.isSubmitting} pendingLabel="Đang đăng ký...">
          Đăng ký
        </SubmitButton>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        Đã có tài khoản?{" "}
        <button
          type="button"
          className="upnext-focus ml-1 rounded font-extrabold text-emerald-700 hover:text-emerald-800"
          onClick={() => router.push("/recruiter/login")}
        >
          Đăng nhập
        </button>
      </p>
    </RecruiterAuthShell>
  );
}

export function RecruiterForgotPasswordPage() {
  const router = useRouter();
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(
      z.object({
        email: z.email(passwordResetMessages.invalidEmail),
      }),
    ),
    defaultValues: { email: "" },
  });

  async function submit(values: ForgotPasswordValues) {
    try {
      const response = await requestRecruiterPasswordReset(values.email);

      showToast("success", response.message);
      router.push("/recruiter/login");
    } catch (error) {
      showToast("error", getAuthErrorMessage(error, "forgot-password"));
    }
  }

  return (
    <RecruiterAuthShell>
      <AuthHeader title="Quên mật khẩu" />
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Nhập email của bạn để nhận link đặt lại mật khẩu.
      </p>
      <AuthDivider label="Khôi phục bằng email" />

      <form
        className="mt-8 space-y-5"
        onSubmit={form.handleSubmit(submit, (errors) =>
          showToast("error", getFirstErrorMessage(errors)),
        )}
        noValidate
      >
        <EmailField inputId="recruiter-forgot-email" register={form.register("email")} />

        <SubmitButton pending={form.formState.isSubmitting} pendingLabel="Đang gửi...">
          Gửi link đặt lại mật khẩu
        </SubmitButton>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        Đã nhớ mật khẩu?{" "}
        <button
          type="button"
          className="upnext-focus ml-1 rounded font-extrabold text-emerald-700 hover:text-emerald-800"
          onClick={() => router.push("/recruiter/login")}
        >
          Đăng nhập
        </button>
      </p>
    </RecruiterAuthShell>
  );
}

export function RecruiterResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(
      z
        .object({
          password: z.string().min(8, passwordResetMessages.passwordMin),
          confirm: z.string().min(1, passwordResetMessages.confirmRequired),
        })
        .refine((values) => values.password === values.confirm, {
          message: passwordResetMessages.passwordMismatch,
          path: ["confirm"],
        }),
    ),
    defaultValues: { password: "", confirm: "" },
  });

  async function submit(values: ResetPasswordValues) {
    if (!token) {
      showToast("error", passwordResetMessages.tokenRequired);
      return;
    }

    try {
      const response = await confirmRecruiterPasswordReset({
        token,
        password: values.password,
      });

      showToast("success", response.message);
      router.push("/recruiter/login");
    } catch (error) {
      showToast("error", getAuthErrorMessage(error, "reset-password"));
    }
  }

  return (
    <RecruiterAuthShell>
      <AuthHeader title="Đặt lại mật khẩu" />
      <p className="mt-4 text-sm leading-6 text-slate-500">
        Tạo mật khẩu mới cho tài khoản nhà tuyển dụng của bạn.
      </p>
      <AuthDivider label="Mật khẩu mới" />

      <form
        className="mt-8 space-y-5"
        onSubmit={form.handleSubmit(submit, (errors) =>
          showToast("error", getFirstErrorMessage(errors)),
        )}
        noValidate
      >
        <PasswordField
          autoComplete="new-password"
          inputId="recruiter-reset-password"
          label="Mật khẩu mới"
          placeholder="Nhập mật khẩu mới"
          setVisible={setShowPassword}
          visible={showPassword}
          register={form.register("password")}
        />

        <PasswordField
          autoComplete="new-password"
          inputId="recruiter-reset-confirm"
          label="Nhập lại mật khẩu"
          placeholder="Nhập lại mật khẩu mới"
          setVisible={setShowConfirm}
          visible={showConfirm}
          register={form.register("confirm")}
        />

        <SubmitButton pending={form.formState.isSubmitting} pendingLabel="Đang đặt lại...">
          Đặt lại mật khẩu
        </SubmitButton>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        Quay lại{" "}
        <button
          type="button"
          className="upnext-focus ml-1 rounded font-extrabold text-emerald-700 hover:text-emerald-800"
          onClick={() => router.push("/recruiter/login")}
        >
          đăng nhập
        </button>
      </p>
    </RecruiterAuthShell>
  );
}

function RecruiterAuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="text-foreground relative grid min-h-screen place-items-center overflow-hidden bg-[linear-gradient(180deg,#003b3b_0%,#006347_52%,#15915d_100%)] px-4 py-10 [font-family:var(--font-sans)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 h-[520px] w-[420px] -translate-x-24 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0)_58%)] [clip-path:polygon(0_0,55%_0,100%_38%,54%_75%,0_18%)]" />
        <div className="absolute top-[170px] left-10 h-[410px] w-[220px] border border-white/10 bg-white/5 [clip-path:polygon(0_0,64%_50%,0_100%,24%_100%,88%_50%,24%_0)]" />
        <div className="absolute right-0 bottom-8 h-[470px] w-[340px] translate-x-16 rotate-180 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0)_62%)] [clip-path:polygon(0_0,55%_0,100%_38%,54%_75%,0_18%)]" />
        <div className="absolute right-8 bottom-[210px] h-[360px] w-[190px] rotate-180 border border-white/10 bg-white/5 [clip-path:polygon(0_0,64%_50%,0_100%,24%_100%,88%_50%,24%_0)]" />
      </div>

      <Card className="relative z-10 grid w-full max-w-[1152px] overflow-hidden rounded-xl border-0 bg-white shadow-[0_28px_90px_rgba(0,28,22,0.28)] lg:grid-cols-2">
        <section className="px-6 py-8 sm:px-12 sm:py-12">{children}</section>
        <ShowcasePanel />
      </Card>
    </main>
  );
}

function AuthHeader({ title }: { title: string }) {
  const router = useRouter();
  const t = useTranslations("Auth");

  return (
    <>
      <button
        type="button"
        className="upnext-focus inline-flex rounded-md"
        onClick={() => router.push("/")}
        aria-label={t("common.homeLabel")}
      >
        <Image
          alt="UpNext"
          src="/upnext-logo/wordmark-cropped.png"
          width={136}
          height={33}
          priority
        />
      </button>

      <h1 className="mt-6 text-xl font-bold tracking-tight sm:mt-8 sm:text-2xl">{title}</h1>
    </>
  );
}

function SocialButtons({ mode }: { mode: "login" | "register" }) {
  const label =
    mode === "login" ? "Đăng nhập với tài khoản Google" : "Đăng ký với tài khoản Google";

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-1">
      <Button
        variant="outline"
        className="h-12 rounded-lg border-slate-200 text-slate-700 shadow-none hover:border-slate-300 hover:text-slate-950"
      >
        <Image src="/assets/google.png" alt="" width={22} height={22} />
        {label}
      </Button>
    </div>
  );
}

function AuthDivider({ label }: { label: string }) {
  return (
    <div className="mt-8 flex items-center gap-3">
      <Separator className="flex-1 bg-slate-200" />
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <Separator className="flex-1 bg-slate-200" />
    </div>
  );
}

function EmailField({ inputId, register }: { inputId: string; register: UseFormRegisterReturn }) {
  return (
    <FormInput
      id={inputId}
      label="Địa chỉ Email"
      className={authInputClassName}
      type="email"
      placeholder="Nhập email của bạn"
      autoComplete="email"
      {...register}
      onBlur={(event) => resetAuthInputFocusStyle(event, register)}
      onFocus={setAuthInputFocusStyle}
    />
  );
}

function PasswordField({
  action,
  autoComplete,
  inputId,
  label,
  placeholder,
  register,
  setVisible,
  visible,
}: {
  action?: React.ReactNode;
  autoComplete: "current-password" | "new-password";
  inputId: string;
  label: string;
  placeholder: string;
  register: UseFormRegisterReturn;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  visible: boolean;
}) {
  const t = useTranslations("Auth");

  return (
    <FormInput
      id={inputId}
      label={label}
      action={action}
      className={`${authInputClassName} pr-10`}
      type={visible ? "text" : "password"}
      placeholder={placeholder}
      autoComplete={autoComplete}
      {...register}
      onBlur={(event) => resetAuthInputFocusStyle(event, register)}
      onFocus={setAuthInputFocusStyle}
      suffix={
        <button
          type="button"
          className="upnext-focus rounded text-slate-400 hover:text-slate-700"
          aria-label={visible ? t("common.hidePassword") : t("common.showPassword")}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeSlash size={18} /> : <Eye size={18} />}
        </button>
      }
    />
  );
}

function SubmitButton({
  children,
  pending,
  pendingLabel,
}: {
  children: React.ReactNode;
  pending: boolean;
  pendingLabel: string;
}) {
  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-11 w-full rounded-lg bg-[#11a77a] text-sm font-extrabold hover:bg-[#0d966d]"
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}

function ShowcasePanel() {
  return (
    <section className="hidden bg-[#f8f7fc] px-10 py-12 lg:flex lg:flex-col lg:items-center lg:justify-center">
      <div className="relative h-[270px] w-full max-w-[390px] overflow-hidden rounded-2xl">
        <Image
          src="/login/showcase.png"
          alt=""
          fill
          className="scale-[1.8] object-cover object-[72%_42%]"
          sizes="390px"
          priority
        />
      </div>

      <div className="mt-12 grid w-full grid-cols-[42px_1fr_42px] items-center gap-5">
        <Button
          variant="outline"
          size="icon"
          className="size-9 rounded-full border-emerald-100 bg-white/70 text-emerald-200 shadow-none"
          aria-label="Nội dung trước"
        >
          <CaretLeft size={17} />
        </Button>
        <div className="text-center">
          <h2 className="text-xl font-extrabold text-slate-950">Biểu đồ 3D phong phú</h2>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            Phân tích dữ liệu trực quan giúp nhà tuyển dụng dễ dàng theo dõi hiệu quả các chiến dịch
            tuyển dụng.
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="size-9 rounded-full border-emerald-600 bg-white text-emerald-600 shadow-none"
          aria-label="Nội dung tiếp theo"
        >
          <CaretRight size={17} />
        </Button>
      </div>

      <Button className="mt-10 h-9 rounded-lg bg-[#11a77a] px-5 text-xs font-extrabold shadow-none hover:bg-[#0d966d]">
        Tìm hiểu thêm
      </Button>
    </section>
  );
}
