'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { getBuildings, type Building } from '@/src/services/base/buildingService';
import { getUnitsByBuilding, type Unit } from '@/src/services/base/unitService';
import {
  createHousehold,
  type CreateHouseholdPayload,
} from '@/src/services/base/householdService';

const KIND_OPTIONS: { value: CreateHouseholdPayload['kind']; label: string }[] = [
  { value: 'OWNER', label: 'Chủ sở hữu (OWNER)' },
  { value: 'TENANT', label: 'Người thuê (TENANT)' },
  { value: 'SERVICE', label: 'Dịch vụ (SERVICE)' },
];

type AsyncState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
};

const DEFAULT_BUILDING_STATE: AsyncState<Building[]> = {
  data: [],
  loading: false,
  error: null,
};

const DEFAULT_UNIT_STATE: AsyncState<Unit[]> = {
  data: [],
  loading: false,
  error: null,
};

export default function HouseholdNewPage() {
  const router = useRouter();

  const [buildingsState, setBuildingsState] =
    useState<AsyncState<Building[]>>(DEFAULT_BUILDING_STATE);
  const [unitsState, setUnitsState] = useState<AsyncState<Unit[]>>(DEFAULT_UNIT_STATE);

  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [kind, setKind] = useState<CreateHouseholdPayload['kind']>('OWNER');
  const [startDate, setStartDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState<string>('');
  const [primaryResidentId, setPrimaryResidentId] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadBuildings = async () => {
      setBuildingsState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const data = await getBuildings();
        setBuildingsState({ data, loading: false, error: null });
      } catch (err: any) {
        const message =
          err?.response?.data?.message || err?.message || 'Không thể tải danh sách tòa nhà.';
        setBuildingsState({ data: [], loading: false, error: message });
      }
    };

    void loadBuildings();
  }, []);

  const handleSelectBuilding = async (buildingId: string) {
    setSelectedBuildingId(buildingId);
    setSelectedUnitId('');

    if (!buildingId) {
      setUnitsState(DEFAULT_UNIT_STATE);
      return;
    }

    setUnitsState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await getUnitsByBuilding(buildingId);
      setUnitsState({ data, loading: false, error: null });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tải danh sách căn hộ của tòa nhà này.';
      setUnitsState({ data: [], loading: false, error: message });
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!selectedUnitId) {
      setSubmitError('Vui lòng chọn căn hộ để tạo hộ gia đình.');
      return;
    }

    if (!startDate) {
      setSubmitError('Vui lòng chọn ngày bắt đầu.');
      return;
    }

    const payload: CreateHouseholdPayload = {
      unitId: selectedUnitId,
      kind,
      startDate,
      endDate: endDate ? endDate : null,
      primaryResidentId: primaryResidentId ? primaryResidentId : null,
    };

    try {
      setSubmitting(true);
      const response = await createHousehold(payload);
      setSubmitSuccess('Tạo hộ gia đình thành công.');
      setPrimaryResidentId('');
      setEndDate('');

      // Nếu đã có chủ hộ, hiển thị thông báo và giữ form
      if (response?.id) {
        setSubmitSuccess(
          `Tạo hộ gia đình thành công (ID: ${response.id}). Bạn có thể cấp tài khoản chủ hộ ngay.`,
        );
        setTimeout(() => {
          router.push(`/base/household/householdDetail/${response.id}`);
        }, 800);
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tạo hộ gia đình. Vui lòng thử lại.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tạo hộ gia đình mới</h1>
            <p className="text-sm text-slate-500">
              Liên kết hộ gia đình với căn hộ và thiết lập thời gian cư trú.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/base/household/householdList')}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            ← Quay lại danh sách
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
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
                onChange={(event) => setSelectedUnitId(event.target.value)}
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Loại hộ</label>
              <select
                value={kind}
                onChange={(event) => setKind(event.target.value as CreateHouseholdPayload['kind'])}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                {KIND_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Ngày bắt đầu</label>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Ngày kết thúc</label>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
              <span className="text-xs text-slate-500">
                Để trống nếu chưa xác định ngày kết thúc cư trú.
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">
                Mã cư dân chủ hộ (tùy chọn)
              </label>
              <input
                type="text"
                value={primaryResidentId}
                onChange={(event) => setPrimaryResidentId(event.target.value)}
                placeholder="Nhập UUID cư dân nếu đã có"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
              <span className="text-xs text-slate-500">
                Nếu để trống, bạn có thể cấp chủ hộ sau thông qua provisioning.
              </span>
            </div>
          </div>

          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {submitError}
            </div>
          )}

          {submitSuccess && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {submitSuccess}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/base/household/householdList')}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Đang tạo...' : 'Tạo hộ gia đình'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

