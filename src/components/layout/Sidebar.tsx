"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import {usePathname} from "next/navigation";
import Delete from "@/src/assets/Delete.svg";

const adminItems = [
  {href:"/dashboard", label:"Dashboard", icon:"🏠"},
  {href:"/roles", label:"Phân quyền", icon:"🔑"},
  {href:"/base/project/projectList", label:"Quản lý Tenant", icon:"🏢"},
  {href:"/tenant-deletions", label:"Yêu cầu Xóa Tenant", icon:"🗑️"},
  {href:"/base/building/buildingList", label:"Quản lý Building", icon:"🏢"},
  {href:"/dashboard/residents", label:"Cư dân", icon:"👥"},
  {href:"/customer-interaction/new/newList", label:"Thông báo", icon:"🧾"},
  {href:"/dashboard/finance", label:"Tài chính", icon:"💰"},
  {href:"/dashboard/assets", label:"Tài sản", icon:"🛠️"},
  {href:"/customer-interaction/request", label:"CSKH/Ticket", icon:"🎫"},
];

const tenantOwnerItems = [
  {href:"/tenant-owner", label:"Trang chủ", icon:"🏠"},
  {href:"/tenant-owner/buildings", label:"Buildings Đang Xóa", icon:"🏗️"},
  {href:"/tenant-owner/employees", label:"Nhân viên", icon:"👥"},
  {href:"/tenant-owner/residents", label:"Cư dân", icon:"👨‍👩‍👧‍👦"},
  {href:"/tenant-owner/services", label:"Dịch vụ", icon:"🧾"},
  {href:"/tenant-owner/finance", label:"Tài chính", icon:"💰"},
  {href:"/tenant-owner/assets", label:"Tài sản", icon:"🛠️"},
  {href:"/tenant-owner/tickets", label:"CSKH/Ticket", icon:"🎫"},
  {href:"/tenant-owner/settings", label:"Cài đặt", icon:"⚙️"},
];

interface SidebarProps {
  variant?: 'admin' | 'tenant-owner';
}

export default function Sidebar({ variant = 'admin' }: SidebarProps){
  const pathname = usePathname();
  const items = variant === 'tenant-owner' ? tenantOwnerItems : adminItems;
  
  return (
    <aside className="w-60 hidden md:flex flex-col border-r border-slate-200 bg-white fixed h-full">
      <nav className="p-2 space-y-1 overflow-y-auto">
        {items.map(it=>{
          const active = pathname===it.href || pathname.startsWith(it.href+"/");
          return (
            <Link key={it.href} href={it.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                ${active ? "bg-[#6B9B6E] text-white" : "text-slate-700 hover:bg-slate-100"}`}>
              <span className="w-5 text-center flex items-center justify-center">
                {it.icon === "delete" ? (
                  <Image src={Delete} alt="Delete" width={20} height={20} className={active ? "brightness-0 invert" : ""} />
                ) : (
                  it.icon
                )}
              </span>
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
