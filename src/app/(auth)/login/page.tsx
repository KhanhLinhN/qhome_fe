import React from "react";
import LoginForm from "@/src/components/auth/LoginForm";
import LocaleSwitcher from "@/src/components/common/LocaleSwitcher";

export default function Page(){
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4"><LocaleSwitcher/></div>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <div className="flex flex-col items-center select-none">
            <img src="/logo.svg" alt="QHome Logo" className="h-28 w-24 mb-4" />
            <span className="text-3xl font-semibold tracking-tight text-slate-800">QHome PMS</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-8">
          <LoginForm/>
        </div>
        <div className="mt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} QHome. All rights reserved.
        </div>
      </div>
    </div>
  );
}
