"use client";

import {
  CircleNotch,
  BellRinging,
  EnvelopeSimple,
  DeviceMobile,
  ChatCircleDots,
  UserCheck,
  Sparkle,
  CalendarCheck,
  MoonStars,
  CheckCircle,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";

import {
  changePassword,
  getRecruiterAccount,
  createRecruiterProfile,
  updateRecruiterProfile,
  uploadFile,
  type UpdateRecruiterProfilePayload,
  type CreateRecruiterProfilePayload,
} from "@/features/recruiter/api/onboarding";
import { clearRecruiterSession, getRecruiterSession } from "@/features/recruiter/session";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { FormInput } from "@/shared/ui/input";

import { RecruiterTableLayout } from "./recruiter-table-layout";

function AccountIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0"></path>
        <path d="M9 10a3 3 0 1 0 6 0a3 3 0 1 0-6 0m-2.832 8.849A4 4 0 0 1 10 16h4a4 4 0 0 1 3.834 2.855"></path>
      </g>
    </svg>
  );
}

function NotificationIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3H4a4 4 0 0 0 2-3v-3a7 7 0 0 1 4-6M9 17v1a3 3 0 0 0 6 0v-1"
      ></path>
    </svg>
  );
}

function BillsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zm4 2h10M7 12h10M7 16h10"
      ></path>
    </svg>
  );
}

function SecurityIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <path d="M5 13a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"></path>
        <path d="M11 16a1 1 0 1 0 2 0a1 1 0 0 0-2 0m-3-5V7a4 4 0 1 1 8 0v4"></path>
      </g>
    </svg>
  );
}

const INVOICES = [
  {
    id: "INV-84920",
    date: "24/06/2026",
    plan: "Recruiter Pro (1 Tháng)",
    amount: 1200000,
    status: "success",
  },
  {
    id: "INV-83021",
    date: "24/05/2026",
    plan: "Recruiter Pro (1 Tháng)",
    amount: 1200000,
    status: "success",
  },
];

function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  id,
  label,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
  id?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-label={label}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
        checked ? "bg-emerald-600" : "bg-slate-200 dark:bg-slate-700",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

