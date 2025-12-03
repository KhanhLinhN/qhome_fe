'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations('Dashboard');

  return (
    <div className="min-h-full space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#02542D]">
          {t('title') || 'Dashboard'}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {t('subtitle') || 'Tổng quan hệ thống'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tòa nhà</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">—</p>
            </div>
            <div className="text-3xl">🏢</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Căn hộ</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">—</p>
            </div>
            <div className="text-3xl">🏠</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cư dân</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">—</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Hóa đơn</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">—</p>
            </div>
            <div className="text-3xl">🧾</div>
          </div>
        </div>
      </div>

      {/* Finance Management Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Quản lý tài chính
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link 
            href="/base/finance/invoices"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">📄</div>
            <div className="font-medium text-slate-800 text-center">Hóa đơn</div>
            <div className="text-xs text-slate-500 text-center mt-1">Quản lý hóa đơn</div>
          </Link>

          <Link 
            href="/base/finance/pricing-tiers"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">📊</div>
            <div className="font-medium text-slate-800 text-center">Bậc giá</div>
            <div className="text-xs text-slate-500 text-center mt-1">Quản lý bậc giá dịch vụ</div>
          </Link>

          <Link 
            href="/base/billingCycles"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">📅</div>
            <div className="font-medium text-slate-800 text-center">Chu kỳ thanh toán</div>
            <div className="text-xs text-slate-500 text-center mt-1">Quản lý chu kỳ</div>
          </Link>
        </div>
      </div>

      {/* Water & Electric Management */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Quản lý điện nước
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            href="/base/readingCycles"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">📈</div>
            <div className="font-medium text-slate-800 text-center">Chu kỳ đọc</div>
            <div className="text-xs text-slate-500 text-center mt-1">Quản lý chu kỳ đọc số</div>
          </Link>

          <Link 
            href="/base/readingAssign"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">📝</div>
            <div className="font-medium text-slate-800 text-center">Phân công đọc</div>
            <div className="text-xs text-slate-500 text-center mt-1">Phân công đọc số</div>
          </Link>

          <Link 
            href="/base/meter-management"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">⚙️</div>
            <div className="font-medium text-slate-800 text-center">Quản lý đồng hồ</div>
            <div className="text-xs text-slate-500 text-center mt-1">Quản lý đồng hồ đo</div>
          </Link>

          <Link 
            href="/base/billingCycles/manage"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">🔧</div>
            <div className="font-medium text-slate-800 text-center">Quản lý chu kỳ</div>
            <div className="text-xs text-slate-500 text-center mt-1">Xử lý chu kỳ</div>
          </Link>
        </div>
      </div>

      {/* Building & Unit Management */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Quản lý tòa nhà và căn hộ
        </h3>
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
            href="/base/residentView"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">👨‍👩‍👧‍👦</div>
            <div className="font-medium text-slate-800 text-center">Cư dân</div>
            <div className="text-xs text-slate-500 text-center mt-1">Quản lý cư dân</div>
          </Link>
        </div>
      </div>

      {/* Account Management */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Quản lý tài khoản
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link 
            href="/accountList"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">📋</div>
            <div className="font-medium text-slate-800 text-center">Danh sách tài khoản</div>
            <div className="text-xs text-slate-500 text-center mt-1">Xem tất cả tài khoản</div>
          </Link>

          <Link 
            href="/accountNewStaff"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">🧑‍💼</div>
            <div className="font-medium text-slate-800 text-center">Tạo tài khoản nhân viên</div>
            <div className="text-xs text-slate-500 text-center mt-1">Tạo tài khoản mới</div>
          </Link>

          <Link 
            href="/accountNewRe"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">🏘️</div>
            <div className="font-medium text-slate-800 text-center">Tạo tài khoản cư dân</div>
            <div className="text-xs text-slate-500 text-center mt-1">Đăng ký tài khoản cư dân</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
