'use client'

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Arrow from '@/src/assets/Arrow.svg';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import DetailField from '@/src/components/base-service/DetailField';
import Select from '@/src/components/customer-interaction/Select';
import TimeBox from '@/src/components/customer-interaction/TimeBox';
import { useServiceDetailPage } from '@/src/hooks/useServiceDetailPage';
import { ServicePricingType, UpdateServicePayload } from '@/src/types/service';
import { useNotifications } from '@/src/hooks/useNotifications';

type FormState = {
  name: string;
  description: string;
  location: string;
  mapUrl: string;
  pricingType: ServicePricingType | '';
  pricePerHour: string;
  pricePerSession: string;
  maxCapacity: string;
  minDurationHours: string;
  rules: string;
  isActive: boolean;
  availabilities: AvailabilityFormState[];
};

type AvailabilityFormState = {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};

type AvailabilityFormErrors = Partial<Record<keyof AvailabilityFormState, string>>;

const DEFAULT_DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const initialState: FormState = {
  name: '',
  description: '',
  location: '',
  mapUrl: '',
  pricingType: '',
  pricePerHour: '',
  pricePerSession: '',
  maxCapacity: '',
  minDurationHours: '',
  rules: '',
  isActive: true,
  availabilities: [
    {
      dayOfWeek: '',
      startTime: '',
      endTime: '',
      isAvailable: true,
    },
  ],
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
  const [availabilityErrors, setAvailabilityErrors] = useState<Record<number, AvailabilityFormErrors>>({});

  useEffect(() => {
    if (!serviceData) return;

    setFormData({
      name: serviceData.name ?? '',
      description: serviceData.description ?? '',
      location: serviceData.location ?? '',
      mapUrl: serviceData.mapUrl ?? '',
      pricingType: (serviceData.pricingType as ServicePricingType | '') ?? '',
      pricePerHour:
        serviceData.pricePerHour != null
          ? String(serviceData.pricePerHour)
          : serviceData.pricingType === ServicePricingType.FREE
          ? ''
          : '',
      pricePerSession:
        serviceData.pricePerSession != null
          ? String(serviceData.pricePerSession)
          : serviceData.pricingType === ServicePricingType.FREE
          ? ''
          : '',
      maxCapacity: serviceData.maxCapacity != null ? String(serviceData.maxCapacity) : '',
      minDurationHours: serviceData.minDurationHours != null ? String(serviceData.minDurationHours) : '',
      rules: serviceData.rules ?? '',
      isActive: serviceData.isActive ?? true,
      availabilities:
        serviceData.availabilities && serviceData.availabilities.length > 0
          ? serviceData.availabilities.map((availability) => ({
              dayOfWeek:
                availability.dayOfWeek !== undefined && availability.dayOfWeek !== null
                  ? String(availability.dayOfWeek)
                  : '',
              startTime: availability.startTime ? availability.startTime.slice(0, 5) : '',
              endTime: availability.endTime ? availability.endTime.slice(0, 5) : '',
              isAvailable: availability.isAvailable ?? true,
            }))
          : [
              {
                dayOfWeek: '',
                startTime: '',
                endTime: '',
                isAvailable: true,
              },
            ],
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
    const availabilityValidationErrors: Record<number, AvailabilityFormErrors> = {};

    if (!formData.name.trim()) {
      errors.name = t('Service.validation.name');
    }
    if (!formData.pricingType) {
      errors.pricingType = t('Service.validation.pricingType');
    }

    const priceHour = parseNumber(formData.pricePerHour);
    const priceSession = parseNumber(formData.pricePerSession);

    if (formData.pricingType === ServicePricingType.HOURLY) {
      if (formData.pricePerHour.trim() === '' || priceHour === undefined || priceHour < 0) {
        errors.pricePerHour = t('Service.validation.pricePerHour');
      }
    }

    if (formData.pricingType === ServicePricingType.SESSION) {
      if (formData.pricePerSession.trim() === '' || priceSession === undefined || priceSession < 0) {
        errors.pricePerSession = t('Service.validation.pricePerSession');
      }
    }

    const maxCapacity = parsePositiveInteger(formData.maxCapacity);
    if (formData.maxCapacity.trim() === '' || maxCapacity === undefined) {
      errors.maxCapacity = t('Service.validation.maxCapacity');
    } else if (maxCapacity < 1 || maxCapacity > 1000) {
      errors.maxCapacity = t('Service.validation.maxCapacityRange');
    }

    const minDuration = parsePositiveInteger(formData.minDurationHours);
    if (formData.minDurationHours.trim() === '' || minDuration === undefined) {
      errors.minDurationHours = t('Service.validation.minDuration');
    }

    if (!formData.availabilities || formData.availabilities.length === 0) {
      errors.availabilities = t('Service.validation.availabilityRequired', {
        defaultMessage: 'Please add at least one availability entry.',
      });
    } else {
      formData.availabilities.forEach((availability, index) => {
        const entryErrors: AvailabilityFormErrors = {};
        const dayValue = availability.dayOfWeek.trim();
        const parsedDay = Number(dayValue);
        if (dayValue === '' || Number.isNaN(parsedDay) || parsedDay < 0 || parsedDay > 6) {
          entryErrors.dayOfWeek = t('Service.validation.availabilityDay', {
            defaultMessage: 'Please select a valid day of the week.',
          });
        }
        if (!availability.startTime) {
          entryErrors.startTime = t('Service.validation.availabilityStart', {
            defaultMessage: 'Start time is required.',
          });
        }
        if (!availability.endTime) {
          entryErrors.endTime = t('Service.validation.availabilityEnd', {
            defaultMessage: 'End time is required.',
          });
        } else if (availability.startTime && availability.endTime <= availability.startTime) {
          entryErrors.endTime = t('Service.validation.availabilityRange', {
            defaultMessage: 'End time must be after start time.',
          });
        }
        if (Object.keys(entryErrors).length > 0) {
          availabilityValidationErrors[index] = entryErrors;
        }
      });

      if (Object.keys(availabilityValidationErrors).length > 0) {
        errors.availabilities = t('Service.validation.availabilityInvalid', {
          defaultMessage: 'Please review the availability entries.',
        });
      }
    }

    setAvailabilityErrors(availabilityValidationErrors);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const parseNumber = (value: string) => {
    if (!value.trim()) return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const parsePositiveNumber = (value: string) => {
    const parsed = parseNumber(value);
    if (parsed === undefined) return undefined;
    if (parsed <= 0) return undefined;
    return parsed;
  };

  const parsePositiveInteger = (value: string) => {
    if (!value.trim()) return undefined;
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return undefined;
    if (parsed <= 0) return undefined;
    return parsed;
  };

  const handleAvailabilityChange = (
    index: number,
    field: keyof AvailabilityFormState,
    value: string | boolean,
  ) => {
    setFormData((prev) => {
      const updated = [...prev.availabilities];
      if (!updated[index]) return prev;
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return {
        ...prev,
        availabilities: updated,
      };
    });

    setAvailabilityErrors((prev) => {
      const current = prev[index];
      if (!current || current[field] === undefined) {
        return prev;
      }
      const entry = { ...current };
      delete entry[field];
      const next = { ...prev };
      if (Object.keys(entry).length === 0) {
        delete next[index];
      } else {
        next[index] = entry;
      }
      return next;
    });

    setFormErrors((prev) => {
      if (!prev.availabilities) return prev;
      const { availabilities, ...rest } = prev;
      return rest;
    });
  };

  const handleAddAvailability = () => {
    setFormData((prev) => ({
      ...prev,
      availabilities: [
        ...prev.availabilities,
        { dayOfWeek: '', startTime: '', endTime: '', isAvailable: true },
      ],
    }));
    setFormErrors((prev) => {
      if (!prev.availabilities) return prev;
      const { availabilities, ...rest } = prev;
      return rest;
    });
  };

  const handleRemoveAvailability = (index: number) => {
    setFormData((prev) => {
      const updated = prev.availabilities.filter((_, idx) => idx !== index);
      return {
        ...prev,
        availabilities: updated,
      };
    });

    setAvailabilityErrors((prev) => {
      if (!Object.keys(prev).length) return prev;
      const next: Record<number, AvailabilityFormErrors> = {};
      Object.entries(prev).forEach(([key, value]) => {
        const numericKey = Number(key);
        if (numericKey === index) {
          return;
        }
        const newIndex = numericKey > index ? numericKey - 1 : numericKey;
        next[newIndex] = value;
      });
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!serviceId || isSubmitting) return;

    if (!validate()) {
      show(t('Service.validation.error'), 'error');
      return;
    }

    const pricingTypeValue = formData.pricingType;
    const maxCapacity = parsePositiveInteger(formData.maxCapacity);
    const minDuration = parsePositiveInteger(formData.minDurationHours);
    const availabilityPayload = (formData.availabilities ?? [])
      .filter(
        (availability) =>
          availability.dayOfWeek.trim() !== '' &&
          availability.startTime &&
          availability.endTime,
      )
      .map((availability) => ({
        dayOfWeek: Number(availability.dayOfWeek),
        startTime: availability.startTime,
        endTime: availability.endTime,
        isAvailable: availability.isAvailable,
      }));

    const payload: UpdateServicePayload = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      location: formData.location.trim() || undefined,
      mapUrl: formData.mapUrl.trim() || undefined,
      pricingType: pricingTypeValue || undefined,
      pricePerHour:
        pricingTypeValue === ServicePricingType.HOURLY
          ? parsePositiveNumber(formData.pricePerHour)
          : undefined,
      pricePerSession:
        pricingTypeValue === ServicePricingType.SESSION
          ? parsePositiveNumber(formData.pricePerSession)
          : undefined,
      maxCapacity: maxCapacity,
      minDurationHours: minDuration,
      rules: formData.rules.trim() || undefined,
      isActive: formData.isActive,
      availabilities: availabilityPayload.length > 0 ? availabilityPayload : undefined,
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
    if (name) {
      setFormErrors((prev) => {
        if (!(name in prev)) return prev;
        const { [name]: _removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const pricingOptions = [
    { name: t('Service.pricing.hourly'), value: ServicePricingType.HOURLY },
    { name: t('Service.pricing.session'), value: ServicePricingType.SESSION },
    { name: t('Service.pricing.free'), value: ServicePricingType.FREE },
  ];

  const statusOptions = [
    { name: t('Service.active'), value: 'true' },
    { name: t('Service.inactive'), value: 'false' },
  ];

  const dayOfWeekOptions = useMemo(
    () =>
      DEFAULT_DAY_NAMES.map((fallbackName, index) => ({
        label: t(`Service.weekday.${index}`, { defaultMessage: fallbackName }),
        value: String(index),
      })),
    [t],
  );

  const shouldShowPricePerHour = formData.pricingType === ServicePricingType.HOURLY;
  const shouldShowPricePerSession = formData.pricingType === ServicePricingType.SESSION;

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
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <DetailField
            label={t('Service.code')}
            value={serviceData.code ?? ''}
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

          <div className="flex flex-col mb-4">
            <label className="text-md font-bold text-[#02542D] mb-1">
              {t('Service.pricingType')}
            </label>
            <Select
              options={pricingOptions}
              value={formData.pricingType}
              onSelect={(item) => {
                setFormData((prev) => ({
                  ...prev,
                  pricingType: item.value as ServicePricingType | '',
                  pricePerHour:
                    item.value === ServicePricingType.HOURLY
                      ? prev.pricePerHour
                      : item.value === ServicePricingType.FREE
                      ? ''
                      : '',
                  pricePerSession:
                    item.value === ServicePricingType.SESSION
                      ? prev.pricePerSession
                      : item.value === ServicePricingType.FREE
                      ? ''
                      : '',
                }));
                setFormErrors((prev) => {
                  const updated = { ...prev };
                  delete updated.pricingType;
                  if (item.value !== ServicePricingType.HOURLY) {
                    delete updated.pricePerHour;
                  }
                  if (item.value !== ServicePricingType.SESSION) {
                    delete updated.pricePerSession;
                  }
                  return updated;
                });
              }}
              renderItem={(item) => item.name}
              getValue={(item) => item.value}
              placeholder={t('Service.pricingType')}
            />
            {formErrors.pricingType && (
              <span className="text-red-500 text-xs mt-1">{formErrors.pricingType}</span>
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
              placeholder={t('Service.pricePerHour')}
              inputType="number"
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
              placeholder={t('Service.pricePerSession')}
              inputType="number"
            />
          )}
          <DetailField
            label={t('Service.maxCapacity')}
            name="maxCapacity"
            value={formData.maxCapacity}
            onChange={handleInputChange}
            readonly={false}
            error={formErrors.maxCapacity}
            placeholder={t('Service.maxCapacity')}
            inputType="number"
          />
          <DetailField
            label={t('Service.minDuration')}
            name="minDurationHours"
            value={formData.minDurationHours}
            onChange={handleInputChange}
            readonly={false}
            error={formErrors.minDurationHours}
            placeholder={t('Service.minDuration')}
            inputType="number"
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
          <div className="md:col-span-2">
            <div className="flex flex-col gap-4 rounded-lg border border-gray-200 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-[#02542D]">
                  {t('Service.availability.sectionTitle', { defaultMessage: 'Service availability' })}
                </h2>
                <button
                  type="button"
                  onClick={handleAddAvailability}
                  className="inline-flex items-center justify-center rounded-lg bg-[#02542D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-opacity-80"
                  disabled={isSubmitting}
                >
                  {t('Service.availability.add', { defaultMessage: 'Add availability' })}
                </button>
              </div>
              {formErrors.availabilities && (
                <span className="text-xs text-red-500">{formErrors.availabilities}</span>
              )}
              <div className="space-y-4">
                {formData.availabilities.map((availability, index) => {
                  const errors = availabilityErrors[index] ?? {};
                  return (
                    <div
                      key={`availability-${index}`}
                      className="rounded-md border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-sm font-semibold text-[#02542D]">
                          {t('Service.availability.slotLabel', {
                            defaultMessage: `Slot ${index + 1}`,
                            slot: index + 1,
                          })}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAvailability(index)}
                          className="text-sm font-medium text-red-500 hover:text-red-600"
                          disabled={isSubmitting}
                        >
                          {t('Service.availability.remove', { defaultMessage: 'Remove' })}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div className="flex flex-col">
                          <label className="text-sm font-medium text-[#02542D]">
                            {t('Service.availability.dayOfWeek', { defaultMessage: 'Day of week' })}
                          </label>
                          <select
                            value={availability.dayOfWeek}
                            onChange={(event) =>
                              handleAvailabilityChange(index, 'dayOfWeek', event.target.value)
                            }
                            className="mt-1 h-10 rounded-md border border-gray-300 px-3 text-sm text-[#02542D] focus:outline-none focus:ring-2 focus:ring-[#02542D]/30"
                          >
                            <option value="">
                              {t('Service.availability.dayPlaceholder', { defaultMessage: 'Select day' })}
                            </option>
                            {dayOfWeekOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {errors.dayOfWeek && (
                            <span className="mt-1 text-xs text-red-500">{errors.dayOfWeek}</span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <label className="text-sm font-medium text-[#02542D]">
                            {t('Service.availability.startTime', { defaultMessage: 'Start time' })}
                          </label>
                          <TimeBox
                            value={availability.startTime}
                            onChange={(value) => handleAvailabilityChange(index, 'startTime', value)}
                            placeholderText={t('Service.availability.startTime', {
                              defaultMessage: 'Start time',
                            })}
                            disabled={isSubmitting}
                          />
                          {errors.startTime && (
                            <span className="mt-1 text-xs text-red-500">{errors.startTime}</span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <label className="text-sm font-medium text-[#02542D]">
                            {t('Service.availability.endTime', { defaultMessage: 'End time' })}
                          </label>
                          <TimeBox
                            value={availability.endTime}
                            onChange={(value) => handleAvailabilityChange(index, 'endTime', value)}
                            placeholderText={t('Service.availability.endTime', {
                              defaultMessage: 'End time',
                            })}
                            disabled={isSubmitting}
                          />
                          {errors.endTime && (
                            <span className="mt-1 text-xs text-red-500">{errors.endTime}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 pt-6 md:pt-0">
                          <input
                            id={`availability-active-${index}`}
                            type="checkbox"
                            checked={availability.isAvailable}
                            onChange={(event) =>
                              handleAvailabilityChange(index, 'isAvailable', event.target.checked)
                            }
                            className="h-4 w-4 rounded border-gray-300 text-[#02542D] focus:ring-[#02542D]"
                          />
                          <label
                            htmlFor={`availability-active-${index}`}
                            className="text-sm font-medium text-[#02542D]"
                          >
                            {t('Service.availability.isAvailable', { defaultMessage: 'Active' })}
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
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

