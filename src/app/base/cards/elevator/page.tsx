'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CardRegistration,
  CardRegistrationFilter,
} from '@/src/types/cardRegistration';
import {
  decideElevatorCardRegistration,
  fetchElevatorCardRegistration,
  fetchElevatorCardRegistrations,
} from '@/src/services/card';

const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'READY_FOR_PAYMENT', label: 'Chờ thanh toán' },
  { value: 'PAYMENT_PENDING', label: 'Đang thanh toán' },
  { value: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
  { value: 'COMPLETED', label: 'Đã hoàn tất' },
  { value: 'REJECTED', label: 'Đã từ chối' },
];

const paymentStatusOptions = [
  { value: '', label: 'Tất cả thanh toán' },
  { value: 'UNPAID', label: 'Chưa thanh toán' },
  { value: 'PAYMENT_PENDING', label: 'Đang thanh toán' },
  { value: 'PAID', label: 'Đã thanh toán' },
];

export default function ElevatorCardAdminPage() {
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
      setError('Không thể tải danh sách đăng ký thang máy. Vui lòng thử lại.');
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
        setDetailError('Không thể tải chi tiết đăng ký. Vui lòng thử lại.');
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
    return (
      selected.status === 'PENDING_APPROVAL' &&
      selected.paymentStatus === 'PAID'
    );
  }, [selected]);

  const handleDecision = async (decision: 'APPROVE' | 'REJECT') => {
    if (!selectedId) return;

    if (decision === 'REJECT' && !note.trim()) {
      alert('Vui lòng nhập lý do từ chối.');
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
          ? 'Đã duyệt đăng ký thẻ thang máy.'
          : 'Đã từ chối đăng ký thẻ thang máy.'
      );
    } catch (err: unknown) {
      console.error('Failed to submit decision', err);
      if (err instanceof Error && err.message) {
        alert(err.message);
      } else {
        alert('Không thể thực hiện hành động. Vui lòng thử lại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#02542D]">
          Quản lý đăng ký thẻ thang máy
        </h1>
        <button
          type="button"
          onClick={handleRefresh}
          className="px-4 py-2 bg-[#02542D] text-white rounded-md hover:bg-[#024428] transition-colors"
        >
          Làm mới
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex flex-col gap-4 md:flex-row md:items-end mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái đăng ký
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
                Trạng thái thanh toán
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
              Không có đăng ký nào phù hợp.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Cư dân
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Căn hộ
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Tòa nhà
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Thanh toán
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                      Thao tác
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
                          {selectedId === item.id ? 'Đóng' : 'Xem chi tiết'}
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
              Chọn một đăng ký để xem chi tiết và duyệt.
            </p>
          ) : loadingDetail ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#02542D]" />
            </div>
          ) : detailError ? (
            <p className="text-red-600">{detailError}</p>
          ) : !selected ? (
            <p className="text-gray-500">Không tìm thấy dữ liệu đăng ký.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-[#02542D]">
                  Chi tiết đăng ký
                </h2>
                <p className="text-sm text-gray-500">
                  Mã đăng ký: {selected.id}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm">
                <DetailRow label="Họ tên cư dân" value={selected.fullName} />
                <DetailRow
                  label="Căn hộ"
                  value={selected.apartmentNumber}
                />
                <DetailRow
                  label="Tòa nhà"
                  value={selected.buildingName}
                />
                <DetailRow label="Số CCCD" value={selected.citizenId} />
                <DetailRow label="Số điện thoại" value={selected.phoneNumber} />
                <DetailRow
                  label="Loại yêu cầu"
                  value={selected.requestType}
                />
                <DetailRow label="Ghi chú" value={selected.note} />
                <DetailRow label="Trạng thái" value={selected.status} />
                <DetailRow
                  label="Trạng thái thanh toán"
                  value={selected.paymentStatus}
                />
                <DetailRow
                  label="Số tiền"
                  value={
                    selected.paymentAmount != null
                      ? `${selected.paymentAmount.toLocaleString()} VND`
                      : '—'
                  }
                />
                <DetailRow
                  label="Ngày thanh toán"
                  value={
                    selected.paymentDate
                      ? new Date(selected.paymentDate).toLocaleString()
                      : '—'
                  }
                />
                <DetailRow
                  label="Ngày tạo"
                  value={
                    selected.createdAt
                      ? new Date(selected.createdAt).toLocaleString()
                      : '—'
                  }
                />
                <DetailRow
                  label="Ngày cập nhật"
                  value={
                    selected.updatedAt
                      ? new Date(selected.updatedAt).toLocaleString()
                      : '—'
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú quản trị viên
                </label>
                <textarea
                  value={note}
                  onChange={event => setNote(event.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6B9B6E]"
                  placeholder="Nhập ghi chú hoặc lý do từ chối..."
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
                  Duyệt
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
                  Từ chối
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









