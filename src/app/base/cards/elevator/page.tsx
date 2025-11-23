'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  CardRegistration,
  CardRegistrationFilter,
} from '@/src/types/cardRegistration';
import {
  decideElevatorCardRegistration,
  fetchElevatorCardRegistration,
  fetchElevatorCardRegistrations,
} from '@/src/services/card';

export default function ElevatorCardAdminPage() {
  const t = useTranslations('ElevatorCards');
  
  const statusOptions = [
    { value: '', label: t('filters.allStatuses') },
    { value: 'READY_FOR_PAYMENT', label: t('statuses.readyForPayment') },
    { value: 'PAYMENT_PENDING', label: t('statuses.paymentPending') },
    { value: 'PENDING', label: t('statuses.pending') },
    { value: 'APPROVED', label: t('statuses.approved') },
    { value: 'COMPLETED', label: t('statuses.completed') },
    { value: 'REJECTED', label: t('statuses.rejected') },
  ];

  const paymentStatusOptions = [
    { value: '', label: t('filters.allPayments') },
    { value: 'UNPAID', label: t('paymentStatuses.unpaid') },
    { value: 'PAYMENT_PENDING', label: t('paymentStatuses.paymentPending') },
    { value: 'PAID', label: t('paymentStatuses.paid') },
  ];
  const [registrations, setRegistrations] = useState<CardRegistration[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<CardRegistration | null>(null);
  const [filters, setFilters] = useState<CardRegistrationFilter>({});
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadRegistrations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchElevatorCardRegistrations(filters);
      setRegistrations(data);
    } catch (err) {
      console.error('Failed to load elevator card registrations', err);
      setError(t('errors.loadError'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadDetail = useCallback(
    async (id: string) => {
      setLoadingDetail(true);
      setDetailError(null);
      try {
        const data = await fetchElevatorCardRegistration(id);
        setSelected(data);
        setNote(data.adminNote ?? '');
      } catch (err) {
        console.error('Failed to load elevator card registration detail', err);
        setDetailError(t('errors.loadDetailError'));
      } finally {
        setLoadingDetail(false);
      }
    },
    []
  );

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  useEffect(() => {
    if (selectedId) {
      void loadDetail(selectedId);
    } else {
      setSelected(null);
      setNote('');
      setDetailError(null);
    }
  }, [selectedId, loadDetail]);

  const handleFilterChange = (field: keyof CardRegistrationFilter, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value || undefined,
    }));
  };

  const handleRefresh = () => {
    void loadRegistrations();
    if (selectedId) {
      void loadDetail(selectedId);
    }
  };

  const canDecide = useMemo(() => {
    if (!selected) return false;
    const canApproveStatus = selected.status === 'PENDING' || selected.status === 'READY_FOR_PAYMENT';
    return canApproveStatus && selected.paymentStatus === 'PAID';
  }, [selected]);

  const handleDecision = async (decision: 'APPROVE' | 'REJECT') => {
    if (!selectedId) return;

    if (decision === 'REJECT' && !note.trim()) {
      alert(t('errors.rejectReasonRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const updated = await decideElevatorCardRegistration(selectedId, {
        decision,
        note: note.trim() || undefined,
      });
      setSelected(updated);
      await loadRegistrations();
      alert(
        decision === 'APPROVE'
          ? t('messages.approveSuccess')
          : t('messages.rejectSuccess')
      );
    } catch (err: unknown) {
      console.error('Failed to submit decision', err);
      if (err instanceof Error && err.message) {
        alert(err.message);
      } else {
        alert(t('errors.actionFailed'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#02542D]">
          {t('title')}
        </h1>
        <button
          type="button"
          onClick={handleRefresh}
          className="px-4 py-2 bg-[#02542D] text-white rounded-md hover:bg-[#024428] transition-colors"
        >
          {t('actions.refresh')}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex flex-col gap-4 md:flex-row md:items-end mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('filters.registrationStatus')}
              </label>
              <select
                value={filters.status ?? ''}
                onChange={event =>
                  handleFilterChange('status', event.target.value)
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6B9B6E]"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('filters.paymentStatus')}
              </label>
              <select
                value={filters.paymentStatus ?? ''}
                onChange={event =>
                  handleFilterChange('paymentStatus', event.target.value)
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6B9B6E]"
              >
                {paymentStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#02542D]" />
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-12">{error}</div>
          ) : registrations.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              {t('empty')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t('table.resident')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t('table.apartment')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t('table.building')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t('table.createdDate')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t('table.status')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t('table.payment')}
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                      {t('table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-sm">
                  {registrations.map(item => (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50 ${
                        selectedId === item.id ? 'bg-gray-100' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {item.fullName ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {item.apartmentNumber ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {item.buildingName ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleString()
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {item.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedId(prev =>
                              prev === item.id ? null : item.id
                            )
                          }
                          className="text-[#02542D] hover:text-[#01391d] font-medium"
                        >
                          {selectedId === item.id ? t('actions.close') : t('actions.viewDetails')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 h-max">
          {selectedId == null ? (
            <p className="text-gray-500">
              {t('selectRegistration')}
            </p>
          ) : loadingDetail ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#02542D]" />
            </div>
          ) : detailError ? (
            <p className="text-red-600">{detailError}</p>
          ) : !selected ? (
            <p className="text-gray-500">{t('notFound')}</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-[#02542D]">
                  {t('detail.title')}
                </h2>
                <p className="text-sm text-gray-500">
                  {t('detail.registrationId')}: {selected.id}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm">
                <DetailRow label={t('detail.fullName')} value={selected.fullName} />
                <DetailRow
                  label={t('detail.apartment')}
                  value={selected.apartmentNumber}
                />
                <DetailRow
                  label={t('detail.building')}
                  value={selected.buildingName}
                />
                <DetailRow label={t('detail.citizenId')} value={selected.citizenId} />
                <DetailRow label={t('detail.phoneNumber')} value={selected.phoneNumber} />
                <DetailRow
                  label={t('detail.requestType')}
                  value={selected.requestType}
                />
                <DetailRow label={t('detail.note')} value={selected.note} />
                <DetailRow label={t('detail.status')} value={selected.status} />
                <DetailRow
                  label={t('detail.paymentStatus')}
                  value={selected.paymentStatus}
                />
                <DetailRow
                  label={t('detail.paymentAmount')}
                  value={
                    selected.paymentAmount != null
                      ? `${selected.paymentAmount.toLocaleString()} VND`
                      : '—'
                  }
                />
                <DetailRow
                  label={t('detail.paymentDate')}
                  value={
                    selected.paymentDate
                      ? new Date(selected.paymentDate).toLocaleString()
                      : '—'
                  }
                />
                <DetailRow
                  label={t('detail.createdDate')}
                  value={
                    selected.createdAt
                      ? new Date(selected.createdAt).toLocaleString()
                      : '—'
                  }
                />
                <DetailRow
                  label={t('detail.updatedDate')}
                  value={
                    selected.updatedAt
                      ? new Date(selected.updatedAt).toLocaleString()
                      : '—'
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('detail.adminNote')}
                </label>
                <textarea
                  value={note}
                  onChange={event => setNote(event.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6B9B6E]"
                  placeholder={t('detail.adminNotePlaceholder')}
                  disabled={submitting}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleDecision('APPROVE')}
                  disabled={!canDecide || submitting}
                  className={`flex-1 px-4 py-2 rounded-md text-white transition-colors ${
                    canDecide && !submitting
                      ? 'bg-[#02542D] hover:bg-[#024428]'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {t('actions.approve')}
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision('REJECT')}
                  disabled={!canDecide || submitting}
                  className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                    canDecide && !submitting
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {t('actions.reject')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div>
      <p className="text-gray-500 text-xs uppercase tracking-wide">{label}</p>
      <p className="text-gray-900 font-medium">
        {value !== null && value !== undefined && value !== ''
          ? value
          : '—'}
      </p>
    </div>
  );
}









