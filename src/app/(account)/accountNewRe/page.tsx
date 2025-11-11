'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Arrow from '@/src/assets/Arrow.svg';
import {
  AccountCreationRequest,
  approveAccountRequest,
  fetchPendingAccountRequests,
  provisionPrimaryResident,
  PrimaryResidentProvisionRequest,
  PrimaryResidentProvisionResponse,
} from '@/src/services/base/residentAccountService';
import {
  createHousehold,
  fetchCurrentHouseholdByUnit,
  HouseholdDto,
} from '@/src/services/base/householdService';
import {
  ContractSummary,
  fetchActiveContractsByUnit,
  ContractDetail,
  fetchContractDetail,
} from '@/src/services/base/contractService';
import { getUnit, getUnitsByBuilding, Unit } from '@/src/services/base/unitService';
import { getBuildings, type Building } from '@/src/services/base/buildingService';

type ManualFormState = {
  householdId: string;
  fullName: string;
  email: string;
  phone: string;
  nationalId: string;
  dob: string;
  username: string;
  relation: string;
};

type ManualFieldErrors = Partial<Record<keyof ManualFormState, string>>;

type RequestActionState = Record<string, boolean>;

const DEFAULT_ACCOUNT_REJECTION_REASON = 'Thông tin không đầy đủ';

const approveIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" height="16" width="16" aria-hidden="true">
    <g fill="none" fillRule="evenodd">
      <path
        d="M16 0v16H0V0h16ZM8.396 15.505l-.008.002-.047.023a.02.02 0 0 1-.022 0l-.047-.024a.01.01 0 0 0-.016.004l-.003.007-.011.285.003.014.007.009.07.049a.02.02 0 0 0 .017 0l.07-.049a.02.02 0 0 0 .01-.022l-.011-.285c0-.007-.004-.012-.01-.012Zm.176-.075a.02.02 0 0 0-.018 0l-.123.062a.016.016 0 0 0-.009.013l.012.287c0 .006.002.01.009.013l.134.061a.02.02 0 0 0 .02-.013l-.023-.41a.02.02 0 0 0-.013-.015Zm-.477.001a.02.02 0 0 0-.018.004l-.004.01-.023.409c0 .008.005.013.012.016l.01-.002.134-.062a.02.02 0 0 0 .01-.02l.012-.287a.02.02 0 0 0-.01-.014l-.123-.061Z"
        strokeWidth=".6667"
      ></path>
      <path
        fill="currentColor"
        d="M13 2.089a.667.667 0 0 1 .901.206l.66 1.007a.667.667 0 0 1-.104.852l-.002.003-.009.009-.038.035-.15.143a55.9 55.9 0 0 0-2.414 2.49c-1.465 1.61-3.204 3.719-4.375 5.765-.327.57-1.125.693-1.598.2l-4.323-4.492a.667.667 0 0 1 .034-.957l1.307-1.179a.667.667 0 0 1 .877-.043l2.206 1.654c3.446-3.398 5.4-4.702 7.057-5.699Z"
        strokeWidth=".6667"
      ></path>
    </g>
  </svg>
);

const rejectIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" height="16" width="16" aria-hidden="true">
    <g fill="none" fillRule="evenodd">
      <path
        d="M16 0v16H0V0h16ZM8.395 15.505l-.007.002-.047.023a.02.02 0 0 1-.022 0l-.047-.023a.01.01 0 0 0-.016.004l-.003.007-.011.285.003.014.007.009.07.049a.02.02 0 0 0 .017 0l.07-.049a.02.02 0 0 0 .01-.022l-.011-.285c0-.007-.004-.012-.01-.012Zm.177-.075a.02.02 0 0 0-.018 0l-.123.062a.016.016 0 0 0-.009.013l.012.287c0 .006.002.01.009.013l.134.061a.02.02 0 0 0 .02-.013l-.023-.41a.02.02 0 0 0-.013-.015Zm-.477.001a.02.02 0 0 0-.018.004l-.004.01-.023.409c0 .008.005.013.012.016l.01-.002.134-.062a.02.02 0 0 0 .01-.02l.012-.287a.02.02 0 0 0-.01-.014l-.123-.061Z"
        strokeWidth=".6667"
      ></path>
      <path
        fill="currentColor"
        d="m8 9.415 3.535 3.535a1 1 0 0 0 1.415-1.415L9.414 8l3.536-3.535A1 1 0 1 0 11.536 3L8 6.586 4.465 3.05A1 1 0 1 0 3.05 4.465L6.586 8l-3.535 3.536A1 1 0 1 0 4.465 12.95L8 9.415Z"
        strokeWidth=".6667"
      ></path>
    </g>
  </svg>
);

