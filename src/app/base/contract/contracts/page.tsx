'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

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
  getAllContracts,
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


const BASE_API_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8081').replace(/\/$/, '');
const DATA_DOCS_API_URL = (process.env.NEXT_PUBLIC_DATA_DOCS_URL || 'http://localhost:8082').replace(/\/$/, '');

function resolveFileUrl(url?: string | null, contractId?: string, fileId?: string) {
  // If we have contractId and fileId, use Next.js API route to proxy the request
  // This ensures credentials are forwarded properly
  if (contractId && fileId) {
    return `/api/contract-files/${contractId}/${fileId}`;
  }
  
  // Fallback to using fileUrl/proxyUrl if provided
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  // Try data-docs-service first, then fallback to base-service
  if (normalizedPath.includes('/api/contracts') || normalizedPath.includes('/api/files')) {
    return `${DATA_DOCS_API_URL}${normalizedPath}`;
  }
  return `${BASE_API_URL}${normalizedPath}`;
}

export default function ContractManagementPage() {
  const t = useTranslations('Contracts');
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
  const [generatingContractNumber, setGeneratingContractNumber] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'expired'>('active');

  const formatDate = (value?: string | null) => {
    if (!value) return t('common.notSet');
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('vi-VN');
  };

  const CONTRACT_TYPE_OPTIONS = useMemo(() => [
    { value: 'RENTAL', label: t('contractTypes.rental') },
    { value: 'PURCHASE', label: t('contractTypes.purchase') },
  ], [t]);

  const PAYMENT_METHOD_OPTIONS = useMemo(() => [
    { value: '', label: t('paymentMethods.selectPlaceholder') },
    { value: t('paymentMethods.transfer'), label: t('paymentMethods.transfer') },
    { value: t('paymentMethods.cash'), label: t('paymentMethods.cash') },
    { value: t('paymentMethods.eWallet'), label: t('paymentMethods.eWallet') },
    { value: t('paymentMethods.other'), label: t('paymentMethods.other') },
  ], [t]);

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
          newErrors.unitId = t('validation.unitRequired');
        } else {
          delete newErrors.unitId;
        }
        break;
      case 'contractNumber':
        if (!value || (typeof value === 'string' && !value.trim())) {
          newErrors.contractNumber = t('validation.contractNumberRequired');
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
          newErrors.startDate = t('validation.startDateRequired');
        } else if (typeof value === 'string' && !isValidDate(value)) {
          newErrors.startDate = t('validation.startDateInvalid');
        } else if (typeof value === 'string' && value.trim()) {
          // Check if startDate > today (must be greater than today, not equal)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const startDate = new Date(value);
          startDate.setHours(0, 0, 0, 0);
          if (startDate <= today) {
            newErrors.startDate = t('validation.startDateInFuture');
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
            newErrors.endDate = t('validation.endDateRequired');
          } else if (typeof value === 'string' && !isValidDate(value)) {
            newErrors.endDate = t('validation.endDateInvalid');
          } else if (typeof value === 'string' && value.trim() && state.startDate) {
            // Check if endDate > startDate by at least 1 month
            const startDate = new Date(state.startDate);
            const endDate = new Date(value);
            const oneMonthLater = new Date(startDate);
            oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
            if (endDate <= oneMonthLater) {
              newErrors.endDate = t('validation.endDateMinDiff');
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
      case 'purchaseDate':
        if (state.contractType === 'PURCHASE') {
          if (!value || (typeof value === 'string' && !value.trim())) {
            newErrors.purchaseDate = t('validation.purchaseDateRequired');
          } else if (typeof value === 'string' && !isValidDate(value)) {
            newErrors.purchaseDate = t('validation.purchaseDateInvalid');
          } else {
            // Allow purchaseDate to be before, equal, or after startDate
            // No validation needed for date comparison
            delete newErrors.purchaseDate;
          }
        } else {
          delete newErrors.purchaseDate;
        }
        break;
      case 'monthlyRent':
        if (state.contractType === 'RENTAL') {
          if (value === null || value === undefined) {
            newErrors.monthlyRent = t('validation.monthlyRentRequired');
          } else if (typeof value === 'number' && value <= 0) {
            newErrors.monthlyRent = t('validation.monthlyRentGreaterThanZero');
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
            newErrors.purchasePrice = t('validation.purchasePriceRequired');
          } else if (typeof value === 'number' && value <= 0) {
            newErrors.purchasePrice = t('validation.purchasePriceGreaterThanZero');
          } else {
            delete newErrors.purchasePrice;
          }
        } else {
          delete newErrors.purchasePrice;
        }
        break;
      case 'paymentMethod':
        // Payment method is required only for RENTAL contracts
        // PURCHASE contracts are fully paid, so paymentMethod is not applicable
        if (state.contractType === 'RENTAL') {
          if (!value || (typeof value === 'string' && !value.trim())) {
            newErrors.paymentMethod = t('validation.paymentMethodRequired');
          } else {
            delete newErrors.paymentMethod;
          }
        } else {
          // For PURCHASE contracts, clear any paymentMethod errors
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
      
      // Auto-update paymentTerms for RENTAL contracts when startDate or endDate changes
      if (prev.contractType === 'RENTAL' && (field === 'startDate' || field === 'endDate')) {
        const startDate = field === 'startDate' ? (value as string) : prev.startDate;
        const endDate = field === 'endDate' ? (value as string) : prev.endDate;
        
        // Only auto-update if paymentTerms is empty or was previously auto-generated
        const currentTerms = prev.paymentTerms?.trim() || '';
        const isAutoGenerated = currentTerms.includes('Thanh toán') && 
                                (currentTerms.includes('từ') || currentTerms.includes('đến'));
        
        if (startDate && endDate && (!currentTerms || isAutoGenerated)) {
          try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
              const startStr = start.toLocaleDateString('vi-VN');
              const endStr = end.toLocaleDateString('vi-VN');
              const months = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
              
              let suggestedTerms = '';
              if (months <= 1) {
                suggestedTerms = `Thanh toán một lần từ ${startStr} đến ${endStr}`;
              } else {
                suggestedTerms = `Thanh toán hàng tháng từ ${startStr} đến ${endStr} (${months} tháng)`;
              }
              
              newState.paymentTerms = suggestedTerms;
            }
          } catch (e) {
            // Ignore date parsing errors
          }
        }
      }
      
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
        err?.response?.data?.message || err?.message || t('errors.loadBuildings');
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
        label: `${unit.code ?? ''}${unit.floor !== undefined ? ` (${t('unitLabel.floor')} ${unit.floor})` : ''}`,
      })),
    [unitsState.data, t],
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
    setActiveTab('active'); // Reset to active tab when selecting new unit

    if (!unitId) {
      setContractsState(DEFAULT_CONTRACTS_STATE);
      return;
    }

    await loadContracts(unitId);
  };

  const handleOpenCreateModal = async () => {
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
    
    // Generate contract number
    setGeneratingContractNumber(true);
    try {
      const contractNumber = await generateAutoContractNumber(selectedUnitId);
      setFieldValue('contractNumber', contractNumber);
    } catch (err) {
      console.error('Failed to generate contract number:', err);
      // Still allow form to open, user can manually enter
    } finally {
      setGeneratingContractNumber(false);
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

  // Generate auto contract number: HD<unitCode>-<ddmmyy>
  const generateAutoContractNumber = async (unitId?: string): Promise<string> => {
    const targetUnitId = unitId || formState.unitId || selectedUnitId;
    
    if (!targetUnitId) {
      throw new Error('Unit ID is required to generate contract number');
    }
    
    // Find unit code from unitsState
    const unit = unitsState.data.find(u => u.id === targetUnitId);
    if (!unit || !unit.code) {
      throw new Error('Unit code not found');
    }
    
    const unitCode = unit.code.trim();
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const datePart = `${day}${month}${year}`;
    
    // Try to get all contracts to check existing numbers
    let existingContracts: ContractSummary[] = [];
    try {
      // Since we don't have a direct endpoint to get all contracts,
      // we'll generate and let backend handle uniqueness
      // If duplicate, backend will throw error and we'll retry with incremented number
      existingContracts = await getAllContracts();
    } catch (err) {
      // If we can't fetch all contracts, we'll still try to generate
      console.warn('Could not fetch all contracts for uniqueness check:', err);
    }
    
    // Extract existing numbers with same prefix (HD<unitCode>-<datePart>)
    const prefix = `HD${unitCode}-${datePart}`;
    const existingNumbers = existingContracts
      .map(c => c.contractNumber)
      .filter((num): num is string => num !== null && num.startsWith(prefix));
    
    // If no existing numbers with this prefix, return base format
    if (existingNumbers.length === 0) {
      return prefix;
    }
    
    // If there are existing numbers, check if base format exists
    const baseExists = existingNumbers.some(num => num === prefix);
    if (!baseExists) {
      return prefix;
    }
    
    // If base exists, add numeric suffix (1, 2, 3, ...)
    const existingSuffixes = existingNumbers
      .map(num => {
        if (num === prefix) return 0; // Base format counts as suffix 0
        const suffix = num.replace(prefix, '');
        // Check if suffix is a number (could be like "-1", "-2", etc.)
        if (suffix.startsWith('-')) {
          const numValue = parseInt(suffix.slice(1), 10);
          return isNaN(numValue) ? -1 : numValue;
        }
        return -1;
      })
      .filter(n => n >= 0);
    
    // Find next available suffix
    let nextSuffix = 1;
    if (existingSuffixes.length > 0) {
      const maxSuffix = Math.max(...existingSuffixes);
      nextSuffix = maxSuffix + 1;
    }
    
    return `${prefix}-${nextSuffix}`;
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
        t('errors.uploadFilesFailed');
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

    if (!formState.contractNumber.trim()) {
      errors.contractNumber = t('validation.contractNumberRequired');
    }

    if (!formState.startDate) {
      errors.startDate = t('validation.startDateRequired');
    } else if (!isValidDate(formState.startDate)) {
      errors.startDate = t('validation.startDateInvalid');
    } else {
      // Check if startDate > today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(formState.startDate);
      startDate.setHours(0, 0, 0, 0);
      if (startDate <= today) {
        errors.startDate = t('validation.startDateInFuture');
      }
    }

    if (formState.contractType === 'RENTAL') {
      if (formState.monthlyRent === null || formState.monthlyRent === undefined) {
        errors.monthlyRent = t('validation.monthlyRentRequired');
      } else if (formState.monthlyRent <= 0) {
        errors.monthlyRent = t('validation.monthlyRentGreaterThanZero');
      }
      if (!formState.endDate) {
        errors.endDate = t('validation.endDateRequired');
      } else if (!isValidDate(formState.endDate)) {
        errors.endDate = t('validation.endDateInvalid');
      } else if (formState.startDate) {
        // Check if endDate > startDate by at least 1 month
        const startDate = new Date(formState.startDate);
        const endDate = new Date(formState.endDate);
        const oneMonthLater = new Date(startDate);
        oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
        if (endDate <= oneMonthLater) {
            errors.endDate = t('validation.endDateMinDiff');
          }
        }
      if (!formState.paymentMethod || !formState.paymentMethod.trim()) {
        errors.paymentMethod = t('validation.paymentMethodRequired');
      }
      // Validate paymentTerms should mention rental period for RENTAL contracts
      if (formState.paymentTerms && formState.paymentTerms.trim()) {
        const paymentTerms = formState.paymentTerms.trim().toLowerCase();
        const hasStartDate = formState.startDate && paymentTerms.includes(
          new Date(formState.startDate).toLocaleDateString('vi-VN').toLowerCase()
        );
        const hasEndDate = formState.endDate && paymentTerms.includes(
          new Date(formState.endDate).toLocaleDateString('vi-VN').toLowerCase()
        );
        const hasDateRange = paymentTerms.includes('từ') || paymentTerms.includes('đến') || 
                            paymentTerms.includes('from') || paymentTerms.includes('to');
        
        // Warning (not error) if paymentTerms doesn't mention rental period
        // This is just a suggestion, not a hard requirement
        if (!hasStartDate && !hasEndDate && !hasDateRange) {
          // Just a warning, not blocking
          console.warn('Payment terms may not mention rental period');
        }
      }
    }

    if (formState.contractType === 'PURCHASE') {
      if (formState.endDate) {
        errors.endDate = t('validation.purchaseHasNoEndDate');
      }
      if (formState.purchasePrice === null || formState.purchasePrice === undefined) {
        errors.purchasePrice = t('validation.purchasePriceRequired');
      } else if (formState.purchasePrice <= 0) {
        errors.purchasePrice = t('validation.purchasePriceGreaterThanZero');
      }
      if (!formState.purchaseDate) {
        errors.purchaseDate = t('validation.purchaseDateRequired');
      } else if (!isValidDate(formState.purchaseDate)) {
        errors.purchaseDate = t('validation.purchaseDateInvalid');
      }
      // Allow purchaseDate to be before, equal, or after startDate
      // No validation needed for date comparison
      // PURCHASE contracts are fully paid, so paymentMethod and paymentTerms are not applicable
    }

    // Validate file upload: not null
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

      // Retry logic for unique contract number
      let attempts = 0;
      let success = false;
      let contract: ContractDetail | null = null;
      
      while (attempts < 5 && !success) {
        try {
          contract = await createContract(payload);
          success = true;
        } catch (err: any) {
          if (err?.response?.status === 409 || 
              err?.response?.data?.message?.includes('already exists') ||
              err?.response?.data?.message?.includes('duplicate') ||
              err?.message?.includes('already exists') ||
              err?.message?.includes('duplicate')) {
            // Contract number conflict, regenerate and retry
            attempts++;
            if (attempts < 5) {
              try {
                const newContractNumber = await generateAutoContractNumber(formState.unitId);
                payload.contractNumber = newContractNumber;
                setFieldValue('contractNumber', newContractNumber);
              } catch (genErr) {
                console.error('Failed to regenerate contract number:', genErr);
                throw err; // Re-throw original error
              }
            } else {
              throw err; // Max attempts reached
            }
          } else {
            throw err; // Other error, don't retry
          }
        }
      }
      
      if (!contract) {
        throw new Error('Failed to create contract after retries');
      }

      if (createFiles && createFiles.length > 0) {
        try {
          await uploadContractFiles(contract.id, createFiles);
        } catch (fileError: any) {
          const message =
            fileError?.response?.data?.message ||
            fileError?.message ||
            t('errors.createSuccessWithFileError');
          setCreateError(message);
        }
      }

      setCreateSuccess(t('messages.createSuccess'));
      await loadContracts(payload.unitId);
      resetCreateForm();
      setCreateModalOpen(false);
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
          error: t('errors.contractNotFound'),
        });
        return;
      }
      setDetailState({ data: detail, loading: false, error: null });
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setDetailState({
          data: null,
          loading: false,
          error: t('errors.contractNotFound'),
        });
        return;
      }
      setDetailState({
        data: null,
        loading: false,
        error: t('errors.loadContractDetailFailed'),
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

  // Check if unit has active contract (not expired)
  const hasActiveContract = useMemo(() => {
    if (!contractsState.data || contractsState.data.length === 0) {
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return contractsState.data.some((contract) => {
      if (contract.status !== 'ACTIVE') {
        return false;
      }
      // If no endDate, contract is still active
      if (!contract.endDate) {
        return true;
      }
      // Check if endDate is in the future
      const endDate = new Date(contract.endDate);
      endDate.setHours(0, 0, 0, 0);
      return endDate > today;
    });
  }, [contractsState.data]);

  // Get expired contracts, sorted by endDate (most recent first)
  const expiredContracts = useMemo(() => {
    if (!contractsState.data || contractsState.data.length === 0) {
      return [];
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return contractsState.data
      .filter((contract) => {
        // Contract is expired if:
        // 1. Status is not ACTIVE, OR
        // 2. Has endDate and endDate <= today
        if (contract.status !== 'ACTIVE') {
          return true;
        }
        if (!contract.endDate) {
          return false; // No endDate means still active
        }
        const endDate = new Date(contract.endDate);
        endDate.setHours(0, 0, 0, 0);
        return endDate <= today;
      })
      .sort((a, b) => {
        // Sort by endDate descending (most recent first)
        if (!a.endDate && !b.endDate) return 0;
        if (!a.endDate) return 1; // No endDate goes to bottom
        if (!b.endDate) return -1;
        const dateA = new Date(a.endDate);
        const dateB = new Date(b.endDate);
        return dateB.getTime() - dateA.getTime(); // Descending order
      });
  }, [contractsState.data]);

  // Get active contracts (not expired)
  const activeContracts = useMemo(() => {
    if (!contractsState.data || contractsState.data.length === 0) {
      return [];
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return contractsState.data.filter((contract) => {
      if (contract.status !== 'ACTIVE') {
        return false;
      }
      if (!contract.endDate) {
        return true; // No endDate means still active
      }
      const endDate = new Date(contract.endDate);
      endDate.setHours(0, 0, 0, 0);
      return endDate > today;
    });
  }, [contractsState.data]);

  // Auto-switch to active tab if expired tab is selected but no expired contracts
  useEffect(() => {
    if (activeTab === 'expired' && expiredContracts.length === 0 && activeContracts.length > 0) {
      setActiveTab('active');
    }
  }, [activeTab, expiredContracts.length, activeContracts.length]);

  const filteredContracts = activeTab === 'active' ? activeContracts : expiredContracts;

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
            disabled={!selectedUnitId || hasActiveContract}
            className="inline-flex items-center rounded-lg bg-[#14AE5C] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0c793f] disabled:cursor-not-allowed disabled:bg-[#A3D9B1]"
          >
            {t('buttons.addContract')}
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
            {selectedUnitId && !contractsState.loading && !contractsState.error && (activeContracts.length > 0 || expiredContracts.length > 0) && (
              <div className="mb-4 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('active')}
                    className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition ${
                      activeTab === 'active'
                        ? 'border-[#14AE5C] text-[#02542D]'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {t('tabs.active')} ({activeContracts.length})
                  </button>
                  {expiredContracts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('expired')}
                      className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition ${
                        activeTab === 'expired'
                          ? 'border-[#14AE5C] text-[#02542D]'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      {t('tabs.expired')} ({expiredContracts.length})
                    </button>
                  )}
                </nav>
              </div>
            )}
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
                  ? (activeTab === 'active' ? t('empty.noActiveContracts') : t('empty.noExpiredContracts'))
                  : t('empty.selectToView')}
              </div>
            ) : (
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
                    {filteredContracts.map((contract) => (
                      <tr key={contract.id} className="hover:bg-[#E9F4EE]">
                        <td className="px-4 py-3 font-medium text-[#02542D]">
                          {contract.contractNumber ?? t('tableValues.unknown')}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {contract.contractType ?? t('common.unknown')}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          <div className="flex flex-col">
                            <span>{t('tableValues.start')} {formatDate(contract.startDate)}</span>
                            <span>{t('tableValues.end')} {formatDate(contract.endDate)}</span>
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
                      className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-[#02542D] shadow-sm focus:border-[#14AE5C] focus:outline-none focus:ring-2 focus:ring-[#C7E8D2] disabled:cursor-not-allowed"
                      required
                      disabled
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
                    {generatingContractNumber ? (
                      <div className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500">
                        {t('loading.generatingContractNumber')}
                      </div>
                    ) : (
                    <input
                      type="text"
                      value={formState.contractNumber}
                      readOnly
                        className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-[#02542D] shadow-sm cursor-not-allowed"
                        required
                    />
                    )}
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
                          paymentMethod: nextType === 'PURCHASE' ? '' : prev.paymentMethod,
                          paymentTerms: nextType === 'PURCHASE' ? '' : prev.paymentTerms,
                        }));
                        if (nextType === 'PURCHASE') {
                          clearFieldErrors('endDate', 'monthlyRent', 'paymentMethod', 'paymentTerms');
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
                  {formState.contractType === 'RENTAL' && (
                    <>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-[#02542D]">{t('fields.paymentMethod')}</label>
                        <select
                          value={formState.paymentMethod ?? ''}
                          onChange={(event) => setFieldValue('paymentMethod', event.target.value)}
                          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#02542D] shadow-sm focus:border-[#14AE5C] focus:outline-none focus:ring-2 focus:ring-[#C7E8D2]"
                        >
                          {PAYMENT_METHOD_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {formErrors.paymentMethod && (
                          <span className="mt-1 text-xs text-red-500">{formErrors.paymentMethod}</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-[#02542D]">{t('fields.paymentTerms')}</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={formState.paymentTerms ?? ''}
                            onChange={(event) => setFieldValue('paymentTerms', event.target.value)}
                            placeholder={(() => {
                              if (formState.contractType === 'RENTAL' && formState.startDate && formState.endDate) {
                                const start = new Date(formState.startDate);
                                const end = new Date(formState.endDate);
                                const startStr = start.toLocaleDateString('vi-VN');
                                const endStr = end.toLocaleDateString('vi-VN');
                                return `VD: Thanh toán hàng tháng từ ${startStr} đến ${endStr}`;
                              }
                              return t('placeholders.paymentTerms');
                            })()}
                            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#02542D] shadow-sm focus:border-[#14AE5C] focus:outline-none focus:ring-2 focus:ring-[#C7E8D2]"
                          />
                          {formState.contractType === 'RENTAL' && formState.startDate && formState.endDate && (
                            <button
                              type="button"
                              onClick={() => {
                                const start = new Date(formState.startDate);
                                const end = new Date(formState.endDate!);
                                const startStr = start.toLocaleDateString('vi-VN');
                                const endStr = end.toLocaleDateString('vi-VN');
                                
                                // Calculate number of months
                                const months = Math.ceil(
                                  (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)
                                );
                                
                                let suggestedTerms = '';
                                if (months <= 1) {
                                  suggestedTerms = `Thanh toán một lần từ ${startStr} đến ${endStr}`;
                                } else {
                                  suggestedTerms = `Thanh toán hàng tháng từ ${startStr} đến ${endStr} (${months} tháng)`;
                                }
                                
                                setFieldValue('paymentTerms', suggestedTerms);
                              }}
                              className="whitespace-nowrap rounded-lg border border-[#14AE5C] bg-white px-3 py-2 text-sm font-medium text-[#02542D] shadow-sm transition hover:bg-[#E9F4EE]"
                              title="Tự động tạo điều khoản thanh toán dựa trên thời gian thuê"
                            >
                              Tự động
                            </button>
                          )}
                        </div>
                        {formErrors.paymentTerms && (
                          <span className="mt-1 text-xs text-red-500">{formErrors.paymentTerms}</span>
                        )}
                      </div>
                    </>
                  )}
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
                    {t('fields.attachments')} *
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(event) => {
                      setCreateFiles(event.target.files);
                      // Clear error when files are selected
                      if (event.target.files && event.target.files.length > 0) {
                        setFormErrors((prev) => {
                          const next = { ...prev };
                          delete next.files;
                          return next;
                        });
                      }
                    }}
                    className="text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#02542D] hover:file:bg-gray-200"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  {formErrors.files && (
                    <span className="mt-1 text-xs text-red-500">{formErrors.files}</span>
                  )}
                  <span className="text-xs text-gray-500">
                    {t('hints.attachments')}
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
                        <span className="font-medium text-[#02542D]">{t('detailLabels.contractType')}</span>{' '}
                        {detailState.data.contractType ?? t('common.unknown')}
                      </p>
                      <p>
                        <span className="font-medium text-[#02542D]">{t('detailLabels.status')}</span>{' '}
                        {detailState.data.status ?? t('common.unknown')}
                      </p>
                      <p>
                        <span className="font-medium text-[#02542D]">{t('detailLabels.startDate')}</span>{' '}
                        {formatDate(detailState.data.startDate)}
                      </p>
                      <p>
                        <span className="font-medium text-[#02542D]">{t('detailLabels.endDate')}</span>{' '}
                        {detailState.data.endDate ? formatDate(detailState.data.endDate) : t('detailLabels.unlimited')}
                      </p>
                      {detailState.data.monthlyRent != null && (
                        <p>
                          <span className="font-medium text-[#02542D]">{t('detailLabels.monthlyRent')}</span>{' '}
                          {detailState.data.monthlyRent.toLocaleString('vi-VN')} đ
                        </p>
                      )}
                      {detailState.data.purchasePrice != null && (
                        <p>
                          <span className="font-medium text-[#02542D]">{t('detailLabels.purchasePrice')}</span>{' '}
                          {detailState.data.purchasePrice.toLocaleString('vi-VN')} đ
                        </p>
                      )}
                      {detailState.data.purchaseDate && (
                        <p>
                          <span className="font-medium text-[#02542D]">{t('detailLabels.purchaseDate')}</span>{' '}
                          {formatDate(detailState.data.purchaseDate)}
                        </p>
                      )}
                      {detailState.data.paymentMethod && (
                        <p>
                          <span className="font-medium text-[#02542D]">{t('detailLabels.paymentMethod')}</span>{' '}
                          {detailState.data.paymentMethod}
                        </p>
                      )}
                    </div>
                    {detailState.data.paymentTerms && (
                      <div>
                        <p className="font-medium text-[#02542D]">{t('detailLabels.paymentTerms')}</p>
                        <p className="mt-1 whitespace-pre-line text-gray-600">
                          {detailState.data.paymentTerms}
                        </p>
                      </div>
                    )}
                    {detailState.data.notes && (
                      <div>
                        <p className="font-medium text-[#02542D]">{t('detailLabels.notes')}</p>
                        <p className="mt-1 whitespace-pre-line text-gray-600">
                          {detailState.data.notes}
                        </p>
                      </div>
                    )}
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
                            const displayUrl = resolveFileUrl(
                              file.proxyUrl ?? file.fileUrl,
                              detailState.data?.id,
                              file.id
                            );
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
                                      {t('tableValues.viewDownload')}
                                    </a>
                                  )}
                                </div>
                                {isImage && displayUrl && (
                                  <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
                                    <img
                                      src={displayUrl}
                                      alt={file.originalFileName ?? file.fileName ?? t('detail.contractImageAlt')}
                                      className="max-h-96 w-full object-contain bg-gray-100"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const errorDiv = document.createElement('div');
                                        errorDiv.className = 'p-4 text-sm text-red-500';
                                        errorDiv.textContent = t('errors.imageLoadFailed') || 'Không thể tải ảnh';
                                        target.parentElement?.appendChild(errorDiv);
                                      }}
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
                          {t('empty.noAttachments')}
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

