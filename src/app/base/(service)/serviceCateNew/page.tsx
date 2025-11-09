'use client'

import { useState } from 'react';
import Image from 'next/image';
import Arrow from '@/src/assets/Arrow.svg';
import DetailField from '@/src/components/base-service/DetailField';
import Select from '@/src/components/customer-interaction/Select';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useNotifications } from '@/src/hooks/useNotifications';
import { useServiceCategoryAdd } from '@/src/hooks/useServiceCategoryAdd';
import { CreateServiceCategoryPayload } from '@/src/types/service';

type FormState = {
  code: string;
  name: string;
  description: string;
  icon: string;
  sortOrder: string;
  isActive: boolean;
};

const initialState: FormState = {
  code: '',
  name: '',
  description: '',
  icon: '',
  sortOrder: '',
  isActive: true,
};

export default function ServiceCategoryCreatePage() {
  const t = useTranslations('ServiceCategory');
  const router = useRouter();
  const { show } = useNotifications();
  const { addCategory, isSubmitting } = useServiceCategoryAdd();

  const [formState, setFormState] = useState<FormState>(initialState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleBack = () => {
    router.push('/base/serviceCateList');
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStatusChange = (item: { name: string; value: string }) => {
    setFormState((prev) => ({
      ...prev,
      isActive: item.value === 'true',
    }));
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formState.code.trim()) {
      errors.code = t('validation.code');
    }
    if (!formState.name.trim()) {
      errors.name = t('validation.name');
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPayload = (): CreateServiceCategoryPayload => ({
    code: formState.code.trim(),
    name: formState.name.trim(),
    description: formState.description.trim() || undefined,
    icon: formState.icon.trim() || undefined,
    sortOrder: formState.sortOrder ? Number(formState.sortOrder) : null,
    isActive: formState.isActive,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!validate()) {
      show(t('validation.error'), 'error');
      return;
    }

    try {
      const payload = buildPayload();
      const created = await addCategory(payload);
      show(t('messages.createSuccess'), 'success');
      if (created?.id) {
        router.push('/base/serviceCateList');
      }
    } catch (submitError) {
      console.error('Failed to create service category', submitError);
      show(t('messages.createError'), 'error');
    }
  };

  const statusOptions = [
    { name: t('active'), value: 'true' },
    { name: t('inactive'), value: 'false' },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-8 font-sans">
      <div
        className="max-w-4xl mx-auto mb-6 flex items-center cursor-pointer"
        onClick={handleBack}
      >
        <Image
          src={Arrow}
          alt="Back"
          width={20}
          height={20}
          className="w-5 h-5 mr-2"
        />
        <span className="text-[#02542D] font-bold text-2xl hover:text-opacity-80 transition duration-150">
          {t('return')}
        </span>
      </div>

      <form
        className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between border-b pb-4 mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#02542D]">
              {t('newTitle')}
            </h1>
          </div>
          
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <DetailField
            label={t('code')}
            name="code"
            value={formState.code}
            onChange={handleInputChange}
            readonly={false}
            error={formErrors.code}
          />
          <DetailField
            label={t('name')}
            name="name"
            value={formState.name}
            onChange={handleInputChange}
            readonly={false}
            error={formErrors.name}
          />
          <div className="flex flex-col mb-4 col-span-1">
            <label className="text-md font-bold text-[#02542D] mb-1">
              {t('status')}
            </label>
            <Select
              options={statusOptions}
              value={String(formState.isActive)}
              onSelect={handleStatusChange}
              renderItem={(item) => item.name}
              getValue={(item) => item.value}
              placeholder={t('status')}
            />
          </div>
          <DetailField
            label={t('description')}
            name="description"
            value={formState.description}
            onChange={handleInputChange}
            readonly={false}
            type="textarea"
            isFullWidth
          />
        </div>

        <div className="flex justify-center mt-8 space-x-4">
          <button
            type="button"
            className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
            onClick={handleBack}
            disabled={isSubmitting}
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            className={`px-6 py-2 rounded-lg bg-[#02542D] text-white hover:bg-opacity-80 transition ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? t('saving') : t('save')}
          </button>
        </div>
      </form>
    </div>
  );
}
