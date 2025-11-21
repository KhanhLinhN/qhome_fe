'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { getBuildings, type Building } from '@/src/services/base/buildingService';
import { getUnitsByBuilding, type Unit } from '@/src/services/base/unitService';
import {
  fetchHouseholdsByUnit,
  type HouseholdDto,
} from '@/src/services/base/householdService';

type AsyncState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
};

const DEFAULT_BUILDINGS_STATE: AsyncState<Building[]> = {
  data: [],
  loading: false,
  error: null,
};

const DEFAULT_UNITS_STATE: AsyncState<Unit[]> = {
  data: [],
  loading: false,
  error: null,
};

const DEFAULT_HOUSEHOLDS_STATE: AsyncState<HouseholdDto[]> = {
  data: [],
  loading: false,
  error: null,
};

const KIND_OPTIONS: Record<string, string> = {
  OWNER: 'Chủ sở hữu',
  TENANT: 'Người thuê',
  SERVICE: 'Dịch vụ',
};

function formatDate(value?: string | null) {
  if (!value) return 'Chưa thiết lập';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN');
}

export default function HouseholdListPage() {
  const [buildingsState, setBuildingsState] =
    useState<AsyncState<Building[]>>(DEFAULT_BUILDINGS_STATE);
  const [unitsState, setUnitsState] = useState<AsyncState<Unit[]>>(DEFAULT_UNITS_STATE);
  const [householdsState, setHouseholdsState] =
    useState<AsyncState<HouseholdDto[]>>(DEFAULT_HOUSEHOLDS_STATE);

  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');

  useEffect(() => {
    const loadBuildings = async () => {
      setBuildingsState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const data = await getBuildings();
        setBuildingsState({ data, loading: false, error: null });
      } catch (err: unknown) {
        const message =
          err?.response?.data?.message || err?.message || 'Không thể tải danh sách tòa nhà.';
        setBuildingsState({ data: [], loading: false, error: message });
      }
    };

    void loadBuildings();
  }, []);

  const handleSelectBuilding = async (buildingId: string) => {
    setSelectedBuildingId(buildingId);
    setSelectedUnitId('');
    setHouseholdsState(DEFAULT_HOUSEHOLDS_STATE);

    if (!buildingId) {
      setUnitsState(DEFAULT_UNITS_STATE);
      return;
    }

    setUnitsState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await getUnitsByBuilding(buildingId);
      setUnitsState({ data, loading: false, error: null });
    } catch (err: unknown) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tải danh sách căn hộ của tòa nhà này.';
      setUnitsState({ data: [], loading: false, error: message });
    }
  };

  const handleSelectUnit = async (unitId: string) => {
    setSelectedUnitId(unitId);
    if (!unitId) {
      setHouseholdsState(DEFAULT_HOUSEHOLDS_STATE);
      return;
    }

    setHouseholdsState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchHouseholdsByUnit(unitId);
      setHouseholdsState({ data, loading: false, error: null });
    } catch (err: unknown) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tải danh sách hộ gia đình của căn hộ.';
      setHouseholdsState({ data: [], loading: false, error: message });
    }
  };

  const buildingOptions = useMemo(
    () =>
      buildingsState.data.map((building) => ({
        value: building.id,
        label: `${building.code ?? ''} - ${building.name ?? ''}`.trim(),
      })),
    [buildingsState.data],
  );

  const unitOptions = useMemo(
    () =>
      unitsState.data.map((unit) => ({
        value: unit.id,
        label: `${unit.code ?? ''} (Tầng ${unit.floor ?? '—'})`,
      })),
    [unitsState.data],
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Quản lý hộ gia đình</h1>
            <p className="text-sm text-slate-500">
              Chọn tòa nhà và căn hộ để xem danh sách hộ đang/đã cư trú.
            </p>
          </div>
          <Link
            href="/base/household/householdNew"
            className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            + Tạo hộ gia đình mới
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Tòa nhà</label>
              <select
                value={selectedBuildingId}
                onChange={(event) => handleSelectBuilding(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">-- Chọn tòa nhà --</option>
                {buildingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {buildingsState.loading && (
                <span className="text-xs text-slate-500">Đang tải danh sách tòa nhà...</span>
              )}
              {buildingsState.error && (
                <span className="text-xs text-red-600">{buildingsState.error}</span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Căn hộ</label>
              <select
                value={selectedUnitId}
                onChange={(event) => handleSelectUnit(event.target.value)}
                disabled={!selectedBuildingId || unitsState.loading}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">
                  {selectedBuildingId ? '-- Chọn căn hộ --' : 'Hãy chọn tòa nhà trước'}
                </option>
                {unitOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {unitsState.loading && (
                <span className="text-xs text-slate-500">Đang tải danh sách căn hộ...</span>
              )}
              {unitsState.error && (
                <span className="text-xs text-red-600">{unitsState.error}</span>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Danh sách hộ gia đình</h2>
              {selectedUnitId ? (
                <p className="text-sm text-slate-500">
                  Đang hiển thị các hộ thuộc căn hộ đã chọn.
                </p>
              ) : (
                <p className="text-sm text-slate-500">
                  Hãy chọn tòa nhà và căn hộ để xem danh sách hộ cư trú.
                </p>
              )}
            </div>
            {selectedUnitId && (
              <Link
                href={`/base/unit/unitDetail/${selectedUnitId}`}
                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Xem chi tiết căn hộ
              </Link>
            )}
          </div>

          {householdsState.loading && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
              Đang tải danh sách hộ gia đình...
            </div>
          )}

          {!householdsState.loading && householdsState.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-600">
              {householdsState.error}
            </div>
          )}

          {!householdsState.loading &&
            !householdsState.error &&
            selectedUnitId &&
            householdsState.data.length === 0 && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
                Chưa có hộ gia đình nào cho căn hộ này.
              </div>
            )}

          {!householdsState.loading &&
            !householdsState.error &&
            householdsState.data.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">
                        Mã hộ
                      </th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">
                        Loại hộ
                      </th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">
                        Chủ hộ
                      </th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">
                        Ngày bắt đầu
                      </th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">
                        Ngày kết thúc
                      </th>
                      <th className="px-4 py-3 text-right font-semibold uppercase tracking-wide text-slate-600">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {householdsState.data.map((household) => (
                      <tr key={household.id} className="hover:bg-emerald-50/40">
                        <td className="px-4 py-3 font-medium text-slate-800">{household.id}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {KIND_OPTIONS[household.kind] ?? household.kind}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {household.primaryResidentName ?? 'Chưa thiết lập'}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(household.startDate)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(household.endDate)}</td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/base/household/householdDetail/${household.id}`}
                            className="font-semibold text-emerald-600 hover:text-emerald-700"
                          >
                            Chi tiết
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

