"use client";

import { CircleNotch } from "@phosphor-icons/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";

import {
  getRecruiterAccount,
  getCompany,
  updateRecruiterProfile,
  updateCompany,
  changePassword,
  uploadFile,
} from "@/features/recruiter/api/onboarding";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";

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
  const [companyId, setCompanyId] = useState("");

  // Account State
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "">("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Company State
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyTaxCode, setCompanyTaxCode] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notification tab state
  const [notifJobs, setNotifJobs] = useState(true);
  const [notifInterviews, setNotifInterviews] = useState(true);
  const [notifSecurity, setNotifSecurity] = useState(false);

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
          if (accountData.company) {
            setCompanyId(accountData.company.id);
            // Fetch full company details to get address and other attributes
            try {
              const companyDetails = await getCompany(accountData.company.id, accessToken);
              if (companyDetails) {
                setCompanyName(companyDetails.name || "");
                setCompanyAddress(companyDetails.address || "");
                setCompanyTaxCode(companyDetails.taxCode || "");
                setCompanyEmail(companyDetails.email || "");
                setCompanyPhone(companyDetails.phone || "");
                setCompanyWebsite(companyDetails.website || "");
                setCompanySize(companyDetails.companySize || "");
                setCompanyDescription(companyDetails.description || "");
              }
            } catch {
              setCompanyName(accountData.company.name || "");
            }
          }
        }
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          localStorage.removeItem("upnext.recruiter.accessToken");
          localStorage.removeItem("upnext.recruiter.tokenType");
          localStorage.removeItem("upnext.recruiter.user");
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
    const accessToken = localStorage.getItem("upnext.recruiter.accessToken");
    const rawUser = localStorage.getItem("upnext.recruiter.user");

    if (!accessToken || !rawUser) {
      router.replace("/recruiter/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(rawUser);
      setToken(accessToken);
      setAccountId(parsedUser.id);
      void fetchDetails(parsedUser.id, accessToken);
    } catch {
      router.replace("/recruiter/login");
    }
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
    setSaving(false);

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
        const profilePayload: any = { fullName: fullName.trim() };
        if (gender) profilePayload.gender = gender;
        if (phoneNumber.trim()) profilePayload.phoneNumber = phoneNumber.trim();
        if (avatarUrl) profilePayload.avatarUrl = avatarUrl;
        await updateRecruiterProfile(profileId, profilePayload, token);
      }

      // 2. Save Company Details
      if (companyId) {
        const companyPayload: any = { name: companyName.trim() };
        if (companyAddress.trim()) companyPayload.address = companyAddress.trim();
        if (companyTaxCode.trim()) companyPayload.taxCode = companyTaxCode.trim();
        if (companyEmail.trim()) companyPayload.email = companyEmail.trim();
        if (companyPhone.trim()) companyPayload.phone = companyPhone.trim();
        if (companyWebsite.trim()) companyPayload.website = companyWebsite.trim();
        if (companySize.trim()) companyPayload.companySize = companySize.trim();
        if (companyDescription.trim()) companyPayload.description = companyDescription.trim();
        await updateCompany(companyId, companyPayload, token);
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
    } catch (err: any) {
      let msg = "Không thể lưu thay đổi vào lúc này.";
      if (err instanceof ApiError) {
        if (err.status === 400) {
          msg = "Dữ liệu nhập vào không hợp lệ hoặc mật khẩu hiện tại sai.";
        }
      } else if (err?.message) {
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
      className="border-0 bg-white p-7 px-0 py-0 text-slate-900 shadow-md dark:bg-slate-900 dark:text-slate-100"
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
                    <div>
                      <label
                        className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300"
                        htmlFor="cpwd"
                      >
                        Mật khẩu hiện tại
                      </label>
                      <input
                        className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus-visible:border-transparent focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-950"
                        id="cpwd"
                        aria-label="Current password"
                        type="password"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                    <div>
                      <label
                        className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300"
                        htmlFor="npwd"
                      >
                        Mật khẩu mới
                      </label>
                      <input
                        className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus-visible:border-transparent focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-950"
                        id="npwd"
                        aria-label="New password"
                        type="password"
                        placeholder="Có ít nhất 6 ký tự"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div>
                      <label
                        className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300"
                        htmlFor="cfpwd"
                      >
                        Xác nhận mật khẩu mới
                      </label>
                      <input
                        className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus-visible:border-transparent focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-950"
                        id="cfpwd"
                        aria-label="Confirm new password"
                        type="password"
                        placeholder="Nhập lại mật khẩu mới"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
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
                      <div>
                        <label
                          className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300"
                          htmlFor="ynm"
                        >
                          Họ và tên
                        </label>
                        <input
                          className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-950"
                          id="ynm"
                          aria-label="Full name"
                          placeholder="Họ và tên"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                        />
                      </div>

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
                      <div>
                        <label
                          className="dark:text-slate-355 mb-2 block text-xs font-bold text-slate-600"
                          htmlFor="em"
                        >
                          Email tài khoản
                        </label>
                        <input
                          className="flex h-10 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-500"
                          id="em"
                          aria-label="Account email"
                          placeholder="Email đăng nhập"
                          type="email"
                          value={email}
                          disabled
                        />
                      </div>

                      <div>
                        <label
                          className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300"
                          htmlFor="ph"
                        >
                          Số điện thoại cá nhân
                        </label>
                        <input
                          className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-950"
                          id="ph"
                          aria-label="Personal phone number"
                          placeholder="Số điện thoại liên hệ"
                          type="text"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Details Card */}
              <div className="col-span-12">
                <div className="rounded-xl border border-slate-100 bg-white p-7 text-slate-900">
                  <h5 className="mb-1 text-base font-bold text-slate-800 dark:text-white">
                    Thông tin công ty
                  </h5>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Chỉnh sửa thông tin chi tiết về doanh nghiệp tuyển dụng của bạn
                  </p>

                  <div className="mt-4 grid grid-cols-12 gap-6">
                    {/* Left Details Grid */}
                    <div className="col-span-12 space-y-4 md:col-span-6">
                      <div>
                        <label
                          className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300"
                          htmlFor="store"
                        >
                          Tên doanh nghiệp
                        </label>
                        <input
                          className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-950"
                          id="store"
                          aria-label="Company name"
                          placeholder="Tên doanh nghiệp / Công ty"
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                        />
                      </div>

                      <div>
                        <label
                          className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300"
                          htmlFor="comSize"
                        >
                          Quy môn nhân sự
                        </label>
                        <input
                          className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-950"
                          id="comSize"
                          aria-label="Company size"
                          placeholder="Ví dụ: 10-50 nhân viên, 50-200 nhân viên"
                          type="text"
                          value={companySize}
                          onChange={(e) => setCompanySize(e.target.value)}
                        />
                      </div>

                      <div>
                        <label
                          className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300"
                          htmlFor="comPhone"
                        >
                          Số điện thoại công ty
                        </label>
                        <input
                          className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-950"
                          id="comPhone"
                          aria-label="Company phone"
                          placeholder="Số điện thoại hotline công ty"
                          type="text"
                          value={companyPhone}
                          onChange={(e) => setCompanyPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Right Details Grid */}
                    <div className="col-span-12 space-y-4 md:col-span-6">
                      <div>
                        <label
                          className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300"
                          htmlFor="tax"
                        >
                          Mã số thuế
                        </label>
                        <input
                          className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-950"
                          id="tax"
                          aria-label="Tax code"
                          placeholder="Mã số thuế doanh nghiệp"
                          type="text"
                          value={companyTaxCode}
                          onChange={(e) => setCompanyTaxCode(e.target.value)}
                        />
                      </div>

                      <div>
                        <label
                          className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300"
                          htmlFor="web"
                        >
                          Website doanh nghiệp
                        </label>
                        <input
                          className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-950"
                          id="web"
                          aria-label="Company website"
                          placeholder="https://example.com"
                          type="text"
                          value={companyWebsite}
                          onChange={(e) => setCompanyWebsite(e.target.value)}
                        />
                      </div>

                      <div>
                        <label
                          className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300"
                          htmlFor="comEmail"
                        >
                          Email liên hệ công ty
                        </label>
                        <input
                          className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-950"
                          id="comEmail"
                          aria-label="Company contact email"
                          placeholder="hr@company.com"
                          type="email"
                          value={companyEmail}
                          onChange={(e) => setCompanyEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Full Width Address */}
                    <div className="col-span-12">
                      <label
                        className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300"
                        htmlFor="add"
                      >
                        Địa chỉ trụ sở công ty
                      </label>
                      <input
                        className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-950"
                        id="add"
                        aria-label="Company address"
                        placeholder="Địa chỉ trụ sở chính"
                        type="text"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                      />
                    </div>

                    {/* Full Width Description */}
                    <div className="col-span-12">
                      <label
                        className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300"
                        htmlFor="desc"
                      >
                        Giới thiệu công ty
                      </label>
                      <textarea
                        className="flex min-h-[80px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-950"
                        id="desc"
                        aria-label="Company description"
                        placeholder="Mô tả tóm tắt về công ty..."
                        value={companyDescription}
                        onChange={(e) => setCompanyDescription(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Save / Cancel buttons */}
                  <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
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
            </div>
          </div>
        )}

        {/* Tab Panel: Notification */}
        {activeTab === "notification" && (
          <div className="mt-2 border-none p-6">
            <div className="max-w-2xl rounded-xl border border-slate-100 bg-white p-7 dark:border-slate-800 dark:bg-slate-900">
              <h5 className="mb-1 text-base font-bold text-slate-800 dark:text-white">
                Cài đặt thông báo
              </h5>
              <p className="mb-6 text-xs text-slate-400 dark:text-slate-500">
                Tùy chọn loại thông báo bạn muốn nhận qua Email và Trình duyệt
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="notif_jobs"
                    aria-label="New applications notifications"
                    className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    checked={notifJobs}
                    onChange={(e) => setNotifJobs(e.target.checked)}
                  />
                  <div>
                    <label
                      htmlFor="notif_jobs"
                      className="text-sm font-bold text-slate-700 dark:text-slate-200"
                    >
                      Ứng tuyển mới
                    </label>
                    <p className="text-xs text-slate-400">
                      Gửi email thông báo ngay khi có ứng viên mới nộp hồ sơ vào tin tuyển dụng
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="notif_interviews"
                    aria-label="Interview reminder notifications"
                    className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    checked={notifInterviews}
                    onChange={(e) => setNotifInterviews(e.target.checked)}
                  />
                  <div>
                    <label
                      htmlFor="notif_interviews"
                      className="text-sm font-bold text-slate-700 dark:text-slate-200"
                    >
                      Nhắc lịch phỏng vấn
                    </label>
                    <p className="text-xs text-slate-400">
                      Gửi nhắc nhở lịch hẹn phỏng vấn sắp diễn ra trong ngày
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="notif_sec"
                    aria-label="Security and login notifications"
                    className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    checked={notifSecurity}
                    onChange={(e) => setNotifSecurity(e.target.checked)}
                  />
                  <div>
                    <label
                      htmlFor="notif_sec"
                      className="text-sm font-bold text-slate-700 dark:text-slate-200"
                    >
                      Bảo mật & Đăng nhập
                    </label>
                    <p className="text-xs text-slate-400">
                      Thông báo cho tôi khi có hoạt động đăng nhập lạ từ thiết bị mới
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    void Swal.fire({
                      icon: "success",
                      title: "Đã cập nhật cài đặt thông báo!",
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

        {/* Tab Panel: Bills */}
        {activeTab === "bills" && (
          <div className="mt-2 border-none p-6">
            <div className="rounded-xl border border-slate-100 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h5 className="mb-1 text-base font-bold text-slate-800 dark:text-white">
                Gói dịch vụ tuyển dụng
              </h5>
              <p className="mb-6 text-xs text-slate-400 dark:text-slate-500">
                Theo dõi thông tin gói dịch vụ hiện tại và lịch sử thanh toán
              </p>

              {/* Package Card */}
              <div className="mb-8 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/50 p-5 dark:border-emerald-900/30 dark:bg-emerald-950/10">
                <div>
                  <span className="rounded bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                    ACTIVE
                  </span>
                  <h4 className="mt-2 text-lg font-bold text-slate-800 dark:text-white">
                    UpNext Recruiter Pro Plan
                  </h4>
                  <p className="mt-1 text-xs text-slate-400">
                    Gói không giới hạn bài đăng & tiếp cận 5.000 hồ sơ ứng viên/tháng
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Gia hạn tiếp theo</p>
                  <p className="mt-1 text-sm font-bold text-slate-800 dark:text-white">
                    24 tháng 12, 2026
                  </p>
                </div>
              </div>

              {/* Invoices Table */}
              <h6 className="mb-3 text-sm font-bold text-slate-800 dark:text-white">
                Lịch sử giao dịch
              </h6>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="dark:border-slate-850 border-b border-slate-100 font-bold text-slate-400">
                      <th className="px-4 py-3">Mã giao dịch</th>
                      <th className="px-4 py-3">Ngày giao dịch</th>
                      <th className="px-4 py-3">Gói dịch vụ</th>
                      <th className="px-4 py-3">Số tiền</th>
                      <th className="px-4 py-3 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-50 transition hover:bg-slate-50/50 dark:border-slate-900 dark:hover:bg-slate-950/50">
                      <td className="px-4 py-3 font-mono font-medium text-slate-600 dark:text-slate-300">
                        INV-84920
                      </td>
                      <td className="px-4 py-3 text-slate-500">24/06/2026</td>
                      <td className="px-4 py-3 font-semibold">Recruiter Pro (1 Tháng)</td>
                      <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">
                        1,200,000 VND
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="rounded bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-700">
                          Thành công
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-slate-50 transition hover:bg-slate-50/50 dark:border-slate-900 dark:hover:bg-slate-950/50">
                      <td className="px-4 py-3 font-mono font-medium text-slate-600 dark:text-slate-300">
                        INV-83021
                      </td>
                      <td className="px-4 py-3 text-slate-500">24/05/2026</td>
                      <td className="px-4 py-3 font-semibold">Recruiter Pro (1 Tháng)</td>
                      <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">
                        1,200,000 VND
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="rounded bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-700">
                          Thành công
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
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
