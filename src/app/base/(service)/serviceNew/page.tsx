'use client'

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Arrow from '@/src/assets/Arrow.svg';
import DetailField from '@/src/components/base-service/DetailField';
import Select from '@/src/components/customer-interaction/Select';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useNotifications } from '@/src/hooks/useNotifications';
import { useServiceAdd } from '@/src/hooks/useServiceAdd';
import { getServiceCategories } from '@/src/services/asset-maintenance/serviceService';
import {
  CreateServicePayload,
  ServiceBookingType,
  ServiceCategory,
  ServicePricingType,
} from '@/src/types/service';

type FormState = {
  categoryId: string;
  code: string;
  name: string;
  description: string;
  location: string;
  mapUrl: string;
  pricingType: ServicePricingType;
  bookingType: ServiceBookingType;
  pricePerHour: string;
  pricePerSession: string;
  maxCapacity: string;
  minDurationHours: string;
  maxDurationHours: string;
  advanceBookingDays: string;
  rules: string;
  isActive: boolean;
};

const initialState: FormState = {
  categoryId: '',
  code: '',
  name: '',
  description: '',
  location: '',
  mapUrl: '',
  pricingType: ServicePricingType.HOURLY,
  bookingType: ServiceBookingType.STANDARD,
  pricePerHour: '',
  pricePerSession: '',
  maxCapacity: '',
  minDurationHours: '',
  maxDurationHours: '',
  advanceBookingDays: '',
  rules: '',
  isActive: true,
};

