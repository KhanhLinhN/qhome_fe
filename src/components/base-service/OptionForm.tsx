import { useMemo, useState } from 'react';
import DetailField from '@/src/components/base-service/DetailField';
import {
  ActiveStatusSelect,
  BaseFormProps,
  BooleanOption,
  FormActions,
  RequiredSelect,
} from '@/src/components/base-service/ServiceFormControls';
import { createServiceOption } from '@/src/services/asset-maintenance/serviceService';
import { CreateServiceOptionPayload } from '@/src/types/service';

function OptionForm({ serviceId, onSuccess, onCancel, t, show }: BaseFormProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    price: '',
    unit: '',
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

export default OptionForm;


