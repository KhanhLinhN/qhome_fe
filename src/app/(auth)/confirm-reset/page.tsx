"use client";
import React, { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useNotifications } from "@/src/hooks/useNotifications";
import { confirmPasswordReset } from "@/src/services/iam";
import LocaleSwitcher from "@/src/components/common/LocaleSwitcher";

export default function Page() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { show } = useNotifications();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const otpParam = searchParams.get('otp');
    if (!emailParam || !otpParam) {
      show(t('confirmReset.errors.invalidInfo'), "error");
      router.push("/forgot-password");
      return;
    }
    setEmail(emailParam);
    setOtp(otpParam);
  }, [searchParams, router, show, t]);

  const validatePassword = (pwd: string): string => {
    if (!pwd.trim()) {
      return t('confirmReset.errors.passwordRequired');
    }
    if (pwd.length < 6) {
      return t('confirmReset.errors.passwordMinLength');
    }
    if (pwd.length > 100) {
      return t('confirmReset.errors.passwordMaxLength');
    }
    return "";
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email || !otp) {
      show(t('confirmReset.errors.invalidInfo'), "error");
      router.push("/forgot-password");
      return;
    }
    
    // Validate password
    const pwdError = validatePassword(password);
    if (pwdError) {
      setPasswordError(pwdError);
      return;
    }
    setPasswordError("");
    
    // Validate confirm password
    if (password !== confirmPassword) {
      setConfirmPasswordError(t('confirmReset.errors.passwordMismatch'));
      return;
    }
    setConfirmPasswordError("");
    
    setLoading(true);
    
    try {
      await confirmPasswordReset(email, otp, password);
      show(t('confirmReset.messages.resetSuccess'), "success");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (e: any) {
      let errorMessage = t('confirmReset.errors.genericError');
      
      if (e?.response?.status === 400) {
        errorMessage = e?.response?.data?.message || t('confirmReset.errors.invalidOtp');
      } else if (e?.code === 'ERR_NETWORK' || e?.message?.includes('Network')) {
        errorMessage = t('confirmReset.errors.networkError');
      }
      
      show(errorMessage, "error");
      if (errorMessage.includes("OTP") || errorMessage.includes("expired") || errorMessage.includes("hết hạn")) {
        setTimeout(() => {
          router.push("/forgot-password");
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!email || !otp) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4"><LocaleSwitcher/></div>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <div className="flex flex-col items-center select-none">
            <img src="/logo.svg" alt="Qhome Base Logo" className="h-28 w-24 mb-4" />
            <span className="text-3xl font-semibold tracking-tight text-slate-800">{t('confirmReset.title')}</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-8">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-semibold text-slate-800">{t('confirmReset.heading')}</h1>
              <p className="text-sm text-slate-500 mt-1">
                {t('confirmReset.description', { email })}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">
                {t('confirmReset.newPasswordLabel')}
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password} 
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) {
                      setPasswordError("");
                    }
                  }}
                  placeholder={t('confirmReset.newPasswordPlaceholder')}
                  className={`w-full border-0 bg-[#E8E5DC] rounded-md px-4 py-2.5 pr-10 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                    passwordError 
                      ? "focus:ring-red-500/30 ring-2 ring-red-500/30" 
                      : "focus:ring-green-500/30"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-red-600 mt-1">{passwordError}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">{t('confirmReset.passwordHint')}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">
                {t('confirmReset.confirmPasswordLabel')}
              </label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword} 
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmPasswordError) {
                      setConfirmPasswordError("");
                    }
                  }}
                  placeholder={t('confirmReset.confirmPasswordPlaceholder')}
                  className={`w-full border-0 bg-[#E8E5DC] rounded-md px-4 py-2.5 pr-10 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                    confirmPasswordError 
                      ? "focus:ring-red-500/30 ring-2 ring-red-500/30" 
                      : "focus:ring-green-500/30"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              {confirmPasswordError && (
                <p className="text-xs text-red-600 mt-1">{confirmPasswordError}</p>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full rounded-md px-4 py-2.5 text-sm font-medium bg-[#6B9B6E] text-white hover:bg-[#5d8660] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t('confirmReset.submitting') : t('confirmReset.submit')}
            </button>

            <div className="text-center">
              <a 
                href="/login" 
                className="text-sm text-slate-600 hover:text-slate-700 hover:underline"
              >
                {t('confirmReset.backToLogin')}
              </a>
            </div>
          </form>
        </div>
        <div className="mt-6 text-center text-xs text-slate-500">
          {t('login.copyright', { year: new Date().getFullYear() })}
        </div>
      </div>
    </div>
  );
}