export default function ServiceCreatePage() {
  const t = useTranslations();
  const router = useRouter();
  const { show } = useNotifications();
  const { addService, isSubmitting } = useServiceAdd();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [formData, setFormData] = useState<FormState>(initialState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        name: category.name ?? '',
        value: category.id ?? '',
      })),
    [categories],
  );

  const pricingOptions = useMemo(
    () => [
      { name: t('Service.pricing.hourly'), value: ServicePricingType.HOURLY },
      { name: t('Service.pricing.session'), value: ServicePricingType.SESSION },
      { name: t('Service.pricing.free'), value: ServicePricingType.FREE },
    ],
    [t],
  );

  const bookingOptions = useMemo(
    () => [
      { name: t('Service.booking.combo'), value: ServiceBookingType.COMBO_BASED },
      { name: t('Service.booking.ticket'), value: ServiceBookingType.TICKET_BASED },
      { name: t('Service.booking.option'), value: ServiceBookingType.OPTION_BASED },
      { name: t('Service.booking.standard'), value: ServiceBookingType.STANDARD },
    ],
    [t],
  );

  const statusOptions = useMemo(
    () => [
      { name: t('Service.active'), value: 'true' },
      { name: t('Service.inactive'), value: 'false' },
    ],
    [t],
  );

  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await getServiceCategories();
        setCategories(response);
        if (response.length > 0) {
          setFormData((prev) => ({
            ...prev,
            categoryId: prev.categoryId || response[0].id || '',
          }));
        }
      } catch (err) {
        console.error('Failed to fetch service categories', err);
        show(t('Service.messages.categoryError'), 'error');
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, [show, t]);

  const handleBack = () => {
    router.push('/base/serviceList');
  };

  const parseNumber = (value: string) => {
    if (!value.trim()) return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!formData.categoryId) {
      errors.categoryId = t('Service.validation.category');
    }
    if (!formData.name.trim()) {
      errors.name = t('Service.validation.name');
    }
    if (!formData.pricingType) {
      errors.pricingType = t('Service.validation.pricingType');
    }
    if (!formData.bookingType) {
      errors.bookingType = t('Service.validation.bookingType');
    }

    const priceHour = parseNumber(formData.pricePerHour);
    const priceSession = parseNumber(formData.pricePerSession);

    if (
      formData.pricingType === ServicePricingType.HOURLY &&
      (!priceHour || priceHour <= 0)
    ) {
      errors.pricePerHour = t('Service.validation.pricePerHour');
    }

    if (
      formData.pricingType === ServicePricingType.SESSION &&
      (!priceSession || priceSession <= 0)
    ) {
      errors.pricePerSession = t('Service.validation.pricePerSession');
    }

    const maxCapacity = parseNumber(formData.maxCapacity);
    if (maxCapacity !== undefined && maxCapacity <= 0) {
      errors.maxCapacity = t('Service.validation.maxCapacity');
    }

    const minDuration = parseNumber(formData.minDurationHours);
    const maxDuration = parseNumber(formData.maxDurationHours);

    if (minDuration !== undefined && minDuration <= 0) {
      errors.minDurationHours = t('Service.validation.minDuration');
    }

    if (maxDuration !== undefined && maxDuration <= 0) {
      errors.maxDurationHours = t('Service.validation.maxDuration');
    }

    if (
      minDuration !== undefined &&
      maxDuration !== undefined &&
      maxDuration < minDuration
    ) {
      errors.maxDurationHours = t('Service.validation.durationRange');
    }

    const advanceBooking = parseNumber(formData.advanceBookingDays);
    if (advanceBooking !== undefined && advanceBooking < 0) {
      errors.advanceBookingDays = t('Service.validation.advanceBooking');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPayload = (): CreateServicePayload => {
    const pricingTypeValue = formData.pricingType || ServicePricingType.HOURLY;
    const bookingTypeValue = formData.bookingType || ServiceBookingType.STANDARD;

    return {
      categoryId: formData.categoryId,
      code: formData.code.trim(),
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      location: formData.location.trim() || undefined,
      mapUrl: formData.mapUrl.trim() || undefined,
      pricingType: pricingTypeValue,
      bookingType: bookingTypeValue,
      pricePerHour:
        pricingTypeValue === ServicePricingType.HOURLY
          ? parseNumber(formData.pricePerHour) ?? null
          : null,
      pricePerSession:
        pricingTypeValue === ServicePricingType.SESSION
          ? parseNumber(formData.pricePerSession) ?? null
          : null,
      maxCapacity: parseNumber(formData.maxCapacity) ?? null,
      minDurationHours: parseNumber(formData.minDurationHours) ?? null,
      maxDurationHours: parseNumber(formData.maxDurationHours) ?? null,
      advanceBookingDays: parseNumber(formData.advanceBookingDays) ?? null,
      rules: formData.rules.trim() || undefined,
      isActive: formData.isActive,
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!validate()) {
      show(t('Service.validation.error'), 'error');
      return;
    }

    try {
      const payload = buildPayload();
      const created = await addService(payload);
      show(t('Service.messages.createSuccess'), 'success');
      if (created?.id) {
        router.push(`/base/serviceDetail/${created.id}`);
      } else {
        router.push('/base/serviceList');
      }
    } catch (submitError) {
      console.error('Failed to create service', submitError);
      show(t('Service.messages.createError'), 'error');
    }
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'name') {
      const generatedCode = value
        .trim()
        .split(' ')
        .filter(Boolean)
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase();
      setFormData((prev) => ({
        ...prev,
        code: prev.code || generatedCode,
      }));
    }
  };

  const shouldShowPricePerHour = formData.pricingType === ServicePricingType.HOURLY;
  const shouldShowPricePerSession =
    formData.pricingType === ServicePricingType.SESSION;

  return (
    <div className="min-h-screen p-4 sm:p-8 font-sans">
      <div
        className="max-w-5xl mx-auto mb-6 flex items-center cursor-pointer"
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
          {t('Service.return')}
        </span>
      </div>

      <form
        className="max-w-5xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between border-b pb-4 mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#02542D]">
              {t('Service.newTitle')}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {t('Service.newSubtitle')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <DetailField
            label={t('Service.code')}
            value={formData.code}
            readonly={true}
            placeholder={t('Service.code')}
          />

          <DetailField
            label={t('Service.name')}
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            readonly={false}
            error={formErrors.name}
            isFullWidth
          />

          <div className="flex flex-col mb-4">
            <label className="text-md font-bold text-[#02542D] mb-1">
              {t('Service.category')}
            </label>
            <Select
              options={categoryOptions}
              value={formData.categoryId}
              onSelect={(item) =>
                setFormData((prev) => ({ ...prev, categoryId: item.value }))
              }
              renderItem={(item) => item.name}
              getValue={(item) => item.value}
              placeholder={
                loadingCategories
                  ? t('Service.loading')
                  : t('Service.categoryPlaceholder')
              }
              disable={loadingCategories}
            />
            {formErrors.categoryId && (
              <span className="text-red-500 text-xs mt-1">
                {formErrors.categoryId}
              </span>
            )}
          </div>

          <div className="flex flex-col mb-4">
            <label className="text-md font-bold text-[#02542D] mb-1">
              {t('Service.status')}
            </label>
            <Select
              options={statusOptions}
              value={String(formData.isActive)}
              onSelect={(item) =>
                setFormData((prev) => ({
                  ...prev,
                  isActive: item.value === 'true',
                }))
              }
              renderItem={(item) => item.name}
              getValue={(item) => item.value}
              placeholder={t('Service.status')}
            />
          </div>

          <div className="flex flex-col mb-4">
            <label className="text-md font-bold text-[#02542D] mb-1">
              {t('Service.pricingType')}
            </label>
            <Select
              options={pricingOptions}
              value={formData.pricingType}
              onSelect={(item) =>
                setFormData((prev) => ({
                  ...prev,
                  pricingType: item.value as ServicePricingType,
                  pricePerHour:
                    item.value === ServicePricingType.HOURLY ? prev.pricePerHour : '',
                  pricePerSession:
                    item.value === ServicePricingType.SESSION
                      ? prev.pricePerSession
                      : '',
                }))
              }
              renderItem={(item) => item.name}
              getValue={(item) => item.value}
              placeholder={t('Service.pricingType')}
            />
            {formErrors.pricingType && (
              <span className="text-red-500 text-xs mt-1">
                {formErrors.pricingType}
              </span>
            )}
          </div>

  <div className="flex flex-col mb-4">
            <label className="text-md font-bold text-[#02542D] mb-1">
              {t('Service.bookingType')}
            </label>
            <Select
              options={bookingOptions}
              value={formData.bookingType}
              onSelect={(item) =>
                setFormData((prev) => ({
                  ...prev,
                  bookingType: item.value as ServiceBookingType,
                }))
              }
              renderItem={(item) => item.name}
              getValue={(item) => item.value}
              placeholder={t('Service.bookingType')}
            />
            {formErrors.bookingType && (
              <span className="text-red-500 text-xs mt-1">
                {formErrors.bookingType}
              </span>
            )}
          </div>

          {shouldShowPricePerHour && (
            <DetailField
              label={t('Service.pricePerHour')}
              name="pricePerHour"
              value={formData.pricePerHour}
              onChange={handleInputChange}
              readonly={false}
              error={formErrors.pricePerHour}
            />
          )}

          {shouldShowPricePerSession && (
            <DetailField
              label={t('Service.pricePerSession')}
              name="pricePerSession"
              value={formData.pricePerSession}
              onChange={handleInputChange}
              readonly={false}
              error={formErrors.pricePerSession}
            />
          )}

          <DetailField
            label={t('Service.maxCapacity')}
            name="maxCapacity"
            value={formData.maxCapacity}
            onChange={handleInputChange}
            readonly={false}
            error={formErrors.maxCapacity}
          />

          <DetailField
            label={t('Service.minDuration')}
            name="minDurationHours"
            value={formData.minDurationHours}
            onChange={handleInputChange}
            readonly={false}
            error={formErrors.minDurationHours}
          />

          <DetailField
            label={t('Service.maxDuration')}
            name="maxDurationHours"
            value={formData.maxDurationHours}
            onChange={handleInputChange}
            readonly={false}
            error={formErrors.maxDurationHours}
          />

          <DetailField
            label={t('Service.advanceBookingDays')}
            name="advanceBookingDays"
            value={formData.advanceBookingDays}
            onChange={handleInputChange}
            readonly={false}
            error={formErrors.advanceBookingDays}
          />

          <DetailField
            label={t('Service.location')}
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            readonly={false}
          />

          <DetailField
            label={t('Service.mapUrl')}
            name="mapUrl"
            value={formData.mapUrl}
            onChange={handleInputChange}
            readonly={false}
          />

          <DetailField
            label={t('Service.description')}
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            readonly={false}
            type="textarea"
            isFullWidth
          />

          <DetailField
            label={t('Service.rules')}
            name="rules"
            value={formData.rules}
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
            {t('Service.cancel')}
          </button>
          <button
            type="submit"
            className={`px-6 py-2 rounded-lg bg-[#02542D] text-white hover:bg-opacity-80 transition ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? t('Service.saving') : t('Service.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
