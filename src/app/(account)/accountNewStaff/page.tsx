'use client';

import { ChangeEvent, FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Arrow from '@/src/assets/Arrow.svg';
import Select from '@/src/components/customer-interaction/Select';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  CreateStaffAccountPayload,
  createStaffAccount,
  checkUsernameExists,
  checkEmailExists,
} from '@/src/services/iam/userService';

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
  const t = useTranslations('AccountNewStaff');
  const { user, isLoading } = useAuth();

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
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);

  // Check if user has ADMIN role
  useEffect(() => {
    if (!isLoading) {
      const isAdmin = user?.roles?.some(role => role.toUpperCase() === 'ADMIN') ?? false;
      if (!user || !isAdmin) {
        // Redirect to 404 if not admin
        router.push('/404');
      }
    }
  }, [user, isLoading, router]);

  const STAFF_ROLE_OPTIONS = [
    { id: 'ADMIN', label: t('roles.admin') },
    { id: 'ACCOUNTANT', label: t('roles.accountant') },
    { id: 'TECHNICIAN', label: t('roles.technician') },
    { id: 'SUPPORTER', label: t('roles.supporter') },
  ];

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
    setUsernameError(null);
    setEmailError(null);
    setRoleError(null);
  };

  // Validate email format
  const validateEmailFormat = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = async () => {
    let isValid = true;

    // Validate username
    setUsernameError(null);
    if (!form.username.trim()) {
      setUsernameError(t('validation.username.required'));
      isValid = false;
    } else if (/\s/.test(form.username)) {
      setUsernameError(t('validation.username.noWhitespace'));
      isValid = false;
    } else if (form.username.length > 40) {
      setUsernameError(t('validation.username.maxLength'));
      isValid = false;
    } else {
      // Check username tồn tại trong database
      try {
        const exists = await checkUsernameExists(form.username.trim());
        if (exists) {
          setUsernameError(t('validation.username.exists'));
          isValid = false;
        }
      } catch (err: any) {
        // Nếu có lỗi khi check (network, etc.), vẫn cho phép submit và để backend xử lý
        console.error('Error checking username:', err);
      }
    }

    // Validate email
    setEmailError(null);
    if (!form.email.trim()) {
      setEmailError(t('validation.email.required'));
      isValid = false;
    } else if (/\s/.test(form.email)) {
      setEmailError(t('validation.email.noWhitespace'));
      isValid = false;
    } else if (form.email.length > 40) {
      setEmailError(t('validation.email.maxLength'));
      isValid = false;
    } else if (!validateEmailFormat(form.email)) {
      setEmailError(t('validation.email.invalid'));
      isValid = false;
    } else {
      // Check email tồn tại trong database
      try {
        const exists = await checkEmailExists(form.email.trim());
        if (exists) {
          setEmailError(t('validation.email.exists'));
          isValid = false;
        }
      } catch (err: any) {
        // Nếu có lỗi khi check (network, etc.), vẫn cho phép submit và để backend xử lý
        console.error('Error checking email:', err);
      }
    }

    // Validate role
    setRoleError(null);
    if (!form.role) {
      setRoleError(t('validation.role.required'));
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();

    const isValid = await validateForm();
    if (!isValid) {
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
      setSuccess(t('messages.createSuccess'));
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
        t('messages.createError');
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  // Don't render if not admin (will redirect to 404)
  const isAdmin = user?.roles?.some(role => role.toUpperCase() === 'ADMIN') ?? false;
  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div
        className="mx-auto mb-6 flex max-w-3xl cursor-pointer items-center"
        onClick={handleBack}
      >
        <Image src={Arrow} alt={t('back')} width={20} height={20} className="mr-2 h-5 w-5" />
        <span className="text-2xl font-bold text-[#02542D] transition hover:text-opacity-80">
          {t('back')}
        </span>
      </div>

      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-slate-800">{t('title')}</h1>
          <p className="text-sm text-slate-500">
            {t('subtitle')}
          </p>
        </div>

        {/* {(error || success) && (
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
        )} */}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">{t('fields.username')}</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => {
                  handleChange('username')(e);
                  if (usernameError) {
                    setUsernameError(null);
                  }
                }}
                placeholder={t('placeholders.username')}
                maxLength={40}
                className={`rounded-lg border px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 ${
                  usernameError
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                }`}
              />
              {usernameError && (
                <p className="text-xs text-red-600">{usernameError}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">{t('fields.email')}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => {
                  handleChange('email')(e);
                  if (emailError) {
                    setEmailError(null);
                  }
                }}
                placeholder={t('placeholders.email')}
                maxLength={40}
                className={`rounded-lg border px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 ${
                  emailError
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                }`}
              />
              {emailError && (
                <p className="text-xs text-red-600">{emailError}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">{t('fields.role')}</label>
              <Select
                options={STAFF_ROLE_OPTIONS}
                value={form.role}
                onSelect={(option) => {
                  handleRoleSelect(option.id);
                  if (roleError) {
                    setRoleError(null);
                  }
                }}
                renderItem={(option) => option.label}
                getValue={(option) => option.id}
                placeholder={t('placeholders.role')}
                error={!!roleError}
              />
              {roleError && (
                <p className="text-xs text-red-600">{roleError}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              {t('buttons.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? t('buttons.creating') : t('buttons.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