export function RecruiterSettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"account" | "notification" | "bills" | "security">(
    "account",
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [token, setToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [profileId, setProfileId] = useState("");

  // Account State
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "">("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notification tab state
  const [notifJobs, setNotifJobs] = useState(true);
  const [notifInterviews, setNotifInterviews] = useState(true);
  const [notifSecurity, setNotifSecurity] = useState(true);
  const [notifAiMatch, setNotifAiMatch] = useState(true);
  const [notifTeam, setNotifTeam] = useState(true);
  const [notifWeekly, setNotifWeekly] = useState(true);
  const [channelEmail, setChannelEmail] = useState(true);
  const [channelPush, setChannelPush] = useState(true);
  const [channelSms, setChannelSms] = useState(false);
  const [quietHours, setQuietHours] = useState(true);

  // Security tab state
  const [tfaEnabled, setTfaEnabled] = useState(false);

  const fetchDetails = useCallback(
    async (id: string, accessToken: string) => {
      try {
        setLoading(true);
        const accountData = await getRecruiterAccount(id, accessToken);

        if (accountData) {
          setEmail(accountData.email);
          if (accountData.profile) {
            setProfileId(accountData.profile.id);
            setFullName(accountData.profile.fullName || "");
            setGender(accountData.profile.gender || "");
            setPhoneNumber(accountData.profile.phoneNumber || "");
            setAvatarUrl(accountData.profile.avatarUrl || "");
          }
        }
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          clearRecruiterSession();
          router.replace("/recruiter/login");
        } else {
          void Swal.fire({
            icon: "error",
            title: "Lỗi tải thông tin",
            text: "Không thể lấy thông tin tài khoản từ hệ thống.",
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    const session = getRecruiterSession();

    if (!session) {
      router.replace("/recruiter/login");
      return;
    }

    setToken(session.accessToken);
    setAccountId(session.user.id);
    void fetchDetails(session.user.id, session.accessToken);
  }, [fetchDetails, router]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
      void Swal.fire({
        icon: "error",
        title: "Dung lượng file quá lớn",
        text: "Kích thước ảnh tối đa cho phép là 800KB.",
      });
      return;
    }

    try {
      setUploading(true);
      const res = await uploadFile(file, "AVATAR", "PUBLIC", token);
      setAvatarUrl(res.file.publicUrl);
      void Swal.fire({
        icon: "success",
        title: "Tải ảnh lên thành công!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch {
      void Swal.fire({
        icon: "error",
        title: "Lỗi tải ảnh lên",
        text: "Không thể tải ảnh lên vào lúc này.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarReset = () => {
    setAvatarUrl("");
  };

  const handleCancel = () => {
    // Reload original state from backend
    void fetchDetails(accountId, token);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    void Swal.fire({
      icon: "info",
      title: "Đã hủy các thay đổi",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 2000,
    });
  };

  const handleSave = async () => {
    // Validations
    if (!fullName.trim()) {
      void Swal.fire({
        icon: "error",
        title: "Lỗi dữ liệu",
        text: "Họ và tên không được để trống",
      });
      return;
    }

    // Check if password fields are partially filled
    const hasPasswordInput = currentPassword || newPassword || confirmPassword;
    if (hasPasswordInput) {
      if (!currentPassword) {
        void Swal.fire({
          icon: "error",
          title: "Lỗi dữ liệu",
          text: "Vui lòng nhập mật khẩu hiện tại để thay đổi mật khẩu",
        });
        return;
      }
      if (newPassword.length < 6) {
        void Swal.fire({
          icon: "error",
          title: "Lỗi dữ liệu",
          text: "Mật khẩu mới phải có ít nhất 6 ký tự",
        });
        return;
      }
      if (newPassword !== confirmPassword) {
        void Swal.fire({
          icon: "error",
          title: "Lỗi dữ liệu",
          text: "Xác nhận mật khẩu mới không khớp",
        });
        return;
      }
    }

    try {
      setSaving(true);

      // 1. Save Profile Details
      if (profileId) {
        const profilePayload: UpdateRecruiterProfilePayload = { fullName: fullName.trim() };
        if (gender) profilePayload.gender = gender;
        if (phoneNumber.trim()) profilePayload.phoneNumber = phoneNumber.trim();
        profilePayload.avatarUrl = avatarUrl || null;
        await updateRecruiterProfile(profileId, profilePayload, token);
      } else {
        const profilePayload: CreateRecruiterProfilePayload = {
          recruiterAccountId: accountId,
          fullName: fullName.trim(),
          gender: gender ? (gender as "MALE" | "FEMALE") : undefined,
          phoneNumber: phoneNumber.trim() ? phoneNumber.trim() : undefined,
          avatarUrl: avatarUrl || undefined,
        };
        await createRecruiterProfile(profilePayload, token);
      }

      // 3. Save Password if requested
      if (hasPasswordInput) {
        await changePassword(
          accountId,
          {
            currentPassword,
            newPassword,
          },
          token,
        );
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }

      void Swal.fire({
        icon: "success",
        title: "Cập nhật thông tin thành công!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2500,
      });

      // Reload
      void fetchDetails(accountId, token);
    } catch (err: unknown) {
      let msg = "Không thể lưu thay đổi vào lúc này.";
      if (err instanceof ApiError) {
        if (err.status === 400) {
          msg = "Dữ liệu nhập vào không hợp lệ hoặc mật khẩu hiện tại sai.";
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      void Swal.fire({
        icon: "error",
        title: "Lỗi cập nhật",
        text: msg,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-sm font-bold text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <CircleNotch className="h-8 w-8 animate-spin text-emerald-600" />
          <span>Đang tải thông tin cài đặt...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="upnext-shadow border-0 bg-white p-7 px-0 py-0 text-slate-900 dark:bg-slate-900 dark:text-slate-100"
      style={{ borderRadius: "7px" }}
    >
      <div dir="ltr" className="w-full">
        {/* Tabs Bar */}
        <div
          role="tablist"
          className="-mb-px flex w-full flex-wrap justify-start border-b border-slate-200 text-center dark:border-slate-800"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "account"}
            className={`flex items-center justify-center gap-2 border-b-2 p-4 text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === "account"
                ? "border-emerald-600 font-semibold text-emerald-600"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
            onClick={() => setActiveTab("account")}
          >
            <AccountIcon />
            Cài đặt tài khoản
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "notification"}
            className={`flex items-center justify-center gap-2 border-b-2 p-4 text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === "notification"
                ? "border-emerald-600 font-semibold text-emerald-600"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
            onClick={() => setActiveTab("notification")}
          >
            <NotificationIcon />
            Thông báo
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "bills"}
            className={`flex items-center justify-center gap-2 border-b-2 p-4 text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === "bills"
                ? "border-emerald-600 font-semibold text-emerald-600"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
            onClick={() => setActiveTab("bills")}
          >
            <BillsIcon />
            Gói dịch vụ & Hóa đơn
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "security"}
            className={`flex items-center justify-center gap-2 border-b-2 p-4 text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === "security"
                ? "border-emerald-600 font-semibold text-emerald-600"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
            onClick={() => setActiveTab("security")}
          >
            <SecurityIcon />
            Bảo mật
          </button>
        </div>

        {/* Tab Panel: Account */}
        {activeTab === "account" && (
          <div className="mt-2 border-none p-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Change Profile Card */}
              <div className="col-span-12 md:col-span-6">
                <div className="rounded-xl border border-slate-100 bg-white p-7 text-slate-900">
                  <h5 className="mb-1 text-base font-bold text-slate-800 dark:text-white">
                    Ảnh đại diện
                  </h5>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Thay đổi ảnh đại diện tài khoản của bạn tại đây
                  </p>

                  <div className="mx-auto mt-5 text-center">
                    <div className="group relative mx-auto size-[120px]">
                      {avatarUrl ? (
                        <Image
                          alt="avatar"
                          className="mx-auto h-[120px] w-[120px] rounded-full border border-slate-100 object-cover"
                          src={avatarUrl}
                          width={120}
                          height={120}
                          unoptimized
                        />
                      ) : (
                        <div className="mx-auto flex h-[120px] w-[120px] items-center justify-center rounded-full border border-slate-100 bg-emerald-50 text-3xl font-bold text-emerald-600 dark:border-slate-800 dark:bg-emerald-950/30">
                          {fullName
                            ? fullName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()
                            : "HR"}
                        </div>
                      )}
                      {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                          <CircleNotch className="h-6 w-6 animate-spin text-white" />
                        </div>
                      )}
                    </div>

                    <input
                      type="file"
                      aria-label="Upload avatar"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.gif"
                      onChange={handleAvatarUpload}
                    />

                    <div className="flex justify-center gap-3 py-6">
                      <button
                        type="button"
                        onClick={handleAvatarClick}
                        disabled={uploading}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={handleAvatarReset}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-50 px-4 py-2 text-sm font-semibold whitespace-nowrap text-red-600 transition-colors hover:bg-red-100"
                      >
                        Xóa ảnh
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Hỗ trợ JPG, GIF hoặc PNG. Dung lượng tối đa 800KB
                    </p>
                  </div>
                </div>
              </div>

              {/* Change Password Card */}
              <div className="col-span-12 md:col-span-6">
                <div className="rounded-xl border border-slate-100 bg-white p-7 text-slate-900">
                  <h5 className="mb-1 text-base font-bold text-slate-800 dark:text-white">
                    Đổi mật khẩu
                  </h5>
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                    Nhập mật khẩu hiện tại và mật khẩu mới để thay đổi
                  </p>

                  <div className="mt-5 flex flex-col gap-4">
                    <FormInput
                      id="cpwd"
                      label="Mật khẩu hiện tại"
                      labelClassName="text-xs font-bold text-slate-600 dark:text-slate-300"
                      className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus:border-emerald-600 focus:outline-none focus-visible:border-emerald-600 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-950"
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <FormInput
                      id="npwd"
                      label="Mật khẩu mới"
                      labelClassName="text-xs font-bold text-slate-600 dark:text-slate-300"
                      className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus:border-emerald-600 focus:outline-none focus-visible:border-emerald-600 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-950"
                      type="password"
                      placeholder="Có ít nhất 6 ký tự"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <FormInput
                      id="cfpwd"
                      label="Xác nhận mật khẩu mới"
                      labelClassName="text-xs font-bold text-slate-600 dark:text-slate-300"
                      className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus:border-emerald-600 focus:outline-none focus-visible:border-emerald-600 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-950"
                      type="password"
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Personal Details Card */}
              <div className="col-span-12">
                <div className="rounded-xl border border-slate-100 bg-white p-7 text-slate-900">
                  <h5 className="mb-1 text-base font-bold text-slate-800 dark:text-white">
                    Thông tin cá nhân
                  </h5>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Chỉnh sửa thông tin liên hệ và tùy chỉnh hiển thị cá nhân của bạn
                  </p>

                  <div className="mt-4 grid grid-cols-12 gap-6">
                    {/* Left Details Grid */}
                    <div className="col-span-12 space-y-4 md:col-span-6">
                      <FormInput
                        id="ynm"
                        label="Họ và tên"
                        labelClassName="text-xs font-bold text-slate-600 dark:text-slate-300"
                        className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-950"
                        placeholder="Họ và tên"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />

                      <div>
                        <span className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
                          Giới tính
                        </span>
                        <div className="grid h-10 w-full grid-cols-2 gap-3">
                          <button
                            type="button"
                            className={`flex items-center justify-center rounded-lg border text-sm font-medium transition-all ${
                              gender === "MALE"
                                ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20"
                                : "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                            }`}
                            onClick={() => setGender("MALE")}
                          >
                            Nam
                          </button>
                          <button
                            type="button"
                            className={`flex items-center justify-center rounded-lg border text-sm font-medium transition-all ${
                              gender === "FEMALE"
                                ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20"
                                : "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                            }`}
                            onClick={() => setGender("FEMALE")}
                          >
                            Nữ
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Details Grid */}
                    <div className="col-span-12 space-y-4 md:col-span-6">
                      <FormInput
                        id="em"
                        label="Email tài khoản"
                        labelClassName="dark:text-slate-355 text-xs font-bold text-slate-600"
                        className="flex h-10 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-500"
                        placeholder="Email đăng nhập"
                        type="email"
                        value={email}
                        disabled
                      />

                      <FormInput
                        id="ph"
                        label="Số điện thoại cá nhân"
                        labelClassName="text-xs font-bold text-slate-600 dark:text-slate-300"
                        className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-950"
                        placeholder="Số điện thoại liên hệ"
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save / Cancel buttons */}
              <div className="col-span-12 mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-600 px-6 py-2 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving && <CircleNotch className="h-4 w-4 animate-spin" />}
                  Lưu thay đổi
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-50 px-6 py-2 text-sm font-semibold whitespace-nowrap text-red-600 transition-colors hover:bg-red-100"
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Panel: Notification */}
        {activeTab === "notification" && (
          <div className="mt-2 border-none p-6">
            <div className="space-y-6">
              {/* Hero Header Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 text-white shadow-lg">
                <div className="pointer-events-none absolute -top-10 -right-10 size-48 rounded-full bg-emerald-500/10 blur-3xl" />
                <div className="pointer-events-none absolute right-20 -bottom-10 size-40 rounded-full bg-teal-500/10 blur-2xl" />

                <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
                      <BellRinging size={26} weight="duotone" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-white">
                          Trung tâm cài đặt thông báo
                        </h4>
                        <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-500/30">
                          Real-time Active
                        </span>
                      </div>
                      <p className="mt-1 max-w-xl text-xs leading-relaxed font-medium text-slate-300">
                        Tùy chỉnh kênh thông báo, tần suất gửi và loại tin nhắn bạn muốn cập nhật để
                        giữ kết nối tức thì với ứng viên mà không bị làm phiền.
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 rounded-xl bg-white/10 p-1.5 backdrop-blur-md">
                    <button
                      type="button"
                      onClick={() => {
                        setNotifJobs(true);
                        setNotifInterviews(true);
                        setNotifAiMatch(true);
                        setNotifTeam(true);
                        setNotifWeekly(true);
                      }}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
                    >
                      Bật tất cả
                    </button>
                    <span className="h-4 w-px bg-white/20" />
                    <button
                      type="button"
                      onClick={() => {
                        setNotifJobs(false);
                        setNotifInterviews(false);
                        setNotifAiMatch(false);
                        setNotifTeam(false);
                        setNotifWeekly(false);
                      }}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/15 hover:text-white"
                    >
                      Tắt tất cả
                    </button>
                  </div>
                </div>
              </div>

              {/* Master Delivery Channels */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      Kênh nhận thông báo chính
                    </h5>
                    <p className="text-xs text-slate-400">
                      Bật/Tắt đồng loạt kênh liên lạc ưa thích của bạn
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {/* Email Channel */}
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-4 transition-all",
                      channelEmail
                        ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                        : "border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-9 items-center justify-center rounded-lg text-emerald-600 dark:text-emerald-400",
                          channelEmail
                            ? "bg-emerald-100 dark:bg-emerald-900/40"
                            : "bg-slate-200/60 dark:bg-slate-800",
                        )}
                      >
                        <EnvelopeSimple size={20} weight="bold" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Email cá nhân
                        </p>
                        <p className="text-[11px] text-slate-400">{email || "Hộp thư recruiter"}</p>
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={channelEmail}
                      onChange={setChannelEmail}
                      label="Email cá nhân"
                    />
                  </div>

                  {/* Web Push Channel */}
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-4 transition-all",
                      channelPush
                        ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                        : "border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-9 items-center justify-center rounded-lg text-emerald-600 dark:text-emerald-400",
                          channelPush
                            ? "bg-emerald-100 dark:bg-emerald-900/40"
                            : "bg-slate-200/60 dark:bg-slate-800",
                        )}
                      >
                        <DeviceMobile size={20} weight="bold" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Trình duyệt & Web Push
                        </p>
                        <p className="text-[11px] text-slate-400">Cảnh báo thả xuống tức thì</p>
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={channelPush}
                      onChange={setChannelPush}
                      label="Trình duyệt & Web Push"
                    />
                  </div>

                  {/* SMS Channel */}
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-4 transition-all",
                      channelSms
                        ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                        : "border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-9 items-center justify-center rounded-lg text-emerald-600 dark:text-emerald-400",
                          channelSms
                            ? "bg-emerald-100 dark:bg-emerald-900/40"
                            : "bg-slate-200/60 dark:bg-slate-800",
                        )}
                      >
                        <ChatCircleDots size={20} weight="bold" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Tin nhắn SMS quan trọng
                        </p>
                        <p className="text-[11px] text-slate-400">Dành cho việc gấp & lịch hẹn</p>
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={channelSms}
                      onChange={setChannelSms}
                      label="Tin nhắn SMS quan trọng"
                    />
                  </div>
                </div>
              </div>

              {/* Main Notification Settings Categories */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Category 1: Recruitment & Applicants */}
                <div className="lg:col-span-6">
                  <div className="h-full rounded-2xl border border-slate-100 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                        <UserCheck size={20} weight="bold" />
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          Ứng tuyển & Gợi ý ứng viên
                        </h5>
                        <p className="text-[11px] text-slate-400">
                          Theo dõi dòng chảy hồ sơ và gợi ý từ thuật toán
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800/60">
                      {/* Item 1 */}
                      <div className="flex items-start justify-between gap-4 pt-4 first:pt-0">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <label
                              htmlFor="notif_jobs_toggle"
                              className="cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200"
                            >
                              Ứng tuyển mới
                            </label>
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                              Email + Web
                            </span>
                          </div>
                          <p className="text-[11px] leading-normal text-slate-400">
                            Gửi thông báo tức thì khi có ứng viên nộp hồ sơ CV mới vào các tin đăng
                            tuyển của bạn.
                          </p>
                        </div>
                        <ToggleSwitch
                          id="notif_jobs_toggle"
                          checked={notifJobs}
                          onChange={setNotifJobs}
                        />
                      </div>

                      {/* Item 2 */}
                      <div className="flex items-start justify-between gap-4 pt-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <label
                              htmlFor="notif_aimatch_toggle"
                              className="cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200"
                            >
                              Đề xuất AI (Daily Matcher)
                            </label>
                            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                              <Sparkle size={10} weight="fill" /> AI Suggested
                            </span>
                          </div>
                          <p className="text-[11px] leading-normal text-slate-400">
                            Nhận danh sách 5-10 ứng viên có chỉ số matching cao nhất mỗi 8:00 sáng.
                          </p>
                        </div>
                        <ToggleSwitch
                          id="notif_aimatch_toggle"
                          checked={notifAiMatch}
                          onChange={setNotifAiMatch}
                        />
                      </div>

                      {/* Item 3 */}
                      <div className="flex items-start justify-between gap-4 pt-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <label
                              htmlFor="notif_team_toggle"
                              className="cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200"
                            >
                              Tương tác từ ứng viên
                            </label>
                          </div>
                          <p className="text-[11px] leading-normal text-slate-400">
                            Cập nhật khi ứng viên đồng ý phỏng vấn, phản hồi thư mời hoặc gửi tin
                            nhắn trao đổi.
                          </p>
                        </div>
                        <ToggleSwitch
                          id="notif_team_toggle"
                          checked={notifTeam}
                          onChange={setNotifTeam}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category 2: Interviews & System Alerts */}
                <div className="lg:col-span-6">
                  <div className="h-full rounded-2xl border border-slate-100 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
                        <CalendarCheck size={20} weight="bold" />
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          Lịch phỏng vấn & Báo cáo
                        </h5>
                        <p className="text-[11px] text-slate-400">
                          Nhắc nhở công việc và báo cáo tổng hợp
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800/60">
                      {/* Item 1 */}
                      <div className="flex items-start justify-between gap-4 pt-4 first:pt-0">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <label
                              htmlFor="notif_interviews_toggle"
                              className="cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200"
                            >
                              Nhắc lịch phỏng vấn trước 30 phút
                            </label>
                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                              Ưu tiên cao
                            </span>
                          </div>
                          <p className="text-[11px] leading-normal text-slate-400">
                            Tự động đẩy thông báo nhắc nhở tới thiết bị trước khi bắt đầu phỏng vấn
                            trực tuyến/trực tiếp.
                          </p>
                        </div>
                        <ToggleSwitch
                          id="notif_interviews_toggle"
                          checked={notifInterviews}
                          onChange={setNotifInterviews}
                        />
                      </div>

                      {/* Item 2 */}
                      <div className="flex items-start justify-between gap-4 pt-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <label
                              htmlFor="notif_weekly_toggle"
                              className="cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200"
                            >
                              Báo cáo tổng hợp hiệu suất tuần (Weekly Digest)
                            </label>
                          </div>
                          <p className="text-[11px] leading-normal text-slate-400">
                            Gửi email thống kê số lượng bài đăng, lượt nộp CV và chỉ số chuyển đổi
                            ứng viên mỗi thứ Hai.
                          </p>
                        </div>
                        <ToggleSwitch
                          id="notif_weekly_toggle"
                          checked={notifWeekly}
                          onChange={setNotifWeekly}
                        />
                      </div>

                      {/* Item 3 (Security - Mandatory) */}
                      <div className="flex items-start justify-between gap-4 pt-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <label
                              htmlFor="notif_security_toggle"
                              className="cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200"
                            >
                              Cảnh báo bảo mật & Đăng nhập mới
                            </label>
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-950/40 dark:text-red-300">
                              Bắt buộc
                            </span>
                          </div>
                          <p className="text-[11px] leading-normal text-slate-400">
                            Thông báo bảo mật khi phát hiện đăng nhập từ IP lạ hoặc thay đổi mật
                            khẩu tài khoản.
                          </p>
                        </div>
                        <ToggleSwitch
                          id="notif_security_toggle"
                          checked={notifSecurity}
                          onChange={setNotifSecurity}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quiet Hours & Do Not Disturb Setting Card */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400">
                      <MoonStars size={22} weight="bold" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Khung giờ yên tĩnh (Quiet Hours)
                      </h5>
                      <p className="text-xs text-slate-400">
                        Tự động tạm hoãn thông báo đẩy ngoài giờ làm việc (19:00 - 07:30 ngày làm
                        việc & cả ngày Thứ 7, CN)
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={quietHours}
                    onChange={setQuietHours}
                    label="Khung giờ yên tĩnh"
                  />
                </div>
              </div>

              {/* Action Footer */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <span className="text-xs text-slate-400">
                  Mọi thay đổi thông báo sẽ có hiệu lực ngay lập tức sau khi lưu
                </span>
                <button
                  type="button"
                  onClick={() => {
                    void Swal.fire({
                      icon: "success",
                      title: "Cập nhật cài đặt thông báo thành công!",
                      text: "Tùy chọn thông báo mới của bạn đã được ghi nhận.",
                      toast: true,
                      position: "top-end",
                      showConfirmButton: false,
                      timer: 2500,
                    });
                  }}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                >
                  <CheckCircle size={18} weight="bold" />
                  <span>Lưu thiết lập thông báo</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Panel: Bills */}
        {activeTab === "bills" && (
          <div className="mt-2 border-none p-6">
            <div className="rounded-xl border border-slate-100 bg-white p-7">
              <h5 className="mb-1 text-base font-bold text-slate-800">Gói dịch vụ tuyển dụng</h5>
              <p className="mb-6 text-xs text-slate-400">
                Theo dõi thông tin gói dịch vụ hiện tại và lịch sử thanh toán
              </p>

              {/* Package Card */}
              <div className="mb-8 flex flex-col gap-4 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-800/40 dark:bg-emerald-950/10">
                <div>
                  <h4 className="text-md font-bold text-slate-800 dark:text-slate-100">
                    UpNext Recruiter Pro Plan
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Gói không giới hạn bài đăng & tiếp cận 5.000 hồ sơ ứng viên/tháng
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Gia hạn tiếp theo</p>
                  <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">
                    24 tháng 12, 2026
                  </p>
                </div>
              </div>

              {/* Invoices Table */}
              <h6 className="mb-3 text-sm font-bold text-slate-800 dark:text-white">
                Lịch sử giao dịch
              </h6>
              <RecruiterTableLayout loading={false}>
                <thead>
                  <tr className="dark:border-slate-850 border-b border-slate-100 font-bold text-slate-400">
                    <th className="border-slate-250 border-r px-4 py-3 dark:border-slate-700">
                      Mã giao dịch
                    </th>
                    <th className="border-slate-250 border-r px-4 py-3 dark:border-slate-700">
                      Ngày giao dịch
                    </th>
                    <th className="border-slate-250 border-r px-4 py-3 dark:border-slate-700">
                      Gói dịch vụ
                    </th>
                    <th className="border-slate-250 border-r px-4 py-3 dark:border-slate-700">
                      Số tiền
                    </th>
                    <th className="px-4 py-3 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {INVOICES.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-slate-50 transition even:bg-slate-50/50 hover:bg-slate-50/50 dark:border-slate-900 dark:even:bg-slate-900/30 dark:hover:bg-slate-950/50"
                    >
                      <td className="px-4 py-3 font-mono font-medium text-slate-600 dark:text-slate-300">
                        {invoice.id}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{invoice.date}</td>
                      <td className="px-4 py-3 font-semibold">{invoice.plan}</td>
                      <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(invoice.amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge tone={invoice.status === "success" ? "success" : "neutral"}>
                          {invoice.status === "success" ? "Thành công" : "Thất bại"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </RecruiterTableLayout>
            </div>
          </div>
        )}

        {/* Tab Panel: Security */}
        {activeTab === "security" && (
          <div className="mt-2 border-none p-6">
            <div className="max-w-2xl rounded-xl border border-slate-100 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h5 className="mb-1 text-base font-bold text-slate-800 dark:text-white">
                Cài đặt bảo mật
              </h5>
              <p className="mb-6 text-xs text-slate-400 dark:text-slate-500">
                Tăng cường lớp bảo vệ và quản lý lịch sử đăng nhập
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-950/30">
                  <input
                    type="checkbox"
                    id="tfa_check"
                    aria-label="Two-factor authentication"
                    className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    checked={tfaEnabled}
                    onChange={(e) => setTfaEnabled(e.target.checked)}
                  />
                  <div>
                    <label
                      htmlFor="tfa_check"
                      className="text-sm font-bold text-slate-700 dark:text-slate-200"
                    >
                      Xác thực 2 yếu tố (2FA)
                    </label>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Yêu cầu nhập mã xác minh được gửi qua điện thoại hoặc ứng dụng Authenticator
                      khi đăng nhập.
                    </p>
                  </div>
                </div>

                <div>
                  <h6 className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                    Thiết bị đang hoạt động
                  </h6>
                  <div className="space-y-3">
                    <div className="dark:border-slate-850 flex items-center justify-between rounded-lg border border-slate-100 p-3 text-xs">
                      <div>
                        <p className="font-bold text-slate-700 dark:text-slate-200">
                          Chrome trên Windows 11 (Thiết bị này)
                        </p>
                        <p className="mt-0.5 text-slate-400">
                          Địa chỉ IP: 113.161.42.12 — Hoạt động lần cuối: Vừa xong
                        </p>
                      </div>
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        ĐANG HOẠT ĐỘNG
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    void Swal.fire({
                      icon: "success",
                      title: "Đã lưu thiết lập bảo mật!",
                      toast: true,
                      position: "top-end",
                      showConfirmButton: false,
                      timer: 2000,
                    });
                  }}
                  className="h-10 rounded-md bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Lưu thiết lập
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
