"use client";
import React from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useAuth} from "@/src/contexts/AuthContext";

type SidebarVariant = "admin" | "tenant-owner" | "technician";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const adminSections: NavSection[] = [
  {
    title: "Tổng quan",
    items: [
      {href: "/dashboard", label: "Dashboard", icon: "📊"},
    ],
  },
  // {
  //   title: "Quản trị hệ thống",
  //   items: [
  //     {href: "/roles", label: "Phân quyền", icon: "🛡️"},
  //     {href: "/tenants", label: "Tenant", icon: "🏢"},
  //     {href: "/tenant-deletions", label: "Yêu cầu xóa Tenant", icon: "🗑️"},
  //     {href: "/users/permissions", label: "Phân quyền user", icon: "⚙️"},
  //   ],
  // },
  {
    title: "Tài khoản",
    items: [
      {href: "/accountList", label: "Danh sách tài khoản", icon: "👥"},
      {href: "/accountNewStaff", label: "Tạo tài khoản nhân viên", icon: "🧑‍💼"},
      {href: "/accountNewRe", label: "Tạo tài khoản cư dân", icon: "🏘️"},
    ],
  },
  {
    title: "Tòa nhà & cư dân",
    items: [
      {href: "/base/building/buildingList", label: "Quản lý Building", icon: "🏢"},
      {href: "/base/residentView", label: "Danh sách cư dân", icon: "👨‍👩‍👧‍👦"},
      {href: "/base/regisresiView", label: "Đăng ký cư dân", icon: "📝"},
      {href: "/base/vehicles/vehicleAll", label: "Quản lý phương tiện", icon: "🚗"},
    ],
  },
  {
    title: "Dịch vụ",
    items: [
      {href: "/base/serviceCateList", label: "Nhóm dịch vụ", icon: "🗂️"},
      {href: "/base/serviceList", label: "Danh sách dịch vụ", icon: "🧾"},
      {href: "/base/serviceNew", label: "Tạo dịch vụ", icon: "➕"},
      // {href: "/base/serviceType", label: "Loại dịch vụ", icon: "📂"},
      // {href: "/base/serviceRequest", label: "Yêu cầu dịch vụ", icon: "📬"},
    ],
  },
  {
    title: "Điện nước",
    items: [
      {href: "/base/readingCycles", label: "Chu kỳ chỉ số", icon: "📈"},
      // {href: "/base/readingSessions", label: "Phiên đọc chỉ số", icon: "🧮"},
      {href: "/base/readingAssign", label: "Phân công đọc", icon: "📝"},
      {href: "/base/showAssign", label: "Danh sách phân công", icon: "📋"},
      // {href: "/base/waterShow", label: "Theo dõi nước", icon: "💧"},
      {href: "/base/billingCycles", label: "Chu kỳ thanh toán", icon: "💡"},
    ],
  },
  {
    title: "Tương tác cư dân",
    items: [
      {href: "/customer-interaction/new/newList", label: "Tin tức", icon: "📰"},
      {href: "/customer-interaction/notiList", label: "Thông báo", icon: "🔔"},
      // {href: "/customer-interaction/request", label: "Yêu cầu hỗ trợ", icon: "📨"},
      {href: "/customer-interaction/requestTicket", label: "Ticket", icon: "🎫"},
    ],
  },
];

const technicianSections: NavSection[] = [
  {
    title: "Tổng quan",
    items: [
      {href: "/dashboard", label: "Dashboard", icon: "📊"},
    ],
  },
  {
    title: "Dịch vụ",
    items: [
      // {href: "base/showAssign", label: "Danh sách nhiệm vụ", icon: "🧾"},
    ],
  },
  {
    title: "Điện nước",
    items: [
      {href: "base/showAssign", label: "Danh sách nhiệm vụ", icon: "🧾"},
    ],
  },
  {
    title: "Tương tác cư dân",
    items: [
      // {href: "/customer-interaction/request", label: "Yêu cầu hỗ trợ", icon: "📨"},
    ],
  },
];

const tenantOwnerSections: NavSection[] = [
  {
    title: "Tổng quan",
    items: [
      {href: "/tenant-owner", label: "Trang chủ", icon: "🏠"},
    ],
  },
  {
    title: "Quản lý",
    items: [
      {href: "/tenant-owner/buildings", label: "Tòa nhà", icon: "🏢"},
      {href: "/tenant-owner/employees", label: "Nhân viên", icon: "👥"},
    ],
  },
];

const menuConfig: Record<SidebarVariant, NavSection[]> = {
  admin: adminSections,
  technician: technicianSections,
  "tenant-owner": tenantOwnerSections,
};

interface SidebarProps {
  variant?: SidebarVariant;
}

export default function Sidebar({variant = "admin"}: SidebarProps) {
  const pathname = usePathname();
  const {user} = useAuth();

  const normalizedRoles = user?.roles?.map(role => role.toLowerCase()) ?? [];

  const resolvedVariant: SidebarVariant =
    variant === "admin"
      ? normalizedRoles.includes("admin")
        ? "admin"
        : normalizedRoles.includes("technician")
          ? "technician"
          : "admin"
      : variant;

  const sections = menuConfig[resolvedVariant];

  return (
    <aside className="w-60 hidden md:flex flex-col border-r border-slate-200 bg-white fixed h-screen">
      <nav className="p-3 space-y-6 overflow-y-auto">
        {sections.map(section => (
          <div key={section.title} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 px-2">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map(item => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      active ? "bg-[#6B9B6E] text-white" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span aria-hidden className="w-5 text-center flex items-center justify-center">
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
