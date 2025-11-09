'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Arrow from '@/src/assets/Arrow.svg';
import {
  CreateResidentAccountPayload,
  createResidentAccount,
  fetchResidentAccounts,
  fetchStaffAccounts,
} from '@/src/services/iam/userService';
import {
  AccountCreationRequest,
  approveAccountRequest,
  fetchPendingAccountRequests,
} from '@/src/services/base/residentAccountService';

type ManualFormState = {
  username: string;
  email: string;
  residentId: string;
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
    username: '',
    email: '',
    residentId: '',
  });

  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);
  const [manualFieldErrors, setManualFieldErrors] = useState<ManualFieldErrors>({});

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
    setManualFieldErrors({});
  };

  const validateManualForm = async () => {
    const errors: ManualFieldErrors = {};
    if (!manualForm.username.trim()) {
      errors.username = 'Tên đăng nhập không được để trống.';
    }
    if (!manualForm.email.trim()) {
      errors.email = 'Email không được để trống.';
    } else if (!manualForm.email.includes('@')) {
      errors.email = 'Email không hợp lệ.';
    }
    setManualFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return false;
    }

    try {
      const [staffRes, residentRes] = await Promise.all([
        fetchStaffAccounts(),
        fetchResidentAccounts(),
      ]);
      const normalizedEmail = manualForm.email.trim().toLowerCase();
      const duplicate =
        pendingRequests.some(
          (request) => request.email && request.email.toLowerCase() === normalizedEmail,
        ) ||
        staffRes.some((staff) => staff.email?.toLowerCase() === normalizedEmail) ||
        residentRes.some((resident) => resident.email?.toLowerCase() === normalizedEmail);

      if (duplicate) {
        setManualFieldErrors({ email: 'Email đã tồn tại.' });
        return false;
      }
    } catch (err) {
      console.error('Failed to validate email uniqueness', err);
    }

    return true;
  };

  const handleManualSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetManualMessages();
    const isValid = await validateManualForm();
    if (!isValid) {
      return;
    }

    const payload: CreateResidentAccountPayload = {
      username: manualForm.username.trim(),
      email: manualForm.email.trim(),
      residentId: manualForm.residentId.trim(),
    autoGenerate: true,
    };

    try {
      setManualSubmitting(true);
      await createResidentAccount(payload);
      setManualSuccess('Tạo tài khoản cư dân thủ công thành công.');
      setManualForm({
        username: '',
        email: '',
        residentId: '',
      });
      setManualFieldErrors({});
      await refreshPendingRequests();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tạo tài khoản cư dân. Vui lòng thử lại.';
      if (message.includes('Email')) {
        setManualFieldErrors((prev) => ({ ...prev, email: message }));
      } else {
        setManualError(message);
      }
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
            <h1 className="text-2xl font-bold text-slate-800">Tạo mới tài khoản cư dân</h1>
            <p className="text-sm text-slate-500">
              Tạo mới tài khoản hoặc duyệt yêu cầu tạo tài khoản do cư dân gửi lên.
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
            <h2 className="text-lg font-semibold text-slate-800">Tạo tài khoản cư dân</h2>

            {(manualSuccess) && (
              <div className="mt-4 space-y-3">
                {manualSuccess && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {manualSuccess}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleManualSubmit} className="mt-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700">Tên đăng nhập</label>
                  <input
                    type="text"
                    value={manualForm.username}
                    onChange={handleManualChange('username')}
                    placeholder="Nhập tên đăng nhập"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                  {manualFieldErrors.username && (
                    <span className="text-xs text-red-500">{manualFieldErrors.username}</span>
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
                  disabled={manualSubmitting}
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {manualSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
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

