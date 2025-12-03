'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations('Dashboard');

  return (
    <div className="min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#02542D]">Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">Tổng quan hệ thống</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Stat Card 1 */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tòa nhà</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">-</p>
            </div>
            <div className="text-3xl">🏢</div>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Căn hộ</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">-</p>
            </div>
            <div className="text-3xl">🏠</div>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cư dân</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">-</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Hóa đơn</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">-</p>
            </div>
            <div className="text-3xl">🧾</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/base/building/buildingList"
            className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <span className="text-2xl">🏢</span>
            <div>
              <p className="font-medium text-gray-900">Quản lý tòa nhà</p>
              <p className="text-sm text-gray-600">Xem danh sách tòa nhà</p>
            </div>
          </a>

          <a
            href="/base/unit/unitList"
            className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <span className="text-2xl">🏠</span>
            <div>
              <p className="font-medium text-gray-900">Quản lý căn hộ</p>
              <p className="text-sm text-gray-600">Xem danh sách căn hộ</p>
            </div>
          </a>

          <a
            href="/base/residentView"
            className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <span className="text-2xl">👥</span>
            <div>
              <p className="font-medium text-gray-900">Quản lý cư dân</p>
              <p className="text-sm text-gray-600">Xem danh sách cư dân</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

