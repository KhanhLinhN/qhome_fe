'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/src/contexts/AuthContext';

type DashboardVariant = 'admin' | 'technician' | 'tenant-owner';

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const { user } = useAuth();

  const normalizedRoles = user?.roles?.map(role => role.toLowerCase()) ?? [];

  const resolvedVariant: DashboardVariant =
    normalizedRoles.includes('admin')
      ? 'admin'
      : normalizedRoles.includes('technician')
        ? 'technician'
        : normalizedRoles.includes('tenant-owner') || normalizedRoles.includes('unit_owner')
          ? 'tenant-owner'
          : 'admin'; // Default to admin

  // Admin sections
  const adminSections = (
    <>
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

      {/* Asset Management */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Quản lý tài sản
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          <Link 
            href="/base/asset-management"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">🔧</div>
            <div className="font-medium text-slate-800 text-center">Quản lý tài sản</div>
            <div className="text-xs text-slate-500 text-center mt-1">Quản lý tài sản</div>
          </Link>

          <Link 
            href="/base/meter-management"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">⚙️</div>
            <div className="font-medium text-slate-800 text-center">Quản lý đồng hồ</div>
            <div className="text-xs text-slate-500 text-center mt-1">Quản lý đồng hồ đo</div>
          </Link>
        </div>
      </div>

      {/* Services */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Quản lý dịch vụ
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link 
            href="/base/serviceCateList"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">🗂️</div>
            <div className="font-medium text-slate-800 text-center">Danh mục dịch vụ</div>
            <div className="text-xs text-slate-500 text-center mt-1">Quản lý danh mục</div>
          </Link>

          <Link 
            href="/base/serviceList"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">🧾</div>
            <div className="font-medium text-slate-800 text-center">Danh sách dịch vụ</div>
            <div className="text-xs text-slate-500 text-center mt-1">Xem tất cả dịch vụ</div>
          </Link>

          <Link 
            href="/base/serviceNew"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">➕</div>
            <div className="font-medium text-slate-800 text-center">Tạo dịch vụ</div>
            <div className="text-xs text-slate-500 text-center mt-1">Tạo dịch vụ mới</div>
          </Link>
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

      {/* Resident Interaction */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Tương tác với cư dân
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link 
            href="/customer-interaction/new/newList"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">📰</div>
            <div className="font-medium text-slate-800 text-center">Tin tức</div>
            <div className="text-xs text-slate-500 text-center mt-1">Quản lý tin tức</div>
          </Link>

          <Link 
            href="/customer-interaction/notiList"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">🔔</div>
            <div className="font-medium text-slate-800 text-center">Thông báo</div>
            <div className="text-xs text-slate-500 text-center mt-1">Quản lý thông báo</div>
          </Link>

          <Link 
            href="/customer-interaction/request"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">📨</div>
            <div className="font-medium text-slate-800 text-center">Yêu cầu hỗ trợ</div>
            <div className="text-xs text-slate-500 text-center mt-1">Xử lý yêu cầu</div>
          </Link>
        </div>
      </div>
    </>
  );

  // Technician sections
  const technicianSections = (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Nhiệm vụ</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">—</p>
            </div>
            <div className="text-3xl">📋</div>
          </div>
        </div>
      </div>

      {/* Accounts */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Tài khoản
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link 
            href="/staffProfile"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">👤</div>
            <div className="font-medium text-slate-800 text-center">Thông tin cá nhân</div>
            <div className="text-xs text-slate-500 text-center mt-1">Xem thông tin</div>
          </Link>
        </div>
      </div>

      {/* Water & Electric Management */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Quản lý điện nước
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link 
            href="/base/showAssign"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">🧾</div>
            <div className="font-medium text-slate-800 text-center">Danh sách nhiệm vụ</div>
            <div className="text-xs text-slate-500 text-center mt-1">Xem nhiệm vụ được phân công</div>
          </Link>
        </div>
      </div>

      {/* Resident Interaction */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Tương tác với cư dân
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link 
            href="/customer-interaction/request"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">📨</div>
            <div className="font-medium text-slate-800 text-center">Yêu cầu hỗ trợ</div>
            <div className="text-xs text-slate-500 text-center mt-1">Xử lý yêu cầu</div>
          </Link>
        </div>
      </div>
    </>
  );

  // Tenant-owner sections
  const tenantOwnerSections = (
    <>
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
              <p className="text-sm text-gray-600">Nhân viên</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">—</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>
      </div>

      {/* Management */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Quản lý
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link 
            href="/tenant-owner/buildings"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">🏢</div>
            <div className="font-medium text-slate-800 text-center">Tòa nhà</div>
            <div className="text-xs text-slate-500 text-center mt-1">Quản lý tòa nhà</div>
          </Link>

          <Link 
            href="/tenant-owner/employees"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">👥</div>
            <div className="font-medium text-slate-800 text-center">Nhân viên</div>
            <div className="text-xs text-slate-500 text-center mt-1">Quản lý nhân viên</div>
          </Link>
        </div>
      </div>
    </>
  );

  const renderSections = () => {
    switch (resolvedVariant) {
      case 'admin':
        return adminSections;
      case 'technician':
        return technicianSections;
      case 'tenant-owner':
        return tenantOwnerSections;
      default:
        return adminSections;
    }
  };

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

      {renderSections()}
    </div>
  );
}
