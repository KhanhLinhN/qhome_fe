"use client";
import React from "react";
import {useAuth} from "@/src/contexts/AuthContext";

export default function Topbar(){
  const [q, setQ] = React.useState("");
  const [showMenu, setShowMenu] = React.useState(false);
  const {user, logout} = useAuth();

  const handleLogout = () => {
    if (confirm("Bạn có chắc muốn đăng xuất?")) {
      logout();
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center">
      <div className="max-w-[1280px] mx-auto px-4 w-full flex items-center gap-3">
        <div className="flex-1">
          <label className="relative block">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" id="Search-2-Fill--Streamline-Mingcute-Fill" height="16" width="16">
                <g fill="none" fillRule="evenodd">
                  <path d="M16 0v16H0V0h16ZM8.395333333333333 15.505333333333333l-0.007333333333333332 0.0013333333333333333 -0.047333333333333324 0.023333333333333334 -0.013333333333333332 0.0026666666666666666 -0.009333333333333332 -0.0026666666666666666 -0.047333333333333324 -0.023333333333333334c-0.006666666666666666 -0.0026666666666666666 -0.012666666666666666 -0.0006666666666666666 -0.016 0.003333333333333333l-0.0026666666666666666 0.006666666666666666 -0.011333333333333334 0.2853333333333333 0.003333333333333333 0.013333333333333332 0.006666666666666666 0.008666666666666666 0.06933333333333333 0.049333333333333326 0.009999999999999998 0.0026666666666666666 0.008 -0.0026666666666666666 0.06933333333333333 -0.049333333333333326 0.008 -0.010666666666666666 0.0026666666666666666 -0.011333333333333334 -0.011333333333333334 -0.2846666666666666c-0.0013333333333333333 -0.006666666666666666 -0.005999999999999999 -0.011333333333333334 -0.011333333333333334 -0.011999999999999999Zm0.17666666666666667 -0.07533333333333334 -0.008666666666666666 0.0013333333333333333 -0.12333333333333332 0.062 -0.006666666666666666 0.006666666666666666 -0.002 0.007333333333333332 0.011999999999999999 0.2866666666666666 0.003333333333333333 0.008 0.005333333333333333 0.004666666666666666 0.134 0.062c0.008 0.0026666666666666666 0.015333333333333332 0 0.019333333333333334 -0.005333333333333333l0.0026666666666666666 -0.009333333333333332 -0.02266666666666667 -0.4093333333333333c-0.002 -0.008 -0.006666666666666666 -0.013333333333333332 -0.013333333333333332 -0.014666666666666665Zm-0.4766666666666666 0.0013333333333333333a0.015333333333333332 0.015333333333333332 0 0 0 -0.018 0.004l-0.004 0.009333333333333332 -0.02266666666666667 0.4093333333333333c0 0.008 0.004666666666666666 0.013333333333333332 0.011333333333333334 0.016l0.009999999999999998 -0.0013333333333333333 0.134 -0.062 0.006666666666666666 -0.005333333333333333 0.0026666666666666666 -0.007333333333333332 0.011333333333333334 -0.2866666666666666 -0.002 -0.008 -0.006666666666666666 -0.006666666666666666 -0.12266666666666666 -0.06133333333333333Z" strokeWidth="0.6667"></path>
                  <path fill="#9ca3af" d="M3.6666666666666665 6.666666666666666a3 3 0 1 1 6 0 3 3 0 0 1 -6 0ZM6.666666666666666 1.6666666666666665a5 5 0 1 0 2.7573333333333334 9.171333333333333l3.202 3.2026666666666666a1 1 0 0 0 1.4146666666666665 -1.4146666666666665l-3.2026666666666666 -3.202A5 5 0 0 0 6.666666666666666 1.6666666666666665Z" strokeWidth="0.6667"></path>
                </g>
              </svg>
            </span>
            <input
              value={q} onChange={e=>setQ(e.target.value)}
              placeholder="Tìm kiếm nhanh (Ctrl + K)"
              className="w-full md:max-w-xl pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </label>
        </div>
        <div className="relative flex items-center gap-2">
          <div className="hidden sm:block text-right">
            <div className="text-sm font-medium text-slate-700">{user?.username || 'User'}</div>
            <div className="text-xs text-slate-500">{user?.roles?.[0] || 'Guest'}</div>
          </div>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="inline-flex h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 items-center justify-center text-white font-semibold hover:shadow-lg transition"
          >
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </button>
          
          {/* Dropdown menu */}
          {showMenu && (
            <div className="absolute right-0 top-10 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="text-sm font-medium text-slate-700">{user?.username}</div>
                <div className="text-xs text-slate-500">{user?.email}</div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition"
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Overlay to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </header>
  );
}
