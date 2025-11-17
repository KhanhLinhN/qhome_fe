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
import DateBox from '@/src/components/customer-interaction/DateBox';

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

const PAYMENT_METHOD_OPTIONS = [
  { value: '', label: '-- Chọn phương thức --' },
  { value: 'Chuyển khoản', label: 'Chuyển khoản' },
  { value: 'Tiền mặt', label: 'Tiền mặt' },
  { value: 'Ví điện tử', label: 'Ví điện tử' },
  { value: 'Khác', label: 'Khác' },
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
  const detailFileInputRef = useRef<HTMLInputElement | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
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

  const clearFieldErrors = (...fields: (keyof CreateContractPayload)[]) => {
    setFormErrors((prev) => {
      if (!prev || Object.keys(prev).length === 0) {
        return prev;
      }
      let hasChanges = false;
      const next = { ...prev };
      fields.forEach((field) => {
        const key = field as string;
        if (key in next) {
          delete next[key];
          hasChanges = true;
        }
      });
      return hasChanges ? next : prev;
    });
  };

  // Validate individual field
  const validateField = <K extends keyof CreateContractPayload>(
    field: K,
    value: CreateContractPayload[K],
    currentFormState?: typeof formState,
  ) => {
    const state = currentFormState || formState;
    const newErrors = { ...formErrors };
    
    switch (field) {
      case 'unitId':
        if (!value || (typeof value === 'string' && !value.trim())) {
          newErrors.unitId = 'Vui lòng chọn căn hộ trước khi tạo hợp đồng.';
        } else {
          delete newErrors.unitId;
        }
        break;
      case 'contractNumber':
        if (!value || (typeof value === 'string' && !value.trim())) {
          newErrors.contractNumber = 'Vui lòng nhập số hợp đồng.';
        } else {
          delete newErrors.contractNumber;
        }
        break;
      case 'contractType':
        // Clear related errors when contract type changes
        if (value === 'PURCHASE') {
          delete newErrors.endDate;
          delete newErrors.monthlyRent;
        } else {
          delete newErrors.purchasePrice;
          delete newErrors.purchaseDate;
        }
        break;
      case 'startDate':
        if (!value || (typeof value === 'string' && !value.trim())) {
          newErrors.startDate = 'Vui lòng chọn ngày bắt đầu hợp đồng.';
        } else if (typeof value === 'string' && !isValidDate(value)) {
          newErrors.startDate = 'Ngày bắt đầu phải theo định dạng YYYY-MM-DD.';
        } else if (typeof value === 'string' && value.trim()) {
          // Check if startDate >= today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const startDate = new Date(value);
          startDate.setHours(0, 0, 0, 0);
          if (startDate < today) {
            newErrors.startDate = 'Ngày bắt đầu phải lớn hơn hoặc bằng ngày hôm nay.';
          } else {
            delete newErrors.startDate;
          }
        } else {
          delete newErrors.startDate;
        }
        break;
      case 'endDate':
        if (state.contractType === 'RENTAL') {
          if (!value || (typeof value === 'string' && !value.trim())) {
            newErrors.endDate = 'Vui lòng chọn ngày kết thúc hợp đồng.';
          } else if (typeof value === 'string' && !isValidDate(value)) {
            newErrors.endDate = 'Ngày kết thúc phải theo định dạng YYYY-MM-DD.';
          } else if (typeof value === 'string' && value.trim() && state.startDate) {
            // Check if endDate > startDate by at least 1 month
            const startDate = new Date(state.startDate);
            const endDate = new Date(value);
            const oneMonthLater = new Date(startDate);
            oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
            if (endDate <= oneMonthLater) {
              newErrors.endDate = 'Ngày kết thúc phải lớn hơn ngày bắt đầu ít nhất 1 tháng.';
            } else {
              delete newErrors.endDate;
            }
          } else {
            delete newErrors.endDate;
          }
        } else {
          delete newErrors.endDate;
        }
        break;
      case 'monthlyRent':
        if (state.contractType === 'RENTAL') {
          if (value === null || value === undefined) {
            newErrors.monthlyRent = 'Vui lòng nhập giá thuê hàng tháng cho hợp đồng thuê.';
          } else if (typeof value === 'number' && value < 0) {
            newErrors.monthlyRent = 'Giá thuê phải lớn hơn hoặc bằng 0.';
          } else {
            delete newErrors.monthlyRent;
          }
        } else {
          delete newErrors.monthlyRent;
        }
        break;
      case 'purchasePrice':
        if (state.contractType === 'PURCHASE') {
          if (value === null || value === undefined) {
            newErrors.purchasePrice = 'Vui lòng nhập giá mua cho hợp đồng mua.';
          } else if (typeof value === 'number' && value < 0) {
            newErrors.purchasePrice = 'Giá mua phải lớn hơn hoặc bằng 0.';
          } else {
            delete newErrors.purchasePrice;
          }
        } else {
          delete newErrors.purchasePrice;
        }
        break;
      case 'purchaseDate':
        if (state.contractType === 'PURCHASE') {
          if (!value || (typeof value === 'string' && !value.trim())) {
            newErrors.purchaseDate = 'Vui lòng nhập ngày mua cho hợp đồng mua.';
          } else if (typeof value === 'string' && !isValidDate(value)) {
            newErrors.purchaseDate = 'Ngày mua phải theo định dạng YYYY-MM-DD.';
          } else {
            delete newErrors.purchaseDate;
          }
        } else {
          delete newErrors.purchaseDate;
        }
        break;
      case 'paymentMethod':
        if (state.contractType === 'RENTAL') {
          if (!value || (typeof value === 'string' && !value.trim())) {
            newErrors.paymentMethod = 'Vui lòng chọn phương thức thanh toán.';
          } else {
            delete newErrors.paymentMethod;
          }
        } else {
          delete newErrors.paymentMethod;
        }
        break;
    }
    
    setFormErrors(newErrors);
  };

  const setFieldValue = <K extends keyof CreateContractPayload>(
    field: K,
    value: CreateContractPayload[K],
  ) => {
    setFormState((prev) => {
      const newState = {
        ...prev,
        [field]: value,
      };
      // Validate field after state update
      setTimeout(() => {
        validateField(field, value, newState);
      }, 0);
      return newState;
    });
    clearFieldErrors(field);
  };

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
    setFieldValue('unitId', '');
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
      if (err?.response?.status === 404) {
        setContractsState({ data: [], loading: false, error: null });
        return;
      }
      setContractsState({
        data: [],
        loading: false,
        error: 'Đã xảy ra lỗi khi tải hợp đồng. Vui lòng thử lại.',
      });
    }
  };

  const handleSelectUnit = async (unitId: string) => {
    setSelectedUnitId(unitId);
    setFieldValue('unitId', unitId);

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
      setFieldValue('unitId', selectedUnitId);
    }
    setCreateFiles(null);
    setFormErrors({});
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
    setFormErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isValidDate = (value?: string | null) => {
    if (!value) return true;
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
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

    const errors: Record<string, string> = {};

    if (!formState.unitId) {
      errors.unitId = 'Vui lòng chọn căn hộ trước khi tạo hợp đồng.';
    }

    if (!formState.contractNumber.trim()) {
      errors.contractNumber = 'Vui lòng nhập số hợp đồng.';
    }

    if (!formState.startDate) {
      errors.startDate = 'Vui lòng chọn ngày bắt đầu hợp đồng.';
    } else if (!isValidDate(formState.startDate)) {
      errors.startDate = 'Ngày bắt đầu phải theo định dạng YYYY-MM-DD.';
    }

    if (formState.contractType === 'RENTAL') {
      if (formState.monthlyRent === null || formState.monthlyRent === undefined) {
        errors.monthlyRent = 'Vui lòng nhập giá thuê hàng tháng cho hợp đồng thuê.';
      }
      if (formState.endDate && !isValidDate(formState.endDate)) {
        errors.endDate = 'Ngày kết thúc phải theo định dạng YYYY-MM-DD.';
      }
    }

    if (formState.contractType === 'PURCHASE') {
      if (formState.endDate) {
        errors.endDate = 'Hợp đồng mua không thể có ngày kết thúc.';
      }
      if (formState.purchasePrice === null || formState.purchasePrice === undefined) {
        errors.purchasePrice = 'Vui lòng nhập giá mua cho hợp đồng mua.';
      }
      if (!formState.purchaseDate) {
        errors.purchaseDate = 'Vui lòng nhập ngày mua cho hợp đồng mua.';
      } else if (!isValidDate(formState.purchaseDate)) {
        errors.purchaseDate = 'Ngày mua phải theo định dạng YYYY-MM-DD.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

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
      if (err?.response?.status === 404) {
        setDetailState({
          data: null,
          loading: false,
          error: 'Không tìm thấy hợp đồng.',
        });
        return;
      }
      setDetailState({
        data: null,
        loading: false,
        error: 'Đã xảy ra lỗi khi tải chi tiết hợp đồng. Vui lòng thử lại.',
      });
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
    <div className="min-h-screen bg-[#F5F9F6] px-[41px] py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#02542D]">Quản lý hợp đồng căn hộ</h1>
            <p className="text-sm text-gray-600">
              Tạo mới và theo dõi các hợp đồng thuê/mua của từng căn hộ trong dự án.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            disabled={!selectedUnitId}
            className="inline-flex items-center rounded-lg bg-[#14AE5C] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0c793f] disabled:cursor-not-allowed disabled:bg-[#A3D9B1]"
          >
            + Thêm hợp đồng
          </button>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#02542D]">Tòa nhà</label>
              <select
                value={selectedBuildingId}
                onChange={(event) => handleSelectBuilding(event.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#02542D] shadow-sm focus:border-[#14AE5C] focus:outline-none focus:ring-2 focus:ring-[#C7E8D2]"
              >
                <option value="">-- Chọn tòa nhà --</option>
                {buildingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {buildingsState.loading && (
                <span className="text-xs text-gray-500">Đang tải danh sách tòa nhà...</span>
              )}
              {buildingsState.error && (
                <span className="text-xs text-red-500">{buildingsState.error}</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#02542D]">Căn hộ</label>
              <select
                value={selectedUnitId}
                onChange={(event) => handleSelectUnit(event.target.value)}
                disabled={!selectedBuildingId || unitsState.loading}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#02542D] shadow-sm focus:border-[#14AE5C] focus:outline-none focus:ring-2 focus:ring-[#C7E8D2] disabled:cursor-not-allowed disabled:bg-gray-100"
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
                <span className="text-xs text-gray-500">Đang tải danh sách căn hộ...</span>
              )}
              {unitsState.error && <span className="text-xs text-red-500">{unitsState.error}</span>}
            </div>
          </div>

          <div className="mt-6">
            {contractsState.loading ? (
              <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600">
                Đang tải danh sách hợp đồng...
              </div>
            ) : contractsState.error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {contractsState.error}
              </div>
            ) : filteredContracts.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600">
                {selectedUnitId
                  ? 'Căn hộ này hiện không có hợp đồng.'
                  : 'Chọn tòa nhà và căn hộ để xem danh sách hợp đồng.'}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-[#E9F4EE]">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-[#02542D]">
                        Số hợp đồng
                      </th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-[#02542D]">
                        Loại
                      </th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-[#02542D]">
                        Hiệu lực
                      </th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-[#02542D]">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-center font-semibold uppercase tracking-wide text-[#02542D]">
                        Chi tiết
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredContracts.map((contract) => (
                      <tr key={contract.id} className="hover:bg-[#E9F4EE]">
                        <td className="px-4 py-3 font-medium text-[#02542D]">
                          {contract.contractNumber ?? 'Không rõ'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {contract.contractType ?? 'Không xác định'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          <div className="flex flex-col">
                            <span>Bắt đầu: {formatDate(contract.startDate)}</span>
                            <span>Kết thúc: {formatDate(contract.endDate)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium shadow-sm ${
                              contract.status === 'ACTIVE'
                                ? 'bg-[#C7E8D2] text-[#02542D]'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {contract.status ?? 'Không xác định'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenContractDetail(contract.id)}
                            className="inline-flex items-center rounded-lg border border-[#14AE5C] px-3 py-1 text-sm font-medium text-[#02542D] shadow-sm transition hover:bg-[#14AE5C] hover:text-white"
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
          <div className="rounded-xl border border-[#C7E8D2] bg-[#E9F4EE] px-4 py-3 text-sm text-[#02542D]">
            {createSuccess}
          </div>
        )}

        {createModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 px-4 py-8">
            <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#02542D]">Thêm hợp đồng mới</h2>
                  <p className="text-sm text-gray-500">
                    Nhập thông tin hợp đồng thuê hoặc mua cho căn hộ được chọn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCreateModalOpen(false);
                    resetCreateForm();
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-100"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleCreateContract} className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-[#02542D]">Căn hộ</label>
                    <select
                      value={formState.unitId}
                      onChange={(event) => setFieldValue('unitId', event.target.value)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#02542D] shadow-sm focus:border-[#14AE5C] focus:outline-none focus:ring-2 focus:ring-[#C7E8D2]"
                      required
                    >
                      <option value="">-- Chọn căn hộ --</option>
                      {unitOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {formErrors.unitId && (
                      <span className="mt-1 text-xs text-red-500">{formErrors.unitId}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-[#02542D]">Số hợp đồng</label>
                    <input
                      type="text"
                      value={formState.contractNumber}
                      onChange={(event) => setFieldValue('contractNumber', event.target.value)}
                      placeholder="Ví dụ: HD-2025-0001"
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#02542D] shadow-sm focus:border-[#14AE5C] focus:outline-none focus:ring-2 focus:ring-[#C7E8D2]"
                      required
                    />
                    {formErrors.contractNumber && (
                      <span className="mt-1 text-xs text-red-500">{formErrors.contractNumber}</span>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-[#02542D]">Loại hợp đồng</label>
                    <select
                      value={formState.contractType ?? 'RENTAL'}
                      onChange={(event) => {
                        const nextType = event.target.value as CreateContractPayload['contractType'];
                        setFormState((prev) => ({
                          ...prev,
                          contractType: nextType,
                          endDate: nextType === 'PURCHASE' ? '' : prev.endDate,
                          monthlyRent: nextType === 'PURCHASE' ? null : prev.monthlyRent,
                          purchasePrice: nextType === 'RENTAL' ? null : prev.purchasePrice,
                          purchaseDate: nextType === 'RENTAL' ? '' : prev.purchaseDate,
                        }));
                        if (nextType === 'PURCHASE') {
                          clearFieldErrors('endDate', 'monthlyRent');
                        } else {
                          clearFieldErrors('purchasePrice', 'purchaseDate');
                        }
                      }}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#02542D] shadow-sm focus:border-[#14AE5C] focus:outline-none focus:ring-2 focus:ring-[#C7E8D2]"
                    >
                      {CONTRACT_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-[#02542D]">Trạng thái</label>
                    <div className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 shadow-inner">
                      Đang hiệu lực (mặc định)
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-[#02542D]">Ngày bắt đầu</label>
                    <DateBox
                      value={formState.startDate ?? ''}
                      onChange={(event) => setFieldValue('startDate', event.target.value)}
                      placeholderText="YYYY-MM-DD"
                    />
                    {formErrors.startDate && (
                      <span className="mt-1 text-xs text-red-500">{formErrors.startDate}</span>
                    )}
                  </div>
                  {formState.contractType !== 'PURCHASE' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-[#02542D]">Ngày kết thúc</label>
                      <DateBox
                        value={formState.endDate ?? ''}
                        onChange={(event) =>
                          setFieldValue('endDate', event.target.value ? event.target.value : null)
                        }
                        placeholderText="YYYY-MM-DD"
                      />
                      {formErrors.endDate && (
                        <span className="mt-1 text-xs text-red-500">{formErrors.endDate}</span>
                      )}
                    </div>
                  )}
                  {formState.contractType === 'PURCHASE' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-[#02542D]">Ngày mua</label>
                      <DateBox
                        value={formState.purchaseDate ?? ''}
                        onChange={(event) =>
                          setFieldValue(
                            'purchaseDate',
                            event.target.value ? event.target.value : null,
                          )
                        }
                        placeholderText="YYYY-MM-DD"
                      />
                      {formErrors.purchaseDate && (
                        <span className="mt-1 text-xs text-red-500">{formErrors.purchaseDate}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {formState.contractType === 'RENTAL' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-[#02542D]">Giá thuê / tháng</label>
                      <input
                        type="number"
                        min={0}
                        value={formState.monthlyRent ?? ''}
                        onChange={(event) =>
                          setFieldValue(
                            'monthlyRent',
                            event.target.value ? Number(event.target.value) : null,
                          )
                        }
                        placeholder="Ví dụ: 12000000"
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#02542D] shadow-sm focus:border-[#14AE5C] focus:outline-none focus:ring-2 focus:ring-[#C7E8D2]"
                      />
                      {formErrors.monthlyRent && (
                        <span className="mt-1 text-xs text-red-500">{formErrors.monthlyRent}</span>
                      )}
                    </div>
                  )}
                  {formState.contractType === 'PURCHASE' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-[#02542D]">Giá mua</label>
                      <input
                        type="number"
                        min={0}
                        value={formState.purchasePrice ?? ''}
                        onChange={(event) =>
                          setFieldValue(
                            'purchasePrice',
                            event.target.value ? Number(event.target.value) : null,
                          )
                        }
                        placeholder="Ví dụ: 2500000000"
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#02542D] shadow-sm focus:border-[#14AE5C] focus:outline-none focus:ring-2 focus:ring-[#C7E8D2]"
                      />
                      {formErrors.purchasePrice && (
                        <span className="mt-1 text-xs text-red-500">{formErrors.purchasePrice}</span>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-[#02542D]">Phương thức thanh toán</label>
                    <select
                      value={formState.paymentMethod ?? ''}
                      onChange={(event) => setFieldValue('paymentMethod', event.target.value)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#02542D] shadow-sm focus:border-[#14AE5C] focus:outline-none focus:ring-2 focus:ring-[#C7E8D2]"
                      disabled={formState.contractType === 'PURCHASE'}
                    >
                      {PAYMENT_METHOD_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-[#02542D]">Điều khoản thanh toán</label>
                    <input
                      type="text"
                      value={formState.paymentTerms ?? ''}
                      onChange={(event) => setFieldValue('paymentTerms', event.target.value)}
                      placeholder="Ví dụ: trả theo quý..."
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#02542D] shadow-sm focus:border-[#14AE5C] focus:outline-none focus:ring-2 focus:ring-[#C7E8D2]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#02542D]">Ghi chú</label>
                  <textarea
                    value={formState.notes ?? ''}
                    onChange={(event) => setFieldValue('notes', event.target.value)}
                    rows={3}
                    placeholder="Thông tin bổ sung về hợp đồng..."
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#02542D] shadow-sm focus:border-[#14AE5C] focus:outline-none focus:ring-2 focus:ring-[#C7E8D2]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#02542D]">
                    Tệp đính kèm hợp đồng (tuỳ chọn)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(event) => setCreateFiles(event.target.files)}
                    className="text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#02542D] hover:file:bg-gray-200"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <span className="text-xs text-gray-500">
                    Có thể tải nhiều tệp (PDF, ảnh...) để lưu trữ cùng hợp đồng.
                  </span>
                </div>

                {createError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {createError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateModalOpen(false);
                      resetCreateForm();
                    }}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-white"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={createSubmitting}
                    className="inline-flex items-center justify-center rounded-lg bg-[#14AE5C] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0c793f] disabled:cursor-not-allowed disabled:bg-[#A3D9B1]"
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
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#02542D]">Chi tiết hợp đồng</h3>
                  {detailState.data?.contractNumber && (
                    <p className="text-sm text-gray-500">
                      Số hợp đồng: {detailState.data.contractNumber}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCloseContractDetail}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-100"
                >
                  ×
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
                {detailState.loading && (
                  <p className="text-sm text-gray-500">Đang tải chi tiết hợp đồng...</p>
                )}
                {detailState.error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {detailState.error}
                  </div>
                )}
                {!detailState.loading && !detailState.error && detailState.data && (
                  <div className="space-y-5 text-sm text-gray-700">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <p>
                        <span className="font-medium text-[#02542D]">Loại hợp đồng:</span>{' '}
                        {detailState.data.contractType ?? 'Không xác định'}
                      </p>
                      <p>
                        <span className="font-medium text-[#02542D]">Trạng thái:</span>{' '}
                        {detailState.data.status ?? 'Không xác định'}
                      </p>
                      <p>
                        <span className="font-medium text-[#02542D]">Ngày bắt đầu:</span>{' '}
                        {formatDate(detailState.data.startDate)}
                      </p>
                      <p>
                        <span className="font-medium text-[#02542D]">Ngày kết thúc:</span>{' '}
                        {detailState.data.endDate ? formatDate(detailState.data.endDate) : 'Không giới hạn'}
                      </p>
                      {detailState.data.monthlyRent != null && (
                        <p>
                          <span className="font-medium text-[#02542D]">Giá thuê / tháng:</span>{' '}
                          {detailState.data.monthlyRent.toLocaleString('vi-VN')} đ
                        </p>
                      )}
                      {detailState.data.purchasePrice != null && (
                        <p>
                          <span className="font-medium text-[#02542D]">Giá mua:</span>{' '}
                          {detailState.data.purchasePrice.toLocaleString('vi-VN')} đ
                        </p>
                      )}
                      {detailState.data.purchaseDate && (
                        <p>
                          <span className="font-medium text-[#02542D]">Ngày mua:</span>{' '}
                          {formatDate(detailState.data.purchaseDate)}
                        </p>
                      )}
                      {detailState.data.paymentMethod && (
                        <p>
                          <span className="font-medium text-[#02542D]">Phương thức thanh toán:</span>{' '}
                          {detailState.data.paymentMethod}
                        </p>
                      )}
                    </div>
                    {detailState.data.paymentTerms && (
                      <div>
                        <p className="font-medium text-[#02542D]">Điều khoản thanh toán</p>
                        <p className="mt-1 whitespace-pre-line text-gray-600">
                          {detailState.data.paymentTerms}
                        </p>
                      </div>
                    )}
                    {detailState.data.notes && (
                      <div>
                        <p className="font-medium text-[#02542D]">Ghi chú</p>
                        <p className="mt-1 whitespace-pre-line text-gray-600">
                          {detailState.data.notes}
                        </p>
                      </div>
                    )}
                    <div className="space-y-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-medium text-[#02542D]">Tệp đính kèm</p>
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
                            className="inline-flex items-center rounded-lg border border-[#14AE5C] px-3 py-1.5 text-sm font-medium text-[#02542D] shadow-sm transition hover:bg-[#14AE5C] hover:text-white disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300"
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
                                className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="font-medium text-[#02542D]">
                                      {file.originalFileName ?? file.fileName ?? 'Tệp không tên'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {file.contentType ?? 'Không rõ định dạng'} •{' '}
                                      {file.fileSize ? `${(file.fileSize / 1024).toFixed(1)} KB` : 'Kích thước không rõ'}
                                    </p>
                                    {file.isPrimary && (
                                      <span className="mt-1 inline-flex rounded-full bg-[#C7E8D2] px-2 py-0.5 text-xs font-medium text-[#02542D]">
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
                                  <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
                                    <img
                                      src={displayUrl}
                                      alt={file.originalFileName ?? file.fileName ?? 'Contract image'}
                                  className="max-h-96 w-full object-contain bg-gray-100"
                                    />
                                  </div>
                                )}
                                {isPdf && displayUrl && (
                                  <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
                                    <object
                                      data={displayUrl}
                                      type="application/pdf"
                                      className="h-96 w-full"
                                    >
                                  <p className="p-4 text-sm text-gray-500">
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
                        <p className="text-sm text-gray-500">
                          Hợp đồng chưa có tệp đính kèm. Bạn có thể tải tệp ngay tại đây.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end border-t border-gray-200 bg-gray-50 px-6 py-4">
                <button
                  type="button"
                  onClick={handleCloseContractDetail}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-white"
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

