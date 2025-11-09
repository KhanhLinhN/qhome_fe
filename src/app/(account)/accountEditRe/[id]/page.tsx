'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Arrow from '@/src/assets/Arrow.svg';
import DetailField from '@/src/components/base-service/DetailField';
import Select from '@/src/components/customer-interaction/Select';
import PasswordChangeSection from '@/src/components/account/PasswordChangeSection';
import {
  UpdateResidentAccountPayload,
  UserAccountInfo,
  UserProfileInfo,
  UserStatusInfo,
  fetchResidentAccountDetail,
  fetchUserProfile,
  fetchUserStatus,
  updateResidentAccount,
  updateUserPassword,
} from '@/src/services/iam/userService';

type FetchState = 'idle' | 'loading' | 'error' | 'success';

type FormState = {
  username: string;
  email: string;
  active: boolean;
  newPassword: string;
  confirmPassword: string;
};

const STATUS_OPTIONS = [
  { id: 'ACTIVE', label: 'Đang hoạt động' },
  { id: 'INACTIVE', label: 'Ngưng hoạt động' },
];

export default function AccountEditResidentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const userIdParam = params?.id;
  const userId =
    typeof userIdParam === 'string' ? userIdParam : Array.isArray(userIdParam) ? userIdParam[0] : '';

  const [state, setState] = useState<FetchState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [account, setAccount] = useState<UserAccountInfo | null>(null);
  const [profile, setProfile] = useState<UserProfileInfo | null>(null);
  const [status, setStatus] = useState<UserStatusInfo | null>(null);

  const [form, setForm] = useState<FormState>({
    username: '',
    email: '',
    active: true,
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!userId) {
      setState('error');
      setError('Không tìm thấy mã tài khoản cư dân.');
      return;
    }

    let active = true;

    const loadDetail = async () => {
      setState('loading');
      setError(null);
      try {
        const [accountRes, profileRes, statusRes] = await Promise.all([
          fetchResidentAccountDetail(userId),
          fetchUserProfile(userId),
          fetchUserStatus(userId),
        ]);

        if (!active) {
          return;
        }

        setAccount(accountRes);
        setProfile(profileRes);
        setStatus(statusRes);
        setForm({
          username: accountRes.username ?? '',
          email: accountRes.email ?? '',
          active: accountRes.active,
          newPassword: '',
          confirmPassword: '',
        });
        setState('success');
      } catch (err: any) {
        if (!active) {
          return;
        }
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Không thể tải thông tin tài khoản cư dân.';
        setError(message);
        setState('error');
      }
    };

    loadDetail();

    return () => {
      active = false;
    };
  }, [userId]);

  const roles = useMemo<string[]>(() => profile?.roles ?? account?.roles ?? [], [profile, account]);

  const handleBack = () => {
    router.push(`/accountDetailRe${userId}`);
  };

  const handleChange =
    (field: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const target = event.target as HTMLInputElement;
      const value = field === 'active' ? target.checked : target.value;
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleStatusSelect = (optionId: string) => {
    setForm((prev) => ({
      ...prev,
      active: optionId === 'ACTIVE',
    }));
  };

  const handlePasswordFieldChange =
    (field: 'newPassword' | 'confirmPassword') =>
    (value: string) => {
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const validateForm = () => {
    if (!form.username.trim()) {
      setError('Tên đăng nhập không được để trống.');
      return false;
    }
    if (!form.email.trim()) {
      setError('Email không được để trống.');
      return false;
    }
    if (form.newPassword) {
      if (form.newPassword.length < 8) {
        setError('Mật khẩu mới phải có ít nhất 8 ký tự.');
        return false;
      }
      if (form.newPassword !== form.confirmPassword) {
        setError('Xác nhận mật khẩu không khớp.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) return;
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const profilePayload: UpdateResidentAccountPayload = {
        username: form.username.trim(),
        email: form.email.trim(),
        active: form.active,
      };

      const updatedAccount = await updateResidentAccount(userId, profilePayload);
      setAccount(updatedAccount);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              username: updatedAccount.username,
              email: updatedAccount.email,
            }
          : prev,
      );

      if (form.newPassword) {
        await updateUserPassword(userId, { newPassword: form.newPassword });
      }

      setForm((prev) => ({
        ...prev,
        username: updatedAccount.username ?? prev.username,
        email: updatedAccount.email ?? prev.email,
        newPassword: '',
        confirmPassword: '',
      }));
      setSuccessMessage('Đã cập nhật tài khoản cư dân thành công.');
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Cập nhật tài khoản thất bại. Vui lòng thử lại.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderBuilding = () => {
    if (!account?.buildingId && !account?.buildingName) {
      return <p className="text-sm text-gray-500">Chưa có thông tin tòa nhà liên kết.</p>;
    }
    if (account?.buildingId) {
      return (
        <Link
          href={`/base/building/buildingDetail/${account.buildingId}`}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          {account.buildingName ?? account.buildingId}
        </Link>
      );
    }
    return <p className="text-sm font-medium text-[#02542D]">{account.buildingName}</p>;
  };

  const renderContent = () => {
    if (state === 'loading' || state === 'idle') {
      return (
        <div className="flex min-h-[240px] items-center justify-center text-sm text-slate-500">
          Đang tải thông tin tài khoản cư dân...
        </div>
      );
    }

    if (state === 'error') {
      return (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-4">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      );
    }

    if (!account) {
      return (
        <div className="flex min-h-[240px] items-center justify-center text-sm text-slate-500">
          Không tìm thấy thông tin tài khoản.
        </div>
      );
    }

    return (
      <form
        onSubmit={handleSubmit}
        className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200 space-y-8"
      >
        <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-[#02542D]">{account.username}</h1>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  form.active ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {form.active ? 'Đang hoạt động' : 'Ngưng hoạt động'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <DetailField
            label="Tên đăng nhập"
            value={form.username}
            readonly={false}
            onChange={handleChange('username')}
          />
          <DetailField
            label="Email"
            value={form.email}
            readonly={false}
            onChange={handleChange('email')}
          />
          <div className="flex flex-col">
            <span className="text-md font-bold text-[#02542D] mb-1">Trạng thái</span>
            <Select
              options={STATUS_OPTIONS}
              value={form.active ? 'ACTIVE' : 'INACTIVE'}
              onSelect={(option) => handleStatusSelect(option.id)}
              renderItem={(option) => option.label}
              getValue={(option) => option.id}
              placeholder="Chọn trạng thái"
            />
          </div>
        </div>

        <div>
          <h2 className="text-md font-semibold text-[#02542D]">Tòa nhà</h2>
          <div className="mt-2">{renderBuilding()}</div>
        </div>

        <PasswordChangeSection
          newPassword={form.newPassword}
          confirmPassword={form.confirmPassword}
          onChangeNewPassword={handlePasswordFieldChange('newPassword')}
          onChangeConfirmPassword={handlePasswordFieldChange('confirmPassword')}
        />
        <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>


      </form>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div
        className="mx-auto mb-6 flex max-w-4xl cursor-pointer items-center"
        onClick={handleBack}
      >
        <Image src={Arrow} alt="Back" width={20} height={20} className="mr-2 h-5 w-5" />
        <span className="text-2xl font-bold text-[#02542D] transition hover:text-opacity-80">
          Quay lại danh sách tài khoản
        </span>
      </div>
      {renderContent()}
    </div>
  );
}

