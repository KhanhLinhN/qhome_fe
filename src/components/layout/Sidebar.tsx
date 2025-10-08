"use client";
import React from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";

const items = [
  {href:"/dashboard", label:"Dashboard", icon:"🏠"},
  {href:"/dashboard/residents", label:"Cư dân", icon:"👥"},
  {href:"/dashboard/services", label:"Dịch vụ", icon:"🧾"},
  {href:"/dashboard/finance", label:"Tài chính", icon:"💰"},
  {href:"/dashboard/assets", label:"Tài sản", icon:"🛠️"},
  {href:"/dashboard/tickets", label:"CSKH/Ticket", icon:"🎫"},
  {href:"/dashboard/settings", label:"Cài đặt", icon:"⚙️"},
];

export default function Sidebar(){
  const pathname = usePathname();
  return (
    <aside className="w-60 hidden md:flex flex-col border-r border-slate-200 bg-white">
      <nav className="p-2 space-y-1">
        {items.map(it=>{
          const active = pathname===it.href || pathname.startsWith(it.href+"/");
          return (
            <Link key={it.href} href={it.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"}`}>
              <span className="w-5 text-center">{it.icon}</span>
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
