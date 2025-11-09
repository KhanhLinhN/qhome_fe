'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Arrow from '@/src/assets/Arrow.svg';
import Select from '@/src/components/customer-interaction/Select';
import {
  CreateStaffAccountPayload,
  createStaffAccount,
} from '@/src/services/iam/userService';

const STAFF_ROLE_OPTIONS = [
  { id: 'ADMIN', label: 'Admin' },
  { id: 'ACCOUNTANT', label: 'Accountant' },
  { id: 'TECHNICIAN', label: 'Technician' },
  { id: 'SUPPORTER', label: 'Supporter' },
];

type FormState = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  active: boolean;
};

export default function AccountNewStaffPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    active: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleBack = () => {
    router.push('/accountList');
  };

  const handleChange =
    (field: keyof FormState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value =
        field === 'active' ? event.target.checked : event.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleRoleSelect = (roleId: string) => {
    setForm((prev) => ({ ...prev, role: roleId }));
  };

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
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
    if (!form.email.includes('@')) {
      setError('Email không hợp lệ.');
      return false;
    }
    if (!form.role) {
      setError('Vui lòng chọn vai trò cho nhân viên.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();

    if (!validateForm()) {
      return;
    }

    const payload: CreateStaffAccountPayload = {
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      roles: [form.role],
      active: form.active,
    };

    try {
      setSubmitting(true);
      await createStaffAccount(payload);
      setSuccess('Tạo tài khoản nhân viên thành công.');
      router.push('/accountList');
      setForm({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '',
        active: true,
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tạo tài khoản nhân viên. Vui lòng thử lại.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div
        className="mx-auto mb-6 flex max-w-3xl cursor-pointer items-center"
        onClick={handleBack}
      >
        <Image src={Arrow} alt="Back" width={20} height={20} className="mr-2 h-5 w-5" />
        <span className="text-2xl font-bold text-[#02542D] transition hover:text-opacity-80">
          Quay lại danh sách tài khoản
        </span>
      </div>

      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-slate-800">Tạo mới tài khoản nhân viên</h1>
          <p className="text-sm text-slate-500">
            Nhập thông tin bên dưới để tạo tài khoản cho nhân viên nội bộ.
          </p>
        </div>

        {(error || success) && (
          <div className="mb-6 space-y-3">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Tên đăng nhập</label>
              <input
                type="text"
                value={form.username}
                onChange={handleChange('username')}
                placeholder="Nhập tên đăng nhập"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="example@domain.com"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Vai trò</label>
              <Select
                options={STAFF_ROLE_OPTIONS}
                value={form.role}
                onSelect={(option) => handleRoleSelect(option.id)}
                renderItem={(option) => option.label}
                getValue={(option) => option.id}
                placeholder="Chọn vai trò"
              />
            </div>
          </div>

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
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

