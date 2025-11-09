'use client'

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Arrow from '@/src/assets/Arrow.svg';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import DetailField from '@/src/components/base-service/DetailField';
import Select from '@/src/components/customer-interaction/Select';
import { useServiceDetailPage } from '@/src/hooks/useServiceDetailPage';
import { ServiceBookingType, ServicePricingType, UpdateServicePayload } from '@/src/types/service';
import { useNotifications } from '@/src/hooks/useNotifications';

type FormState = {
  name: string;
  description: string;
  location: string;
  mapUrl: string;
  pricingType: ServicePricingType | '';
  bookingType: ServiceBookingType | '';
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
  name: '',
  description: '',
  location: '',
  mapUrl: '',
  pricingType: '',
  bookingType: '',
  pricePerHour: '',
  pricePerSession: '',
  maxCapacity: '',
  minDurationHours: '',
  maxDurationHours: '',
  advanceBookingDays: '',
  rules: '',
  isActive: true,
};

export default function ServiceEditPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const serviceId = params?.id?.toString() ?? '';
  const { show } = useNotifications();

  const { serviceData, loading, error, isSubmitting, editService } = useServiceDetailPage(serviceId);

  const [formData, setFormData] = useState<FormState>(initialState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!serviceData) return;

    setFormData({
      name: serviceData.name ?? '',
      description: serviceData.description ?? '',
      location: serviceData.location ?? '',
      mapUrl: serviceData.mapUrl ?? '',
      pricingType: serviceData.pricingType ?? '',
      bookingType: serviceData.bookingType ?? '',
      pricePerHour: serviceData.pricePerHour != null ? String(serviceData.pricePerHour) : '',
      pricePerSession: serviceData.pricePerSession != null ? String(serviceData.pricePerSession) : '',
      maxCapacity: serviceData.maxCapacity != null ? String(serviceData.maxCapacity) : '',
      minDurationHours: serviceData.minDurationHours != null ? String(serviceData.minDurationHours) : '',
      maxDurationHours: serviceData.maxDurationHours != null ? String(serviceData.maxDurationHours) : '',
      advanceBookingDays: serviceData.advanceBookingDays != null ? String(serviceData.advanceBookingDays) : '',
      rules: serviceData.rules ?? '',
      isActive: serviceData.isActive ?? true,
    });
  }, [serviceData]);

  const handleBack = () => {
    if (serviceId) {
      router.push(`/base/serviceDetail/${serviceId}`);
    } else {
      router.push('/base/serviceList');
    }
  };

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = t('Service.validation.name');
    }
    if (!formData.pricingType) {
      errors.pricingType = t('Service.validation.pricingType');
    }
    if (!formData.bookingType) {
      errors.bookingType = t('Service.validation.bookingType');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const parseNumber = (value: string) => {
    if (!value.trim()) return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!serviceId || isSubmitting) return;

    if (!validate()) {
      show(t('Service.validation.error'), 'error');
      return;
    }

    const payload: UpdateServicePayload = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      location: formData.location.trim() || undefined,
      mapUrl: formData.mapUrl.trim() || undefined,
      pricingType: formData.pricingType || undefined,
      bookingType: formData.bookingType || undefined,
      pricePerHour: parseNumber(formData.pricePerHour),
      pricePerSession: parseNumber(formData.pricePerSession),
      maxCapacity: parseNumber(formData.maxCapacity),
      minDurationHours: parseNumber(formData.minDurationHours),
      maxDurationHours: parseNumber(formData.maxDurationHours),
      advanceBookingDays: parseNumber(formData.advanceBookingDays),
      rules: formData.rules.trim() || undefined,
      isActive: formData.isActive,
    };

    try {
      await editService(serviceId, payload);
      show(t('Service.messages.updateSuccess'), 'success');
      router.push(`/base/serviceDetail/${serviceId}`);
    } catch (submitError) {
      console.error('Failed to update service', submitError);
      show(t('Service.messages.updateError'), 'error');
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const pricingOptions = [
    { name: t('Service.pricing.hourly'), value: ServicePricingType.HOURLY },
    { name: t('Service.pricing.session'), value: ServicePricingType.SESSION },
    { name: t('Service.pricing.free'), value: ServicePricingType.FREE },
  ];

  const bookingOptions = [
    { name: t('Service.booking.combo'), value: ServiceBookingType.COMBO_BASED },
    { name: t('Service.booking.ticket'), value: ServiceBookingType.TICKET_BASED },
    { name: t('Service.booking.option'), value: ServiceBookingType.OPTION_BASED },
    { name: t('Service.booking.standard'), value: ServiceBookingType.STANDARD },
  ];

  const statusOptions = [
    { name: t('Service.active'), value: 'true' },
    { name: t('Service.inactive'), value: 'false' },
  ];

  if (loading) {
    return (
      <div className="px-[41px] py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-2 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('Service.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-[41px] py-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{t('Service.error')}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-primary-2 text-white rounded-md hover:bg-primary-3"
          >
            {t('Service.returnList')}
          </button>
        </div>
      </div>
    );
  }

  if (!serviceData) {
    return (
      <div className="px-[41px] py-12 flex items-center justify-center">
        <div className="text-center text-gray-600">
          {t('Service.noData')}
        </div>
      </div>
    );
  }

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
          {t('Service.returnDetail')}
        </span>
      </div>

      <form
        className="max-w-5xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between border-b pb-4 mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#02542D]">
              {t('Service.editTitle')}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {t('Service.editSubtitle')}
            </p>
          </div>
          <div className="flex flex-col gap-2 min-w-[180px]">
            <label className="text-md font-bold text-[#02542D] mb-1">
              {t('Service.status')}
            </label>
            <Select
              options={statusOptions}
              value={String(formData.isActive)}
              onSelect={(item) => setFormData((prev) => ({ ...prev, isActive: item.value === 'true' }))}
              renderItem={(item) => item.name}
              getValue={(item) => item.value}
              placeholder={t('Service.status')}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <DetailField
            label={t('Service.code')}
            value={serviceData.code}
            readonly={true}
          />
          <DetailField
            label={t('Service.category')}
            value={serviceData.category?.name ?? '-'}
            readonly={true}
          />
          <DetailField
            label={t('Service.name')}
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            readonly={false}
            error={formErrors.name}
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

          <div className="flex flex-col mb-4">
            <label className="text-md font-bold text-[#02542D] mb-1">
              {t('Service.pricingType')}
            </label>
            <Select
              options={pricingOptions}
              value={formData.pricingType}
              onSelect={(item) => setFormData((prev) => ({ ...prev, pricingType: item.value }))}
              renderItem={(item) => item.name}
              getValue={(item) => item.value}
              placeholder={t('Service.pricingType')}
            />
            {formErrors.pricingType && (
              <span className="text-red-500 text-xs mt-1">{formErrors.pricingType}</span>
            )}
          </div>

          <div className="flex flex-col mb-4">
            <label className="text-md font-bold text-[#02542D] mb-1">
              {t('Service.bookingType')}
            </label>
            <Select
              options={bookingOptions}
              value={formData.bookingType}
              onSelect={(item) => setFormData((prev) => ({ ...prev, bookingType: item.value }))}
              renderItem={(item) => item.name}
              getValue={(item) => item.value}
              placeholder={t('Service.bookingType')}
            />
            {formErrors.bookingType && (
              <span className="text-red-500 text-xs mt-1">{formErrors.bookingType}</span>
            )}
          </div>

          <DetailField
            label={t('Service.pricePerHour')}
            name="pricePerHour"
            value={formData.pricePerHour}
            onChange={handleInputChange}
            readonly={false}
          />
          <DetailField
            label={t('Service.pricePerSession')}
            name="pricePerSession"
            value={formData.pricePerSession}
            onChange={handleInputChange}
            readonly={false}
          />
          <DetailField
            label={t('Service.maxCapacity')}
            name="maxCapacity"
            value={formData.maxCapacity}
            onChange={handleInputChange}
            readonly={false}
          />
          <DetailField
            label={t('Service.minDuration')}
            name="minDurationHours"
            value={formData.minDurationHours}
            onChange={handleInputChange}
            readonly={false}
          />
          <DetailField
            label={t('Service.maxDuration')}
            name="maxDurationHours"
            value={formData.maxDurationHours}
            onChange={handleInputChange}
            readonly={false}
          />
          <DetailField
            label={t('Service.advanceBookingDays')}
            name="advanceBookingDays"
            value={formData.advanceBookingDays}
            onChange={handleInputChange}
            readonly={false}
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

