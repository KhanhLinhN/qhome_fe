import { useMemo, useState } from 'react';
import DetailField from '@/src/components/base-service/DetailField';
import {
  ActiveStatusSelect,
  BaseFormProps,
  BooleanOption,
  FormActions,
} from '@/src/components/base-service/ServiceFormControls';
import Select from '@/src/components/customer-interaction/Select';
import { createServiceTicket } from '@/src/services/asset-maintenance/serviceService';
import { CreateServiceTicketPayload, ServiceTicketType } from '@/src/types/service';

function TicketForm({ serviceId, onSuccess, onCancel, t, show }: BaseFormProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    ticketType: ServiceTicketType.DAY,
    durationHours: '',
    price: '',
    maxPeople: '',
    description: '',
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

export default TicketForm;


