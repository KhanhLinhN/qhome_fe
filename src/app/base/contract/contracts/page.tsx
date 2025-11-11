'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { getBuildings, type Building } from '@/src/services/base/buildingService';
import { getUnitsByBuilding, type Unit } from '@/src/services/base/unitService';
import {
  ContractDetail,
  ContractSummary,
  CreateContractPayload,
  createContract,
  fetchContractDetail,
  fetchContractsByUnit,
  uploadContractFiles,
} from '@/src/services/base/contractService';

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

const DEFAULT_CONTRACTS_STATE: AsyncState<ContractSummary[]> = {
  data: [],
  loading: false,
  error: null,
};

const CONTRACT_TYPE_OPTIONS = [
  { value: 'RENTAL', label: 'Thuê (RENTAL)' },
  { value: 'PURCHASE', label: 'Mua (PURCHASE)' },
];

const BASE_API_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8081').replace(/\/$/, '');

function resolveFileUrl(url?: string | null) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  return `${BASE_API_URL}${normalizedPath}`;
}

function formatDate(value?: string | null) {
  if (!value) return 'Chưa thiết lập';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN');
}

export default function ContractManagementPage() {
  const [buildingsState, setBuildingsState] =
    useState<AsyncState<Building[]>>(DEFAULT_BUILDINGS_STATE);
  const [unitsState, setUnitsState] = useState<AsyncState<Unit[]>>(DEFAULT_UNITS_STATE);
  const [contractsState, setContractsState] =
    useState<AsyncState<ContractSummary[]>>(DEFAULT_CONTRACTS_STATE);

  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [createFiles, setCreateFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);
  const purchaseDateInputRef = useRef<HTMLInputElement>(null);
  const detailFileInputRef = useRef<HTMLInputElement | null>(null);
  const [detailUploadError, setDetailUploadError] = useState<string | null>(null);
  const [detailUploading, setDetailUploading] = useState(false);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailState, setDetailState] = useState<{
    data: ContractDetail | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  const [formState, setFormState] = useState<CreateContractPayload>({
    unitId: '',
    contractNumber: '',
    contractType: 'RENTAL',
    startDate: '',
    endDate: '',
    monthlyRent: null,
    purchasePrice: null,
    paymentMethod: '',
    paymentTerms: '',
    purchaseDate: '',
    notes: '',
    status: 'ACTIVE',
  });

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

  const buildingOptions = useMemo(
    () =>
      buildingsState.data.map((building) => ({
        value: building.id,
        label: `${building.code ? `${building.code} - ` : ''}${building.name ?? ''}`,
      })),
    [buildingsState.data],
  );

  const unitOptions = useMemo(
    () =>
      unitsState.data.map((unit) => ({
        value: unit.id,
        label: `${unit.code ?? ''}${unit.floor !== undefined ? ` (Tầng ${unit.floor})` : ''}`,
      })),
    [unitsState.data],
  );

  const handleSelectBuilding = async (buildingId: string) => {
    setSelectedBuildingId(buildingId);
    setSelectedUnitId('');
    setFormState((prev) => ({ ...prev, unitId: '' }));
    setUnitsState(DEFAULT_UNITS_STATE);
    setContractsState(DEFAULT_CONTRACTS_STATE);

    if (!buildingId) {
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

  const loadContracts = async (unitId: string) => {
    setContractsState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchContractsByUnit(unitId);
      setContractsState({ data, loading: false, error: null });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tải danh sách hợp đồng của căn hộ.';
      setContractsState({ data: [], loading: false, error: message });
    }
  };

  const handleSelectUnit = async (unitId: string) => {
    setSelectedUnitId(unitId);
    setFormState((prev) => ({ ...prev, unitId }));

    if (!unitId) {
      setContractsState(DEFAULT_CONTRACTS_STATE);
      return;
    }

    await loadContracts(unitId);
  };

  const handleOpenCreateModal = () => {
    setCreateError(null);
    setCreateSuccess(null);
    setCreateModalOpen(true);
    if (selectedUnitId) {
      setFormState((prev) => ({ ...prev, unitId: selectedUnitId }));
    }
    setCreateFiles(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetCreateForm = () => {
    setFormState({
      unitId: selectedUnitId || '',
      contractNumber: '',
      contractType: 'RENTAL',
      startDate: '',
      endDate: '',
      monthlyRent: null,
      purchasePrice: null,
      paymentMethod: '',
      paymentTerms: '',
      purchaseDate: '',
      notes: '',
      status: 'ACTIVE',
    });
    setCreateError(null);
    setCreateFiles(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isValidDate = (value?: string | null) => {
    if (!value) return true;
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
  };

  const triggerNativeDatePicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    const input = ref.current;
    if (!input) return;
    const picker = input as HTMLInputElement & { showPicker?: () => void };
    if (typeof picker.showPicker === 'function') {
      picker.showPicker();
    } else {
      input.focus();
      input.click();
    }
  };

  const handleUploadFilesForDetail = async (files: FileList | null) => {
    if (!files || files.length === 0 || !detailState.data) {
      return;
    }
    setDetailUploadError(null);
    setDetailUploading(true);
    try {
      await uploadContractFiles(detailState.data.id, files);
      const refreshed = await fetchContractDetail(detailState.data.id);
      if (refreshed) {
        setDetailState({ data: refreshed, loading: false, error: null });
      }
      if (detailFileInputRef.current) {
        detailFileInputRef.current.value = '';
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Không thể tải tệp đính kèm. Vui lòng thử lại.';
      setDetailUploadError(message);
    } finally {
      setDetailUploading(false);
    }
  };

  const handleCreateContract = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    if (!formState.unitId) {
      setCreateError('Vui lòng chọn căn hộ trước khi tạo hợp đồng.');
      return;
    }
    if (!formState.contractNumber.trim()) {
      setCreateError('Vui lòng nhập số hợp đồng.');
      return;
    }
    if (!formState.startDate) {
      setCreateError('Vui lòng chọn ngày bắt đầu hợp đồng.');
      return;
    }

    if (!isValidDate(formState.startDate)) {
      setCreateError('Ngày bắt đầu phải theo định dạng YYYY-MM-DD.');
      return;
    }

    if (formState.contractType === 'RENTAL' && !formState.monthlyRent && formState.monthlyRent !== 0) {
      setCreateError('Vui lòng nhập giá thuê hàng tháng cho hợp đồng thuê.');
      return;
    }

    if (formState.contractType === 'PURCHASE' && !formState.purchasePrice && formState.purchasePrice !== 0) {
      setCreateError('Vui lòng nhập giá mua cho hợp đồng mua.');
      return;
    }

    if (formState.contractType === 'PURCHASE') {
      if (formState.endDate) {
        setCreateError('Hợp đồng mua không thể có ngày kết thúc.');
        return;
      }
      if (!formState.purchaseDate) {
        setCreateError('Vui lòng nhập ngày mua cho hợp đồng mua.');
        return;
      }
      if (!isValidDate(formState.purchaseDate)) {
        setCreateError('Ngày mua phải theo định dạng YYYY-MM-DD.');
        return;
      }
    }

    if (formState.contractType === 'RENTAL' && formState.endDate && !isValidDate(formState.endDate)) {
      setCreateError('Ngày kết thúc phải theo định dạng YYYY-MM-DD.');
      return;
    }

    try {
      setCreateSubmitting(true);
      const trimmedPaymentMethod =
        formState.paymentMethod && formState.paymentMethod.trim().length > 0
          ? formState.paymentMethod.trim()
          : null;
      const trimmedPaymentTerms =
        formState.paymentTerms && formState.paymentTerms.trim().length > 0
          ? formState.paymentTerms.trim()
          : null;
      const payload: CreateContractPayload = {
        ...formState,
        monthlyRent:
          formState.contractType === 'RENTAL' ? formState.monthlyRent ?? 0 : null,
        purchasePrice:
          formState.contractType === 'PURCHASE' ? formState.purchasePrice ?? 0 : null,
        endDate:
          formState.contractType === 'RENTAL' ? formState.endDate || null : null,
        purchaseDate:
          formState.contractType === 'PURCHASE' ? formState.purchaseDate || null : null,
        paymentMethod:
          formState.contractType === 'PURCHASE' ? null : trimmedPaymentMethod,
        paymentTerms:
          formState.contractType === 'PURCHASE' ? null : trimmedPaymentTerms,
        notes: formState.notes && formState.notes.trim().length > 0 ? formState.notes.trim() : null,
        status: 'ACTIVE',
      };

      const contract = await createContract(payload);

      if (createFiles && createFiles.length > 0) {
        try {
          await uploadContractFiles(contract.id, createFiles);
        } catch (fileError: any) {
          const message =
            fileError?.response?.data?.message ||
            fileError?.message ||
            'Tạo hợp đồng thành công nhưng tải tệp đính kèm thất bại.';
          setCreateError(message);
        }
      }

      setCreateSuccess('Đã tạo hợp đồng thành công.');
      await loadContracts(payload.unitId);
      resetCreateForm();
      setCreateModalOpen(false);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tạo hợp đồng. Vui lòng thử lại.';
      setCreateError(message);
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleOpenContractDetail = async (contractId: string) => {
    setDetailModalOpen(true);
    setDetailUploadError(null);
    setDetailState({ data: null, loading: true, error: null });
    try {
      const detail = await fetchContractDetail(contractId);
      if (!detail) {
        setDetailState({
          data: null,
          loading: false,
          error: 'Không tìm thấy hợp đồng.',
        });
        return;
      }
      setDetailState({ data: detail, loading: false, error: null });
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Không thể tải chi tiết hợp đồng.';
      setDetailState({ data: null, loading: false, error: message });
    }
  };

  const handleCloseContractDetail = () => {
    setDetailModalOpen(false);
    setDetailUploadError(null);
    if (detailFileInputRef.current) {
      detailFileInputRef.current.value = '';
    }
  };

  const filteredContracts = contractsState.data;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Quản lý hợp đồng căn hộ</h1>
            <p className="text-sm text-slate-500">
              Tạo mới và theo dõi các hợp đồng thuê/mua của từng căn hộ trong dự án.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            disabled={!selectedUnitId}
            className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            + Thêm hợp đồng
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Tòa nhà</label>
              <select
                value={selectedBuildingId}
                onChange={(event) => handleSelectBuilding(event.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
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
                <span className="text-xs text-red-500">{buildingsState.error}</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Căn hộ</label>
              <select
                value={selectedUnitId}
                onChange={(event) => handleSelectUnit(event.target.value)}
                disabled={!selectedBuildingId || unitsState.loading}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">
                  {selectedBuildingId ? '-- Chọn căn hộ --' : 'Chọn tòa nhà trước'}
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
              {unitsState.error && <span className="text-xs text-red-500">{unitsState.error}</span>}
            </div>
          </div>

          <div className="mt-6">
            {contractsState.loading ? (
              <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                Đang tải danh sách hợp đồng...
              </div>
            ) : contractsState.error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {contractsState.error}
              </div>
            ) : filteredContracts.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                {selectedUnitId
                  ? 'Căn hộ hiện chưa có hợp đồng nào.'
                  : 'Chọn tòa nhà và căn hộ để xem danh sách hợp đồng.'}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">
                        Số hợp đồng
                      </th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">
                        Loại
                      </th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">
                        Hiệu lực
                      </th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-center font-semibold uppercase tracking-wide text-slate-600">
                        Chi tiết
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredContracts.map((contract) => (
                      <tr key={contract.id} className="hover:bg-emerald-50/40">
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {contract.contractNumber ?? 'Không rõ'}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {contract.contractType ?? 'Không xác định'}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div className="flex flex-col">
                            <span>Bắt đầu: {formatDate(contract.startDate)}</span>
                            <span>Kết thúc: {formatDate(contract.endDate)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              contract.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {contract.status ?? 'Không xác định'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenContractDetail(contract.id)}
                            className="inline-flex items-center rounded-lg border border-blue-300 px-3 py-1 text-sm text-blue-600 transition hover:bg-blue-50"
                          >
                            Xem
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {createSuccess && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {createSuccess}
          </div>
        )}

        {createModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 px-4 py-8">
            <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Thêm hợp đồng mới</h2>
                  <p className="text-sm text-slate-500">
                    Nhập thông tin hợp đồng thuê hoặc mua cho căn hộ được chọn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCreateModalOpen(false);
                    resetCreateForm();
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100"
                  aria-label="Đóng tạo hợp đồng"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleCreateContract} className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700">Căn hộ</label>
                    <select
                      value={formState.unitId}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, unitId: event.target.value }))
                      }
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      required
                    >
                      <option value="">-- Chọn căn hộ --</option>
                      {unitOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700">Số hợp đồng</label>
                    <input
                      type="text"
                      value={formState.contractNumber}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, contractNumber: event.target.value }))
                      }
                      placeholder="Ví dụ: HD-2025-0001"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700">Loại hợp đồng</label>
                    <select
                      value={formState.contractType ?? 'RENTAL'}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          contractType: event.target.value,
                          endDate: event.target.value === 'PURCHASE' ? '' : prev.endDate,
                          monthlyRent: event.target.value === 'PURCHASE' ? null : prev.monthlyRent,
                          purchasePrice: event.target.value === 'RENTAL' ? null : prev.purchasePrice,
                          purchaseDate: event.target.value === 'RENTAL' ? '' : prev.purchaseDate,
                        }))
                      }
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    >
                      {CONTRACT_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700">Trạng thái</label>
                    <div className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
                      Đang hiệu lực (mặc định)
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700">Ngày bắt đầu</label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        placeholder="YYYY-MM-DD"
                        value={formState.startDate ?? ''}
                        onClick={() => triggerNativeDatePicker(startDateInputRef)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            triggerNativeDatePicker(startDateInputRef);
                          }
                        }}
                        className="w-full cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        aria-describedby="start-date-help"
                        required
                      />
                      <input
                        ref={startDateInputRef}
                        type="date"
                        value={formState.startDate ?? ''}
                        onChange={(event) =>
                          setFormState((prev) => ({ ...prev, startDate: event.target.value }))
                        }
                        className="hidden"
                      />
                    </div>
                  </div>
                  {formState.contractType !== 'PURCHASE' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-slate-700">Ngày kết thúc</label>
                      <div className="relative">
                        <input
                          type="text"
                          readOnly
                          placeholder="YYYY-MM-DD"
                          value={formState.endDate ?? ''}
                          onClick={() => triggerNativeDatePicker(endDateInputRef)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              triggerNativeDatePicker(endDateInputRef);
                            }
                          }}
                          className="w-full cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        />
                        <input
                          ref={endDateInputRef}
                          type="date"
                          value={formState.endDate ?? ''}
                          onChange={(event) =>
                            setFormState((prev) => ({ ...prev, endDate: event.target.value || null }))
                          }
                          className="hidden"
                        />
                      </div>
                    </div>
                  )}
                  {formState.contractType === 'PURCHASE' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-slate-700">Ngày mua</label>
                      <div className="relative">
                        <input
                          type="text"
                          readOnly
                          placeholder="YYYY-MM-DD"
                          value={formState.purchaseDate ?? ''}
                          onClick={() => triggerNativeDatePicker(purchaseDateInputRef)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              triggerNativeDatePicker(purchaseDateInputRef);
                            }
                          }}
                          className="w-full cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        />
                        <input
                          ref={purchaseDateInputRef}
                          type="date"
                          value={formState.purchaseDate ?? ''}
                          onChange={(event) =>
                            setFormState((prev) => ({ ...prev, purchaseDate: event.target.value || null }))
                          }
                          className="hidden"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {formState.contractType === 'RENTAL' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-slate-700">Giá thuê / tháng</label>
                      <input
                        type="number"
                        min={0}
                        value={formState.monthlyRent ?? ''}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            monthlyRent: event.target.value ? Number(event.target.value) : null,
                          }))
                        }
                        placeholder="Ví dụ: 12000000"
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                  )}
                  {formState.contractType === 'PURCHASE' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-slate-700">Giá mua</label>
                      <input
                        type="number"
                        min={0}
                        value={formState.purchasePrice ?? ''}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            purchasePrice: event.target.value ? Number(event.target.value) : null,
                          }))
                        }
                        placeholder="Ví dụ: 2500000000"
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700">Phương thức thanh toán</label>
                    <input
                      type="text"
                      value={formState.paymentMethod ?? ''}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, paymentMethod: event.target.value }))
                      }
                      placeholder="Chuyển khoản, tiền mặt..."
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700">Điều khoản thanh toán</label>
                    <input
                      type="text"
                      value={formState.paymentTerms ?? ''}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, paymentTerms: event.target.value }))
                      }
                      placeholder="Ví dụ: trả theo quý..."
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700">Ghi chú</label>
                  <textarea
                    value={formState.notes ?? ''}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, notes: event.target.value }))
                    }
                    rows={3}
                    placeholder="Thông tin bổ sung về hợp đồng..."
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700">
                    Tệp đính kèm hợp đồng (tuỳ chọn)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(event) => setCreateFiles(event.target.files)}
                    className="text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <span className="text-xs text-slate-500">
                    Có thể tải nhiều tệp (PDF, ảnh...) để lưu trữ cùng hợp đồng.
                  </span>
                </div>

                {createError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {createError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateModalOpen(false);
                      resetCreateForm();
                    }}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={createSubmitting}
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                  >
                    {createSubmitting ? 'Đang tạo...' : 'Tạo hợp đồng'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {detailModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 px-4 py-8">
            <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Chi tiết hợp đồng</h3>
                  {detailState.data?.contractNumber && (
                    <p className="text-sm text-slate-500">
                      Số hợp đồng: {detailState.data.contractNumber}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCloseContractDetail}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100"
                  aria-label="Đóng chi tiết hợp đồng"
                >
                  ×
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
                {detailState.loading && (
                  <p className="text-sm text-slate-500">Đang tải chi tiết hợp đồng...</p>
                )}
                {detailState.error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {detailState.error}
                  </div>
                )}
                {!detailState.loading && !detailState.error && detailState.data && (
                  <div className="space-y-5 text-sm text-slate-700">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <p>
                        <span className="font-medium text-slate-900">Loại hợp đồng:</span>{' '}
                        {detailState.data.contractType ?? 'Không xác định'}
                      </p>
                      <p>
                        <span className="font-medium text-slate-900">Trạng thái:</span>{' '}
                        {detailState.data.status ?? 'Không xác định'}
                      </p>
                      <p>
                        <span className="font-medium text-slate-900">Ngày bắt đầu:</span>{' '}
                        {formatDate(detailState.data.startDate)}
                      </p>
                      <p>
                        <span className="font-medium text-slate-900">Ngày kết thúc:</span>{' '}
                        {detailState.data.endDate ? formatDate(detailState.data.endDate) : 'Không giới hạn'}
                      </p>
                      {detailState.data.monthlyRent != null && (
                        <p>
                          <span className="font-medium text-slate-900">Giá thuê / tháng:</span>{' '}
                          {detailState.data.monthlyRent.toLocaleString('vi-VN')} đ
                        </p>
                      )}
                      {detailState.data.purchasePrice != null && (
                        <p>
                          <span className="font-medium text-slate-900">Giá mua:</span>{' '}
                          {detailState.data.purchasePrice.toLocaleString('vi-VN')} đ
                        </p>
                      )}
                      {detailState.data.purchaseDate && (
                        <p>
                          <span className="font-medium text-slate-900">Ngày mua:</span>{' '}
                          {formatDate(detailState.data.purchaseDate)}
                        </p>
                      )}
                      {detailState.data.paymentMethod && (
                        <p>
                          <span className="font-medium text-slate-900">Phương thức thanh toán:</span>{' '}
                          {detailState.data.paymentMethod}
                        </p>
                      )}
                    </div>
                    {detailState.data.paymentTerms && (
                      <div>
                        <p className="font-medium text-slate-900">Điều khoản thanh toán</p>
                        <p className="mt-1 whitespace-pre-line text-slate-600">
                          {detailState.data.paymentTerms}
                        </p>
                      </div>
                    )}
                    {detailState.data.notes && (
                      <div>
                        <p className="font-medium text-slate-900">Ghi chú</p>
                        <p className="mt-1 whitespace-pre-line text-slate-600">
                          {detailState.data.notes}
                        </p>
                      </div>
                    )}
                    <div className="space-y-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-medium text-slate-900">Tệp đính kèm</p>
                        <div className="flex items-center gap-3">
                          <input
                            ref={detailFileInputRef}
                            type="file"
                            multiple
                            onChange={(event) => handleUploadFilesForDetail(event.target.files)}
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                          />
                          <button
                            type="button"
                            onClick={() => detailFileInputRef.current?.click()}
                            disabled={!detailState.data || detailUploading}
                            className="inline-flex items-center rounded-lg border border-blue-300 px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                          >
                            {detailUploading ? 'Đang tải lên...' : 'Tải tệp đính kèm'}
                          </button>
                        </div>
                      </div>
                      {detailUploadError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                          {detailUploadError}
                        </div>
                      )}
                      {detailState.data.files && detailState.data.files.length > 0 ? (
                        <div className="space-y-4">
                          {detailState.data.files.map((file) => {
                            const isImage =
                              file.contentType?.startsWith('image/') ||
                              /\.(jpg|jpeg|png|gif|webp)$/i.test(file.fileName ?? '');
                            const isPdf =
                              file.contentType === 'application/pdf' ||
                              /\.pdf$/i.test(file.fileName ?? '');
                            const displayUrl = resolveFileUrl(file.proxyUrl ?? file.fileUrl);
                            return (
                              <div
                                key={file.id}
                                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="font-medium text-slate-800">
                                      {file.originalFileName ?? file.fileName ?? 'Tệp không tên'}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {file.contentType ?? 'Không rõ định dạng'} •{' '}
                                      {file.fileSize ? `${(file.fileSize / 1024).toFixed(1)} KB` : 'Kích thước không rõ'}
                                    </p>
                                    {file.isPrimary && (
                                      <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                        Tệp chính
                                      </span>
                                    )}
                                  </div>
                                  {displayUrl && (
                                    <a
                                      href={displayUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center rounded-md border border-blue-300 px-3 py-1 text-sm text-blue-600 transition hover:bg-blue-50"
                                    >
                                      Xem / tải
                                    </a>
                                  )}
                                </div>
                                {isImage && displayUrl && (
                                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                                    <img
                                      src={displayUrl}
                                      alt={file.originalFileName ?? file.fileName ?? 'Contract image'}
                                      className="max-h-96 w-full object-contain bg-slate-100"
                                    />
                                  </div>
                                )}
                                {isPdf && displayUrl && (
                                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                                    <object
                                      data={displayUrl}
                                      type="application/pdf"
                                      className="h-96 w-full"
                                    >
                                      <p className="p-4 text-sm text-slate-500">
                                        Không thể hiển thị PDF.{' '}
                                        <a
                                          href={displayUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 underline"
                                        >
                                          Bấm vào đây để tải xuống.
                                        </a>
                                      </p>
                                    </object>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">
                          Hợp đồng chưa có tệp đính kèm. Bạn có thể tải tệp ngay tại đây.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={handleCloseContractDetail}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

