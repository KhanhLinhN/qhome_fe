'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function AssetManagementPage() {
  const t = useTranslations('AssetManagement');
  
  const actions = [
    {
      label: t('actions.buildingList.label'),
      description: t('actions.buildingList.description'),
      href: '/base/building/buildingList',
    },
    {
      label: t('actions.meterManagement.label'),
      description: t('actions.meterManagement.description'),
      href: '/base/meter-management',
    },
    {
      label: t('actions.createMeter.label'),
      description: t('actions.createMeter.description'),
      href: '/base/building/buildingList',
    },
    {
      label: t('actions.readingAssignment.label'),
      description: t('actions.readingAssignment.description'),
      href: '/base/readingAssign',
    },
  ];

  return (
    <div className="px-[41px] py-12 space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-gray-500">{t('subtitle')}</p>
        <h1 className="text-3xl font-semibold text-[#02542D]">{t('title')}</h1>
        <p className="text-sm text-gray-600 max-w-2xl">
          {t('description')}
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-3">
        {actions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className="border border-gray-200 rounded-2xl p-6 space-y-4 bg-white shadow-sm hover:shadow-md transition"
          >
            <h2 className="text-lg font-semibold text-[#02542D]">{action.label}</h2>
            <p className="text-sm text-gray-600">{action.description}</p>
            <span className="text-sm font-semibold text-[#02542D]">→ {t('goTo')}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

