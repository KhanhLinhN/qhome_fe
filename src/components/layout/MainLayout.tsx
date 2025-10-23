import React from "react";
import Sidebar from "@/src/components/layout/Sidebar";
import Topbar from "@/src/components/layout/Topbar";

export default function MainLayout({children}:{children:React.ReactNode}) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar trái */}
      <Sidebar />
      {/* Nội dung + Topbar */}
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="p-4 md:p-6">
          <div className="max-w-[1280px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
