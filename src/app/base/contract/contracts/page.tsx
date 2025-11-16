'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

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
import { useTranslations } from 'next-intl';

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
  if (!value) return t('common.notSet');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN');
}

function generateAutoContractNumber() {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `HD-${yyyy}${mm}${dd}-${hh}${mi}${ss}${ms}-${rand}`;
}

export default function ContractManagementPage() {
  const t = useTranslations('Contracts');
  const router = useRouter();
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
  const [showExpired, setShowExpired] = useState(false);

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

  const setFieldValue = <K extends keyof CreateContractPayload>(
    field: K,
    value: CreateContractPayload[K],
  ) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
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
          err?.response?.data?.message || err?.message || t('errors.loadBuildings');
        setBuildingsState({ data: [], loading: false, error: message });
      }
    };

    void loadBuildings();
  }, [t]);

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
        t('errors.loadUnits');
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
        error: t('errors.loadContracts'),
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
    // Auto-generate contract number with strong uniqueness
    setFieldValue('contractNumber', generateAutoContractNumber());
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
    return /^\d{2}\/\d{2}\/\d{4}$/.test(value);
  };

  const ddmmyyyyToYyyyMmDd = (value: string | null | undefined) => {
    if (!value) return '';
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return '';
    const [d, m, y] = value.split('/').map(Number);
    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return '';
    const yyyy = String(y);
    const mm = String(m).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const parseDdMmYyyyToDate = (value?: string | null) => {
    if (!value || !/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return null;
    const [d, m, y] = value.split('/').map(Number);
    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
    dt.setHours(0, 0, 0, 0);
    return dt;
  };

  const addMonths = (date: Date, months: number) => {
    const d = new Date(date.getTime());
    const targetMonth = d.getMonth() + months;
    d.setMonth(targetMonth);
    // Handle end-of-month rollovers
    if (d.getMonth() !== (targetMonth % 12 + 12) % 12) {
      d.setDate(0);
    }
    d.setHours(0, 0, 0, 0);
    return d;
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
      errors.unitId = t('validation.unitRequired');
    }

    // contractNumber is auto-generated and readonly; ensure present
    if (!formState.contractNumber || !formState.contractNumber.trim()) {
      setFieldValue('contractNumber', generateAutoContractNumber());
    }

    // Contract type must be selected
    if (!formState.contractType) {
      errors.contractType = t('validation.contractTypeRequired');
    }

    if (!formState.startDate) {
      errors.startDate = t('validation.startDateRequired');
    } else if (!isValidDate(formState.startDate)) {
      errors.startDate = t('validation.dateFormat');
    } else {
      const start = parseDdMmYyyyToDate(formState.startDate);
      const today = new Date(); today.setHours(0,0,0,0);
      if (!start) {
        errors.startDate = t('validation.startDateInvalid');
      } else if (start < today) {
        errors.startDate = t('validation.startDateInFuture');
      }
    }

    if (formState.contractType === 'RENTAL') {
      // End date required and at least 1 month after start
      if (!formState.endDate) {
        errors.endDate = t('validation.endDateRequired');
      } else if (!isValidDate(formState.endDate)) {
        errors.endDate = t('validation.dateFormat');
      } else {
        const start = parseDdMmYyyyToDate(formState.startDate);
        const end = parseDdMmYyyyToDate(formState.endDate);
        if (!start || !end) {
          errors.endDate = t('validation.endDateInvalid');
        } else {
          const minEnd = addMonths(start, 1);
          if (end < minEnd) {
            errors.endDate = t('validation.endDateMinDiff');
          }
        }
      }

      if (formState.monthlyRent === null || formState.monthlyRent === undefined) {
        errors.monthlyRent = t('validation.monthlyRentRequired');
      } else if (formState.monthlyRent < 0) {
        errors.monthlyRent = t('validation.nonNegative');
      }

      if (!formState.paymentMethod || !formState.paymentMethod.trim()) {
        errors.paymentMethod = t('validation.paymentMethodRequired');
      }
    }

    if (formState.contractType === 'PURCHASE') {
      if (formState.endDate) {
        errors.endDate = t('validation.purchaseHasNoEndDate');
      }
      if (formState.purchasePrice === null || formState.purchasePrice === undefined) {
        errors.purchasePrice = t('validation.purchasePriceRequired');
      }
      if (!formState.purchaseDate) {
        errors.purchaseDate = t('validation.purchaseDateRequired');
      } else if (!isValidDate(formState.purchaseDate)) {
        errors.purchaseDate = t('validation.dateFormat');
      }
    }

    // Require at least one file to be uploaded
    if (!createFiles || createFiles.length === 0) {
      errors.files = t('validation.filesRequired');
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
      const basePayload: CreateContractPayload = {
        ...formState,
        startDate: ddmmyyyyToYyyyMmDd(formState.startDate) || '',
        endDate:
          formState.contractType === 'RENTAL'
            ? ddmmyyyyToYyyyMmDd(formState.endDate ?? '') || null
            : null,
        purchaseDate:
          formState.contractType === 'PURCHASE'
            ? ddmmyyyyToYyyyMmDd(formState.purchaseDate ?? '') || null
            : null,
        monthlyRent:
          formState.contractType === 'RENTAL' ? formState.monthlyRent ?? 0 : null,
        purchasePrice:
          formState.contractType === 'PURCHASE' ? formState.purchasePrice ?? 0 : null,
        paymentMethod:
          formState.contractType === 'PURCHASE' ? null : trimmedPaymentMethod,
        paymentTerms:
          formState.contractType === 'PURCHASE' ? null : trimmedPaymentTerms,
        notes: formState.notes && formState.notes.trim().length > 0 ? formState.notes.trim() : null,
        status: 'ACTIVE',
      };

      // Retry up to 3 times if backend reports duplicate contract number
      let attempts = 0;
      let lastError: any = null;
      while (attempts < 3) {
        attempts += 1;
        const candidateNumber =
          attempts === 1 ? formState.contractNumber : generateAutoContractNumber();
        const payload: CreateContractPayload = {
          ...basePayload,
          contractNumber: candidateNumber,
        };
        try {
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

          setCreateSuccess(t('messages.createSuccess'));
          await loadContracts(payload.unitId);
          resetCreateForm();
          setCreateModalOpen(false);
          setFieldValue('contractNumber', candidateNumber);
          lastError = null;
          break;
        } catch (err: any) {
          const msg =
            err?.response?.data?.message?.toString() ||
            err?.message?.toString() ||
            '';
          lastError = err;
          if (msg.includes('Contract number already exists')) {
            // regenerate and retry
            continue;
          }
          throw err;
        }
      }

      if (lastError) {
        throw lastError;
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        t('errors.createFailed');
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

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isExpired = (contract: ContractSummary) => {
    if (!contract.endDate) {
      // No end date -> considered not expired (unlimited)
      return false;
    }
    const end = new Date(contract.endDate);
    end.setHours(0, 0, 0, 0);
    return end < today;
  };

  const expiredContracts = useMemo(
    () => filteredContracts.filter((c) => isExpired(c)),
    [filteredContracts, today],
  );
  const validContracts = useMemo(
    () => filteredContracts.filter((c) => !isExpired(c)),
    [filteredContracts, today],
  );

  return (
    <div className="min-h-screen bg-[#F5F9F6] px-[41px] py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#02542D]">{t('title')}</h1>
            <p className="text-sm text-gray-600">
              {t('subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            disabled={!selectedUnitId || validContracts.length > 0}
            className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition
              ${!selectedUnitId || validContracts.length > 0
                ? 'cursor-not-allowed bg-[#A3D9B1] text-white'
                : 'bg[#14AE5C] bg-[#14AE5C] text-white hover:bg-[#0c793f]'}`}
          >
            + {t('buttons.addContract')}
          </button>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#02542D]">{t('fields.building')}</label>
              <select
                value={selectedBuildingId}
                onChange={(event) => handleSelectBuilding(event.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#02542D] shadow-sm focus:border-[#14AE5C] focus:outline-none focus:ring-2 focus:ring-[#C7E8D2]"
              >
                <option value="">{t('placeholders.selectBuilding')}</option>
                {buildingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {buildingsState.loading && (
                <span className="text-xs text-gray-500">{t('loading.buildings')}</span>
              )}
              {buildingsState.error && (
                <span className="text-xs text-red-500">{buildingsState.error}</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#02542D]">{t('fields.unit')}</label>
              <select
                value={selectedUnitId}
                onChange={(event) => handleSelectUnit(event.target.value)}
                disabled={!selectedBuildingId || unitsState.loading}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#02542D] shadow-sm focus:border-[#14AE5C] focus:outline-none focus:ring-2 focus:ring-[#C7E8D2] disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="">
                  {selectedBuildingId ? t('placeholders.selectUnit') : t('placeholders.selectBuildingFirst')}
                </option>
                {unitOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {unitsState.loading && (
                <span className="text-xs text-gray-500">{t('loading.units')}</span>
              )}
              {unitsState.error && <span className="text-xs text-red-500">{unitsState.error}</span>}
            </div>
          </div>

          <div className="mt-6">
            {contractsState.loading ? (
              <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600">
                {t('loading.contracts')}
              </div>
            ) : contractsState.error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {contractsState.error}
              </div>
            ) : filteredContracts.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600">
                {selectedUnitId
                  ? t('empty.noContracts')
                  : t('empty.selectToView')}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-[#E9F4EE]">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-[#02542D]">
                          {t('table.contractNumber')}
                        </th>
                        <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-[#02542D]">
                          {t('table.type')}
                        </th>
                        <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-[#02542D]">
                          {t('table.validity')}
                        </th>
                        <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-[#02542D]">
                          {t('table.status')}
                        </th>
                        <th className="px-4 py-3 text-center font-semibold uppercase tracking-wide text-[#02542D]">
                          {t('table.detail')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {validContracts.map((contract) => (
                        <tr key={contract.id} className="hover:bg-[#E9F4EE]">
                          <td className="px-4 py-3 font-medium text-[#02542D]">
                            {contract.contractNumber ?? t('common.unknown')}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {contract.contractType ?? t('common.unknown')}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            <div className="flex flex-col">
                              <span>{t('table.start')}: {formatDate(contract.startDate)}</span>
                              <span>{t('table.end')}: {formatDate(contract.endDate)}</span>
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
                              {contract.status ?? t('common.unknown')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenContractDetail(contract.id)}
                              className="inline-flex items-center rounded-lg border border-[#14AE5C] px-3 py-1 text-sm font-medium text-[#02542D] shadow-sm transition hover:bg-[#14AE5C] hover:text-white"
                            >
                              {t('buttons.view')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {expiredContracts.length > 0 && (
                  <div className="rounded-xl border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowExpired((s) => !s)}
                      className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left text-sm font-medium text-[#02542D]"
                    >
                      <span>Hợp đồng đã hết hạn ({expiredContracts.length})</span>
                      <span className="text-gray-500">{showExpired ? '▾' : '▸'}</span>
                    </button>
                    {showExpired && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-[#F6FAF8]">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-[#02542D]">
                                {t('table.contractNumber')}
                              </th>
                              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-[#02542D]">
                                {t('table.type')}
                              </th>
                              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-[#02542D]">
                                {t('table.validity')}
                              </th>
                              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-[#02542D]">
                                {t('table.status')}
                              </th>
                              <th className="px-4 py-3 text-center font-semibold uppercase tracking-wide text-[#02542D]">
                                {t('table.detail')}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {expiredContracts.map((contract) => (
                              <tr key={contract.id} className="opacity-60 hover:bg-[#E9F4EE]">
                                <td className="px-4 py-3 font-medium text-[#02542D]">
                                  {contract.contractNumber ?? t('common.unknown')}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {contract.contractType ?? t('common.unknown')}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  <div className="flex flex-col">
                                    <span>{t('table.start')}: {formatDate(contract.startDate)}</span>
                                    <span>{t('table.end')}: {formatDate(contract.endDate)}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  <span className="inline-flex rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 shadow-sm">
                                    {contract.status ?? t('common.unknown')}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenContractDetail(contract.id)}
                                    className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-100"
                                  >
                                    {t('buttons.view')}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
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
                  <h2 className="text-lg font-semibold text-[#02542D]">{t('create.title')}</h2>
                  <p className="text-sm text-gray-500">
                    {t('create.subtitle')}
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
                    <label className="text-sm font-medium text-[#02542D]">{t('fields.unit')}</label>
                    <select
                      value={formState.unitId}
                      onChange={(event) => setFieldValue('unitId', event.target.value)}
                      disabled
                      className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-[#02542D] shadow-inner focus:border-gray-200 focus:outline-none disabled:cursor-not-allowed"
                      required
                    >
                      <option value="">{t('placeholders.selectUnit')}</option>
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
                    <label className="text-sm font-medium text-[#02542D]">{t('fields.contractNumber')}</label>
                    <input
                      type="text"
                      value={formState.contractNumber}
                      readOnly
                      disabled
                      placeholder={t('placeholders.contractNumber')}
                      className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-[#02542D] shadow-inner focus:border-gray-200 focus:outline-none disabled:cursor-not-allowed"
                    />
                    {formErrors.contractNumber && (
                      <span className="mt-1 text-xs text-red-500">{formErrors.contractNumber}</span>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-[#02542D]">{t('fields.contractType')}</label>
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
                      <option value="RENTAL">{t('contractTypes.rental')}</option>
                      <option value="PURCHASE">{t('contractTypes.purchase')}</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-[#02542D]">{t('fields.status')}</label>
                    <div className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 shadow-inner">
                      {t('status.activeDefault')}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-[#02542D]">{t('fields.startDate')}</label>
                    <DateBox
                      value={formState.startDate ?? ''}
                      onChange={(event) => setFieldValue('startDate', event.target.value)}
                      placeholderText={t('placeholders.ddmmyyyy')}
                    />
                    {formErrors.startDate && (
                      <span className="mt-1 text-xs text-red-500">{formErrors.startDate}</span>
                    )}
                  </div>
                  {formState.contractType !== 'PURCHASE' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-[#02542D]">{t('fields.endDate')}</label>
                      <DateBox
                        value={formState.endDate ?? ''}
                        onChange={(event) =>
                          setFieldValue('endDate', event.target.value ? event.target.value : null)
                        }
                        placeholderText={t('placeholders.ddmmyyyy')}
                      />
                      {formErrors.endDate && (
                        <span className="mt-1 text-xs text-red-500">{formErrors.endDate}</span>
                      )}
                    </div>
                  )}
                  {formState.contractType === 'PURCHASE' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-[#02542D]">{t('fields.purchaseDate')}</label>
                      <DateBox
                        value={formState.purchaseDate ?? ''}
                        onChange={(event) =>
                          setFieldValue(
                            'purchaseDate',
                            event.target.value ? event.target.value : null,
                          )
                        }
                        placeholderText={t('placeholders.ddmmyyyy')}
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
                      <label className="text-sm font-medium text-[#02542D]">{t('fields.monthlyRent')}</label>
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
                        placeholder={t('placeholders.monthlyRent')}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#02542D] shadow-sm focus:border-[#14AE5C] focus:outline-none focus:ring-2 focus:ring-[#C7E8D2]"
                      />
                      {formErrors.monthlyRent && (
                        <span className="mt-1 text-xs text-red-500">{formErrors.monthlyRent}</span>
                      )}
                    </div>
                  )}
                  {formState.contractType === 'PURCHASE' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-[#02542D]">{t('fields.purchasePrice')}</label>
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
                        placeholder={t('placeholders.purchasePrice')}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#02542D] shadow-sm focus:border-[#14AE5C] focus:outline-none focus:ring-2 focus:ring-[#C7E8D2]"
                      />
                      {formErrors.purchasePrice && (
                        <span className="mt-1 text-xs text-red-500">{formErrors.purchasePrice}</span>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-[#02542D]">{t('fields.paymentMethod')}</label>
                    <select
                      value={formState.paymentMethod ?? ''}
                      onChange={(event) => setFieldValue('paymentMethod', event.target.value)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#02542D] shadow-sm focus:border-[#14AE5C] focus:outline-none focus:ring-2 focus:ring-[#C7E8D2]"
                      disabled={formState.contractType === 'PURCHASE'}
                    >
                      <option value="">{t('placeholders.selectPaymentMethod')}</option>
                      <option value="Chuyển khoản">{t('paymentMethods.transfer')}</option>
                      <option value="Tiền mặt">{t('paymentMethods.cash')}</option>
                      <option value="Ví điện tử">{t('paymentMethods.eWallet')}</option>
                      <option value="Khác">{t('paymentMethods.other')}</option>
                    </select>
                    {formErrors.paymentMethod && (
                      <span className="mt-1 text-xs text-red-500">{formErrors.paymentMethod}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-[#02542D]">{t('fields.paymentTerms')}</label>
                    <input
                      type="text"
                      value={formState.paymentTerms ?? ''}
                      onChange={(event) => setFieldValue('paymentTerms', event.target.value)}
                      placeholder={t('placeholders.paymentTerms')}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#02542D] shadow-sm focus:border-[#14AE5C] focus:outline-none focus:ring-2 focus:ring-[#C7E8D2]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#02542D]">{t('fields.notes')}</label>
                  <textarea
                    value={formState.notes ?? ''}
                    onChange={(event) => setFieldValue('notes', event.target.value)}
                    rows={3}
                    placeholder={t('placeholders.notes')}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#02542D] shadow-sm focus:border-[#14AE5C] focus:outline-none focus:ring-2 focus:ring-[#C7E8D2]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#02542D]">
                    {t('fields.attachmentsRequired')}
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(event) => setCreateFiles(event.target.files)}
                    className="text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#02542D] hover:file:bg-gray-200"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <span className="text-xs text-gray-500">{t('hints.attachments')}</span>
                  {formErrors.files && (
                    <span className="mt-1 text-xs text-red-500">{formErrors.files}</span>
                  )}
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
                    {t('buttons.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={createSubmitting}
                    className="inline-flex items-center justify-center rounded-lg bg-[#14AE5C] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0c793f] disabled:cursor-not-allowed disabled:bg-[#A3D9B1]"
                  >
                    {createSubmitting ? t('buttons.creating') : t('buttons.create')}
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
                  <h3 className="text-lg font-semibold text-[#02542D]">{t('detail.title')}</h3>
                  {detailState.data?.contractNumber && (
                    <p className="text-sm text-gray-500">
                      {t('detail.contractNumber')}: {detailState.data.contractNumber}
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
                  <p className="text-sm text-gray-500">{t('loading.detail')}</p>
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
                        <span className="font-medium text-[#02542D]">{t('detail.type')}:</span>{' '}
                        {detailState.data.contractType ?? t('common.unknown')}
                      </p>
                      <p>
                        <span className="font-medium text-[#02542D]">{t('detail.status')}:</span>{' '}
                        {detailState.data.status ?? t('common.unknown')}
                      </p>
                      <p>
                        <span className="font-medium text-[#02542D]">{t('detail.start')}:</span>{' '}
                        {formatDate(detailState.data.startDate)}
                      </p>
                      <p>
                        <span className="font-medium text-[#02542D]">{t('detail.end')}:</span>{' '}
                        {detailState.data.endDate ? formatDate(detailState.data.endDate) : t('detail.unlimited')}
                      </p>
                      {detailState.data.monthlyRent != null && (
                        <p>
                          <span className="font-medium text-[#02542D]">{t('detail.monthlyRent')}:</span>{' '}
                          {detailState.data.monthlyRent.toLocaleString('vi-VN')} đ
                        </p>
                      )}
                      {detailState.data.purchasePrice != null && (
                        <p>
                          <span className="font-medium text-[#02542D]">{t('detail.purchasePrice')}:</span>{' '}
                          {detailState.data.purchasePrice.toLocaleString('vi-VN')} đ
                        </p>
                      )}
                      {detailState.data.purchaseDate && (
                        <p>
                          <span className="font-medium text-[#02542D]">{t('detail.purchaseDate')}:</span>{' '}
                          {formatDate(detailState.data.purchaseDate)}
                        </p>
                      )}
                      {detailState.data.paymentMethod && (
                        <p>
                          <span className="font-medium text-[#02542D]">{t('detail.paymentMethod')}:</span>{' '}
                          {detailState.data.paymentMethod}
                        </p>
                      )}
                    </div>
                    {detailState.data.paymentTerms && (
                      <div>
                        <p className="font-medium text-[#02542D]">{t('detail.paymentTerms')}</p>
                        <p className="mt-1 whitespace-pre-line text-gray-600">
                          {detailState.data.paymentTerms}
                        </p>
                      </div>
                    )}
                    {detailState.data.notes && (
                      <div>
                        <p className="font-medium text-[#02542D]">{t('detail.notes')}</p>
                        <p className="mt-1 whitespace-pre-line text-gray-600">
                          {detailState.data.notes}
                        </p>
                      </div>
                    )}
                    {/* Export PDF */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => detailState.data && router.push(`/base/contract/export/${detailState.data.id}`)}
                        className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
                      >
                        Xuất hợp đồng PDF
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-medium text-[#02542D]">{t('detail.attachments')}</p>
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
                            {detailUploading ? t('buttons.uploading') : t('buttons.uploadAttachment')}
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
                                      {file.originalFileName ?? file.fileName ?? t('detail.unnamedFile')}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {file.contentType ?? t('detail.unknownType')} •{' '}
                                      {file.fileSize ? `${(file.fileSize / 1024).toFixed(1)} KB` : t('detail.unknownSize')}
                                    </p>
                                    {file.isPrimary && (
                                      <span className="mt-1 inline-flex rounded-full bg-[#C7E8D2] px-2 py-0.5 text-xs font-medium text-[#02542D]">
                                        {t('detail.primaryFile')}
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
                                      {t('buttons.viewOrDownload')}
                                    </a>
                                  )}
                                </div>
                                {isImage && displayUrl && (
                                  <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
                                    <img
                                      src={displayUrl}
                                      alt={file.originalFileName ?? file.fileName ?? t('detail.contractImageAlt')}
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
                                        {t('detail.cannotDisplayPdf')}{' '}
                                        <a
                                          href={displayUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 underline"
                                        >
                                          {t('buttons.downloadHere')}
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
                          {t('detail.noAttachments')}
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
                  {t('buttons.close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

