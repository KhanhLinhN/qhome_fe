"use client";
import React from "react";

export default function Topbar(){
  const [q, setQ] = React.useState("");
  const userName = typeof window !== "undefined" ? (localStorage.getItem("userName") || "BQL Manager") : "BQL Manager";

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center">
      <div className="max-w-[1280px] mx-auto px-4 w-full flex items-center gap-3">
        <div className="flex-1">
          <label className="relative block">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">🔍</span>
            <input
              value={q} onChange={e=>setQ(e.target.value)}
              placeholder="Tìm kiếm nhanh (Ctrl + K)"
              className="w-full md:max-w-xl pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-sm text-slate-600">{userName}</span>
          <span className="inline-flex h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-emerald-400" />
        </div>
      </div>
    </header>
  );
}
