'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';

import { getBuildings, type Building } from '@/src/services/base/buildingService';
import { getUnitsByBuilding, type Unit } from '@/src/services/base/unitService';
import DropdownArrow from '@/src/assets/DropdownArrow.svg';
import {
  fetchCurrentHouseholdByUnit,
  fetchHouseholdMembersByHousehold,
  type HouseholdMemberDto,
} from '@/src/services/base/householdService';

type BuildingExpansionState = Record<string, boolean>;

type BuildingUnitState = {
  units: Unit[];
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
};

const DEFAULT_PAGE_SIZE = 10;

const DEFAULT_UNIT_STATE: BuildingUnitState = {
  units: [],
  loading: false,
  error: null,
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Đang hoạt động',
  INACTIVE: 'Ngưng hoạt động',
  MAINTENANCE: 'Bảo trì',
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];

type UnitResidentsState = {
  residents: HouseholdMemberDto[];
  loading: boolean;
  error: string | null;
  message: string | null;
};

const DEFAULT_UNIT_RESIDENT_STATE: UnitResidentsState = {
  residents: [],
  loading: false,
  error: null,
  message: null,
};

function formatStatus(status?: string | null) {
  if (!status) return 'Không rõ';
  return STATUS_LABELS[status] ?? status.replaceAll('_', ' ');
}

function formatArea(value?: number) {
  if (typeof value !== 'number') return '—';
  return `${value.toLocaleString('vi-VN')} m²`;
}

function formatFloor(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return value.toString();
}

