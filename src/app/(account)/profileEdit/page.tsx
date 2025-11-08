"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import {
  fetchUserAccount,
  fetchUserProfile,
  updateUserPassword,
  updateUserProfile,
  UpdateUserPasswordPayload,
  UpdateUserProfilePayload,
  UserAccountInfo,
  UserProfileInfo,
} from "@/src/services/iam/userService";

type FormState = {
  username: string;
  email: string;
  active: boolean;
  newPassword: string;
  confirmPassword: string;
};

const initialFormState: FormState = {
  username: "",
  email: "",
  active: true,
  newPassword: "",
  confirmPassword: "",
};

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, setUser, isLoading } = useAuth();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [profile, setProfile] = useState<UserProfileInfo | null>(null);
  const [account, setAccount] = useState<UserAccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      if (!user?.userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [profileRes, accountRes] = await Promise.all([
          fetchUserProfile(user.userId),
          fetchUserAccount(user.userId),
        ]);

        if (!active) return;

        setProfile(profileRes);
        setAccount(accountRes);

        setForm({
          username: accountRes?.username || profileRes.username || "",
          email: accountRes?.email || profileRes.email || "",
          active: accountRes?.active ?? true,
          newPassword: "",
          confirmPassword: "",
        });
      } catch (err: any) {
        console.error("Failed to load profile for editing", err);
        if (!active) return;
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Không thể tải dữ liệu hồ sơ để chỉnh sửa.";
        setError(message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [user?.userId]);

  const handleChange =
    (field: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        field === "active" ? event.target.checked : event.target.value;
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user?.userId) {
      setError("Không xác định được người dùng hiện tại.");
      return;
    }

    if (form.newPassword && form.newPassword.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setError("Xác nhận mật khẩu không khớp.");
      return;
    }

    const trimmedUsername = form.username.trim();
    const trimmedEmail = form.email.trim();

    const profilePayload: UpdateUserProfilePayload = {
      username: trimmedUsername || undefined,
      email: trimmedEmail || undefined,
      active: form.active,
    };

    const accountUsername = account?.username ?? "";
    const accountEmail = account?.email ?? "";
    const accountActive = account?.active ?? true;

    const hasProfileChanges =
      account === null ||
      (profilePayload.username !== undefined && profilePayload.username !== accountUsername) ||
      (profilePayload.email !== undefined && profilePayload.email !== accountEmail) ||
      profilePayload.active !== accountActive;

    const passwordPayload: UpdateUserPasswordPayload | undefined = form.newPassword
      ? { newPassword: form.newPassword }
      : undefined;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      let updatedAccount: UserAccountInfo | null = null;
      if (hasProfileChanges) {
        updatedAccount = await updateUserProfile(user.userId, profilePayload);
        setAccount(updatedAccount);
        setUser({
          ...(user ?? {
            userId: updatedAccount.userId,
            roles: [],
            permissions: [],
            tenantId: "",
            username: "",
            email: "",
          }),
          userId: updatedAccount.userId,
          username: updatedAccount.username,
          email: updatedAccount.email,
        });
      }

      if (passwordPayload) {
        await updateUserPassword(user.userId, passwordPayload);
      }

      if (!passwordPayload && !updatedAccount) {
        setSuccess("Không có thay đổi nào được áp dụng.");
      } else if (passwordPayload && updatedAccount) {
        setSuccess("Cập nhật hồ sơ và đổi mật khẩu thành công!");
      } else if (passwordPayload) {
        setSuccess("Đổi mật khẩu thành công!");
      } else {
        setSuccess("Cập nhật hồ sơ thành công!");
      }

      setForm((prev) => ({
        ...prev,
        username: updatedAccount ? updatedAccount.username : prev.username,
        email: updatedAccount ? updatedAccount.email : prev.email,
        active: updatedAccount ? updatedAccount.active : prev.active,
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (err: any) {
      console.error("Failed to update profile", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Cập nhật hồ sơ thất bại. Vui lòng thử lại sau.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm text-slate-600">
          Đang tải thông tin hồ sơ để chỉnh sửa...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white shadow rounded-xl p-6 text-center space-y-3">
          <h1 className="text-lg font-semibold text-slate-800">
            Vui lòng đăng nhập
          </h1>
          <p className="text-sm text-slate-500">
            Bạn cần đăng nhập để chỉnh sửa hồ sơ cá nhân.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear,
        input[type="password"]::-webkit-textfield-decoration-container {
          display: none;
        }
      `}</style>
      <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-emerald-600 uppercase tracking-wide">
              Cập nhật hồ sơ
            </p>
            <h1 className="text-2xl font-bold text-slate-800">
              {profile?.username || user.username || "Chỉnh sửa hồ sơ"}
            </h1>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6"
        >
          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            {user?.roles?.find(role => role === "Resident") && (
            <div>
                <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">
                    Username
                </label>
                <input
                    type="text"
                    value={form.username}
                    onChange={handleChange("username")}
                    required
                    minLength={3}
                    maxLength={50}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    placeholder="Nhập username"
                />
                </div>

                <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">
                    Email
                </label>
                <input
                    type="email"
                    value={form.email}
                    onChange={handleChange("email")}
                    required
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    placeholder="example@domain.com"
                />
                </div>
            </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold text-slate-700">
              Đổi mật khẩu (tuỳ chọn)
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Để giữ nguyên mật khẩu hiện tại, hãy để trống các ô bên dưới.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="relative">
                <label className="text-xs font-medium uppercase text-slate-500">
                  Mật khẩu mới
                </label>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={form.newPassword}
                  onChange={handleChange("newPassword")}
                  minLength={8}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  placeholder="Nhập mật khẩu mới"
                  autoComplete="new-password"
                />
                {form.newPassword && (
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3 top-[42px] text-xs font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    {showNewPassword ? 
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="Eye-Close-Fill--Streamline-Mingcute-Fill" height="24" width="24">
                            <g fill="none" fillRule="evenodd">
                                <path d="M24 0v24H0V0h24ZM12.593 23.258l-0.011 0.002 -0.071 0.035 -0.02 0.004 -0.014 -0.004 -0.071 -0.035c-0.01 -0.004 -0.019 -0.001 -0.024 0.005l-0.004 0.01 -0.017 0.428 0.005 0.02 0.01 0.013 0.104 0.074 0.015 0.004 0.012 -0.004 0.104 -0.074 0.012 -0.016 0.004 -0.017 -0.017 -0.427c-0.002 -0.01 -0.009 -0.017 -0.017 -0.018Zm0.265 -0.113 -0.013 0.002 -0.185 0.093 -0.01 0.01 -0.003 0.011 0.018 0.43 0.005 0.012 0.008 0.007 0.201 0.093c0.012 0.004 0.023 0 0.029 -0.008l0.004 -0.014 -0.034 -0.614c-0.003 -0.012 -0.01 -0.02 -0.02 -0.022Zm-0.715 0.002a0.023 0.023 0 0 0 -0.027 0.006l-0.006 0.014 -0.034 0.614c0 0.012 0.007 0.02 0.017 0.024l0.015 -0.002 0.201 -0.093 0.01 -0.008 0.004 -0.011 0.017 -0.43 -0.003 -0.012 -0.01 -0.01 -0.184 -0.092Z" strokeWidth="1"></path>
                                <path fill="currentColor" d="M2.5 9a1.5 1.5 0 0 1 2.945 -0.404c1.947 6.502 11.158 6.503 13.109 0.005a1.5 1.5 0 1 1 2.877 0.85 10.104 10.104 0 0 1 -1.623 3.236l0.96 0.96a1.5 1.5 0 1 1 -2.122 2.12l-1.01 -1.01a9.616 9.616 0 0 1 -1.67 0.915l0.243 0.906a1.5 1.5 0 0 1 -2.897 0.776l-0.251 -0.935c-0.705 0.073 -1.417 0.073 -2.122 0l-0.25 0.935a1.5 1.5 0 0 1 -2.898 -0.776l0.242 -0.907a9.61 9.61 0 0 1 -1.669 -0.914l-1.01 1.01a1.5 1.5 0 1 1 -2.122 -2.12l0.96 -0.96a10.102 10.102 0 0 1 -1.62 -3.23A1.5 1.5 0 0 1 2.5 9Z" strokeWidth="1"></path>
                            </g>
                        </svg>
                        : 
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="Eye-2-Fill--Streamline-Mingcute-Fill" height="24" width="24">
                            <g fill="none" fillRule="nonzero">
                            <path d="M24 0v24H0V0h24ZM12.593 23.258l-0.011 0.002 -0.071 0.035 -0.02 0.004 -0.014 -0.004 -0.071 -0.035c-0.01 -0.004 -0.019 -0.001 -0.024 0.005l-0.004 0.01 -0.017 0.428 0.005 0.02 0.01 0.013 0.104 0.074 0.015 0.004 0.012 -0.004 0.104 -0.074 0.012 -0.016 0.004 -0.017 -0.017 -0.427c-0.002 -0.01 -0.009 -0.017 -0.017 -0.018Zm0.265 -0.113 -0.013 0.002 -0.185 0.093 -0.01 0.01 -0.003 0.011 0.018 0.43 0.005 0.012 0.008 0.007 0.201 0.093c0.012 0.004 0.023 0 0.029 -0.008l0.004 -0.014 -0.034 -0.614c-0.003 -0.012 -0.01 -0.02 -0.02 -0.022Zm-0.715 0.002a0.023 0.023 0 0 0 -0.027 0.006l-0.006 0.014 -0.034 0.614c0 0.012 0.007 0.02 0.017 0.024l0.015 -0.002 0.201 -0.093 0.01 -0.008 0.004 -0.011 0.017 -0.43 -0.003 -0.012 -0.01 -0.01 -0.184 -0.092Z" strokeWidth="1"></path>
                            <path fill="currentColor" d="M12 5c3.679 0 8.162 2.417 9.73 5.901 0.146 0.328 0.27 0.71 0.27 1.099 0 0.388 -0.123 0.771 -0.27 1.099C20.161 16.583 15.678 19 12 19c-3.679 0 -8.162 -2.417 -9.73 -5.901C2.124 12.77 2 12.389 2 12c0 -0.388 0.123 -0.771 0.27 -1.099C3.839 7.417 8.322 5 12 5Zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0 -8Zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0 -4Z" strokeWidth="1"></path>
                            </g>
                        </svg>    
                    }
                  </button>
                )}
              </div>
              <div className="relative">
                <label className="text-xs font-medium uppercase text-slate-500">
                  Xác nhận mật khẩu
                </label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  minLength={8}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                />
                {form.confirmPassword && (
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((prev) => !prev)
                    }
                    className="absolute right-3 top-[42px] text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:cursor-pointer"
                  >
                    {showConfirmPassword ? 
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="Eye-Close-Fill--Streamline-Mingcute-Fill" height="24" width="24">
                        <g fill="none" fillRule="evenodd">
                            <path d="M24 0v24H0V0h24ZM12.593 23.258l-0.011 0.002 -0.071 0.035 -0.02 0.004 -0.014 -0.004 -0.071 -0.035c-0.01 -0.004 -0.019 -0.001 -0.024 0.005l-0.004 0.01 -0.017 0.428 0.005 0.02 0.01 0.013 0.104 0.074 0.015 0.004 0.012 -0.004 0.104 -0.074 0.012 -0.016 0.004 -0.017 -0.017 -0.427c-0.002 -0.01 -0.009 -0.017 -0.017 -0.018Zm0.265 -0.113 -0.013 0.002 -0.185 0.093 -0.01 0.01 -0.003 0.011 0.018 0.43 0.005 0.012 0.008 0.007 0.201 0.093c0.012 0.004 0.023 0 0.029 -0.008l0.004 -0.014 -0.034 -0.614c-0.003 -0.012 -0.01 -0.02 -0.02 -0.022Zm-0.715 0.002a0.023 0.023 0 0 0 -0.027 0.006l-0.006 0.014 -0.034 0.614c0 0.012 0.007 0.02 0.017 0.024l0.015 -0.002 0.201 -0.093 0.01 -0.008 0.004 -0.011 0.017 -0.43 -0.003 -0.012 -0.01 -0.01 -0.184 -0.092Z" strokeWidth="1"></path>
                            <path fill="currentColor" d="M2.5 9a1.5 1.5 0 0 1 2.945 -0.404c1.947 6.502 11.158 6.503 13.109 0.005a1.5 1.5 0 1 1 2.877 0.85 10.104 10.104 0 0 1 -1.623 3.236l0.96 0.96a1.5 1.5 0 1 1 -2.122 2.12l-1.01 -1.01a9.616 9.616 0 0 1 -1.67 0.915l0.243 0.906a1.5 1.5 0 0 1 -2.897 0.776l-0.251 -0.935c-0.705 0.073 -1.417 0.073 -2.122 0l-0.25 0.935a1.5 1.5 0 0 1 -2.898 -0.776l0.242 -0.907a9.61 9.61 0 0 1 -1.669 -0.914l-1.01 1.01a1.5 1.5 0 1 1 -2.122 -2.12l0.96 -0.96a10.102 10.102 0 0 1 -1.62 -3.23A1.5 1.5 0 0 1 2.5 9Z" strokeWidth="1"></path>
                        </g>
                    </svg>
                    : 
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="Eye-2-Fill--Streamline-Mingcute-Fill" height="24" width="24">
                        <g fill="none" fillRule="nonzero">
                        <path d="M24 0v24H0V0h24ZM12.593 23.258l-0.011 0.002 -0.071 0.035 -0.02 0.004 -0.014 -0.004 -0.071 -0.035c-0.01 -0.004 -0.019 -0.001 -0.024 0.005l-0.004 0.01 -0.017 0.428 0.005 0.02 0.01 0.013 0.104 0.074 0.015 0.004 0.012 -0.004 0.104 -0.074 0.012 -0.016 0.004 -0.017 -0.017 -0.427c-0.002 -0.01 -0.009 -0.017 -0.017 -0.018Zm0.265 -0.113 -0.013 0.002 -0.185 0.093 -0.01 0.01 -0.003 0.011 0.018 0.43 0.005 0.012 0.008 0.007 0.201 0.093c0.012 0.004 0.023 0 0.029 -0.008l0.004 -0.014 -0.034 -0.614c-0.003 -0.012 -0.01 -0.02 -0.02 -0.022Zm-0.715 0.002a0.023 0.023 0 0 0 -0.027 0.006l-0.006 0.014 -0.034 0.614c0 0.012 0.007 0.02 0.017 0.024l0.015 -0.002 0.201 -0.093 0.01 -0.008 0.004 -0.011 0.017 -0.43 -0.003 -0.012 -0.01 -0.01 -0.184 -0.092Z" strokeWidth="1"></path>
                        <path fill="currentColor" d="M12 5c3.679 0 8.162 2.417 9.73 5.901 0.146 0.328 0.27 0.71 0.27 1.099 0 0.388 -0.123 0.771 -0.27 1.099C20.161 16.583 15.678 19 12 19c-3.679 0 -8.162 -2.417 -9.73 -5.901C2.124 12.77 2 12.389 2 12c0 -0.388 0.123 -0.771 0.27 -1.099C3.839 7.417 8.322 5 12 5Zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0 -8Zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0 -4Z" strokeWidth="1"></path>
                        </g>
                    </svg>    
                    }
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Link
              href="/profileView"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition"
            >
              Huỷ bỏ
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
      </div>
    </>
  );
}

