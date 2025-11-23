'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import EditTable from '@/src/assets/EditTable.svg';
import { useUnitPage } from '@/src/hooks/useUnitPage';
import { Unit } from '@/src/types/unit';
import { updateUnitStatus } from '@/src/services/base/unitService';
import PopupConfirm from '@/src/components/common/PopupComfirm';

type UnitWithContext = Unit & {
  buildingId: string;
  buildingName?: string | null;
  buildingCode?: string | null;
  buildingStatus?: string | null;
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

  // Change unit status with confirmation
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedUnitStatus, setSelectedUnitStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const unitsWithContext = useMemo<UnitWithContext[]>(() => {
    const result: UnitWithContext[] = [];

    buildings.forEach((building) => {
      building.units?.forEach((unit) => {
        result.push({
          ...unit,
          buildingId: building.id,
          buildingName: building.name,
          buildingCode: building.code,
          buildingStatus: building.status,
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

  const onUnitStatusChange = (unitId: string) => {
    const unit = unitsToDisplay.find(u => u.id === unitId);
    setSelectedUnitId(unitId);
    setSelectedUnitStatus(unit?.status ?? null);
    setConfirmOpen(true);
    setErrorMessage(null);
  };

  const handleConfirmChange = async () => {
    if (!selectedUnitId || !selectedUnitStatus) {
      setConfirmOpen(false);
      return;
    }
    const newStatus = selectedUnitStatus?.toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateUnitStatus(selectedUnitId, newStatus);
      
      setConfirmOpen(false);
      setSelectedUnitId(null);
      setSelectedUnitStatus(null);
      window.location.reload();
    } catch (e: any) {
      console.error('Error updating unit status:', e);
      const errorMsg = e?.response?.data?.message || e?.message || 'Cập nhật trạng thái căn hộ thất bại';
      setErrorMessage(errorMsg);
      setConfirmOpen(false);
      // Auto hide error message after 5 seconds
      setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
    }
  };

  const handleCloseConfirm = () => {
    setConfirmOpen(false);
    setSelectedUnitId(null);
    setSelectedUnitStatus(null);
    setErrorMessage(null);
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
                      filteredBuildings.map((building) => {
                        const isInactive = building.status?.toUpperCase() === 'INACTIVE';
                        return (
                          <button
                            key={building.id}
                            type="button"
                            onClick={() => handleSelectBuilding(building.id)}
                            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
                              isInactive
                                ? 'border-slate-300 bg-slate-100 text-slate-500 cursor-default'
                                : selectedBuildingId === building.id
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-transparent hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex flex-1 flex-col">
                              <span className={`font-semibold ${isInactive ? 'text-slate-500' : 'text-[#02542D]'}`}>
                                {building.name}
                              </span>
                              <span className="text-xs text-slate-500">{building.code}</span>
                            </div>
                            <span className="text-xs font-medium text-slate-500">
                              {building.units?.length ?? 0}
                            </span>
                          </button>
                        );
                      })
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
                  unitsToDisplay.map((unit) => {
                    const isBuildingInactive = unit.buildingStatus?.toUpperCase() === 'INACTIVE';
                    const isUnitInactive = unit.status?.toUpperCase() === 'INACTIVE';
                    const isDisabled = isBuildingInactive || isUnitInactive;
                    return (
                      <tr 
                        key={unit.id} 
                        className={isDisabled ? 'bg-slate-100' : 'hover:bg-emerald-50/40'}
                      >
                        <td className={`px-4 py-3 font-medium ${isDisabled ? 'text-slate-500' : 'text-slate-800'}`}>
                          {unit.code}
                        </td>
                        <td className={`px-4 py-3 ${isDisabled ? 'text-slate-500' : 'text-slate-600'}`}>
                          <div className="flex flex-col">
                            <span>{unit.buildingName ?? '-'}</span>
                            <span className="text-xs text-slate-500">{unit.buildingCode ?? '-'}</span>
                          </div>
                        </td>
                        <td className={`px-4 py-3 ${isDisabled ? 'text-slate-500' : 'text-slate-600'}`}>
                          {unit.floor ?? '-'}
                        </td>
                        <td className={`px-4 py-3 ${isDisabled ? 'text-slate-500' : 'text-slate-600'}`}>
                          {unit.areaM2 ?? '-'}
                        </td>
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
                        <td className={`px-4 py-3 ${isDisabled ? 'text-slate-500' : 'text-slate-600'}`}>
                          <div className="flex flex-col">
                            <span>{unit.ownerName ?? '-'}</span>
                            {unit.ownerContact && (
                              <span className="text-xs text-slate-500">{unit.ownerContact}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {unit.status === 'INACTIVE' || unit.status === 'Inactive' ? (
                              <span className="inline-flex items-center cursor-not-allowed opacity-50">
                                <Image src={EditTable} alt="View Detail" width={24} height={24} />
                              </span>
                            ) : (
                              <Link
                                href={`/base/unit/unitDetail/${unit.id}`}
                                className="inline-flex items-center"
                              >
                                <Image src={EditTable} alt="View Detail" width={24} height={24} />
                              </Link>
                            )}
                            {!isBuildingInactive && (
                              <button
                                type="button"
                                onClick={() => onUnitStatusChange(unit.id)}
                                className="w-[34px] h-[34px] flex items-center justify-center rounded-md bg-white border border-gray-300 hover:bg-gray-100 transition"
                                title="Thay đổi trạng thái"
                              >
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  viewBox="0 0 16 16" 
                                  height="16" 
                                  width="16"
                                  fill="currentColor"
                                >
                                  <g fill="none" fillRule="nonzero">
                                    <path d="M16 0v16H0V0h16ZM8.395333333333333 15.505333333333333l-0.007333333333333332 0.0013333333333333333 -0.047333333333333324 0.023333333333333334 -0.013333333333333332 0.0026666666666666666 -0.009333333333333332 -0.0026666666666666666 -0.047333333333333324 -0.023333333333333334c-0.006666666666666666 -0.0026666666666666666 -0.012666666666666666 -0.0006666666666666666 -0.016 0.003333333333333333l-0.0026666666666666666 0.006666666666666666 -0.011333333333333334 0.2853333333333333 0.003333333333333333 0.013333333333333332 0.006666666666666666 0.008666666666666666 0.06933333333333333 0.049333333333333326 0.009999999999999998 0.0026666666666666666 0.008 -0.0026666666666666666 0.06933333333333333 -0.049333333333333326 0.008 -0.010666666666666666 0.0026666666666666666 -0.011333333333333334 -0.011333333333333334 -0.2846666666666666c-0.0013333333333333333 -0.006666666666666666 -0.005999999999999999 -0.011333333333333334 -0.011333333333333334 -0.011999999999999999Zm0.17666666666666667 -0.07533333333333334 -0.008666666666666666 0.0013333333333333333 -0.12333333333333332 0.062 -0.006666666666666666 0.006666666666666666 -0.002 0.007333333333333332 0.011999999999999999 0.2866666666666666 0.003333333333333333 0.008 0.005333333333333333 0.004666666666666666 0.134 0.062c0.008 0.0026666666666666666 0.015333333333333332 0 0.019333333333333334 -0.005333333333333333l0.0026666666666666666 -0.009333333333333332 -0.02266666666666667 -0.4093333333333333c-0.002 -0.008 -0.006666666666666666 -0.013333333333333332 -0.013333333333333332 -0.014666666666666665Zm-0.4766666666666666 0.0013333333333333333a0.015333333333333332 0.015333333333333332 0 0 0 -0.018 0.004l-0.004 0.009333333333333332 -0.02266666666666667 0.4093333333333333c0 0.008 0.004666666666666666 0.013333333333333332 0.011333333333333334 0.016l0.009999999999999998 -0.0013333333333333333 0.134 -0.062 0.006666666666666666 -0.005333333333333333 0.0026666666666666666 -0.007333333333333332 0.011333333333333334 -0.2866666666666666 -0.002 -0.008 -0.006666666666666666 -0.006666666666666666 -0.12266666666666666 -0.06133333333333333Z" strokeWidth="0.6667"></path>
                                    <path fill="currentColor" d="M13.333333333333332 9.333333333333332a1 1 0 0 1 0.09599999999999999 1.9953333333333332L13.333333333333332 11.333333333333332H5.080666666666667l0.96 0.96a1 1 0 0 1 -1.3386666666666667 1.4826666666666668l-0.076 -0.06866666666666665 -2.5526666666666666 -2.5533333333333332c-0.6493333333333333 -0.6493333333333333 -0.22666666666666668 -1.7446666666666666 0.6606666666666666 -1.8166666666666667l0.09333333333333334 -0.004H13.333333333333332ZM9.959999999999999 2.293333333333333a1 1 0 0 1 1.338 -0.06933333333333333l0.076 0.06866666666666665 2.5526666666666666 2.5533333333333332c0.6493333333333333 0.6493333333333333 0.22666666666666668 1.7446666666666666 -0.6606666666666666 1.8166666666666667l-0.09333333333333334 0.004H2.6666666666666665a1 1 0 0 1 -0.09599999999999999 -1.9953333333333332L2.6666666666666665 4.666666666666666h8.252666666666666l-0.96 -0.96a1 1 0 0 1 0 -1.4133333333333333Z" strokeWidth="0.6667"></path>
                                  </g>
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <PopupConfirm
        isOpen={confirmOpen}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmChange}
        popupTitle="Xác nhận thay đổi trạng thái"
        popupContext={selectedUnitStatus?.toUpperCase() === 'ACTIVE' 
          ? 'Bạn có chắc muốn vô hiệu hoá căn hộ này?' 
          : 'Bạn có chắc muốn kích hoạt căn hộ này?'}
        isDanger={false}
      />
      {errorMessage && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50">
          {errorMessage}
        </div>
      )}
    </div>
  );
}