export default function ResidentHouseholdApprovalPage() {
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState<boolean>(false);
  const [buildingsError, setBuildingsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [expandedBuildings, setExpandedBuildings] = useState<BuildingExpansionState>({});
  const [unitStates, setUnitStates] = useState<Record<string, BuildingUnitState>>({});
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});
  const [unitResidentsState, setUnitResidentsState] = useState<Record<string, UnitResidentsState>>({});

  const fetchBuildings = useCallback(async () => {
    setLoadingBuildings(true);
    setBuildingsError(null);
    try {
      const data = await getBuildings();
      setBuildings(data);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Không thể tải danh sách tòa nhà. Vui lòng thử lại.';
      setBuildingsError(message);
    } finally {
      setLoadingBuildings(false);
    }
  }, []);

  useEffect(() => {
    void fetchBuildings();
  }, [fetchBuildings]);

  const fetchUnitsForBuilding = useCallback(async (buildingId: string) => {
    setUnitStates((prev) => ({
      ...prev,
      [buildingId]: {
        ...(prev[buildingId] ?? DEFAULT_UNIT_STATE),
        loading: true,
        error: null,
      },
    }));

    try {
      const units = await getUnitsByBuilding(buildingId);
      setUnitStates((prev) => ({
        ...prev,
        [buildingId]: {
          ...(prev[buildingId] ?? DEFAULT_UNIT_STATE),
          units,
          loading: false,
          error: null,
          page: 0,
        },
      }));
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tải danh sách căn hộ của tòa nhà này. Vui lòng thử lại.';
      setUnitStates((prev) => ({
        ...prev,
        [buildingId]: {
          ...(prev[buildingId] ?? DEFAULT_UNIT_STATE),
          loading: false,
          error: message,
        },
      }));
    }
  }, []);

  const fetchUnitResidents = useCallback(async (unitId: string) => {
    setUnitResidentsState((prev) => ({
      ...prev,
      [unitId]: {
        ...(prev[unitId] ?? DEFAULT_UNIT_RESIDENT_STATE),
        loading: true,
        error: null,
        message: null,
      },
    }));

    try {
      const household = await fetchCurrentHouseholdByUnit(unitId);
      if (!household?.id) {
        setUnitResidentsState((prev) => ({
          ...prev,
          [unitId]: {
            residents: [],
            loading: false,
            error: null,
            message: 'Chưa có hộ dân đang cư trú trong căn hộ này.',
          },
        }));
        return;
      }

      const residents = await fetchHouseholdMembersByHousehold(household.id);
      setUnitResidentsState((prev) => ({
        ...prev,
        [unitId]: {
          residents,
          loading: false,
          error: null,
          message: residents.length ? null : 'Chưa có cư dân nào trong căn hộ này.',
        },
      }));
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setUnitResidentsState((prev) => ({
          ...prev,
          [unitId]: {
            residents: [],
            loading: false,
            error: null,
            message: 'Chưa có hộ dân đang cư trú trong căn hộ này.',
          },
        }));
        return;
      }

      const message =
        err?.response?.data?.message || err?.message || 'Không thể tải danh sách cư dân của căn hộ.';
      setUnitResidentsState((prev) => ({
        ...prev,
        [unitId]: {
          ...(prev[unitId] ?? DEFAULT_UNIT_RESIDENT_STATE),
          loading: false,
          error: message,
          message: null,
        },
      }));
    }
  }, []);

  const handleToggleBuilding = async (buildingId: string) => {
    setExpandedBuildings((prev) => ({
      ...prev,
      [buildingId]: !prev[buildingId],
    }));

    const nextExpanded = !expandedBuildings[buildingId];
    if (nextExpanded) {
      const existingState = unitStates[buildingId];
      if (!existingState || (!existingState.units.length && !existingState.loading)) {
        void fetchUnitsForBuilding(buildingId);
      }
    }
  };

  const handleToggleUnit = useCallback(
    (unitId: string) => {
      setExpandedUnits((prev) => {
        const nextExpanded = !(prev[unitId] ?? false);
        if (nextExpanded) {
          const existing = unitResidentsState[unitId];
          if (!existing || (!existing.residents.length && !existing.message && !existing.error)) {
            void fetchUnitResidents(unitId);
          }
        }
        return {
          ...prev,
          [unitId]: nextExpanded,
        };
      });
    },
    [fetchUnitResidents, unitResidentsState],
  );

  const handleChangePage = (buildingId: string, nextPage: number) => {
    setUnitStates((prev) => {
      const current = prev[buildingId] ?? DEFAULT_UNIT_STATE;
      const totalPages = Math.max(1, Math.ceil(current.units.length / current.pageSize));
      const safePage = Math.min(Math.max(0, nextPage), totalPages - 1);
      return {
        ...prev,
        [buildingId]: {
          ...current,
          page: safePage,
        },
      };
    });
  };

  const handleChangePageSize = (buildingId: string, newSize: number) => {
    setUnitStates((prev) => {
      const current = prev[buildingId] ?? DEFAULT_UNIT_STATE;
      return {
        ...prev,
        [buildingId]: {
          ...current,
          pageSize: newSize,
          page: 0,
        },
      };
    });
  };

  const renderUnitResidentsContent = useCallback(
    (unitId: string) => {
      const state = unitResidentsState[unitId] ?? DEFAULT_UNIT_RESIDENT_STATE;

      if (state.loading) {
        return <p className="text-sm text-slate-500">Đang tải danh sách cư dân...</p>;
      }

      if (state.error) {
        return <p className="text-sm text-red-600">{state.error}</p>;
      }

      if (state.message) {
        return <p className="text-sm text-slate-500">{state.message}</p>;
      }

      if (!state.residents.length) {
        return <p className="text-sm text-slate-500">Chưa có cư dân nào trong căn hộ này.</p>;
      }

      return (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">Họ và tên</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">Email</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">
                  Số điện thoại
                </th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">Quan hệ</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">Chủ hộ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {state.residents.map((resident) => (
                <tr key={resident.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{resident.residentName ?? 'Chưa cập nhật'}</td>
                  <td className="px-4 py-3 text-slate-600">{resident.residentEmail ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{resident.residentPhone ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{resident.relation ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        resident.isPrimary ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {resident.isPrimary ? 'Chủ hộ' : 'Thành viên'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    },
    [unitResidentsState],
  );

  const renderUnitTable = useCallback(
    (buildingId: string) => {
      const state = unitStates[buildingId] ?? DEFAULT_UNIT_STATE;

      if (state.loading) {
        return (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
            Đang tải danh sách căn hộ...
          </div>
        );
      }

      if (state.error) {
        return (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600">
            {state.error}
          </div>
        );
      }

      if (!state.units.length) {
        return (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
            Tòa nhà này chưa có căn hộ nào hoặc dữ liệu đang trống.
          </div>
        );
      }

      const totalPages = Math.max(1, Math.ceil(state.units.length / state.pageSize));
      const startIndex = state.page * state.pageSize;
      const currentUnits = state.units.slice(startIndex, startIndex + state.pageSize);

      return (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">Mã căn hộ</th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">Tên căn hộ</th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">Tầng</th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">Diện tích</th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">Phòng ngủ</th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">Chủ hộ</th>
                  <th className="w-12 px-4 py-3" aria-label="Toggle" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {currentUnits.map((unit) => {
                  const ownerLabel = (unit as unknown as { primaryResidentId?: string | null }).primaryResidentId
                    ? 'Đã có'
                    : 'Chưa có';
                  const isExpanded = expandedUnits[unit.id] ?? false;

                  return (
                    <Fragment key={unit.id}>
                      <tr className="hover:bg-emerald-50/40">
                        <td className="px-4 py-3 font-medium text-slate-800">{unit.code ?? 'Không rõ'}</td>
                        <td className="px-4 py-3 text-slate-600">{unit.name ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{formatFloor(unit.floor)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatArea(unit.areaM2)}</td>
                        <td className="px-4 py-3 text-slate-600">{unit.bedrooms ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{formatStatus(unit.status)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              ownerLabel === 'Đã có'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {ownerLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleToggleUnit(unit.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white transition hover:border-emerald-300 hover:bg-emerald-50"
                            aria-label={isExpanded ? 'Thu gọn cư dân' : 'Mở danh sách cư dân'}
                          >
                            <Image
                              src={DropdownArrow}
                              alt="Toggle residents"
                              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
                            />
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-emerald-50/30">
                          <td colSpan={8} className="px-6 py-4">
                            <h4 className="text-sm font-semibold text-slate-700">Cư dân trong căn hộ</h4>
                            <div className="mt-2">{renderUnitResidentsContent(unit.id)}</div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Hiển thị</span>
              <select
                value={state.pageSize}
                onChange={(event) => handleChangePageSize(buildingId, Number(event.target.value))}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span>hàng mỗi trang</span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => handleChangePage(buildingId, state.page - 1)}
                disabled={state.page === 0}
                className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trước
              </button>
              <span className="text-sm text-slate-600">
                Trang {state.page + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => handleChangePage(buildingId, state.page + 1)}
                disabled={state.page >= totalPages - 1}
                className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      );
    },
    [expandedUnits, handleChangePage, handleChangePageSize, handleToggleUnit, renderUnitResidentsContent, unitStates],
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredBuildings = useMemo(() => {
    if (!normalizedSearch) {
      return buildings;
    }
    return buildings.filter((building) => {
      const name = (building.name ?? building.code ?? '').toLowerCase();
      return name.includes(normalizedSearch);
    });
  }, [buildings, normalizedSearch]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-[#02542D]">Phê duyệt cư dân và tài khoản</h1>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm theo tên hoặc mã tòa nhà"
              className="w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
            <button
                type="button"
                onClick={() => router.push('/base/regisresiView')}
                className="inline-flex w-full items-center justify-center rounded-lg border border-green-600 bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:border-green-700 hover:bg-green-700 sm:w-auto"
                >
                Xem đơn đăng ký cư dân
            </button>
            </div>

        </header>

        <section className="space-y-4">
          {loadingBuildings && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
              Đang tải danh sách tòa nhà...
            </div>
          )}

          {buildingsError && !loadingBuildings && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-6 text-sm text-red-600">
              {buildingsError}
            </div>
          )}

          {!loadingBuildings && !buildingsError && !buildings.length && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
              Chưa có tòa nhà nào được cấu hình.
            </div>
          )}

          {!loadingBuildings && !buildingsError && buildings.length && !filteredBuildings.length && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
              Không tìm thấy tòa nhà phù hợp với từ khóa "{searchTerm}".
            </div>
          )}

          {!loadingBuildings &&
            !buildingsError &&
            filteredBuildings.map((building) => {
              const isExpanded = expandedBuildings[building.id] ?? false;
              return (
                <div key={building.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => handleToggleBuilding(building.id)}
                    className="flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left transition hover:bg-emerald-50"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-lg font-semibold text-slate-800">
                        {building.name ?? building.code}
                      </span>
                      <span className="text-sm text-slate-500">Mã tòa nhà: {building.code ?? building.id}</span>
                    </div>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white">
                      <Image
                        src={DropdownArrow}
                        alt="Toggle building"
                        className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
                      />
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-200 px-5 py-4">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                        Danh sách căn hộ trong tòa nhà
                      </h3>
                      <div className="mt-3">{renderUnitTable(building.id)}</div>
                    </div>
                  )}
                </div>
              );
            })}
        </section>
      </div>
    </div>
  );
}
