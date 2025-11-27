"use client";
import React, { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useNotifications } from "@/src/hooks/useNotifications";
import { verifyOtp } from "@/src/services/iam";
import LocaleSwitcher from "@/src/components/common/LocaleSwitcher";

export default function Page() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { show } = useNotifications();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (!emailParam) {
      show("Email không hợp lệ. Vui lòng quay lại trang quên mật khẩu.", "error");
      router.push("/forgot-password");
      return;
    }
    setEmail(emailParam);
  }, [searchParams, router, show]);

  const validateOtp = (otp: string): string => {
    if (!otp.trim()) {
      return "Mã OTP không được để trống";
    }
    if (otp.length !== 6) {
      return "Mã OTP phải là 6 chữ số";
    }
    return "";
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email) {
      show("Email không hợp lệ. Vui lòng quay lại trang quên mật khẩu.", "error");
      router.push("/forgot-password");
      return;
    }
    
    // Validate OTP
    const error = validateOtp(otp);
    if (error) {
      setOtpError(error);
      return;
    }
    
    setOtpError("");
    setLoading(true);
    
    try {
      await verifyOtp(email, otp.trim());
      show("Mã OTP đã được xác thực thành công.", "success");
      setTimeout(() => {
        router.push(`/confirm-reset?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp.trim())}`);
      }, 1000);
    } catch (e: any) {
      let errorMessage = "Có lỗi xảy ra. Vui lòng thử lại.";
      
      if (e?.response?.status === 400) {
        errorMessage = e?.response?.data?.message || "Mã OTP không hợp lệ hoặc đã hết hạn.";
      } else if (e?.code === 'ERR_NETWORK' || e?.message?.includes('Network')) {
        errorMessage = "Không thể kết nối đến server. Vui lòng kiểm tra backend đang chạy.";
      }
      
      setOtpError(errorMessage);
      show(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4"><LocaleSwitcher/></div>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <div className="flex flex-col items-center select-none">
            <img src="/logo.svg" alt="Qhome Base Logo" className="h-28 w-24 mb-4" />
            <span className="text-3xl font-semibold tracking-tight text-slate-800">Xác thực OTP</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-8">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-semibold text-slate-800">Xác thực mã OTP</h1>
              <p className="text-sm text-slate-500 mt-1">
                Nhập mã OTP đã được gửi đến email <span className="font-medium text-slate-700">{email}</span>
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">
                Mã OTP (6 chữ số)
              </label>
              <input 
                type="text"
                value={otp} 
                onChange={(e) => {
                  const value = e.target.value.slice(0, 6);
                  setOtp(value);
                  if (otpError) {
                    setOtpError("");
                  }
                }}
                placeholder="000000"
                maxLength={6}
                className={`w-full border-0 bg-[#E8E5DC] rounded-md px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 text-center text-2xl tracking-widest ${
                  otpError 
                    ? "focus:ring-red-500/30 ring-2 ring-red-500/30" 
                    : "focus:ring-green-500/30"
                }`}
              />
              {otpError && (
                <p className="text-xs text-red-600 mt-1">{otpError}</p>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full rounded-md px-4 py-2.5 text-sm font-medium bg-[#6B9B6E] text-white hover:bg-[#5d8660] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Đang xác thực..." : "Xác thực OTP"}
            </button>

            <div className="text-center space-y-2">
              <a 
                href={`/forgotpassword?email=${encodeURIComponent(email)}`}
                className="text-sm text-green-600 hover:text-green-700 hover:underline block"
              >
                Gửi lại mã OTP
              </a>
              <a 
                href="/login" 
                className="text-sm text-slate-600 hover:text-slate-700 hover:underline block"
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

