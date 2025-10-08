import React from "react";
import LoginForm from "@/src/components/auth/LoginForm";
import LocaleSwitcher from "@/src/components/common/LocaleSwitcher";

export default function Page(){
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4"><LocaleSwitcher/></div>
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="flex flex-col items-center select-none">
            <img src="/logo.svg" alt="QHome Logo" className="h-30 w-25 mb-3" />
            <span className="text-3xl font-semibold tracking-tight">QHome PMS</span>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-slate-200 p-6">
          <LoginForm/>
        </div>
        <div className="mt-4 text-center text-xs text-slate-500">© {new Date().getFullYear()} QHome. All rights reserved.</div>
      </div>
    </div>
  );
}
