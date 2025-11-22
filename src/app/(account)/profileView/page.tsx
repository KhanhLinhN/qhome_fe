"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/src/contexts/AuthContext";
import {
  fetchUserAccount,
  fetchUserProfile,
  fetchUserStatus,
  UserAccountInfo,
  UserProfileInfo,
  UserStatusInfo,
} from "@/src/services/iam/userService";
import { getErrorMessage } from "@/src/types/error";

export default function ProfileViewPage() {
  const { user, isLoading, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfileInfo | null>(null);
  const [account, setAccount] = useState<UserAccountInfo | null>(null);
  const [status, setStatus] = useState<UserStatusInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    if (confirm("Bạn có chắc muốn đăng xuất?")) {
      logout();
    }
  };

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      if (!user?.userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [profileRes, accountRes, statusRes] = await Promise.all([
          fetchUserProfile(user.userId),
          fetchUserAccount(user.userId),
          fetchUserStatus(user.userId),
        ]);
        console.log("profileRes", profileRes);
        console.log("accountRes", accountRes);
        console.log("statusRes", statusRes);

        if (!active) return;

        setProfile(profileRes);
        setAccount(accountRes);
        setStatus(statusRes);
      } catch (err: unknown) {
        console.error("Failed to load profile", err);
        if (!active) return;
        const message = getErrorMessage(err, "Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.");
        setError(message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [user?.userId]);

  const permissionsByService = useMemo(() => {
    if (!profile?.permissions?.length) return {};

    return profile.permissions.reduce<Record<string, string[]>>((acc, perm) => {
      const [service, code] = perm.split(".");
      const key = service || "khác";
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(code || perm);
      return acc;
    }, {});
  }, [profile?.permissions]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm text-slate-600">Đang tải hồ sơ của bạn...</div>
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
            Bạn cần đăng nhập để xem thông tin hồ sơ cá nhân.
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
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-600 uppercase tracking-wide">
              Hồ sơ của tôi
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
                <h1 className="mt-2 text-2xl font-bold text-slate-800">
                {profile?.username || user.username || "Không xác định"}
                </h1>
                <div className="mt-2 ml-2 flex flex-wrap gap-2">
                    {(profile?.roles?.length ? profile.roles : user.roles)?.map(
                      (role) => (
                        <span
                          key={role}
                          className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700"
                        >
                          {role}
                        </span>
                      )
                    ) || (
                      <span className="text-sm text-slate-500">
                        Chưa có vai trò
                      </span>
                    )}
                  </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/profileEdit"
              className="inline-flex items-center justify-center rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition"
            >
              {user?.roles?.find(role => role === "Resident") ? "Chỉnh sửa hồ sơ" : "Thay đổi mật khẩu"}
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="grid gap-6 md:grid-cols-5">
          <div className="md:col-span-3 space-y-6">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">
                  Thông tin tài khoản
                </h2>
              </div>

              <dl className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <dt className="text-xs font-medium uppercase text-slate-500">
                    Username
                  </dt>
                  <dd className="mt-2 text-base font-semibold text-slate-800">
                    {account?.username || profile?.username || "Không xác định"}
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 overflow-auto">
                  <dt className="text-xs font-medium uppercase text-slate-500">
                    Email
                  </dt>
                  <dd className="mt-2 text-base font-semibold text-slate-800">
                    {account?.email || profile?.email || "Không xác định"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          <aside className="col-span-2 md:grid-cols-1 space-y-6">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700">
                Thao tác nhanh
              </h3>
              <div className="mt-4 space-y-3">
                <Link
                  href="/profileEdit"
                  className="block rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 transition"
                >
                  {user?.roles?.find(role => role === "Resident") ? "Chỉnh sửa hồ sơ" : "Thay đổi mật khẩu"}
                </Link>
                {user?.roles?.find(role => role === "Resident") && (
                  <Link
                    href="/dashboard/buildings"
                    className="block rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-yellow-200 hover:bg-yellow-50 hover:text-yellow-700 transition"
                  >
                    Xem thông tin căn hộ
                  </Link>
                )}
                <Link
                  href=""
                  onClick={handleLogout}
                  className="block rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition"
                >
                  Đăng xuất
                </Link>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

