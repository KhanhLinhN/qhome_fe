'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  decideHouseholdMemberRequest,
  fetchPendingHouseholdMemberRequests,
  HouseholdMemberRequest,
} from '@/src/services/base/householdMemberRequestService';
import { fetchResidentByIdForAdmin } from '@/src/services/base/residentService';
import PopupConfirm from '@/src/components/common/PopupComfirm';

const formatDate = (value?: string | null) => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('vi-VN');
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('vi-VN');
};

export default function HouseholdMemberRequestsPage() {
  const [requests, setRequests] = useState<HouseholdMemberRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionState, setActionState] = useState<Record<string, boolean>>({});
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [requesterDetails, setRequesterDetails] = useState<Record<string, { email?: string | null; phone?: string | null }>>({});
  const [imagePopup, setImagePopup] = useState<{ isOpen: boolean; imageUrl: string | null }>({
    isOpen: false,
    imageUrl: null,
  });
  const [confirmPopup, setConfirmPopup] = useState<{
    isOpen: boolean;
    request: HouseholdMemberRequest | null;
    action: 'approve' | 'reject' | 'rejectSubmit' | null;
  }>({
    isOpen: false,
    request: null,
    action: null,
  });

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPendingHouseholdMemberRequests();
      console.log("CCC",data);
      setRequests(data);
      
      // Lấy danh sách các requestedBy ID duy nhất
      const uniqueRequestedByIds = Array.from(
        new Set(data.map((req) => req.requestedBy).filter((id): id is string => id !== null))
      );
      
      // Gọi API để lấy thông tin email và số điện thoại cho từng người gửi yêu cầu
      const detailsMap: Record<string, { email?: string | null; phone?: string | null }> = {};
      await Promise.all(
        uniqueRequestedByIds.map(async (requestedById) => {
          try {
            const resident = await fetchResidentByIdForAdmin(requestedById);
            detailsMap[requestedById] = {
              email: resident.email || null,
              phone: resident.phone || null,
            };
          } catch (err) {
            console.error(`Failed to fetch resident ${requestedById}:`, err);
            detailsMap[requestedById] = {
              email: null,
              phone: null,
            };
          }
        })
      );
      
      setRequesterDetails(detailsMap);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Không thể tải danh sách yêu cầu.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const hasRequests = useMemo(() => requests.length > 0, [requests]);

  const handleApproveClick = (request: HouseholdMemberRequest) => {
    setConfirmPopup({
      isOpen: true,
      request,
      action: 'approve',
    });
  };

  const handleApprove = async (id: string) => {
    setError(null);
    setSuccess(null);
    setActionState((prev) => ({ ...prev, [id]: true }));
    try {
      await decideHouseholdMemberRequest(id, { approve: true });
      setRequests((prev) => prev.filter((item) => item.id !== id));
      setSuccess('Đã chấp nhận yêu cầu và thêm thành viên vào hộ gia đình.');
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Không thể duyệt yêu cầu. Vui lòng thử lại.';
      setError(message);
    } finally {
      setActionState((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const openRejectForm = (request: HouseholdMemberRequest) => {
    setConfirmPopup({
      isOpen: true,
      request,
      action: 'reject',
    });
  };

  const confirmOpenRejectForm = () => {
    if (confirmPopup.request) {
      setRejectingId(confirmPopup.request.id);
      setRejectionReason('');
      setSuccess(null);
      setError(null);
      setConfirmPopup({ isOpen: false, request: null, action: null });
    }
  };

  const cancelReject = () => {
    setRejectingId(null);
    setRejectionReason('');
  };

  const handleRejectSubmitClick = (request: HouseholdMemberRequest) => {
    const reason = rejectionReason.trim();
    if (!reason) {
      setError('Vui lòng nhập lý do từ chối.');
      return;
    }

    setConfirmPopup({
      isOpen: true,
      request,
      action: 'rejectSubmit',
    });
  };

  const handleRejectSubmit = async (id: string) => {
    const reason = rejectionReason.trim();
    if (!reason) {
      setError('Vui lòng nhập lý do từ chối.');
      return;
    }

    setError(null);
    setSuccess(null);
    setActionState((prev) => ({ ...prev, [id]: true }));
    try {
      await decideHouseholdMemberRequest(id, { approve: false, rejectionReason: reason });
      setRequests((prev) => prev.filter((item) => item.id !== id));
      setSuccess('Đã từ chối yêu cầu thành công.');
      cancelReject();
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Không thể từ chối yêu cầu. Vui lòng thử lại.';
      setError(message);
    } finally {
      setActionState((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmPopup.request || !confirmPopup.action) return;

    const request = confirmPopup.request;
    setConfirmPopup({ isOpen: false, request: null, action: null });

    if (confirmPopup.action === 'approve') {
      await handleApprove(request.id);
    } else if (confirmPopup.action === 'reject') {
      confirmOpenRejectForm();
    } else if (confirmPopup.action === 'rejectSubmit') {
      await handleRejectSubmit(request.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#02542D]">
          Duyệt thành viên gia đình
        </h1>
        <button
          type="button"
          onClick={() => void loadRequests()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          ⟳ Làm mới
        </button>
      </div>

      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 p-12 text-sm text-slate-500">
          Đang tải danh sách yêu cầu...
        </div>
      ) : !hasRequests ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Hiện chưa có yêu cầu nào đang chờ duyệt.
        </div>
      ) : (
        <div className="space-y-5">
          {requests.map((request) => {
            const isProcessing = actionState[request.id];
            const showRejectForm = rejectingId === request.id;
            return (
              <div key={request.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Hộ gia đình
                    </p>
                    <p className="text-sm text-slate-700">
                      {request.householdCode ? `Hộ ${request.householdCode}` : 'Chưa có mã hộ'}
                    </p>
                    <p className="text-sm text-slate-500">Căn hộ: {request.unitCode ?? request.unitId}</p>
                    <p className="text-sm text-slate-500">
                      Quan hệ: {request.relation ? request.relation : 'Chưa xác định'}
                    </p>
                    {request.note && (
                      <p className="text-sm text-slate-500">Ghi chú: {request.note}</p>
                    )}
                    <p className="text-xs text-slate-400">
                      Gửi lúc: {formatDateTime(request.createdAt)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Thông tin người được thêm
                    </p>
                    <p className="text-sm text-slate-700">
                      {request.requestedResidentFullName || 'Không có họ tên'}
                    </p>
                    <p className="text-sm text-slate-500">
                      Email: {request.requestedResidentEmail || '—'}
                    </p>
                    <p className="text-sm text-slate-500">
                      Điện thoại: {request.requestedResidentPhone || '—'}
                    </p>
                    <p className="text-sm text-slate-500">
                      CCCD: {request.requestedResidentNationalId || '—'}
                    </p>
                    <p className="text-sm text-slate-500">
                      Ngày sinh: {formatDate(request.requestedResidentDob)}
                    </p>
                    {request.proofOfRelationImageUrl && (
                      <button
                        type="button"
                        onClick={() => setImagePopup({ isOpen: true, imageUrl: request.proofOfRelationImageUrl || null })}
                        className="inline-flex text-sm text-green-600 hover:text-green-700 hover:underline"
                      >
                        Xem minh chứng quan hệ
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Người gửi yêu cầu
                    </p>
                    <p className="text-sm text-slate-700">{request.requestedByName || 'Không rõ'}</p>
                    <p className="text-sm text-slate-500">
                      Email: {request.requestedBy ? (requesterDetails[request.requestedBy]?.email || '—') : '—'}
                    </p>
                    <p className="text-sm text-slate-500">
                      Điện thoại: {request.requestedBy ? (requesterDetails[request.requestedBy]?.phone || '—') : '—'}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleApproveClick(request)}
                        disabled={isProcessing}
                        className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400"
                      >
                        {isProcessing ? 'Đang xử lý...' : 'Chấp nhận'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openRejectForm(request)}
                        disabled={isProcessing}
                        className="inline-flex items-center justify-center rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-red-200 disabled:text-red-300"
                      >
                        Từ chối
                      </button>
                    </div>
                  </div>
                </div>

                {showRejectForm && (
                  <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-medium text-red-700">
                      Nhập lý do từ chối yêu cầu này
                    </p>
                    <textarea
                      className="mt-2 w-full rounded-lg border border-red-200 bg-white p-2 text-sm text-slate-700 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200"
                      rows={3}
                      value={rejectionReason}
                      onChange={(event) => setRejectionReason(event.target.value)}
                      placeholder="Ví dụ: Thông tin cung cấp chưa chính xác hoặc thiếu giấy tờ."
                    />
                    <div className="mt-3 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleRejectSubmitClick(request)}
                        disabled={isProcessing}
                        className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400"
                      >
                        Xác nhận từ chối
                      </button>
                      <button
                        type="button"
                        onClick={cancelReject}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Popup */}
      {confirmPopup.isOpen && confirmPopup.request && confirmPopup.action && (
        <PopupConfirm
          isOpen={confirmPopup.isOpen}
          onClose={() => setConfirmPopup({ isOpen: false, request: null, action: null })}
          onConfirm={handleConfirmAction}
          popupTitle={
            confirmPopup.action === 'approve'
              ? 'Xác nhận chấp nhận'
              : confirmPopup.action === 'reject'
              ? 'Xác nhận từ chối'
              : 'Xác nhận từ chối yêu cầu'
          }
          popupContext={
            confirmPopup.action === 'approve'
              ? `Bạn có chắc chắn muốn chấp nhận yêu cầu thêm thành viên ${confirmPopup.request.requestedResidentFullName || 'này'} vào hộ gia đình không?`
              : confirmPopup.action === 'reject'
              ? `Bạn có chắc chắn muốn từ chối yêu cầu này không? Sau khi xác nhận, bạn sẽ cần nhập lý do từ chối.`
              : `Bạn có chắc chắn muốn từ chối yêu cầu thêm thành viên ${confirmPopup.request.requestedResidentFullName || 'này'} vào hộ gia đình không?`
          }
          isDanger={confirmPopup.action !== 'approve'}
        />
      )}

      {/* Image Popup */}
      {imagePopup.isOpen && imagePopup.imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#E7E4E8CC]/70"
          onClick={() => setImagePopup({ isOpen: false, imageUrl: null })}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <button
              type="button"
              onClick={() => setImagePopup({ isOpen: false, imageUrl: null })}
              className="absolute top-2 right-2 z-10 rounded-full bg-white p-2 text-gray-700 shadow-lg hover:bg-gray-100 transition-colors"
              aria-label="Đóng"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={imagePopup.imageUrl}
              alt="Minh chứng quan hệ"
              className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

