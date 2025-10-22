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
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">🔍</span>
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
