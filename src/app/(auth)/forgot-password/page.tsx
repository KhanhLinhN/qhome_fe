"use client";
import React, { useState } from "react";
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useNotifications } from "@/src/hooks/useNotifications";
import { forgotPassword } from "@/src/services/iam";
import LocaleSwitcher from "@/src/components/common/LocaleSwitcher";

export default function Page() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const { show } = useNotifications();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const validateEmail = (email: string): string => {
    if (!email.trim()) {
      return "Email không được để trống";
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return "Email không đúng định dạng";
    }
    return "";
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validate email
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }
    
    setEmailError("");
    setLoading(true);
    
    try {
      await forgotPassword(email);
      show("Mật khẩu mới đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.", "success");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (e: any) {
      let errorMessage = "Có lỗi xảy ra. Vui lòng thử lại.";
      
      if (e?.response?.status === 404) {
        errorMessage = "Email bạn nhập không có trong hệ thống.";
      } else if (e?.response?.status === 400) {
        errorMessage = e?.response?.data?.message || "Email không hợp lệ.";
      } else if (e?.code === 'ERR_NETWORK' || e?.message?.includes('Network')) {
        errorMessage = "Không thể kết nối đến server. Vui lòng kiểm tra backend đang chạy.";
      }
      
      setEmailError(errorMessage);
      show(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4"><LocaleSwitcher/></div>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <div className="flex flex-col items-center select-none">
            <img src="/logo.svg" alt="Qhome Base Logo" className="h-28 w-24 mb-4" />
            <span className="text-3xl font-semibold tracking-tight text-slate-800">Quên mật khẩu</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-8">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-semibold text-slate-800">Quên mật khẩu</h1>
              <p className="text-sm text-slate-500 mt-1">
                Nhập email của bạn để nhận mật khẩu mới
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">
                Email
              </label>
              <input 
                type="email"
                value={email} 
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) {
                    setEmailError("");
                  }
                }}
                placeholder="you@example.com"
                className={`w-full border-0 bg-[#E8E5DC] rounded-md px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  emailError 
                    ? "focus:ring-red-500/30 ring-2 ring-red-500/30" 
                    : "focus:ring-green-500/30"
                }`}
              />
              {emailError && (
                <p className="text-xs text-red-600 mt-1">{emailError}</p>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full rounded-md px-4 py-2.5 text-sm font-medium bg-[#6B9B6E] text-white hover:bg-[#5d8660] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Đang xử lý..." : "Gửi mật khẩu mới"}
            </button>

            <div className="text-center">
              <a 
                href="/login" 
                className="text-sm text-green-600 hover:text-green-700 hover:underline"
              >
                Quay lại đăng nhập
              </a>
            </div>
          </form>
        </div>
        <div className="mt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Qhome Base. All rights reserved.
        </div>
      </div>
    </div>
  );
}

