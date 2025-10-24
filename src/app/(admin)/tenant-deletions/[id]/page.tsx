"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getDeletionRequest,
  getDeletionTargetsStatus,
  approveDeletionRequest,
  rejectDeletionRequest,
  completeDeletion,
  type TenantDeletionRequest,
  type TenantDeletionTargetsStatus,
  TenantDeletionStatus,
} from '@/src/services/base';

export default function DeletionRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [request, setRequest] = useState<TenantDeletionRequest | null>(null);
  const [targetsStatus, setTargetsStatus] = useState<TenantDeletionTargetsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [requestId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqData, statusData] = await Promise.all([
        getDeletionRequest(requestId),
        getDeletionTargetsStatus(requestId),
      ]);
      setRequest(reqData);
      setTargetsStatus(statusData);
    } catch (error) {
      console.error('Failed to load request:', error);
      alert('❌ Không thể tải thông tin yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleApprove = async (note: string) => {
    try {
      await approveDeletionRequest(requestId, { note });
      alert('✅ Đã phê duyệt yêu cầu xóa tenant!');
      setShowApproveModal(false);
      await loadData();
    } catch (error: any) {
      console.error('Failed to approve:', error);
      alert(`❌ Lỗi: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleReject = async (note: string) => {
    try {
      await rejectDeletionRequest(requestId, { note });
      alert('✅ Đã từ chối yêu cầu xóa tenant!');
      setShowRejectModal(false);
      await loadData();
    } catch (error: any) {
      console.error('Failed to reject:', error);
      alert(`❌ Lỗi: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleComplete = async () => {
    try {
      await completeDeletion(requestId);
      alert('✅ Đã hoàn thành xóa tenant!');
      setShowCompleteModal(false);
      await loadData();
    } catch (error: any) {
      console.error('Failed to complete:', error);
      alert(`❌ Lỗi: ${error.response?.data?.message || error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="lg:col-span-1 space-y-6">
        <div className="max-w-screen overflow-x-hidden bg-[#F5F7FA] min-h-screen">
          <div className="px-[41px] py-12 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-2 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="lg:col-span-1 space-y-6">
        <div className="max-w-screen overflow-x-hidden bg-[#F5F7FA] min-h-screen">
          <div className="px-[41px] py-12 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-600 mb-4">❌ Không tìm thấy yêu cầu</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: TenantDeletionStatus) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      APPROVED: 'bg-green-100 text-green-800 border-green-200',
      COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200',
      CANCELED: 'bg-slate-100 text-slate-600 border-slate-200',
    };
    return colors[status] || colors.CANCELED;
  };

  const buildingsProgress = targetsStatus 
    ? (targetsStatus.buildingsArchived / Math.max(targetsStatus.totalBuildings, 1)) * 100
    : 0;
  const unitsProgress = targetsStatus
    ? (targetsStatus.unitsInactive / Math.max(targetsStatus.totalUnits, 1)) * 100
    : 0;

  return (
    <div className="lg:col-span-1 space-y-6">
      <div className="max-w-screen overflow-x-hidden bg-[#F5F7FA] min-h-screen">
      {/* Breadcrumb */}
      <div className="mb-4 text-sm text-slate-600">
          <Link href="/tenant-deletions" className="hover:text-[#02542D]">
          Yêu cầu xóa tenant
        </Link>
        {' '}/{' '}
          <span className="text-[#02542D] font-medium">#{requestId.slice(0, 8)}</span>
      </div>

        {/* Page Title */}
        <h1 className="text-2xl font-semibold text-[#02542D] mb-4">
          Chi tiết yêu cầu xóa Tenant
        </h1>

      {/* Header Card */}
        <div className={`bg-white rounded-xl p-6 mb-6 border-2 ${getStatusColor(request.status)}`}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              Yêu cầu Xóa Tenant #{requestId.slice(0, 8)}
            </h2>
            <div className="space-y-1 text-sm">
              <div><span className="font-medium">Tenant ID:</span> <code className="bg-white/50 px-2 py-1 rounded">{request.tenantId}</code></div>
              <div><span className="font-medium">Người yêu cầu:</span> {request.requestedBy}</div>
              <div><span className="font-medium">Ngày tạo:</span> {new Date(request.createdAt).toLocaleString('vi-VN')}</div>
              {request.approvedBy && (
                <div><span className="font-medium">Người phê duyệt:</span> {request.approvedBy}</div>
              )}
              {request.approvedAt && (
                <div><span className="font-medium">Ngày phê duyệt:</span> {new Date(request.approvedAt).toLocaleString('vi-VN')}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-4 py-2 rounded-lg font-bold text-lg border-2 ${getStatusColor(request.status)}`}>
              {request.status}
            </span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-white/50 rounded-lg">
          <div className="font-medium text-sm mb-1">Lý do:</div>
          <div className="text-sm">{request.reason}</div>
        </div>
        
        {request.note && (
          <div className="mt-2 p-3 bg-white/50 rounded-lg">
            <div className="font-medium text-sm mb-1">Ghi chú:</div>
            <div className="text-sm">{request.note}</div>
          </div>
        )}
      </div>

      {/* Timeline */}
        <div className="bg-white rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">📊 Tiến trình</h2>
        <div className="flex items-center justify-between">
          {[
            { label: 'Tạo yêu cầu', status: 'PENDING', active: true },
            { label: 'Chờ duyệt', status: 'PENDING', active: request.status !== 'REJECTED' && request.status !== 'CANCELED' },
            { label: 'Đã duyệt', status: 'APPROVED', active: request.status === 'APPROVED' || request.status === 'COMPLETED' },
            { label: 'Hoàn thành', status: 'COMPLETED', active: request.status === 'COMPLETED' },
          ].map((step, idx) => (
            <div key={idx} className="flex-1 flex items-center">
              <div className="flex flex-col items-center">
                <div                 className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${
                  step.active 
                    ? 'bg-[#02542D] text-white border-[#02542D]' 
                    : 'bg-slate-100 text-slate-400 border-slate-300'
                }`}>
                  {step.active ? '✓' : idx + 1}
                </div>
                <div className={`mt-2 text-xs font-medium ${step.active ? 'text-[#02542D]' : 'text-slate-400'}`}>
                  {step.label}
                </div>
              </div>
              {idx < 3 && (
                <div className={`flex-1 h-0.5 ${step.active ? 'bg-[#02542D]' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Targets Status (Only show if APPROVED) */}
      {request.status === TenantDeletionStatus.APPROVED && targetsStatus && (
          <div className="bg-white rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">🎯 Tiến độ Xóa</h2>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3 py-1.5 text-sm text-[#02542D] border border-[#02542D] rounded-md hover:bg-green-50 transition disabled:opacity-50"
            >
              {refreshing ? '⏳' : '🔄'} Refresh
            </button>
          </div>

          {/* Buildings Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-slate-700 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" id="Building-5-Fill--Streamline-Mingcute-Fill" height="16" width="16">
                  <g fill="none" fillRule="evenodd">
                    <path d="M16 0v16H0V0h16ZM8.395333333333333 15.505333333333333l-0.007333333333333332 0.0013333333333333333 -0.047333333333333324 0.023333333333333334 -0.013333333333333332 0.0026666666666666666 -0.009333333333333332 -0.0026666666666666666 -0.047333333333333324 -0.023333333333333334c-0.006666666666666666 -0.0026666666666666666 -0.012666666666666666 -0.0006666666666666666 -0.016 0.003333333333333333l-0.0026666666666666666 0.006666666666666666 -0.011333333333333334 0.2853333333333333 0.003333333333333333 0.013333333333333332 0.006666666666666666 0.008666666666666666 0.06933333333333333 0.049333333333333326 0.009999999999999998 0.0026666666666666666 0.008 -0.0026666666666666666 0.06933333333333333 -0.049333333333333326 0.008 -0.010666666666666666 0.0026666666666666666 -0.011333333333333334 -0.011333333333333334 -0.2846666666666666c-0.0013333333333333333 -0.006666666666666666 -0.005999999999999999 -0.011333333333333334 -0.011333333333333334 -0.011999999999999999Zm0.17666666666666667 -0.07533333333333334 -0.008666666666666666 0.0013333333333333333 -0.12333333333333332 0.062 -0.006666666666666666 0.006666666666666666 -0.002 0.007333333333333332 0.011999999999999999 0.2866666666666666 0.003333333333333333 0.008 0.005333333333333333 0.004666666666666666 0.134 0.062c0.008 0.0026666666666666666 0.015333333333333332 0 0.019333333333333334 -0.005333333333333333l0.0026666666666666666 -0.009333333333333332 -0.02266666666666667 -0.4093333333333333c-0.002 -0.008 -0.006666666666666666 -0.013333333333333332 -0.013333333333333332 -0.014666666666666665Zm-0.4766666666666666 0.0013333333333333333a0.015333333333333332 0.015333333333333332 0 0 0 -0.018 0.004l-0.004 0.009333333333333332 -0.02266666666666667 0.4093333333333333c0 0.008 0.004666666666666666 0.013333333333333332 0.011333333333333334 0.016l0.009999999999999998 -0.0013333333333333333 0.134 -0.062 0.006666666666666666 -0.005333333333333333 0.0026666666666666666 -0.007333333333333332 0.011333333333333334 -0.2866666666666666 -0.002 -0.008 -0.006666666666666666 -0.006666666666666666 -0.12266666666666666 -0.06133333333333333Z" strokeWidth="0.6667"></path>
                    <path fill="#475569" d="M10 2a1.3333333333333333 1.3333333333333333 0 0 1 1.3333333333333333 1.3333333333333333v2.6666666666666665h1.3333333333333333a1.3333333333333333 1.3333333333333333 0 0 1 1.3333333333333333 1.3333333333333333v5.333333333333333a0.6666666666666666 0.6666666666666666 0 1 1 0 1.3333333333333333H2a0.6666666666666666 0.6666666666666666 0 1 1 0 -1.3333333333333333V6a1.3333333333333333 1.3333333333333333 0 0 1 1.3333333333333333 -1.3333333333333333h1.3333333333333333V3.333333333333333a1.3333333333333333 1.3333333333333333 0 0 1 1.3333333333333333 -1.3333333333333333h4ZM4.666666666666666 6H3.333333333333333v6.666666666666666h1.3333333333333333V6Zm8 1.3333333333333333h-1.3333333333333333v5.333333333333333h1.3333333333333333v-5.333333333333333Zm-4 2.6666666666666665h-1.3333333333333333v1.3333333333333333h1.3333333333333333v-1.3333333333333333Zm0 -2.6666666666666665h-1.3333333333333333v1.3333333333333333h1.3333333333333333v-1.3333333333333333Zm0 -2.6666666666666665h-1.3333333333333333v1.3333333333333333h1.3333333333333333V4.666666666666666Z" strokeWidth="0.6667"></path>
                  </g>
                </svg>
                Buildings
              </div>
              <div className="text-sm text-slate-600">
                {targetsStatus.buildingsArchived} / {targetsStatus.totalBuildings} ARCHIVED
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  buildingsProgress === 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${buildingsProgress}%` }}
              />
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {targetsStatus.buildingsReady ? '✅ Đã sẵn sàng' : '⏳ Đang xử lý...'}
            </div>
          </div>

          {/* Units Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-slate-700">🏠 Units</div>
              <div className="text-sm text-slate-600">
                {targetsStatus.unitsInactive} / {targetsStatus.totalUnits} INACTIVE
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  unitsProgress === 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${unitsProgress}%` }}
              />
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {targetsStatus.unitsReady ? '✅ Đã sẵn sàng' : '⏳ Đang xử lý...'}
            </div>
          </div>

          {/* Employees Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-slate-700">👥 Employees</div>
              <div className="text-sm text-slate-600">
                {targetsStatus.employeesCount} nhân viên còn lại
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  targetsStatus.employeesReady ? 'bg-green-500' : 'bg-amber-500'
                }`}
                style={{ width: targetsStatus.employeesReady ? '100%' : '0%' }}
              />
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {targetsStatus.employeesReady ? '✅ Đã sẵn sàng (0 nhân viên)' : `⏳ Còn ${targetsStatus.employeesCount} nhân viên cần gỡ bỏ`}
            </div>
          </div>

          {/* Overall Status */}
          <div className={`mt-4 p-4 rounded-lg border-2 ${
            targetsStatus.allTargetsReady 
              ? 'bg-green-50 border-green-200' 
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{targetsStatus.allTargetsReady ? '✅' : '⏳'}</span>
              <div>
                <div className="font-medium text-sm">
                  {targetsStatus.allTargetsReady 
                    ? 'Sẵn sàng hoàn thành!' 
                    : 'Đang chờ xóa buildings, units & employees...'}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {targetsStatus.allTargetsReady
                    ? 'Tất cả buildings, units và employees đã được xử lý. Có thể hoàn thành deletion.'
                    : 'Đợi tất cả buildings ARCHIVED, units INACTIVE và employees được gỡ bỏ trước khi hoàn thành.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
        <div className="bg-white rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">⚡ Hành động</h2>
        <div className="flex gap-3">
          {request.status === TenantDeletionStatus.PENDING && (
            <>
              <button
                onClick={() => setShowApproveModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
              >
                ✅ Phê duyệt
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
              >
                ❌ Từ chối
              </button>
            </>
          )}
          
          {request.status === TenantDeletionStatus.APPROVED && targetsStatus?.allTargetsReady && (
            <button
              onClick={() => setShowCompleteModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              🎯 Hoàn thành Deletion
            </button>
          )}
          
          {request.status === TenantDeletionStatus.APPROVED && !targetsStatus?.allTargetsReady && (
            <button
              disabled
              className="px-4 py-2 text-sm font-medium text-white bg-slate-300 rounded-lg cursor-not-allowed"
              title="Chờ tất cả targets sẵn sàng"
            >
              🎯 Hoàn thành Deletion (Chưa sẵn sàng)
            </button>
          )}
          
          {request.status === TenantDeletionStatus.COMPLETED && (
            <div className="text-green-600 font-medium">
              ✅ Yêu cầu đã được hoàn thành
            </div>
          )}
          
          {request.status === TenantDeletionStatus.REJECTED && (
            <div className="text-red-600 font-medium">
              ❌ Yêu cầu đã bị từ chối
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showApproveModal && (
        <ApproveModal
          onConfirm={handleApprove}
          onClose={() => setShowApproveModal(false)}
        />
      )}
      
      {showRejectModal && (
        <RejectModal
          onConfirm={handleReject}
          onClose={() => setShowRejectModal(false)}
        />
      )}
      
      {showCompleteModal && (
        <CompleteModal
          tenantId={request.tenantId}
          onConfirm={handleComplete}
          onClose={() => setShowCompleteModal(false)}
        />
      )}
      </div>
    </div>
  );
}

// Approve Modal Component
function ApproveModal({ onConfirm, onClose }: { onConfirm: (note: string) => void; onClose: () => void }) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onConfirm(note);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-200 bg-green-50">
          <h3 className="text-lg font-semibold text-green-900">✅ Phê duyệt Yêu cầu Xóa</h3>
        </div>
        <div className="px-6 py-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Ghi chú (tùy chọn)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nhập ghi chú..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200"
            rows={3}
          />
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
            ⚠️ Phê duyệt sẽ:
            <ul className="list-disc list-inside mt-1 text-amber-800">
              <li>Set buildings → DELETING</li>
              <li>Set units → INACTIVE</li>
              <li>Tạo building deletion requests</li>
              <li>Employees cần được gỡ bỏ thủ công</li>
            </ul>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg">
            Hủy
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50">
            {isSubmitting ? '⏳ Đang xử lý...' : '✅ Xác nhận Phê duyệt'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Reject Modal Component
function RejectModal({ onConfirm, onClose }: { onConfirm: (note: string) => void; onClose: () => void }) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (note.trim().length < 10) {
      alert('Lý do từ chối phải có ít nhất 10 ký tự');
      return;
    }
    setIsSubmitting(true);
    await onConfirm(note);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-200 bg-red-50">
          <h3 className="text-lg font-semibold text-red-900">❌ Từ chối Yêu cầu Xóa</h3>
        </div>
        <div className="px-6 py-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Lý do từ chối <span className="text-red-500">*</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nhập lý do từ chối (tối thiểu 10 ký tự)..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200"
            rows={3}
            required
          />
          <p className="text-xs text-slate-500 mt-1">{note.length}/10 ký tự</p>
        </div>
        <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg">
            Hủy
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting || note.trim().length < 10} className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50">
            {isSubmitting ? '⏳ Đang xử lý...' : '❌ Xác nhận Từ chối'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Complete Modal Component
function CompleteModal({ tenantId, onConfirm, onClose }: { tenantId: string; onConfirm: () => void; onClose: () => void }) {
  const [confirmText, setConfirmText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const expectedText = tenantId.slice(0, 8);

  const handleSubmit = async () => {
    if (confirmText !== expectedText) {
      alert('Mã xác nhận không đúng!');
      return;
    }
    setIsSubmitting(true);
    await onConfirm();
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-200 bg-blue-50">
          <h3 className="text-lg font-semibold text-blue-900">🎯 Hoàn thành Deletion</h3>
        </div>
        <div className="px-6 py-4">
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg mb-4">
            <div className="font-bold text-red-900 mb-2">🔥 CẢNH BÁO CUỐI CÙNG</div>
            <div className="text-sm text-red-800">
              <ul className="list-disc list-inside space-y-1">
                <li>Tenant sẽ được đánh dấu ARCHIVED</li>
                <li>Tenant.deleted = true</li>
                <li><strong>KHÔNG THỂ HOÀN TÁC!</strong></li>
              </ul>
            </div>
          </div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Nhập mã tenant để xác nhận: <code className="bg-slate-100 px-2 py-1 rounded">{expectedText}</code>
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={`Nhập "${expectedText}" để xác nhận`}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg">
            Hủy
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting || confirmText !== expectedText} className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? '⏳ Đang xử lý...' : '🔥 Hoàn thành Deletion'}
          </button>
        </div>
      </div>
    </div>
  );
}

