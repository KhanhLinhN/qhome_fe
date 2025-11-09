'use client';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Arrow from '@/src/assets/Arrow.svg';
import Edit from '@/src/assets/Edit.svg';
import DetailField from '@/src/components/base-service/DetailField';
import {
  UserAccountInfo,
  UserProfileInfo,
  UserStatusInfo,
  fetchStaffAccountDetail,
  fetchUserProfile,
  fetchUserStatus,
} from '@/src/services/iam/userService';

type FetchState = 'idle' | 'loading' | 'error' | 'success';

export default function AccountDetailStaffPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const userIdParam = params?.id;
  const userId =
    typeof userIdParam === 'string' ? userIdParam : Array.isArray(userIdParam) ? userIdParam[0] : '';

  const [account, setAccount] = useState<UserAccountInfo | null>(null);
  const [profile, setProfile] = useState<UserProfileInfo | null>(null);
  const [status, setStatus] = useState<UserStatusInfo | null>(null);
  const [state, setState] = useState<FetchState>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setState('error');
      setError('Không tìm thấy mã tài khoản nhân viên.');
      return;
    }

    let active = true;

    const loadDetail = async () => {
      setState('loading');
      setError(null);
      try {
        const [accountRes, profileRes, statusRes] = await Promise.all([
          fetchStaffAccountDetail(userId),
          fetchUserProfile(userId),
          fetchUserStatus(userId),
        ]);

        if (!active) {
          return;
        }

        setAccount(accountRes);
        setProfile(profileRes);
        setStatus(statusRes);
        setState('success');
      } catch (err: any) {
        if (!active) {
          return;
        }
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Không thể tải thông tin tài khoản nhân viên.';
        setError(message);
        setState('error');
      }
    };

    loadDetail();

    return () => {
      active = false;
    };
  }, [userId]);

  const roles = useMemo<string[]>(() => {
    if (account?.roles?.length) {
      return account.roles;
    }
    if (profile?.roles?.length) {
      return profile.roles;
    }
    return [];
  }, [account, profile]);

  const permissions = useMemo<string[]>(() => profile?.permissions ?? [], [profile]);

  const handleBack = () => {
    router.push('/accountList');
  };

  const handleEdit = () => {
    if (userId) {
      router.push(`/accountEditStaff/${userId}`);
    }
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'Chưa ghi nhận';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString('vi-VN');
  };

  const renderRoles = () => {
    if (!roles.length) {
      return 'Không có vai trò';
    }
    return (
      <div className="flex flex-wrap gap-2">
        {roles.map((role) => (
          <span
            key={role}
            className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
          >
            {role}
          </span>
        ))}
      </div>
    );
  };

  const renderPermissions = () => {
    if (!permissions.length) {
      return <p className="text-sm text-gray-500">Không có phân quyền bổ sung.</p>;
    }
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {permissions.map((perm) => (
          <div
            key={perm}
            className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700"
          >
            {perm}
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    if (state === 'loading' || state === 'idle') {
      return (
        <div className="flex min-h-[240px] items-center justify-center text-sm text-slate-500">
          Đang tải thông tin tài khoản nhân viên...
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
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
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

    const isActive = account.active;

    return (
      <>
        <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200">
          <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-semibold text-[#02542D]">{account.username}</h1>
                    <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                    }`}
                    >
                    {isActive ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                    </span>
                </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            <DetailField label="Tên đăng nhập" value={account.username} readonly />
            <DetailField label="Email" value={account.email} readonly />
            <DetailField label="Trạng thái" value={isActive ? 'Đang hoạt động' : 'Ngưng hoạt động'} readonly />
            <DetailField label="Vai trò" value={roles.join(', ')} readonly />
          </div>

        </div>
      </>
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

