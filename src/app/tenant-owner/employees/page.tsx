"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import Topbar from '@/src/components/layout/Topbar';
import Sidebar from '@/src/components/layout/Sidebar';
import axios from '@/src/lib/axios';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8081';
const IAM_URL = process.env.NEXT_PUBLIC_IAM_URL || 'http://localhost:8088';

interface Employee {
  userId: string;
  username: string;
  email: string;
  roles: string[];
}

interface TenantDeletionTargetsStatus {
  buildings: Record<string, number>;
  units: Record<string, number>;
  totalBuildings: number;
  totalUnits: number;
  buildingsArchived: number;
  unitsInactive: number;
  buildingsReady: boolean;
  unitsReady: boolean;
  employeesCount: number;
  employeesReady: boolean;
  allTargetsReady: boolean;
  requirements: {
    buildings: string;
    units: string;
    employees: string;
  };
}

export default function TenantOwnerEmployeesPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [deletionStatus, setDeletionStatus] = useState<TenantDeletionTargetsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [unassigning, setUnassigning] = useState<string | null>(null);

  useEffect(() => {
    if (user?.tenantId) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user?.tenantId) return;

    try {
      setLoading(true);
      
      // Load employees in tenant
      const employeesResponse = await axios.get<Employee[]>(
        `${IAM_URL}/api/employee-roles/tenant/${user.tenantId}`,
        { withCredentials: true }
      );
      setEmployees(employeesResponse.data);

      // Load deletion status
      try {
        const statusResponse = await axios.get<TenantDeletionTargetsStatus>(
          `${BASE_URL}/api/tenant-deletions/my-requests`,
          { withCredentials: true }
        );
        if (statusResponse.data && statusResponse.data.length > 0) {
          // Get the first APPROVED request's status
          const approvedRequest = statusResponse.data.find(r => r.status === 'APPROVED');
          if (approvedRequest) {
            const targetsResponse = await axios.get<TenantDeletionTargetsStatus>(
              `${BASE_URL}/api/tenant-deletions/${approvedRequest.id}/targets-status`,
              { withCredentials: true }
            );
            setDeletionStatus(targetsResponse.data);
          }
        }
      } catch (error) {
        console.log('No active deletion request found');
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignEmployee = async (userId: string, username: string) => {
    if (!confirm(`Bạn có chắc muốn gỡ bỏ "${username}" khỏi tenant?\n\nHọ sẽ không còn quyền truy cập vào tenant này.`)) {
      return;
    }

    try {
      setUnassigning(userId);
      // Note: Individual unassign API not available, using remove role instead
      await axios.post(
        `${IAM_URL}/api/employee-roles/remove`,
        { userId, tenantId: user?.tenantId, roles: [] }, // Remove all roles
        { withCredentials: true }
      );
      alert(`✅ Đã gỡ bỏ "${username}" khỏi tenant!`);
      loadData(); // Reload
    } catch (error: any) {
      console.error('Failed to unassign employee:', error);
      alert(`❌ Gỡ bỏ thất bại: ${error?.response?.data?.message || error.message}`);
    } finally {
      setUnassigning(null);
    }
  };

  const handleUnassignAllEmployees = async () => {
    if (employees.length === 0) return;
    
    if (!confirm(`Bạn có chắc muốn gỡ bỏ TẤT CẢ ${employees.length} nhân viên khỏi tenant?\n\nHọ sẽ không còn quyền truy cập vào tenant này.`)) {
      return;
    }

    try {
      setUnassigning('all');
      await axios.post(
        `${IAM_URL}/api/employee-roles/${user?.tenantId}/employees/unassign-all`,
        {},
        { withCredentials: true }
      );
      alert(`✅ Đã gỡ bỏ tất cả ${employees.length} nhân viên khỏi tenant!`);
      loadData(); // Reload
    } catch (error: any) {
      console.error('Failed to unassign all employees:', error);
      alert(`❌ Gỡ bỏ thất bại: ${error?.response?.data?.message || error.message}`);
    } finally {
      setUnassigning(null);
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
                👥 Nhân viên trong Tenant
              </h1>
              <p className="text-sm text-slate-600">
                Quản lý nhân viên trong tenant. Cần gỡ bỏ tất cả nhân viên trước khi hoàn tất xóa tenant.
              </p>
            </div>

            {/* Deletion Status Card */}
            {deletionStatus && (
              <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">📊 Trạng thái Xóa Tenant</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-lg border ${deletionStatus.buildingsReady ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🏢</span>
                      <span className="font-medium text-slate-800">Buildings</span>
                    </div>
                    <div className="text-sm text-slate-600">
                      {deletionStatus.buildingsArchived} / {deletionStatus.totalBuildings} đã ARCHIVED
                    </div>
                    <div className={`text-xs font-medium mt-1 ${deletionStatus.buildingsReady ? 'text-green-700' : 'text-amber-700'}`}>
                      {deletionStatus.buildingsReady ? '✅ Hoàn thành' : '⏳ Đang xử lý'}
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border ${deletionStatus.unitsReady ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🏠</span>
                      <span className="font-medium text-slate-800">Units</span>
                    </div>
                    <div className="text-sm text-slate-600">
                      {deletionStatus.unitsInactive} / {deletionStatus.totalUnits} đã INACTIVE
                    </div>
                    <div className={`text-xs font-medium mt-1 ${deletionStatus.unitsReady ? 'text-green-700' : 'text-amber-700'}`}>
                      {deletionStatus.unitsReady ? '✅ Hoàn thành' : '⏳ Đang xử lý'}
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border ${deletionStatus.employeesReady ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">👥</span>
                      <span className="font-medium text-slate-800">Employees</span>
                    </div>
                    <div className="text-sm text-slate-600">
                      {deletionStatus.employeesCount} nhân viên còn lại
                    </div>
                    <div className={`text-xs font-medium mt-1 ${deletionStatus.employeesReady ? 'text-green-700' : 'text-red-700'}`}>
                      {deletionStatus.employeesReady ? '✅ Hoàn thành' : '❌ Cần gỡ bỏ'}
                    </div>
                  </div>
                </div>

                {!deletionStatus.allTargetsReady && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded">
                    <p className="text-sm text-amber-800">
                      <strong>⚠️ Lưu ý:</strong> Cần hoàn thành tất cả các bước trên trước khi có thể hoàn tất xóa tenant.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Employees List */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800">
                  👥 Danh sách Nhân viên ({employees.length})
                </h2>
                {employees.length > 0 && (
                  <button
                    onClick={handleUnassignAllEmployees}
                    disabled={unassigning === 'all'}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {unassigning === 'all' ? '⏳ Đang xử lý...' : '🗑️ Gỡ bỏ tất cả'}
                  </button>
                )}
              </div>
              
              {employees.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">✅</div>
                  <div className="text-slate-800 font-medium mb-2">
                    Không có nhân viên nào trong tenant
                  </div>
                  <p className="text-sm text-slate-600">
                    Tất cả nhân viên đã được gỡ bỏ khỏi tenant
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {employees.map((employee) => (
                    <div key={employee.userId} className="p-4 border border-slate-200 rounded-lg hover:border-red-300 transition">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-slate-800">
                              {employee.username}
                            </h3>
                            <span className="text-sm text-slate-500">
                              {employee.email}
                            </span>
                          </div>
                          {employee.roles && employee.roles.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {employee.roles.map((role, index) => (
                                <span
                                  key={`${role}-${index}`}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 uppercase"
                                >
                                  {role}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleUnassignEmployee(employee.userId, employee.username)}
                          disabled={unassigning === employee.userId}
                          className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {unassigning === employee.userId ? '⏳ Đang xử lý...' : '🗑️ Gỡ bỏ'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

