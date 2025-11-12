import { useMemo, useState } from 'react';
import DetailField from '@/src/components/base-service/DetailField';
import {
  ActiveStatusSelect,
  BaseFormProps,
  BooleanOption,
  FormActions,
} from '@/src/components/base-service/ServiceFormControls';
import { createServiceCombo } from '@/src/services/asset-maintenance/serviceService';
import { CreateServiceComboPayload, ServiceComboItemPayload } from '@/src/types/service';

interface ComboItemFormState {
  id: string;
  code: string;
  name: string;
  price: string;
  durationMinutes: string;
  quantity: string;
  note: string;
}

type ComboItemField = 'code' | 'name' | 'price' | 'durationMinutes' | 'quantity' | 'note';

type ComboItemErrorState = Partial<Record<ComboItemField, string>>;

const createEmptyItem = (): ComboItemFormState => ({
  id:
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `combo-item-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  code: '',
  name: '',
  price: '',
  durationMinutes: '',
  quantity: '1',
  note: '',
});

function ComboForm({ serviceId, onSuccess, onCancel, t, show }: BaseFormProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    servicesIncluded: '',
    durationMinutes: '',
    price: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [comboItems, setComboItems] = useState<ComboItemFormState[]>([]);
  const [itemErrors, setItemErrors] = useState<Record<string, ComboItemErrorState>>({});
  const [generalItemsError, setGeneralItemsError] = useState<string | null>(null);

  const statusOptions = useMemo<BooleanOption[]>(
    () => [
      { value: true, label: t('Service.active') },
      { value: false, label: t('Service.inactive') },
    ],
    [t],
  );

  const resetItemError = (id: string, field?: ComboItemField) => {
    setItemErrors((prev) => {
      if (!prev[id]) {
        return prev;
      }
      if (!field) {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      }

      const fieldErrors = { ...prev[id] };
      if (!fieldErrors[field]) {
        return prev;
      }
      delete fieldErrors[field];

      if (Object.keys(fieldErrors).length === 0) {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [id]: fieldErrors,
      };
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

  const handleItemFieldChange = (id: string, field: ComboItemField, value: string) => {
    setComboItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
    setGeneralItemsError(null);
    resetItemError(id, field);
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
    setErrors(nextErrors);

    const nextItemErrors: Record<string, ComboItemErrorState> = {};
    let generalError: string | null = null;

    if (comboItems.length === 0) {
      generalError = t('Service.validation.comboItems');
    } else {
      comboItems.forEach((item) => {
        const fieldErrors: ComboItemErrorState = {};

        if (!item.code.trim()) {
          fieldErrors.code = t('Service.validation.comboItemCode');
        }

        if (!item.name.trim()) {
          fieldErrors.name = t('Service.validation.comboItemName');
        }

        const priceValue = Number(item.price);
        if (!item.price.trim() || Number.isNaN(priceValue) || priceValue < 0) {
          fieldErrors.price = t('Service.validation.comboItemPrice');
        }

        if (item.durationMinutes.trim()) {
          const durationValue = Number(item.durationMinutes);
          if (Number.isNaN(durationValue) || durationValue < 0) {
            fieldErrors.durationMinutes = t('Service.validation.nonNegative');
          }
        }

        const quantityValue = Number(item.quantity);
        if (!item.quantity.trim() || Number.isNaN(quantityValue) || quantityValue <= 0) {
          fieldErrors.quantity = t('Service.validation.comboItemQuantity');
        }

        if (Object.keys(fieldErrors).length > 0) {
          nextItemErrors[item.id] = fieldErrors;
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
        const priceValue = Number(item.price);
        const durationValue = item.durationMinutes.trim()
          ? Number(item.durationMinutes)
          : null;
        const payload: ServiceComboItemPayload = {
          itemName: item.code.trim(),
          itemDescription: item.name.trim() || undefined,
          itemPrice: Number.isNaN(priceValue) || priceValue < 0 ? 0 : priceValue,
          itemDurationMinutes:
            durationValue !== null && Number.isNaN(durationValue) ? null : durationValue,
          quantity: Number.isNaN(quantityValue) || quantityValue <= 0 ? 1 : quantityValue,
          note: item.note.trim() || undefined,
          sortOrder: index + 1,
        };
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
          {generalItemsError && <p className="text-sm text-red-500">{generalItemsError}</p>}
          {comboItems.length === 0 ? (
            <p className="text-sm text-gray-500">{t('Service.comboItemNoItems')}</p>
          ) : (
            <div className="space-y-4">
              {comboItems.map((item, index) => {
                const errorsForItem = itemErrors[item.id] ?? {};
                return (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
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
                        {t('Service.comboItemCode')}
                      </label>
                      <input
                        className="h-10 rounded-md border border-gray-300 px-3 py-2 text-sm text-[#02542D] focus:outline-none focus:ring-2 focus:ring-[#02542D]/30"
                        value={item.code}
                        onChange={(event) => handleItemFieldChange(item.id, 'code', event.target.value)}
                      />
                      {errorsForItem.code && (
                        <span className="text-sm text-red-500">{errorsForItem.code}</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 text-sm">
                      <label className="font-medium text-[#02542D]">
                        {t('Service.comboName')}
                      </label>
                      <input
                        className="h-10 rounded-md border border-gray-300 px-3 py-2 text-sm text-[#02542D] focus:outline-none focus:ring-2 focus:ring-[#02542D]/30"
                        value={item.name}
                        onChange={(event) => handleItemFieldChange(item.id, 'name', event.target.value)}
                      />
                      {errorsForItem.name && (
                        <span className="text-sm text-red-500">{errorsForItem.name}</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 text-sm">
                      <label className="font-medium text-[#02542D]">
                        {t('Service.comboItemPrice')}
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.price}
                        onChange={(event) =>
                          handleItemFieldChange(item.id, 'price', event.target.value)
                        }
                        className="h-10 rounded-md border border-gray-300 px-3 py-2 text-sm text-[#02542D] focus:outline-none focus:ring-2 focus:ring-[#02542D]/30"
                      />
                      {errorsForItem.price && (
                        <span className="text-sm text-red-500">{errorsForItem.price}</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 text-sm">
                      <label className="font-medium text-[#02542D]">
                        {t('Service.comboItemDuration')}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={item.durationMinutes}
                        onChange={(event) =>
                          handleItemFieldChange(item.id, 'durationMinutes', event.target.value)
                        }
                        className="h-10 rounded-md border border-gray-300 px-3 py-2 text-sm text-[#02542D] focus:outline-none focus:ring-2 focus:ring-[#02542D]/30"
                      />
                      {errorsForItem.durationMinutes && (
                        <span className="text-sm text-red-500">
                          {errorsForItem.durationMinutes}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 text-sm">
                      <label className="font-medium text-[#02542D]">
                        {t('Service.comboItemQuantity')}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(event) =>
                          handleItemFieldChange(item.id, 'quantity', event.target.value)
                        }
                        className="h-10 rounded-md border border-gray-300 px-3 py-2 text-sm text-[#02542D] focus:outline-none focus:ring-2 focus:ring-[#02542D]/30"
                      />
                      {errorsForItem.quantity && (
                        <span className="text-sm text-red-500">{errorsForItem.quantity}</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 text-sm md:col-span-2">
                      <label className="font-medium text-[#02542D]">
                        {t('Service.comboItemNote')}
                      </label>
                      <textarea
                        rows={2}
                        value={item.note}
                        onChange={(event) =>
                          handleItemFieldChange(item.id, 'note', event.target.value)
                        }
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm text-[#02542D] focus:outline-none focus:ring-2 focus:ring-[#02542D]/30"
                      />
                    </div>
                  </div>
                </div>
              );
              })}
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

export default ComboForm;


