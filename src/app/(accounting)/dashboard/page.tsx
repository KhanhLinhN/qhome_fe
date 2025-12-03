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
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('sections.financeManagement.title')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link 
            href="/base/finance/invoices"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">📄</div>
            <div className="font-medium text-slate-800 text-center">{t('sections.financeManagement.invoices.title')}</div>
            <div className="text-xs text-slate-500 text-center mt-1">{t('sections.financeManagement.invoices.description')}</div>
          </Link>

          <Link 
            href="/base/finance/pricing-tiers"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">📊</div>
            <div className="font-medium text-slate-800 text-center">{t('sections.financeManagement.pricingTiers.title')}</div>
            <div className="text-xs text-slate-500 text-center mt-1">{t('sections.financeManagement.pricingTiers.description')}</div>
          </Link>

          <Link 
            href="/base/billingCycles"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">📅</div>
            <div className="font-medium text-slate-800 text-center">{t('sections.financeManagement.billingCycles.title')}</div>
            <div className="text-xs text-slate-500 text-center mt-1">{t('sections.financeManagement.billingCycles.description')}</div>
          </Link>
        </div>
      </div>

      {/* Water & Electric Management */}
      <div className="bg-white rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('sections.waterElectric.title')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            href="/base/readingCycles"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">📈</div>
            <div className="font-medium text-slate-800 text-center">{t('sections.waterElectric.readingCycles.title')}</div>
            <div className="text-xs text-slate-500 text-center mt-1">{t('sections.waterElectric.readingCycles.description')}</div>
          </Link>

          <Link 
            href="/base/readingAssign"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">📝</div>
            <div className="font-medium text-slate-800 text-center">{t('sections.waterElectric.readingAssign.title')}</div>
            <div className="text-xs text-slate-500 text-center mt-1">{t('sections.waterElectric.readingAssign.description')}</div>
          </Link>

          <Link 
            href="/base/meter-management"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">⚙️</div>
            <div className="font-medium text-slate-800 text-center">{t('sections.waterElectric.meterManagement.title')}</div>
            <div className="text-xs text-slate-500 text-center mt-1">{t('sections.waterElectric.meterManagement.description')}</div>
          </Link>

          <Link 
            href="/base/billingCycles/manage"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">🔧</div>
            <div className="font-medium text-slate-800 text-center">{t('sections.waterElectric.billingCyclesManage.title')}</div>
            <div className="text-xs text-slate-500 text-center mt-1">{t('sections.waterElectric.billingCyclesManage.description')}</div>
          </Link>
        </div>
      </div>

      {/* Building & Unit Management */}
      <div className="bg-white rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('sections.buildingUnit.title')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link 
            href="/base/building/buildingList"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">🏢</div>
            <div className="font-medium text-slate-800 text-center">{t('sections.buildingUnit.buildings.title')}</div>
            <div className="text-xs text-slate-500 text-center mt-1">{t('sections.buildingUnit.buildings.description')}</div>
          </Link>

          <Link 
            href="/base/unit/unitList"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">🏠</div>
            <div className="font-medium text-slate-800 text-center">{t('sections.buildingUnit.units.title')}</div>
            <div className="text-xs text-slate-500 text-center mt-1">{t('sections.buildingUnit.units.description')}</div>
          </Link>

          <Link 
            href="/base/household/householdList"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">👨‍👩‍👧‍👦</div>
            <div className="font-medium text-slate-800 text-center">{t('sections.buildingUnit.households.title')}</div>
            <div className="text-xs text-slate-500 text-center mt-1">{t('sections.buildingUnit.households.description')}</div>
          </Link>
        </div>
      </div>

      {/* Account Management */}
      <div className="bg-white rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('sections.accountManagement.title')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link 
            href="/accountList"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">📋</div>
            <div className="font-medium text-slate-800 text-center">{t('sections.accountManagement.accountList.title')}</div>
            <div className="text-xs text-slate-500 text-center mt-1">{t('sections.accountManagement.accountList.description')}</div>
          </Link>

          <Link 
            href="/accountNewStaff"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">🧑‍💼</div>
            <div className="font-medium text-slate-800 text-center">{t('sections.accountManagement.createStaff.title')}</div>
            <div className="text-xs text-slate-500 text-center mt-1">{t('sections.accountManagement.createStaff.description')}</div>
          </Link>

          <Link 
            href="/accountNewRe"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">🏘️</div>
            <div className="font-medium text-slate-800 text-center">{t('sections.accountManagement.createResident.title')}</div>
            <div className="text-xs text-slate-500 text-center mt-1">{t('sections.accountManagement.createResident.description')}</div>
          </Link>
        </div>
      </div>

      {/* Admin Functions */}
      <div className="bg-white rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('sections.adminFunctions.title')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link 
            href="/admin/users/permissions"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">🔐</div>
            <div className="font-medium text-slate-800 text-center">{t('sections.adminFunctions.permissions.title')}</div>
            <div className="text-xs text-slate-500 text-center mt-1">{t('sections.adminFunctions.permissions.description')}</div>
          </Link>

          <Link 
            href="/admin/roles"
            className="flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-lg hover:border-[#02542D] hover:bg-green-50 transition group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition">🛡️</div>
            <div className="font-medium text-slate-800 text-center">{t('sections.adminFunctions.roles.title')}</div>
            <div className="text-xs text-slate-500 text-center mt-1">{t('sections.adminFunctions.roles.description')}</div>
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

