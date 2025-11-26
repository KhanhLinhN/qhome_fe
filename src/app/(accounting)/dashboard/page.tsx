"use client";
import React from "react";
import Link from "next/link";
import { useTranslations } from 'next-intl';

export default function AccountingDashboard(){
  const t = useTranslations('AccountingDashboard');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[#02542D] mb-4">{t('title')}</h1>
      
      {/* Finance Management Section */}
      <div className="bg-white rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">💰 Quản lý Tài chính</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link 
            href="/base/finance/invoices"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">📄</div>
            <div className="font-medium text-slate-800 text-center">Hóa đơn</div>
            <div className="text-xs text-slate-500 text-center mt-1">Quản lý thu chi</div>
          </Link>

          <Link 
            href="/base/finance/pricing-tiers"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">📊</div>
            <div className="font-medium text-slate-800 text-center">Bậc giá</div>
            <div className="text-xs text-slate-500 text-center mt-1">Quản lý bậc giá</div>
          </Link>

          <Link 
            href="/base/billingCycles"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">📅</div>
            <div className="font-medium text-slate-800 text-center">Kỳ thu</div>
            <div className="text-xs text-slate-500 text-center mt-1">Quản lý kỳ thu</div>
          </Link>
        </div>
      </div>

      {/* Water & Electric Management */}
      <div className="bg-white rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">💧⚡ Quản lý Điện Nước</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            href="/base/readingCycles"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">📈</div>
            <div className="font-medium text-slate-800 text-center">Kỳ đọc</div>
            <div className="text-xs text-slate-500 text-center mt-1">Kỳ đọc chỉ số</div>
          </Link>

          <Link 
            href="/base/readingAssign"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">📝</div>
            <div className="font-medium text-slate-800 text-center">Phân công</div>
            <div className="text-xs text-slate-500 text-center mt-1">Phân công đọc</div>
          </Link>

          <Link 
            href="/base/meter-management"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">⚙️</div>
            <div className="font-medium text-slate-800 text-center">Đồng hồ</div>
            <div className="text-xs text-slate-500 text-center mt-1">Quản lý đồng hồ</div>
          </Link>

          <Link 
            href="/base/billingCycles/manage"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">🔧</div>
            <div className="font-medium text-slate-800 text-center">Quản lý kỳ</div>
            <div className="text-xs text-slate-500 text-center mt-1">Quản lý kỳ thu</div>
          </Link>
        </div>
      </div>

      {/* Building & Unit Management */}
      <div className="bg-white rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">🏢 Quản lý Tòa nhà & Căn hộ</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link 
            href="/base/building/buildingList"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">🏢</div>
            <div className="font-medium text-slate-800 text-center">Tòa nhà</div>
            <div className="text-xs text-slate-500 text-center mt-1">Quản lý tòa nhà</div>
          </Link>

          <Link 
            href="/base/unit/unitList"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">🏠</div>
            <div className="font-medium text-slate-800 text-center">Căn hộ</div>
            <div className="text-xs text-slate-500 text-center mt-1">Quản lý căn hộ</div>
          </Link>

          <Link 
            href="/base/household/householdList"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">👨‍👩‍👧‍👦</div>
            <div className="font-medium text-slate-800 text-center">Hộ dân</div>
            <div className="text-xs text-slate-500 text-center mt-1">Quản lý hộ dân</div>
          </Link>
        </div>
      </div>

      {/* Account Management */}
      <div className="bg-white rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">👥 Quản lý Tài khoản</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link 
            href="/accountList"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">📋</div>
            <div className="font-medium text-slate-800 text-center">Danh sách</div>
            <div className="text-xs text-slate-500 text-center mt-1">Danh sách tài khoản</div>
          </Link>

          <Link 
            href="/accountNewStaff"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">🧑‍💼</div>
            <div className="font-medium text-slate-800 text-center">Nhân viên</div>
            <div className="text-xs text-slate-500 text-center mt-1">Tạo tài khoản NV</div>
          </Link>

          <Link 
            href="/accountNewRe"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">🏘️</div>
            <div className="font-medium text-slate-800 text-center">Cư dân</div>
            <div className="text-xs text-slate-500 text-center mt-1">Tạo tài khoản CĐ</div>
          </Link>
        </div>
      </div>

      {/* Admin Functions */}
      <div className="bg-white rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">⚙️ Chức năng Quản trị</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link 
            href="/admin/users/permissions"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">🔐</div>
            <div className="font-medium text-slate-800 text-center">Phân quyền</div>
            <div className="text-xs text-slate-500 text-center mt-1">Quản lý phân quyền</div>
          </Link>

          <Link 
            href="/admin/roles"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">🛡️</div>
            <div className="font-medium text-slate-800 text-center">Vai trò</div>
            <div className="text-xs text-slate-500 text-center mt-1">Quản lý vai trò</div>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4">
          <div className="text-slate-500 text-sm">{t('stats.households')}</div>
          <div className="text-2xl font-semibold mt-1">—</div>
        </div>
      </div>
    </div>
  );
}

