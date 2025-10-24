"use client";
import React, { useState, useEffect } from 'react';
import { getAllTenants, type Tenant } from '@/src/services/base';
import CreateDeletionRequestModal from '@/src/components/tenant/CreateDeletionRequestModal';
import { useAuth } from '@/src/contexts/AuthContext';

export default function TenantsPage() {
  const { user, hasRole } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const data = await getAllTenants();
      
      // Filter tenants based on user role
      let filteredData = data;
      if (!hasRole('admin')) {
        // If not admin, only show user's own tenant
        filteredData = data.filter(tenant => tenant.id === user?.tenantId);
      }
      
      setTenants(filteredData);
    } catch (error) {
      console.error('Failed to load tenants:', error);
      alert('❌ Không thể tải danh sách tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDeletion = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setShowDeleteModal(true);
  };

  const handleDeletionSuccess = () => {
    loadTenants(); // Reload to show updated status
  };

  // Filter tenants by search
  const filteredTenants = tenants.filter(tenant => 
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="lg:col-span-1 space-y-6">
      <div className="max-w-screen overflow-x-hidden bg-[#F5F7FA]">
        {/* Header */}
        <h1 className="text-2xl font-semibold text-[#02542D] mb-2">
          🏢 Quản Lý Tenant
        </h1>
        <p className="text-sm text-slate-600 mb-4">
          Danh sách tất cả tenant trong hệ thống
        </p>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm tenant theo tên hoặc mã..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02542D]"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="px-[41px] py-12 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-2 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải...</p>
            </div>
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className="bg-white rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Mã
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Địa chỉ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    {searchQuery 
                      ? '🔍 Không tìm thấy tenant nào'
                      : '📭 Chưa có tenant nào'
                    }
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => (
                  <tr 
                    key={tenant.id} 
                    className="hover:bg-slate-50 transition"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">
                        {tenant.name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                        {tenant.code || '-'}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {tenant.address || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${tenant.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800' 
                            : tenant.status === 'PENDING_DELETION'
                            ? 'bg-yellow-100 text-yellow-800'
                            : tenant.status === 'ARCHIVED'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-slate-100 text-slate-600'
                          }`}
                      >
                        {tenant.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRequestDeletion(tenant)}
                        disabled={tenant.status !== 'ACTIVE'}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition disabled:bg-slate-300 disabled:cursor-not-allowed"
                        title={tenant.status !== 'ACTIVE' ? 'Chỉ có thể xóa tenant ACTIVE' : 'Yêu cầu xóa tenant'}
                      >
                        🗑️ Yêu cầu Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

            {/* Footer Stats */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-sm text-slate-600">
              Tổng cộng: <span className="font-medium">{filteredTenants.length}</span> tenant
              {searchQuery && ` (đã lọc từ ${tenants.length} tenant)`}
            </div>
          </div>
        )}

        {/* Deletion Request Modal */}
        {showDeleteModal && selectedTenant && (
          <CreateDeletionRequestModal
            tenantId={selectedTenant.id}
            tenantName={selectedTenant.name}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedTenant(null);
            }}
            onSuccess={handleDeletionSuccess}
          />
        )}
      </div>
    </div>
  );
}

