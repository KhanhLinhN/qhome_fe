'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Arrow from '@/src/assets/Arrow.svg';
import {
  CreateResidentAccountPayload,
  createResidentAccount,
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

type RequestActionState = Record<string, boolean>;

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

  const [pendingRequests, setPendingRequests] = useState<AccountCreationRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestActionState, setRequestActionState] = useState<RequestActionState>({});

  const handleBack = () => {
    router.push('/account/accountList');
  };

  const handleTabChange = (tab: 'manual' | 'requests') => {
    setActiveTab(tab);
  };

  const handleManualChange =
    (field: keyof ManualFormState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setManualForm((prev) => ({ ...prev, [field]: value }));
    };

  const resetManualMessages = () => {
    setManualError(null);
    setManualSuccess(null);
  };

  const validateManualForm = () => {
    if (!manualForm.username.trim()) {
      setManualError('Tên đăng nhập không được để trống.');
      return false;
    }
    if (!manualForm.email.trim()) {
      setManualError('Email không được để trống.');
      return false;
    }
    if (!manualForm.email.includes('@')) {
      setManualError('Email không hợp lệ.');
      return false;
    }
    return true;
  };

  const handleManualSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetManualMessages();

    if (!validateManualForm()) {
      return;
    }

    const payload: CreateResidentAccountPayload = {
      username: manualForm.username.trim(),
      email: manualForm.email.trim(),
      residentId: manualForm.residentId.trim(),
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
      await refreshPendingRequests();
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
    if (activeTab === 'requests' && pendingRequests.length === 0) {
      void refreshPendingRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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
      const reason = window.prompt('Nhập lý do từ chối (bắt buộc):', '');
      if (!reason || !reason.trim()) {
        return;
      }
      rejectionReason = reason.trim();
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
          <div className="flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-xs font-medium text-emerald-700">
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
            <p className="mt-1 text-sm text-slate-500">
              Điền thông tin cư dân và tài khoản để tạo mới.
            </p>

            {(manualError || manualSuccess) && (
              <div className="mt-4 space-y-3">
                {manualError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {manualError}
                  </div>
                )}
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

            {loadingRequests ? (
              <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Đang tải danh sách yêu cầu...
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Hiện không có yêu cầu đang chờ duyệt.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {pendingRequests.map((request) => {
                  const isProcessing = processingRequests.has(request.id);
                  return (
                    <div
                      key={request.id}
                      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-semibold text-slate-800">
                              {request.residentName || 'Cư dân chưa cập nhật tên'}
                            </span>
                            <span
                              className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                            >
                              {request.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Đã gửi lúc {formatDateTime(request.createdAt)} • Mã yêu cầu: {request.id}
                          </div>
                          <div className="grid gap-1 text-sm text-slate-700 sm:grid-cols-2">
                            <span>
                              <strong>Email cư dân:</strong>{' '}
                              {request.residentEmail || 'Chưa cung cấp'}
                            </span>
                            <span>
                              <strong>Số điện thoại:</strong>{' '}
                              {request.residentPhone || 'Chưa cung cấp'}
                            </span>
                            <span>
                              <strong>Tên đăng nhập đề xuất:</strong>{' '}
                              {request.username || 'Không có'}
                            </span>
                            <span>
                              <strong>Email đăng nhập:</strong>{' '}
                              {request.email || 'Không có'}
                            </span>
                            <span>
                              <strong>Tự tạo mật khẩu:</strong>{' '}
                              {request.autoGenerate ? 'Có' : 'Không'}
                            </span>
                            <span>
                              <strong>Quan hệ:</strong> {request.relation || 'Không rõ'}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:items-end">
                          <button
                            type="button"
                            onClick={() => handleRequestAction(request.id, true)}
                            disabled={isProcessing}
                            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isProcessing ? 'Đang xử lý...' : 'Phê duyệt'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestAction(request.id, false)}
                            disabled={isProcessing}
                            className="inline-flex items-center justify-center rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isProcessing ? 'Đang xử lý...' : 'Từ chối'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

