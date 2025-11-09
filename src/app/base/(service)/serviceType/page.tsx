'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import Arrow from '@/src/assets/Arrow.svg';
import DetailField from '@/src/components/base-service/DetailField';
import Select from '@/src/components/customer-interaction/Select';
import { useNotifications } from '@/src/hooks/useNotifications';
import {
  createServiceCombo,
  createServiceOption,
  createServiceOptionGroup,
  createServiceTicket,
  getServiceOptions,
  getServices,
} from '@/src/services/asset-maintenance/serviceService';
import {
  CreateServiceComboPayload,
  CreateServiceOptionGroupPayload,
  CreateServiceOptionPayload,
  CreateServiceTicketPayload,
  Page,
  Service,
  ServiceComboItemPayload,
  ServiceOption,
  ServiceTicketType,
} from '@/src/types/service';

type FormType = 'combo' | 'option' | 'option-group' | 'ticket';

type BaseFormProps = {
  serviceId: string;
  onSuccess: () => void;
  onCancel: () => void;
  t: (key: string) => string;
  show: (message: string, tone?: 'success' | 'error' | 'info') => void;
};

const VALID_TYPES: FormType[] = ['combo', 'option', 'option-group', 'ticket'];

type BooleanOption = {
  label: string;
  value: boolean;
};

type ComboItemTargetType = 'service' | 'option';

interface ComboItemFormState {
  id: string;
  targetType: ComboItemTargetType;
  targetId: string;
  quantity: string;
  note: string;
}

function ActiveStatusSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  options: BooleanOption[];
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-[#02542D]">{label}</span>
      <Select<BooleanOption>
        options={options}
        value={String(value)}
        onSelect={(option) => onChange(option.value)}
        renderItem={(option) => option.label}
        getValue={(option) => String(option.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function RequiredSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  options: BooleanOption[];
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-[#02542D]">{label}</span>
      <Select<BooleanOption>
        options={options}
        value={String(value)}
        onSelect={(option) => onChange(option.value)}
        renderItem={(option) => option.label}
        getValue={(option) => String(option.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function FormActions({
  submitting,
  onCancel,
  cancelLabel,
  submitLabel,
}: {
  submitting: boolean;
  onCancel: () => void;
  cancelLabel: string;
  submitLabel: string;
}) {
  return (
    <div className="flex justify-center mt-8 space-x-4">
      <button
        type="button"
        className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
        onClick={onCancel}
        disabled={submitting}
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        className={`px-6 py-2 rounded-lg bg-[#02542D] text-white transition ${
          submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-80'
        }`}
        disabled={submitting}
      >
        {submitLabel}
      </button>
    </div>
  );
}

function ComboForm({ serviceId, onSuccess, onCancel, t, show }: BaseFormProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    servicesIncluded: '',
    durationMinutes: '',
    price: '',
    sortOrder: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [comboItems, setComboItems] = useState<ComboItemFormState[]>([]);
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
  const [generalItemsError, setGeneralItemsError] = useState<string | null>(null);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [availableOptions, setAvailableOptions] = useState<ServiceOption[]>([]);
  const [loadingSources, setLoadingSources] = useState<boolean>(false);

  const statusOptions = useMemo<BooleanOption[]>(
    () => [
      { value: true, label: t('Service.active') },
      { value: false, label: t('Service.inactive') },
    ],
    [t],
  );

  const targetTypeOptions = useMemo(
    () => [
      { value: 'service' as ComboItemTargetType, label: t('Service.comboItemServiceLabel') },
      { value: 'option' as ComboItemTargetType, label: t('Service.comboItemOptionLabel') },
    ],
    [t],
  );

  useEffect(() => {
    if (!serviceId) {
      setAvailableServices([]);
      setAvailableOptions([]);
      return;
    }

    let mounted = true;

    const fetchSources = async () => {
      setLoadingSources(true);
      try {
        const [servicesResponse, optionsResponse] = await Promise.all([
          getServices(),
          getServiceOptions(serviceId, true),
        ]);

        if (!mounted) {
          return;
        }

        const servicesRaw = servicesResponse as unknown;
        let servicesList: Service[] = [];

        if (Array.isArray(servicesRaw)) {
          servicesList = servicesRaw as Service[];
        } else if (
          servicesRaw &&
          typeof servicesRaw === 'object' &&
          Array.isArray((servicesRaw as Page<Service>).content)
        ) {
          servicesList = (servicesRaw as Page<Service>).content;
        }

        setAvailableServices(servicesList.filter((service) => Boolean(service.id)));
        setAvailableOptions(
          Array.isArray(optionsResponse)
            ? (optionsResponse as ServiceOption[]).filter((option) => Boolean(option.id))
            : [],
        );
      } catch (error) {
        console.error('Failed to load combo item sources', error);
      } finally {
        if (mounted) {
          setLoadingSources(false);
        }
      }
    };

    fetchSources();

    return () => {
      mounted = false;
    };
  }, [serviceId]);

  const createEmptyItem = (): ComboItemFormState => ({
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `combo-item-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    targetType: 'service',
    targetId: '',
    quantity: '1',
    note: '',
  });

  const resetItemError = (id: string) => {
    setItemErrors((prev) => {
      if (!prev[id]) {
        return prev;
      }
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleAddItem = () => {
    setComboItems((prev) => [...prev, createEmptyItem()]);
    setGeneralItemsError(null);
  };

  const handleRemoveItem = (id: string) => {
    setComboItems((prev) => prev.filter((item) => item.id !== id));
    setItemErrors((prev) => {
      if (!prev[id]) {
        return prev;
      }
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
    setGeneralItemsError(null);
  };

  const handleItemTypeChange = (id: string, targetType: ComboItemTargetType) => {
    setComboItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              targetType,
              targetId: '',
            }
          : item,
      ),
    );
    resetItemError(id);
    setGeneralItemsError(null);
  };

  const handleItemTargetChange = (id: string, targetId: string) => {
    setComboItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, targetId } : item)),
    );
    resetItemError(id);
    setGeneralItemsError(null);
  };

  const handleItemQuantityChange = (id: string, value: string) => {
    setComboItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: value } : item)),
    );
    resetItemError(id);
    setGeneralItemsError(null);
  };

  const handleItemNoteChange = (id: string, value: string) => {
    setComboItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, note: value } : item)),
    );
  };

  const serviceChoices = useMemo(
    () => availableServices.filter((service) => Boolean(service.id)),
    [availableServices],
  );

  const optionChoices = useMemo(
    () => availableOptions.filter((option) => Boolean(option.id)),
    [availableOptions],
  );

  const serviceLabel = (service: Service) => {
    if (!service) {
      return '';
    }
    if (service.name && service.code) {
      return `${service.name} (${service.code})`;
    }
    return service.name ?? service.code ?? '';
  };

  const optionLabel = (option: ServiceOption) => {
    if (!option) {
      return '';
    }
    if (option.name && option.code) {
      return `${option.name} (${option.code})`;
    }
    return option.name ?? option.code ?? '';
  };

  const handleChange = (name: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as string]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name as string];
        return updated;
      });
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.code.trim()) {
      nextErrors.code = t('Service.validation.comboCode');
    }
    if (!formData.name.trim()) {
      nextErrors.name = t('Service.validation.comboName');
    }
    const price = Number(formData.price);
    if (!formData.price.trim() || Number.isNaN(price) || price <= 0) {
      nextErrors.price = t('Service.validation.comboPrice');
    }
    if (formData.durationMinutes.trim()) {
      const duration = Number(formData.durationMinutes);
      if (Number.isNaN(duration) || duration < 0) {
        nextErrors.durationMinutes = t('Service.validation.nonNegative');
      }
    }
    if (formData.sortOrder.trim()) {
      const order = Number(formData.sortOrder);
      if (Number.isNaN(order) || order < 0) {
        nextErrors.sortOrder = t('Service.validation.nonNegative');
      }
    }
    setErrors(nextErrors);

    const nextItemErrors: Record<string, string> = {};
    let generalError: string | null = null;

    if (comboItems.length === 0) {
      generalError = t('Service.validation.comboItems');
    } else {
      comboItems.forEach((item) => {
        if (!item.targetId) {
          nextItemErrors[item.id] = t('Service.validation.comboItemTarget');
        } else {
          const quantityValue = Number(item.quantity);
          if (!item.quantity.trim() || Number.isNaN(quantityValue) || quantityValue <= 0) {
            nextItemErrors[item.id] = t('Service.validation.comboItemQuantity');
          }
        }
      });
    }

    setItemErrors(nextItemErrors);
    setGeneralItemsError(generalError);

    const hasFieldErrors = Object.keys(nextErrors).length > 0;
    const hasItemErrors = Object.keys(nextItemErrors).length > 0 || Boolean(generalError);

    return !hasFieldErrors && !hasItemErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const itemsPayload: ServiceComboItemPayload[] = comboItems.map((item, index) => {
        const quantityValue = Number(item.quantity);
        const payload: ServiceComboItemPayload = {
          quantity: Number.isNaN(quantityValue) || quantityValue <= 0 ? 1 : quantityValue,
          note: item.note.trim() || undefined,
          sortOrder: index + 1,
        };
        if (item.targetType === 'service') {
          payload.includedServiceId = item.targetId;
        } else {
          payload.optionId = item.targetId;
        }
        return payload;
      });

      const payload: CreateServiceComboPayload = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        servicesIncluded: formData.servicesIncluded.trim() || undefined,
        durationMinutes: formData.durationMinutes.trim()
          ? Number(formData.durationMinutes)
          : null,
        price: Number(formData.price),
        isActive: formData.isActive,
        sortOrder: formData.sortOrder.trim() ? Number(formData.sortOrder) : null,
        items: itemsPayload,
      };
      await createServiceCombo(serviceId, payload);
      show(t('Service.messages.createComboSuccess'), 'success');
      onSuccess();
    } catch (error) {
      console.error('Failed to create combo', error);
      show(t('Service.messages.createComboError'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200"
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        <DetailField
          label={t('Service.comboCode')}
          name="code"
          value={formData.code}
          onChange={(event) => handleChange('code', event.target.value)}
          readonly={false}
          error={errors.code}
        />
        <DetailField
          label={t('Service.comboName')}
          name="name"
          value={formData.name}
          onChange={(event) => handleChange('name', event.target.value)}
          readonly={false}
          error={errors.name}
        />
        <DetailField
          label={t('Service.comboPrice')}
          name="price"
          value={formData.price}
          onChange={(event) => handleChange('price', event.target.value)}
          readonly={false}
          error={errors.price}
          inputType="number"
        />
        <DetailField
          label={t('Service.comboDuration')}
          name="durationMinutes"
          value={formData.durationMinutes}
          onChange={(event) => handleChange('durationMinutes', event.target.value)}
          readonly={false}
          error={errors.durationMinutes}
          inputType="number"
        />
        <DetailField
          label={t('Service.sortOrder')}
          name="sortOrder"
          value={formData.sortOrder}
          onChange={(event) => handleChange('sortOrder', event.target.value)}
          readonly={false}
          error={errors.sortOrder}
          inputType="number"
        />
        <ActiveStatusSelect
          label={t('Service.isActiveLabel')}
          value={formData.isActive}
          onChange={(value) => handleChange('isActive', value)}
          options={statusOptions}
          placeholder={t('Service.status')}
        />
        <DetailField
          label={t('Service.description')}
          name="description"
          value={formData.description}
          onChange={(event) => handleChange('description', event.target.value)}
          readonly={false}
          type="textarea"
          isFullWidth
        />
        <DetailField
          label={t('Service.comboServicesIncluded')}
          name="servicesIncluded"
          value={formData.servicesIncluded}
          onChange={(event) => handleChange('servicesIncluded', event.target.value)}
          readonly={false}
          type="textarea"
          isFullWidth
        />
        <div className="md:col-span-2 border border-dashed border-gray-300 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#02542D]">
              {t('Service.comboItems')}
            </h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-2 rounded-lg bg-[#02542D] px-3 py-2 text-sm font-semibold text-white hover:bg-opacity-80 transition"
            >
              {t('Service.addComboItem')}
            </button>
          </div>
          {generalItemsError && (
            <p className="text-sm text-red-500">{generalItemsError}</p>
          )}
          {comboItems.length === 0 ? (
            <p className="text-sm text-gray-500">
              {loadingSources ? t('Service.loading') : t('Service.comboItemNoItems')}
            </p>
          ) : (
            <div className="space-y-4">
              {comboItems.map((item, index) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-[#02542D]">
                      {t('Service.comboItemIndex').replace('{index}', String(index + 1))}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      {t('Service.comboItemRemove')}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2 text-sm">
                      <label className="font-medium text-[#02542D]">
                        {t('Service.comboItemType')}
                      </label>
                      <select
                        className="h-10 rounded-md border border-gray-300 px-3 py-2 text-sm text-[#02542D] focus:outline-none focus:ring-2 focus:ring-[#02542D]/30"
                        value={item.targetType}
                        onChange={(event) =>
                          handleItemTypeChange(item.id, event.target.value as ComboItemTargetType)
                        }
                      >
                        {targetTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2 text-sm">
                      <label className="font-medium text-[#02542D]">
                        {t('Service.comboItemTarget')}
                      </label>
                      {item.targetType === 'service' ? (
                        <Select<Service>
                          options={serviceChoices}
                          value={item.targetId}
                          onSelect={(service) =>
                            handleItemTargetChange(item.id, service.id ?? '')
                          }
                          renderItem={(service) => serviceLabel(service)}
                          getValue={(service) => service.id ?? ''}
                          placeholder={t('Service.comboItemSelectService')}
                        />
                      ) : (
                        <Select<ServiceOption>
                          options={optionChoices}
                          value={item.targetId}
                          onSelect={(option) =>
                            handleItemTargetChange(item.id, option.id ?? '')
                          }
                          renderItem={(option) => optionLabel(option)}
                          getValue={(option) => option.id ?? ''}
                          placeholder={t('Service.comboItemSelectOption')}
                        />
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2 text-sm">
                      <label className="font-medium text-[#02542D]">
                        {t('Service.comboItemQuantity')}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(event) => handleItemQuantityChange(item.id, event.target.value)}
                        className="h-10 rounded-md border border-gray-300 px-3 py-2 text-sm text-[#02542D] focus:outline-none focus:ring-2 focus:ring-[#02542D]/30"
                      />
                    </div>
                    <div className="flex flex-col gap-2 text-sm">
                      <label className="font-medium text-[#02542D]">
                        {t('Service.comboItemNote')}
                      </label>
                      <textarea
                        rows={2}
                        value={item.note}
                        onChange={(event) => handleItemNoteChange(item.id, event.target.value)}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm text-[#02542D] focus:outline-none focus:ring-2 focus:ring-[#02542D]/30"
                      />
                    </div>
                  </div>
                  {itemErrors[item.id] && (
                    <p className="text-sm text-red-500">{itemErrors[item.id]}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <FormActions
        submitting={submitting}
        onCancel={onCancel}
        cancelLabel={t('Service.cancel')}
        submitLabel={t('Service.save')}
      />
    </form>
  );
}

function OptionForm({ serviceId, onSuccess, onCancel, t, show }: BaseFormProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    price: '',
    unit: '',
    sortOrder: '',
    isRequired: false,
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const yesNoOptions = useMemo<BooleanOption[]>(
    () => [
      { value: true, label: t('Popup.yes') },
      { value: false, label: t('Popup.no') },
    ],
    [t],
  );

  const statusOptions = useMemo<BooleanOption[]>(
    () => [
      { value: true, label: t('Service.active') },
      { value: false, label: t('Service.inactive') },
    ],
    [t],
  );

  const handleChange = (name: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as string]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name as string];
        return updated;
      });
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.code.trim()) {
      nextErrors.code = t('Service.validation.optionCode');
    }
    if (!formData.name.trim()) {
      nextErrors.name = t('Service.validation.optionName');
    }
    const price = Number(formData.price);
    if (!formData.price.trim() || Number.isNaN(price) || price <= 0) {
      nextErrors.price = t('Service.validation.optionPrice');
    }
    if (formData.sortOrder.trim()) {
      const order = Number(formData.sortOrder);
      if (Number.isNaN(order) || order < 0) {
        nextErrors.sortOrder = t('Service.validation.nonNegative');
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload: CreateServiceOptionPayload = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: Number(formData.price),
        unit: formData.unit.trim() || undefined,
        isRequired: formData.isRequired,
        isActive: formData.isActive,
        sortOrder: formData.sortOrder.trim() ? Number(formData.sortOrder) : null,
      };
      await createServiceOption(serviceId, payload);
      show(t('Service.messages.createOptionSuccess'), 'success');
      onSuccess();
    } catch (error) {
      console.error('Failed to create option', error);
      show(t('Service.messages.createOptionError'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200"
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        <DetailField
          label={t('Service.optionCode')}
          name="code"
          value={formData.code}
          onChange={(event) => handleChange('code', event.target.value)}
          readonly={false}
          error={errors.code}
        />
        <DetailField
          label={t('Service.optionName')}
          name="name"
          value={formData.name}
          onChange={(event) => handleChange('name', event.target.value)}
          readonly={false}
          error={errors.name}
        />
        <DetailField
          label={t('Service.optionPrice')}
          name="price"
          value={formData.price}
          onChange={(event) => handleChange('price', event.target.value)}
          readonly={false}
          error={errors.price}
          inputType="number"
        />
        <DetailField
          label={t('Service.optionUnit')}
          name="unit"
          value={formData.unit}
          onChange={(event) => handleChange('unit', event.target.value)}
          readonly={false}
        />
        <DetailField
          label={t('Service.sortOrder')}
          name="sortOrder"
          value={formData.sortOrder}
          onChange={(event) => handleChange('sortOrder', event.target.value)}
          readonly={false}
          error={errors.sortOrder}
          inputType="number"
        />
        <div className="flex flex-col gap-3">
          <RequiredSelect
            label={t('Service.optionIsRequired')}
            value={formData.isRequired}
            onChange={(value) => handleChange('isRequired', value)}
            options={yesNoOptions}
            placeholder={t('Popup.yes')}
          />
          <ActiveStatusSelect
            label={t('Service.isActiveLabel')}
            value={formData.isActive}
            onChange={(value) => handleChange('isActive', value)}
            options={statusOptions}
            placeholder={t('Service.status')}
          />
        </div>
        <DetailField
          label={t('Service.optionDescription')}
          name="description"
          value={formData.description}
          onChange={(event) => handleChange('description', event.target.value)}
          readonly={false}
          type="textarea"
          isFullWidth
        />
      </div>
      <FormActions
        submitting={submitting}
        onCancel={onCancel}
        cancelLabel={t('Service.cancel')}
        submitLabel={t('Service.save')}
      />
    </form>
  );
}

function OptionGroupForm({ serviceId, onSuccess, onCancel, t, show }: BaseFormProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    minSelect: '',
    maxSelect: '',
    sortOrder: '',
    isRequired: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const yesNoOptions = useMemo<BooleanOption[]>(
    () => [
      { value: true, label: t('Popup.yes') },
      { value: false, label: t('Popup.no') },
    ],
    [t],
  );

  const handleChange = (name: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as string]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name as string];
        return updated;
      });
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.code.trim()) {
      nextErrors.code = t('Service.validation.optionGroupCode');
    }
    if (!formData.name.trim()) {
      nextErrors.name = t('Service.validation.optionGroupName');
    }
    if (formData.minSelect.trim()) {
      const min = Number(formData.minSelect);
      if (Number.isNaN(min) || min < 0) {
        nextErrors.minSelect = t('Service.validation.nonNegative');
      }
    }
    if (formData.maxSelect.trim()) {
      const max = Number(formData.maxSelect);
      if (Number.isNaN(max) || max < 0) {
        nextErrors.maxSelect = t('Service.validation.nonNegative');
      }
    }
    if (
      formData.minSelect.trim() &&
      formData.maxSelect.trim() &&
      Number(formData.maxSelect) < Number(formData.minSelect)
    ) {
      nextErrors.range = t('Service.validation.optionGroupRange');
    }
    if (formData.sortOrder.trim()) {
      const order = Number(formData.sortOrder);
      if (Number.isNaN(order) || order < 0) {
        nextErrors.sortOrder = t('Service.validation.nonNegative');
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload: CreateServiceOptionGroupPayload = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        minSelect: formData.minSelect.trim() ? Number(formData.minSelect) : null,
        maxSelect: formData.maxSelect.trim() ? Number(formData.maxSelect) : null,
        isRequired: formData.isRequired,
        sortOrder: formData.sortOrder.trim() ? Number(formData.sortOrder) : null,
      };
      await createServiceOptionGroup(serviceId, payload);
      show(t('Service.messages.createOptionGroupSuccess'), 'success');
      onSuccess();
    } catch (error) {
      console.error('Failed to create option group', error);
      show(t('Service.messages.createOptionGroupError'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200"
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        <DetailField
          label={t('Service.optionGroupCode')}
          name="code"
          value={formData.code}
          onChange={(event) => handleChange('code', event.target.value)}
          readonly={false}
          error={errors.code}
        />
        <DetailField
          label={t('Service.optionGroupName')}
          name="name"
          value={formData.name}
          onChange={(event) => handleChange('name', event.target.value)}
          readonly={false}
          error={errors.name}
        />
        <DetailField
          label={t('Service.optionGroupMinSelect')}
          name="minSelect"
          value={formData.minSelect}
          onChange={(event) => handleChange('minSelect', event.target.value)}
          readonly={false}
          error={errors.minSelect}
          inputType="number"
        />
        <DetailField
          label={t('Service.optionGroupMaxSelect')}
          name="maxSelect"
          value={formData.maxSelect}
          onChange={(event) => handleChange('maxSelect', event.target.value)}
          readonly={false}
          error={errors.maxSelect || errors.range}
          inputType="number"
        />
        <DetailField
          label={t('Service.sortOrder')}
          name="sortOrder"
          value={formData.sortOrder}
          onChange={(event) => handleChange('sortOrder', event.target.value)}
          readonly={false}
          error={errors.sortOrder}
          inputType="number"
        />
        <RequiredSelect
          label={t('Service.optionGroupIsRequired')}
          value={formData.isRequired}
          onChange={(value) => handleChange('isRequired', value)}
          options={yesNoOptions}
          placeholder={t('Popup.yes')}
        />
        <DetailField
          label={t('Service.optionGroupDescription')}
          name="description"
          value={formData.description}
          onChange={(event) => handleChange('description', event.target.value)}
          readonly={false}
          type="textarea"
          isFullWidth
        />
      </div>
      <FormActions
        submitting={submitting}
        onCancel={onCancel}
        cancelLabel={t('Service.cancel')}
        submitLabel={t('Service.save')}
      />
    </form>
  );
}

function TicketForm({ serviceId, onSuccess, onCancel, t, show }: BaseFormProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    ticketType: ServiceTicketType.DAY,
    durationHours: '',
    price: '',
    maxPeople: '',
    description: '',
    sortOrder: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const ticketTypeOptions = useMemo(
    () =>
      Object.values(ServiceTicketType).map((value) => ({
        name: t(`Service.ticketType.${value.toLowerCase()}`),
        value,
      })),
    [t],
  );

  const statusOptions = useMemo<BooleanOption[]>(
    () => [
      { value: true, label: t('Service.active') },
      { value: false, label: t('Service.inactive') },
    ],
    [t],
  );

  const handleChange = (name: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as string]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name as string];
        return updated;
      });
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.code.trim()) {
      nextErrors.code = t('Service.validation.ticketCode');
    }
    if (!formData.name.trim()) {
      nextErrors.name = t('Service.validation.ticketName');
    }
    if (!formData.ticketType) {
      nextErrors.ticketType = t('Service.validation.ticketType');
    }
    const price = Number(formData.price);
    if (!formData.price.trim() || Number.isNaN(price) || price <= 0) {
      nextErrors.price = t('Service.validation.ticketPrice');
    }
    if (formData.durationHours.trim()) {
      const duration = Number(formData.durationHours);
      if (Number.isNaN(duration) || duration <= 0) {
        nextErrors.durationHours = t('Service.validation.ticketDuration');
      }
    }
    if (formData.maxPeople.trim()) {
      const maxPeople = Number(formData.maxPeople);
      if (Number.isNaN(maxPeople) || maxPeople < 1) {
        nextErrors.maxPeople = t('Service.validation.ticketMaxPeople');
      }
    }
    if (formData.sortOrder.trim()) {
      const order = Number(formData.sortOrder);
      if (Number.isNaN(order) || order < 0) {
        nextErrors.sortOrder = t('Service.validation.nonNegative');
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload: CreateServiceTicketPayload = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        ticketType: formData.ticketType,
        durationHours: formData.durationHours.trim()
          ? Number(formData.durationHours)
          : null,
        price: Number(formData.price),
        maxPeople: formData.maxPeople.trim() ? Number(formData.maxPeople) : null,
        description: formData.description.trim() || undefined,
        isActive: formData.isActive,
        sortOrder: formData.sortOrder.trim() ? Number(formData.sortOrder) : null,
      };
      await createServiceTicket(serviceId, payload);
      show(t('Service.messages.createTicketSuccess'), 'success');
      onSuccess();
    } catch (error) {
      console.error('Failed to create ticket', error);
      show(t('Service.messages.createTicketError'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200"
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        <DetailField
          label={t('Service.ticketCode')}
          name="code"
          value={formData.code}
          onChange={(event) => handleChange('code', event.target.value)}
          readonly={false}
          error={errors.code}
        />
        <DetailField
          label={t('Service.ticketName')}
          name="name"
          value={formData.name}
          onChange={(event) => handleChange('name', event.target.value)}
          readonly={false}
          error={errors.name}
        />
        <div className="flex flex-col gap-2">
          <label className="text-md font-bold text-[#02542D] mb-1">
            {t('Service.ticketTypeLabel')}
          </label>
          <Select
            options={ticketTypeOptions}
            value={formData.ticketType}
            onSelect={(item) => handleChange('ticketType', item.value)}
            renderItem={(item) => item.name}
            getValue={(item) => item.value}
            placeholder={t('Service.ticketTypeLabel')}
          />
          {errors.ticketType && (
            <span className="text-red-500 text-xs mt-1">{errors.ticketType}</span>
          )}
        </div>
        <DetailField
          label={t('Service.ticketPrice')}
          name="price"
          value={formData.price}
          onChange={(event) => handleChange('price', event.target.value)}
          readonly={false}
          error={errors.price}
          inputType="number"
        />
        <DetailField
          label={t('Service.ticketDuration')}
          name="durationHours"
          value={formData.durationHours}
          onChange={(event) => handleChange('durationHours', event.target.value)}
          readonly={false}
          error={errors.durationHours}
          inputType="number"
        />
        <DetailField
          label={t('Service.ticketMaxPeople')}
          name="maxPeople"
          value={formData.maxPeople}
          onChange={(event) => handleChange('maxPeople', event.target.value)}
          readonly={false}
          error={errors.maxPeople}
          inputType="number"
        />
        <DetailField
          label={t('Service.sortOrder')}
          name="sortOrder"
          value={formData.sortOrder}
          onChange={(event) => handleChange('sortOrder', event.target.value)}
          readonly={false}
          error={errors.sortOrder}
          inputType="number"
        />
        <ActiveStatusSelect
          label={t('Service.isActiveLabel')}
          value={formData.isActive}
          onChange={(value) => handleChange('isActive', value)}
          options={statusOptions}
          placeholder={t('Service.status')}
        />
        <DetailField
          label={t('Service.ticketDescription')}
          name="description"
          value={formData.description}
          onChange={(event) => handleChange('description', event.target.value)}
          readonly={false}
          type="textarea"
          isFullWidth
        />
      </div>
      <FormActions
        submitting={submitting}
        onCancel={onCancel}
        cancelLabel={t('Service.cancel')}
        submitLabel={t('Service.save')}
      />
    </form>
  );
}

export default function ServiceTypeCreatePage() {
  const t = useTranslations();
  const router = useRouter();
  const { show } = useNotifications();
  const searchParams = useSearchParams();

  const typeParam = (searchParams.get('type') ?? '').toLowerCase() as FormType;
  const serviceId = searchParams.get('serviceId') ?? '';

  const handleBack = () => {
    if (serviceId) {
      router.push(`/base/serviceDetail/${serviceId}`);
    } else {
      router.push('/base/serviceList');
    }
  };

  const handleSuccess = () => {
    if (serviceId) {
      router.push(`/base/serviceDetail/${serviceId}`);
    } else {
      router.push('/base/serviceList');
    }
  };

  const titleMap: Record<FormType, string> = {
    combo: t('Service.createComboTitle'),
    option: t('Service.createOptionTitle'),
    'option-group': t('Service.createOptionGroupTitle'),
    ticket: t('Service.createTicketTitle'),
  };

  const isValid = serviceId && VALID_TYPES.includes(typeParam);

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

      {!isValid ? (
        <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-red-200 text-center">
          <p className="text-red-600 mb-4">{t('Service.invalidType')}</p>
          <button
            type="button"
            className="px-6 py-2 rounded-lg bg-[#02542D] text-white hover:bg-opacity-80 transition"
            onClick={handleBack}
          >
            {t('Service.returnDetail')}
          </button>
        </div>
      ) : (
        <>
          <div className="max-w-5xl mx-auto mb-6">
            <h1 className="text-2xl font-semibold text-[#02542D]">
              {titleMap[typeParam]}
            </h1>
          </div>
          {typeParam === 'combo' && (
            <ComboForm
              serviceId={serviceId}
              onSuccess={handleSuccess}
              onCancel={handleBack}
              t={t}
              show={show}
            />
          )}
          {typeParam === 'option' && (
            <OptionForm
              serviceId={serviceId}
              onSuccess={handleSuccess}
              onCancel={handleBack}
              t={t}
              show={show}
            />
          )}
          {typeParam === 'option-group' && (
            <OptionGroupForm
              serviceId={serviceId}
              onSuccess={handleSuccess}
              onCancel={handleBack}
              t={t}
              show={show}
            />
          )}
          {typeParam === 'ticket' && (
            <TicketForm
              serviceId={serviceId}
              onSuccess={handleSuccess}
              onCancel={handleBack}
              t={t}
              show={show}
            />
          )}
        </>
      )}
    </div>
  );
}