export default function AccountNewResidentPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'manual' | 'requests'>('manual');

  const [manualForm, setManualForm] = useState<ManualFormState>({
    householdId: '',
    fullName: '',
    email: '',
    phone: '',
    nationalId: '',
    dob: '',
    username: '',
    relation: 'Chủ hộ',
  });

  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);
  const [provisionResponse, setProvisionResponse] = useState<PrimaryResidentProvisionResponse | null>(null);
  const [lastSubmittedEmail, setLastSubmittedEmail] = useState<string>('');
  const [manualFieldErrors, setManualFieldErrors] = useState<ManualFieldErrors>({});
  const [householdInfo, setHouseholdInfo] = useState<HouseholdDto | null>(null);
  const [unitInfo, setUnitInfo] = useState<Unit | null>(null);
  const [householdLoading, setHouseholdLoading] = useState(false);
  const [householdError, setHouseholdError] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingsLoading, setBuildingsLoading] = useState(false);
  const [buildingsError, setBuildingsError] = useState<string | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [unitsError, setUnitsError] = useState<string | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [buildingSelectionError, setBuildingSelectionError] = useState<string | null>(null);
  const [unitSelectionError, setUnitSelectionError] = useState<string | null>(null);
  const [contractInfo, setContractInfo] = useState<ContractSummary | null>(null);
  const [contractError, setContractError] = useState<string | null>(null);
  const [isContractModalOpen, setContractModalOpen] = useState(false);
  const [contractDetailState, setContractDetailState] = useState<{
    data: ContractDetail | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  const [pendingRequests, setPendingRequests] = useState<AccountCreationRequest[]>([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestActionState, setRequestActionState] = useState<RequestActionState>({});

  const handleBack = () => {
    router.back();
  };

  const handleTabChange = (tab: 'manual' | 'requests') => {
    setActiveTab(tab);
  };

  useEffect(() => {
    const loadBuildings = async () => {
      setBuildingsLoading(true);
      setBuildingsError(null);
      try {
        const data = await getBuildings();
        setBuildings(data);
      } catch (err: any) {
        const message =
          err?.response?.data?.message || err?.message || 'Không thể tải danh sách tòa nhà.';
        setBuildingsError(message);
      } finally {
        setBuildingsLoading(false);
      }
    };

    void loadBuildings();
  }, []);

  const handleBuildingChange = async (buildingId: string) => {
    setSelectedBuildingId(buildingId);
    setSelectedUnitId('');
    setUnits([]);
    setUnitsError(null);
    setUnitInfo(null);
    setHouseholdInfo(null);
    setHouseholdError(null);
    setContractInfo(null);
    setContractError(null);
    setManualForm((prev) => ({ ...prev, householdId: '' }));
    setBuildingSelectionError(null);
    setUnitSelectionError(null);

    if (!buildingId) {
      return;
    }

    setUnitsLoading(true);
    try {
      const data = await getUnitsByBuilding(buildingId);
      setUnits(data);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Không thể tải danh sách căn hộ.';
      setUnitsError(message);
    } finally {
      setUnitsLoading(false);
    }
  };

  const handleUnitChange = async (unitId: string) => {
    setSelectedUnitId(unitId);
    setUnitSelectionError(null);
    setManualForm((prev) => ({ ...prev, householdId: '' }));
    setHouseholdInfo(null);
    setUnitInfo(null);
    setHouseholdError(null);
    setContractInfo(null);
    setContractError(null);

    if (!unitId) {
      return;
    }

    await loadHouseholdForUnit(unitId);
  };

  const handleManualChange =
    (field: keyof ManualFormState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setManualForm((prev) => ({ ...prev, [field]: value }));
      setManualFieldErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    };

  const resetManualMessages = () => {
    setManualError(null);
    setManualSuccess(null);
    setProvisionResponse(null);
    setManualFieldErrors({});
    setBuildingSelectionError(null);
    setUnitSelectionError(null);
  };

  const handleOpenContractDetail = async () => {
    if (!contractInfo) {
      return;
    }
    setContractModalOpen(true);
    setContractDetailState({ data: null, loading: true, error: null });
    try {
      const detail = await fetchContractDetail(contractInfo.id);
      if (!detail) {
        setContractDetailState({
          data: null,
          loading: false,
          error: 'Không tìm thấy thông tin hợp đồng.',
        });
        return;
      }
      setContractDetailState({ data: detail, loading: false, error: null });
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.message || 'Không thể tải chi tiết hợp đồng.';
      setContractDetailState({ data: null, loading: false, error: message });
    }
  };

  const handleCloseContractDetail = () => {
    setContractModalOpen(false);
  };

  const validateManualForm = () => {
    const errors: ManualFieldErrors = {};
    let isValid = true;

    if (!selectedBuildingId) {
      setBuildingSelectionError('Vui lòng chọn tòa nhà.');
      isValid = false;
    } else {
      setBuildingSelectionError(null);
    }

    if (!selectedUnitId) {
      setUnitSelectionError('Vui lòng chọn căn hộ.');
      isValid = false;
    } else if (!manualForm.householdId.trim()) {
      setUnitSelectionError('Căn hộ này chưa có hộ gia đình. Vui lòng tạo trước.');
      isValid = false;
    } else if (!householdInfo || householdInfo.id !== manualForm.householdId.trim()) {
      setUnitSelectionError('Vui lòng kiểm tra lại thông tin hộ gia đình.');
      isValid = false;
    } else if (householdInfo.primaryResidentId) {
      setUnitSelectionError('Hộ gia đình đã có chủ hộ.');
      isValid = false;
    } else {
      setUnitSelectionError(null);
    }

    if (!contractInfo) {
      setUnitSelectionError('Căn hộ này chưa có hợp đồng hợp lệ. Vui lòng tạo hợp đồng trước.');
      isValid = false;
    }

    if (!manualForm.fullName.trim()) {
      errors.fullName = 'Tên cư dân không được để trống.';
      isValid = false;
    }

    if (!manualForm.email.trim()) {
      errors.email = 'Email không được để trống.';
      isValid = false;
    } else if (!manualForm.email.includes('@')) {
      errors.email = 'Email không hợp lệ.';
      isValid = false;
    }

    setManualFieldErrors(errors);
    return isValid;
  };

  const loadHouseholdForUnit = async (unitId: string) => {
    setManualForm((prev) => ({ ...prev, householdId: '' }));
    setHouseholdError(null);
    setHouseholdInfo(null);
    setUnitInfo(null);
    setManualFieldErrors((prev) => {
      const next = { ...prev };
      delete next.householdId;
      return next;
    });
    setUnitSelectionError(null);
    setContractInfo(null);
    setContractError(null);

    if (!unitId) {
      return;
    }

    setHouseholdLoading(true);

    try {
      try {
        const unit = await getUnit(unitId);
        setUnitInfo(unit);
      } catch (unitErr: any) {
        console.error('Không thể tải thông tin căn hộ', unitErr);
      }

      let activeContract: ContractSummary | null = null;
      try {
        const contracts = await fetchActiveContractsByUnit(unitId);
        activeContract = selectPrimaryContract(contracts);
        if (!activeContract) {
          setContractInfo(null);
          setUnitSelectionError('Căn hộ này chưa có hợp đồng hợp lệ. Vui lòng tạo hợp đồng trước.');
          return;
        }
        setContractInfo(activeContract);
      } catch (contractErr: any) {
        console.error('Không thể tải hợp đồng của căn hộ:', contractErr);
        const message =
          contractErr?.response?.data?.message ||
          contractErr?.message ||
          'Không thể tải hợp đồng của căn hộ.';
        setContractError(message);
        setUnitSelectionError('Không thể tải thông tin hợp đồng. Vui lòng thử lại.');
        return;
      }

      const household = await fetchCurrentHouseholdByUnit(unitId);
      if (household) {
        applyHouseholdInfo(household, activeContract);
        return;
      }

      if (activeContract) {
        await attemptCreateHousehold(unitId, activeContract);
      }
    } catch (err: any) {
      console.error('Không thể tải thông tin hộ gia đình theo căn hộ:', err);
      setHouseholdError(
        err?.response?.data?.message || err?.message || 'Không thể tải thông tin hộ gia đình.',
      );
    } finally {
      setHouseholdLoading(false);
    }
  };

  const applyHouseholdInfo = (household: HouseholdDto | null, fallbackContract?: ContractSummary | null) => {
    if (!household || !household.id) {
      setHouseholdInfo(null);
      setManualForm((prev) => ({ ...prev, householdId: '' }));
      return;
    }
    setHouseholdInfo(household);
    setManualForm((prev) => ({ ...prev, householdId: household.id }));
    if (household.primaryResidentId) {
      setUnitSelectionError('Hộ gia đình đã có chủ hộ.');
    } else {
      setUnitSelectionError(null);
    }

    if (household.contractId) {
      setContractInfo({
        id: household.contractId,
        unitId: household.unitId ?? fallbackContract?.unitId ?? '',
        contractNumber: household.contractNumber ?? fallbackContract?.contractNumber ?? null,
        contractType: fallbackContract?.contractType ?? null,
        startDate: household.contractStartDate ?? fallbackContract?.startDate ?? null,
        endDate: household.contractEndDate ?? fallbackContract?.endDate ?? null,
        status: household.contractStatus ?? fallbackContract?.status ?? null,
      });
    } else if (fallbackContract) {
      setContractInfo(fallbackContract);
    }
  };

  const attemptCreateHousehold = async (unitId: string, contract: ContractSummary) => {
    try {
      const startDate =
        contract.startDate ??
        (() => {
          const today = new Date();
          return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
            today.getDate(),
          ).padStart(2, '0')}`;
        })();

      const created = await createHousehold({
        unitId,
        kind: 'OWNER',
        contractId: contract.id,
        startDate,
        endDate: contract.endDate ?? undefined,
      });
      applyHouseholdInfo(created, contract);
      setManualSuccess('Đã tạo hộ gia đình mới cho căn hộ.');
    } catch (createErr: any) {
      console.error('Không thể tự động tạo hộ gia đình:', createErr);
      const message =
        createErr?.response?.data?.message ||
        createErr?.message ||
        'Không thể tạo hộ gia đình cho căn hộ này.';
      setUnitSelectionError(message);
    }
  };

  const handleManualSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetManualMessages();
    if (!manualForm.householdId.trim() && selectedUnitId) {
      await loadHouseholdForUnit(selectedUnitId);
    }
    const isValid = validateManualForm();
    if (!isValid) {
      return;
    }

    const targetUnitId = selectedUnitId.trim();
    const payload: PrimaryResidentProvisionRequest = {
      resident: {
        fullName: manualForm.fullName.trim(),
        phone: manualForm.phone.trim() || undefined,
        email: manualForm.email.trim(),
        nationalId: manualForm.nationalId.trim() || undefined,
        dob: manualForm.dob || undefined,
      },
      account: {
        username: manualForm.username.trim() || undefined,
        autoGenerate: true,
      },
      relation: manualForm.relation.trim() || undefined,
    };

    try {
      setManualSubmitting(true);
      const fallbackEmail = manualForm.email.trim();
      const response = await provisionPrimaryResident(targetUnitId, payload);
      setProvisionResponse(response);
      setLastSubmittedEmail(fallbackEmail);
      setManualSuccess('Tạo chủ hộ và tài khoản cư dân thành công.');
      setManualForm({
        householdId: '',
        fullName: '',
        email: '',
        phone: '',
        nationalId: '',
        dob: '',
        username: '',
        relation: 'Chủ hộ',
      });
      setManualFieldErrors({});
      setHouseholdInfo(null);
      setUnitInfo(null);
      setHouseholdError(null);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tạo tài khoản cư dân. Vui lòng thử lại.';
      setManualError(message);
    } finally {
      setManualSubmitting(false);
    }
  };

  const refreshPendingRequests = async () => {
    try {
      setLoadingRequests(true);
      setRequestError(null);
      const data = await fetchPendingAccountRequests();
      setPendingRequests(data);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tải danh sách yêu cầu tạo tài khoản.';
      setRequestError(message);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (initialLoad) {
      void refreshPendingRequests().finally(() => setInitialLoad(false));
      return;
    }

    if (activeTab === 'requests' && pendingRequests.length === 0) {
      void refreshPendingRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, initialLoad]);

  const formatDate = (value?: string | null) => {
    if (!value) return 'Chưa cập nhật';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString('vi-VN');
  };

const selectPrimaryContract = (contracts: ContractSummary[]): ContractSummary | null => {
  if (!contracts || contracts.length === 0) {
    return null;
  }
  return [...contracts].sort((a, b) => {
    const aTime = a.startDate ? new Date(a.startDate).getTime() : 0;
    const bTime = b.startDate ? new Date(b.startDate).getTime() : 0;
    return bTime - aTime;
  })[0];
};

  const formatDateTime = (value: string | null) => {
    if (!value) return 'Chưa cập nhật';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString('vi-VN');
  };

  const processingRequests = useMemo(
    () => new Set(Object.entries(requestActionState).filter(([, v]) => v).map(([key]) => key)),
    [requestActionState],
  );

  const handleRequestAction = async (requestId: string, approve: boolean) => {
    let rejectionReason: string | undefined;

    if (!approve) {
      // eslint-disable-next-line no-alert
      const reason =
        window.prompt('Nhập lý do từ chối (bắt buộc):', DEFAULT_ACCOUNT_REJECTION_REASON) ??
        DEFAULT_ACCOUNT_REJECTION_REASON;
      const trimmed = reason.trim();
      if (!trimmed) {
        return;
      }
      rejectionReason = trimmed;
    }

    try {
      setRequestActionState((prev) => ({ ...prev, [requestId]: true }));
      await approveAccountRequest(requestId, {
        approve,
        rejectionReason,
      });
      setPendingRequests((prev) => prev.filter((item) => item.id !== requestId));
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể xử lý yêu cầu. Vui lòng thử lại.';
      setRequestError(message);
    } finally {
      setRequestActionState((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div
        className="mx-auto mb-6 flex max-w-5xl cursor-pointer items-center"
        onClick={handleBack}
      >
        <Image src={Arrow} alt="Back" width={20} height={20} className="mr-2 h-5 w-5" />
        <span className="text-2xl font-bold text-[#02542D] transition hover:text-opacity-80">
          Quay lại danh sách tài khoản
        </span>
      </div>

      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Tạo tài khoản chủ hộ</h1>
            <p className="text-sm text-slate-500">
              Tạo tài khoản cho chủ hộ hoặc duyệt các yêu cầu tạo tài khoản được cư dân gửi lên.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-amber-400 bg-amber-100 px-4 py-1 text-xs font-semibold text-amber-700 shadow-sm">
            <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" />
            Đang có {pendingRequests.length} yêu cầu chờ duyệt
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => handleTabChange('manual')}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'manual'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tạo thủ công
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('requests')}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'requests'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Duyệt yêu cầu cư dân
          </button>
        </div>

        {activeTab === 'manual' && (
          <div className="mt-6 rounded-xl border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-800">Thông tin chủ hộ</h2>

            {(manualSuccess || manualError) && (
              <div className="mt-4 space-y-3">
                {manualSuccess && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <p>{manualSuccess}</p>
                    {provisionResponse?.account && (
                      <div className="mt-2 space-y-1 text-xs text-emerald-800">
                        <p>
                          Tên đăng nhập:{' '}
                          <span className="font-semibold">
                            {provisionResponse.account.username || 'Được tạo tự động'}
                          </span>
                        </p>
                        <p>
                          Email đăng nhập:{' '}
                          <span className="font-semibold">
                            {provisionResponse.account.email || lastSubmittedEmail}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {manualError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {manualError}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleManualSubmit} className="mt-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700">Tòa nhà</label>
                  <select
                    value={selectedBuildingId}
                    onChange={(event) => handleBuildingChange(event.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="">-- Chọn tòa nhà --</option>
                    {buildings.map((building) => (
                      <option key={building.id} value={building.id}>
                        {(building.code ? `${building.code} - ` : '') + (building.name ?? '')}
                      </option>
                    ))}
                  </select>
                  {buildingsLoading && (
                    <span className="text-xs text-slate-500">Đang tải danh sách tòa nhà...</span>
                  )}
                  {buildingsError && (
                    <span className="text-xs text-red-500">{buildingsError}</span>
                  )}
                  {buildingSelectionError && (
                    <span className="text-xs text-red-500">{buildingSelectionError}</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700">Căn hộ</label>
                  <select
                    value={selectedUnitId}
                    onChange={(event) => handleUnitChange(event.target.value)}
                    disabled={!selectedBuildingId || unitsLoading}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    <option value="">
                      {selectedBuildingId ? '-- Chọn căn hộ --' : 'Chọn tòa nhà trước'}
                    </option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {(unit.code ?? '') + (unit.floor !== undefined ? ` (Tầng ${unit.floor})` : '')}
                      </option>
                    ))}
                  </select>
                  {unitsLoading && (
                    <span className="text-xs text-slate-500">Đang tải danh sách căn hộ...</span>
                  )}
                  {unitsError && <span className="text-xs text-red-500">{unitsError}</span>}
                  {unitSelectionError && (
                    <span className="text-xs text-red-500">{unitSelectionError}</span>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <h3 className="text-sm font-semibold text-blue-800">Thông tin hợp đồng</h3>
                {contractInfo ? (
                  <div className="mt-2 grid gap-2 text-sm text-blue-900 sm:grid-cols-2">
                    <p>
                      <span className="font-medium">Số hợp đồng:</span>{' '}
                      {contractInfo.contractNumber ?? 'Chưa cập nhật'}
                    </p>
                    <p>
                      <span className="font-medium">Trạng thái:</span>{' '}
                      {contractInfo.status ?? 'Không xác định'}
                    </p>
                    <p>
                      <span className="font-medium">Hiệu lực từ:</span>{' '}
                      {formatDate(contractInfo.startDate)}
                    </p>
                    <p>
                      <span className="font-medium">Hiệu lực đến:</span>{' '}
                      {contractInfo.endDate ? formatDate(contractInfo.endDate) : 'Không giới hạn'}
                    </p>
                  </div>
                ) : selectedUnitId ? (
                  <p className="mt-2 text-sm text-blue-700">
                    Chưa có hợp đồng hợp lệ cho căn hộ này. Vui lòng tạo hợp đồng trước khi cấp tài khoản chủ hộ.
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-blue-700">
                    Chọn tòa nhà và căn hộ để xem thông tin hợp đồng.
                  </p>
                )}
                {contractInfo && (
                  <button
                    type="button"
                    onClick={handleOpenContractDetail}
                    className="mt-4 inline-flex items-center justify-center rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                  >
                    Xem chi tiết hợp đồng
                  </button>
                )}
                {contractError && (
                  <p className="mt-2 text-xs text-red-500">
                    {contractError}
                  </p>
                )}
              </div>

              {householdError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                  {householdError}
                </div>
              )}

              {householdLoading && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                  Đang tải thông tin hộ gia đình...
                </div>
              )}

              {householdInfo && !householdLoading && !unitSelectionError && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-emerald-900 shadow-inner">
                  <h3 className="mb-2 text-base font-semibold text-emerald-800">Thông tin hộ gia đình</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <p>
                      <span className="font-medium">Hộ:</span> {householdInfo.id}
                    </p>
                    <p>
                      <span className="font-medium">Loại:</span> {householdInfo.kind ?? '---'}
                    </p>
                    <p>
                      <span className="font-medium">Ngày bắt đầu:</span>{' '}
                      {new Date(householdInfo.startDate).toLocaleDateString('vi-VN')}
                    </p>
                    <p>
                      <span className="font-medium">Ngày kết thúc:</span>{' '}
                      {householdInfo.endDate
                        ? new Date(householdInfo.endDate).toLocaleDateString('vi-VN')
                        : 'Chưa thiết lập'}
                    </p>
                    {unitInfo && (
                      <>
                        <p>
                          <span className="font-medium">Căn hộ:</span> {unitInfo.code}
                        </p>
                        <p>
                          <span className="font-medium">Tòa:</span> {unitInfo.buildingId ?? '—'}
                        </p>
                        <p>
                          <span className="font-medium">Tầng:</span> {unitInfo.floor ?? '---'}
                        </p>
                        <p>
                          <span className="font-medium">Diện tích:</span>{' '}
                          {unitInfo.areaM2 ? `${unitInfo.areaM2} m²` : '---'}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700">Họ và tên cư dân</label>
                  <input
                    type="text"
                    value={manualForm.fullName}
                    onChange={handleManualChange('fullName')}
                    placeholder="Nhập họ tên đầy đủ"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                  {manualFieldErrors.fullName && (
                    <span className="text-xs text-red-500">{manualFieldErrors.fullName}</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    value={manualForm.email}
                    onChange={handleManualChange('email')}
                    placeholder="example@domain.com"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                  {manualFieldErrors.email && (
                    <span className="text-xs text-red-500">{manualFieldErrors.email}</span>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700">Số điện thoại</label>
                  <input
                    type="tel"
                    value={manualForm.phone}
                    onChange={handleManualChange('phone')}
                    placeholder="Nhập số điện thoại"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700">Ngày sinh</label>
                  <input
                    type="date"
                    value={manualForm.dob}
                    onChange={handleManualChange('dob')}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700">CMND / CCCD</label>
                  <input
                    type="text"
                    value={manualForm.nationalId}
                    onChange={handleManualChange('nationalId')}
                    placeholder="Nhập số CMND/CCCD"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700">
                    Tên đăng nhập (tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={manualForm.username}
                    onChange={handleManualChange('username')}
                    placeholder="Để trống để hệ thống tự tạo"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Quan hệ</label>
                <input
                  type="text"
                  value={manualForm.relation}
                  readOnly
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-800"
                />
                <span className="text-xs text-slate-500">Mặc định là Chủ hộ cho quy trình này.</span>
              </div>

              <p className="text-sm text-slate-500">
                Mật khẩu tạm thời sẽ được hệ thống tạo tự động và gửi tới email cư dân ngay sau khi
                tài khoản được tạo.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Huỷ bỏ
                </button>
                <button
                  type="submit"
                  disabled={manualSubmitting || !contractInfo}
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {manualSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        )}

        {isContractModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 px-4 py-8">
            <div className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Chi tiết hợp đồng</h3>
                  {contractInfo?.contractNumber && (
                    <p className="text-sm text-slate-500">Số hợp đồng: {contractInfo.contractNumber}</p>
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
                {contractDetailState.loading && (
                  <p className="text-sm text-slate-500">Đang tải chi tiết hợp đồng...</p>
                )}
                {contractDetailState.error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {contractDetailState.error}
                  </div>
                )}
                {!contractDetailState.loading &&
                  !contractDetailState.error &&
                  contractDetailState.data && (
                    <div className="space-y-5 text-sm text-slate-700">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <p>
                          <span className="font-medium text-slate-900">Loại hợp đồng:</span>{' '}
                          {contractDetailState.data.contractType ?? 'Không xác định'}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Trạng thái:</span>{' '}
                          {contractDetailState.data.status ?? 'Không xác định'}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Ngày bắt đầu:</span>{' '}
                          {formatDate(contractDetailState.data.startDate)}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Ngày kết thúc:</span>{' '}
                          {contractDetailState.data.endDate
                            ? formatDate(contractDetailState.data.endDate)
                            : 'Không giới hạn'}
                        </p>
                        {contractDetailState.data.monthlyRent != null && (
                          <p>
                            <span className="font-medium text-slate-900">Giá thuê / tháng:</span>{' '}
                            {contractDetailState.data.monthlyRent.toLocaleString('vi-VN')} đ
                          </p>
                        )}
                        {contractDetailState.data.purchasePrice != null && (
                          <p>
                            <span className="font-medium text-slate-900">Giá mua:</span>{' '}
                            {contractDetailState.data.purchasePrice.toLocaleString('vi-VN')} đ
                          </p>
                        )}
                        {contractDetailState.data.purchaseDate && (
                          <p>
                            <span className="font-medium text-slate-900">Ngày mua:</span>{' '}
                            {formatDate(contractDetailState.data.purchaseDate)}
                          </p>
                        )}
                        {contractDetailState.data.paymentMethod && (
                          <p>
                            <span className="font-medium text-slate-900">Phương thức thanh toán:</span>{' '}
                            {contractDetailState.data.paymentMethod}
                          </p>
                        )}
                      </div>
                      {contractDetailState.data.notes && (
                        <div>
                          <p className="font-medium text-slate-900">Ghi chú</p>
                          <p className="mt-1 whitespace-pre-line text-slate-600">
                            {contractDetailState.data.notes}
                          </p>
                        </div>
                      )}
                      {contractDetailState.data.files && contractDetailState.data.files.length > 0 && (
                        <div>
                          <p className="font-medium text-slate-900">Tệp đính kèm</p>
                          <ul className="mt-2 space-y-2 text-sm">
                            {contractDetailState.data.files.map((file) => (
                              <li
                                key={file.id}
                                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                              >
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
                                {file.fileUrl && (
                                  <a
                                    href={file.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center rounded-md border border-blue-300 px-3 py-1 text-sm text-blue-600 transition hover:bg-blue-50"
                                  >
                                    Xem / tải
                                  </a>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
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

        {activeTab === 'requests' && (
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                Danh sách yêu cầu tạo tài khoản từ cư dân
              </h2>
              <button
                type="button"
                onClick={() => refreshPendingRequests()}
                className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Làm mới
              </button>
            </div>

            {requestError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {requestError}
              </div>
            )}

            <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">
                      Cư dân
                    </th>
                    <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">
                      Liên hệ
                    </th>
                    <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">
                      Tài khoản đề xuất
                    </th>
                    <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">
                      Tùy chọn
                    </th>
                    <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-600">
                      Thời gian
                    </th>
                    <th className="px-4 py-3 text-center font-semibold uppercase tracking-wide text-slate-600">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingRequests ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                        Đang tải danh sách yêu cầu...
                      </td>
                    </tr>
                  ) : pendingRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                        Hiện không có yêu cầu đang chờ duyệt.
                      </td>
                    </tr>
                  ) : (
                    pendingRequests.map((request) => {
                      const isProcessing = processingRequests.has(request.id);
                      return (
                        <tr key={request.id} className="hover:bg-emerald-50/40">
                          <td className="px-4 py-3 font-medium text-slate-800">
                            <div className="flex flex-col">
                              <span>{request.residentName || 'Cư dân chưa cập nhật tên'}</span>
                              <span className="text-xs text-slate-500">
                                Mã yêu cầu: {request.id}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            <div className="flex flex-col">
                              <span>{request.residentPhone || 'Chưa cung cấp'}</span>
                              <span className="text-xs text-slate-500">
                                {request.residentEmail || 'Chưa cung cấp'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            <div className="flex flex-col">
                              <span>
                                <strong>Tên đăng nhập:</strong> {request.username || 'Không có'}
                              </span>
                              <span>
                                <strong>Email:</strong> {request.email || 'Không có'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            <div className="flex flex-col gap-1">
                              <span>
                                <strong>Quan hệ:</strong> {request.relation || 'Không rõ'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatDateTime(request.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleRequestAction(request.id, true)}
                                disabled={isProcessing}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                                title="Phê duyệt"
                              >
                                {approveIcon}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRequestAction(request.id, false)}
                                disabled={isProcessing}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-200 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                title="Từ chối"
                              >
                                {rejectIcon}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

