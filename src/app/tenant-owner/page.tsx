"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { getAllTenants, getBuildingsByTenant, type Tenant, type Building } from '@/src/services/base';
import { getMyDeletionRequests, approveDeletionRequest, type TenantDeletionRequest } from '@/src/services/base';
import Link from 'next/link';
import Topbar from '@/src/components/layout/Topbar';
import Sidebar from '@/src/components/layout/Sidebar';

export default function TenantOwnerHomePage() {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<TenantDeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TenantDeletionRequest | null>(null);
  const [approveNote, setApproveNote] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.tenantId) return;

    try {
      setLoading(true);
      const [tenantsData, buildingsData, requestsData] = await Promise.all([
        getAllTenants(),
        getBuildingsByTenant(user.tenantId),
        getMyDeletionRequests().catch(() => []), // Graceful fail
      ]);

      const myTenant = tenantsData.find(t => t.id === user.tenantId);
      setTenant(myTenant || null);
      setBuildings(buildingsData);
      setDeletionRequests(requestsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (request: TenantDeletionRequest) => {
    setSelectedRequest(request);
    setApproveNote('');
    setShowApproveModal(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setApproving(selectedRequest.id);
      await approveDeletionRequest(selectedRequest.id, { note: approveNote });
      alert('✅ Đã approve yêu cầu xóa tenant! Hệ thống sẽ bắt đầu xử lý.');
      setShowApproveModal(false);
      loadData(); // Reload to show updated status
    } catch (error: any) {
      console.error('Failed to approve request:', error);
      alert(`❌ Approve thất bại: ${error?.response?.data?.message || error.message}`);
    } finally {
      setApproving(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0]">
        <Topbar />
        <div className="flex">
          <Sidebar variant="tenant-owner" />
          <main className="flex-1 ml-64 p-6">
            <div className="text-center py-12 text-slate-500">⏳ Đang tải...</div>
          </main>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-[#F5F5F0]">
        <Topbar />
        <div className="flex">
          <Sidebar variant="tenant-owner" />
          <main className="flex-1 ml-64 p-6">
            <div className="text-center py-12 text-red-500">❌ Không tìm thấy thông tin tenant</div>
          </main>
        </div>
      </div>
    );
  }

  const activeBuildings = buildings.filter(b => b.status === 'ACTIVE').length;
  const totalUnits = buildings.reduce((sum, b) => sum + (b.totalUnits || 0), 0);
  const pendingRequests = deletionRequests.filter(r => r.status === 'PENDING').length;
  const hasActiveRequest = deletionRequests.some(r => ['PENDING', 'APPROVED', 'IN_PROGRESS'].includes(r.status));

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <Topbar />
      <div className="flex">
        <Sidebar variant="tenant-owner" />
        <main className="flex-1 ml-64 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-800 mb-2">
                🏢 Trang chủ - {tenant.name}
              </h1>
              <p className="text-sm text-slate-600">
                Chào mừng, {user?.username}! Quản lý thông tin tenant của bạn.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Tòa nhà</div>
                    <div className="text-3xl font-bold text-[#6B9B6E]">{activeBuildings}</div>
                    <div className="text-xs text-slate-500 mt-1">Đang hoạt động</div>
                  </div>
                  <div className="text-4xl">🏢</div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Căn hộ</div>
                    <div className="text-3xl font-bold text-blue-600">{totalUnits}</div>
                    <div className="text-xs text-slate-500 mt-1">Tổng số căn hộ</div>
                  </div>
                  <div className="text-4xl">🏠</div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Yêu cầu xóa</div>
                    <div className="text-3xl font-bold text-amber-600">{pendingRequests}</div>
                    <div className="text-xs text-slate-500 mt-1">Đang chờ duyệt</div>
                  </div>
                  <div className="text-4xl">🗑️</div>
                </div>
              </div>
            </div>

            {/* Tenant Info Card */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">📋 Thông tin Tenant</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-600">Tên Tenant</div>
                  <div className="font-medium text-slate-800">{tenant.name}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Mã Tenant</div>
                  <code className="text-sm bg-slate-100 px-2 py-1 rounded">{tenant.code || tenant.id}</code>
                </div>
              </div>
            </div>

            {/* Buildings List */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800">🏢 Danh sách Tòa nhà</h2>
                <span className="text-sm text-slate-600">{buildings.length} tòa nhà</span>
              </div>
              
              {buildings.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  📭 Chưa có tòa nhà nào
                </div>
              ) : (
                <div className="space-y-3">
                  {buildings.map(building => (
                    <div key={building.id} className="p-4 border border-slate-200 rounded-lg hover:border-[#6B9B6E] transition">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-800">{building.name}</div>
                          <div className="text-sm text-slate-600 mt-1">
                            📍 {building.address || 'Không có địa chỉ'}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            building.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {building.status}
                          </span>
                          <div className="text-sm text-slate-600 mt-1">
                            {building.totalUnits || 0} căn hộ
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Deletion Requests Section */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800">🗑️ Yêu cầu Xóa Tenant</h2>
                <span className="text-sm text-slate-600">{deletionRequests.length} yêu cầu</span>
              </div>
              
              {deletionRequests.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📭</div>
                  <div className="text-slate-800 font-medium mb-2">Chưa có yêu cầu xóa tenant</div>
                  <p className="text-sm text-slate-600 mb-4">
                    Bạn có thể tạo yêu cầu xóa tenant nếu cần thiết
                  </p>
                  <Link
                    href="/tenants"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#6B9B6E] text-white rounded-lg hover:bg-[#5a8559] transition"
                  >
                    ➕ Tạo yêu cầu mới
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {deletionRequests.map(request => {
                    const statusColors: Record<string, string> = {
                      PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
                      APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
                      IN_PROGRESS: 'bg-purple-100 text-purple-800 border-purple-200',
                      COMPLETED: 'bg-green-100 text-green-800 border-green-200',
                      REJECTED: 'bg-red-100 text-red-800 border-red-200',
                      CANCELLED: 'bg-slate-100 text-slate-800 border-slate-200',
                    };
                    const statusLabels: Record<string, string> = {
                      PENDING: '⏳ Chờ duyệt',
                      APPROVED: '✅ Đã duyệt',
                      IN_PROGRESS: '🔄 Đang xử lý',
                      COMPLETED: '✔️ Hoàn thành',
                      REJECTED: '❌ Từ chối',
                      CANCELLED: '🚫 Đã hủy',
                    };

                    return (
                      <div key={request.id} className="p-4 border border-slate-200 rounded-lg hover:border-[#6B9B6E] transition">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusColors[request.status]}`}>
                                {statusLabels[request.status]}
                              </span>
                              <span className="text-xs text-slate-500">
                                {new Date(request.requestedAt).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                            {request.reason && (
                              <p className="text-sm text-slate-600 italic mb-2">
                                "{request.reason}"
                              </p>
                            )}
                            {request.status === 'REJECTED' && request.rejectionReason && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                                <strong>Lý do từ chối:</strong> {request.rejectionReason}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            {request.status === 'PENDING' && (
                              <button
                                onClick={() => handleApproveClick(request)}
                                disabled={approving === request.id}
                                className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {approving === request.id ? '⏳ Đang xử lý...' : '✅ Approve'}
                              </button>
                            )}
                            <Link
                              href={`/tenant-deletions/${request.id}`}
                              className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition"
                            >
                              Chi tiết
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Approve Modal */}
            {showApproveModal && selectedRequest && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">
                    ✅ Xác nhận Approve Yêu cầu Xóa Tenant
                  </h3>
                  <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded">
                    <p className="text-sm text-amber-800 mb-2">
                      <strong>⚠️ Lưu ý quan trọng:</strong>
                    </p>
                    <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                      <li>Hệ thống sẽ tự động đặt trạng thái buildings thành <strong>DELETING</strong></li>
                      <li>Tất cả units sẽ được xóa dần</li>
                      <li>Sau khi xóa hết units → Building status = <strong>ARCHIVED</strong></li>
                      <li>Sau khi xóa hết buildings → Tenant status = <strong>ARCHIVED</strong></li>
                    </ul>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Ghi chú (tùy chọn):
                    </label>
                    <textarea
                      value={approveNote}
                      onChange={(e) => setApproveNote(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      rows={3}
                      placeholder="Nhập lý do approve..."
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setShowApproveModal(false)}
                      disabled={approving !== null}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition disabled:opacity-50"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={approving !== null}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {approving ? '⏳ Đang xử lý...' : '✅ Xác nhận Approve'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

