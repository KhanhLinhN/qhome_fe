'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import EditTable from '@/src/assets/EditTable.svg';
import { useUnitPage } from '@/src/hooks/useUnitPage';
import { Unit } from '@/src/types/unit';

type UnitWithContext = Unit & {
  buildingId: string;
  buildingName?: string | null;
  buildingCode?: string | null;
};

const normalizeText = (value?: string | null) => value?.toLowerCase().trim() ?? '';

export default function UnitListPage() {
  const t = useTranslations('Unit');
  const router = useRouter();
  const { buildings, loading, error, refresh } = useUnitPage();

  const [selectedBuildingId, setSelectedBuildingId] = useState<'all' | string>('all');
  const [buildingSearch, setBuildingSearch] = useState('');
  const [unitSearch, setUnitSearch] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const unitsWithContext = useMemo<UnitWithContext[]>(() => {
    const result: UnitWithContext[] = [];

    buildings.forEach((building) => {
      building.units?.forEach((unit) => {
        result.push({
          ...unit,
          buildingId: building.id,
          buildingName: building.name,
          buildingCode: building.code,
        });
      });
    });

    return result;
  }, [buildings]);

  useEffect(() => {
    if (selectedBuildingId === 'all') {
      return;
    }

    const buildingExists = buildings.some((building) => building.id === selectedBuildingId);

    if (!buildingExists) {
      setSelectedBuildingId('all');
      return;
    }
  }, [buildings, selectedBuildingId]);

  const filteredBuildings = useMemo(() => {
    const query = normalizeText(buildingSearch);
    if (!query) {
      return buildings;
    }

    return buildings.filter((building) => {
      const buildingMatch = normalizeText(`${building.name ?? ''} ${building.code ?? ''}`).includes(query);
      return buildingMatch;
    });
  }, [buildingSearch, buildings]);

  const unitsToDisplay = useMemo(() => {
    const unitQuery = normalizeText(unitSearch);

    let scopedUnits = unitsWithContext;

    if (selectedBuildingId !== 'all') {
      scopedUnits = scopedUnits.filter((unit) => unit.buildingId === selectedBuildingId);
    }

    if (!unitQuery) {
      return scopedUnits;
    }

    return scopedUnits.filter((unit) => {
      const combined = [
        unit.code,
        unit.name,
        unit.floor?.toString(),
        unit.areaM2?.toString(),
        unit.ownerName,
        unit.ownerContact,
        unit.buildingName,
        unit.buildingCode,
      ]
        .map(normalizeText)
        .join(' ');

      return combined.includes(unitQuery);
    });
  }, [
    selectedBuildingId,
    unitSearch,
    unitsWithContext,
  ]);

  const handleSelectAll = () => {
    setSelectedBuildingId('all');
  };

  const handleSelectBuilding = (buildingId: string) => {
    setSelectedBuildingId(buildingId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center px-[41px] py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary-2"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center px-[41px] py-12">
        <div className="text-center">
          <p className="mb-4 text-red-600">{t('error')}</p>
          <button
            onClick={refresh}
            className="rounded-md bg-primary-2 px-4 py-2 text-white transition-colors hover:bg-primary-3"
          >
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-[#02542D]">{t('unitList')}</h1>
        <button
          onClick={() => router.push('/base/unit/unitNew')}
          className="rounded-md bg-[#02542D] px-4 py-2 text-white transition-colors hover:bg-[#024428]"
        >
          {t('addUnit')}
        </button>
      </div>

      <div
        className={`relative grid gap-6 ${
          isSidebarCollapsed ? 'lg:grid-cols-1' : 'lg:grid-cols-[320px_1fr]'
        }`}
      >
        {!isSidebarCollapsed && (
          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Tòa nhà</h2>
                  <p className="text-sm text-slate-500">Chọn tòa nhà để lọc</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition hover:border-emerald-300 hover:text-emerald-700"
                >
                  <span className="text-base leading-none">{'«'}</span>
                </button>
              </div>
              <div className="px-5 py-4">
                <div className="relative">
                  <input
                    type="text"
                    value={buildingSearch}
                    onChange={(event) => setBuildingSearch(event.target.value)}
                    placeholder="Tìm kiếm tòa nhà"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
                      selectedBuildingId === 'all'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <span>Tất cả</span>
                    <span className="text-xs text-slate-500">{unitsWithContext.length}</span>
                  </button>

                  <div className="max-h-[420px] space-y-1 overflow-y-auto pr-1">
                    {filteredBuildings.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-slate-500">
                        Không có dữ liệu
                      </div>
                    ) : (
                      filteredBuildings.map((building) => (
                        <button
                          key={building.id}
                          type="button"
                          onClick={() => handleSelectBuilding(building.id)}
                          className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
                            selectedBuildingId === building.id
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-transparent hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex flex-1 flex-col">
                            <span className="font-semibold text-[#02542D]">{building.name}</span>
                            <span className="text-xs text-slate-500">{building.code}</span>
                          </div>
                          <span className="text-xs font-medium text-slate-500">
                            {building.units?.length ?? 0}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}

        <section className="relative rounded-2xl border border-slate-200 bg-white shadow-sm">
          {isSidebarCollapsed && (
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(false)}
              className="absolute left-0 top-5 z-10 inline-flex -translate-x-1/2 items-center justify-center rounded-full border border-slate-300 bg-white p-2 text-slate-500 shadow transition hover:border-emerald-300 hover:text-emerald-700"
            >
              <span className="text-sm leading-none">{'»'}</span>
            </button>
          )}
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{t('unitList')}</h2>
              <p className="text-sm text-slate-500">
                {selectedBuildingId === 'all'
                  ? `Tổng cộng: ${unitsToDisplay.length} căn hộ`
                  : `Tòa nhà được chọn: ${unitsToDisplay.length} căn hộ`}
              </p>
            </div>
            <div className="w-full max-w-xs">
              <input
                type="text"
                value={unitSearch}
                onChange={(event) => setUnitSearch(event.target.value)}
                placeholder="Tìm kiếm căn hộ"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">
                    {t('unitCode')}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">
                    {t('buildingName')}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">
                    {t('floor')}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">
                    {t('areaM2')}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">
                    {t('status')}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">
                    {t('ownerName')}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">
                    {t('action')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {unitsToDisplay.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-sm text-slate-500"
                    >
                      {t('noUnit')}
                    </td>
                  </tr>
                ) : (
                  unitsToDisplay.map((unit) => (
                    <tr key={unit.id} className="hover:bg-emerald-50/40">
                      <td className="px-4 py-3 font-medium text-slate-800">{unit.code}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="flex flex-col">
                          <span>{unit.buildingName ?? '-'}</span>
                          <span className="text-xs text-slate-500">{unit.buildingCode ?? '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{unit.floor ?? '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{unit.areaM2 ?? '-'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium ${
                            unit.status === 'ACTIVE' || unit.status === 'Active'
                              ? 'rounded bg-emerald-100 text-emerald-700'
                              : 'rounded bg-slate-100 text-slate-600'
                          }`}
                        >
                          {unit.status === 'ACTIVE' || unit.status === 'Active' ? t('active') : t('inactive')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="flex flex-col">
                          <span>{unit.ownerName ?? '-'}</span>
                          {unit.ownerContact && (
                            <span className="text-xs text-slate-500">{unit.ownerContact}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/base/unit/unitDetail/${unit.id}`}
                          className="inline-flex items-center"
                        >
                          <Image src={EditTable} alt="View Detail" width={24} height={24} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

