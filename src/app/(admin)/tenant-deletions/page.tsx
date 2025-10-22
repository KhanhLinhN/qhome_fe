"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllDeletionRequests, getMyDeletionRequests, TenantDeletionRequest, TenantDeletionStatus } from '@/src/services/base';
import { useAuth } from '@/src/contexts/AuthContext';

export default function AdminDeletionRequestsPage() {
  const { user, hasRole } = useAuth();
  const [requests, setRequests] = useState<TenantDeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      // Admin sees all requests, tenant_owner sees only their requests
      const data = hasRole('admin') 
        ? await getAllDeletionRequests()
        : await getMyDeletionRequests();
      setRequests(data);
    } catch (error) {
      console.error('Failed to load deletion requests:', error);
      alert('❌ Không thể tải danh sách yêu cầu xóa');
    } finally {
      setLoading(false);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(req => {
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesSearch = searchQuery === '' || 
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.tenantId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Count by status
  const statusCounts = {
    PENDING: requests.filter(r => r.status === TenantDeletionStatus.PENDING).length,
    APPROVED: requests.filter(r => r.status === TenantDeletionStatus.APPROVED).length,
    COMPLETED: requests.filter(r => r.status === TenantDeletionStatus.COMPLETED).length,
    REJECTED: requests.filter(r => r.status === TenantDeletionStatus.REJECTED).length,
  };

  const getStatusBadge = (status: TenantDeletionStatus) => {
    const badges = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      REJECTED: 'bg-red-100 text-red-800',
      CANCELED: 'bg-slate-100 text-slate-600',
    };
    return badges[status] || 'bg-slate-100 text-slate-600';
  };

  const getStatusIcon = (status: TenantDeletionStatus) => {
    const icons = {
      PENDING: '🟡',
      APPROVED: '🟢',
      COMPLETED: '✅',
      REJECTED: '❌',
      CANCELED: '⚪',
    };
    return icons[status] || '⚪';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          🗑️ {hasRole('admin') ? 'Quản Lý Yêu Cầu Xóa Tenant' : 'Yêu Cầu Xóa Tenant Của Tôi'}
        </h1>
        <p className="text-sm text-slate-600">
          {hasRole('admin') 
            ? 'Admin: Phê duyệt và xử lý các yêu cầu xóa tenant' 
            : 'Theo dõi các yêu cầu xóa tenant bạn đã gửi'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-yellow-700 font-medium">Chờ duyệt</div>
              <div className="text-2xl font-bold text-yellow-800 mt-1">{statusCounts.PENDING}</div>
            </div>
            <div className="text-3xl">🟡</div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-green-700 font-medium">Đã duyệt</div>
              <div className="text-2xl font-bold text-green-800 mt-1">{statusCounts.APPROVED}</div>
            </div>
            <div className="text-3xl">🟢</div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-700 font-medium">Hoàn thành</div>
              <div className="text-2xl font-bold text-blue-800 mt-1">{statusCounts.COMPLETED}</div>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-red-700 font-medium">Từ chối</div>
              <div className="text-2xl font-bold text-red-800 mt-1">{statusCounts.REJECTED}</div>
            </div>
            <div className="text-3xl">❌</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Tìm kiếm theo ID, Tenant ID, lý do..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B9B6E]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B9B6E]"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="PENDING">🟡 Chờ duyệt</option>
          <option value="APPROVED">🟢 Đã duyệt</option>
          <option value="COMPLETED">✅ Hoàn thành</option>
          <option value="REJECTED">❌ Từ chối</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="text-slate-500">⏳ Đang tải...</div>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Tenant ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Lý do</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Ngày tạo</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    {searchQuery || statusFilter !== 'all'
                      ? '🔍 Không tìm thấy yêu cầu nào'
                      : '📭 Chưa có yêu cầu xóa nào'
                    }
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                        #{request.id.slice(0, 8)}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                        {request.tenantId.slice(0, 8)}
                      </code>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="text-sm text-slate-700 truncate" title={request.reason}>
                        {request.reason}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                        {getStatusIcon(request.status)} {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/tenant-deletions/${request.id}`}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-[#6B9B6E] hover:bg-[#5A8A5D] rounded-md transition"
                      >
                        👁️ Chi tiết
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Footer */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-sm text-slate-600">
            Hiển thị: <span className="font-medium">{filteredRequests.length}</span>
            {(searchQuery || statusFilter !== 'all') && ` / ${requests.length}`} yêu cầu
          </div>
        </div>
      )}
    </div>
  );
}

