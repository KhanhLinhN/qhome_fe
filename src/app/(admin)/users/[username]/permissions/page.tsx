"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getEmployeesInTenant, getUserPermissionSummary, type UserPermissionSummaryDto } from '@/src/services/iam';
import type { EmployeeRoleDto } from '@/src/services/iam';
import PermissionGroup from '@/src/components/admin/PermissionGroup';
import EditUserPermissionsModal from '@/src/components/admin/EditUserPermissionsModal';

export default function UserPermissionDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const username = params.username as string;
  const tenantId = searchParams.get('tenant') || '';
  const tenantName = searchParams.get('tenantName') || 'Unknown Tenant';

  const [employee, setEmployee] = useState<EmployeeRoleDto | null>(null);
  const [summary, setSummary] = useState<UserPermissionSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (tenantId && username) {
      loadEmployeeData();
    }
  }, [tenantId, username]);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      const employees = await getEmployeesInTenant(tenantId);
      const found = employees.find(emp => emp.username === username);
      setEmployee(found || null);
      
      // Load permission summary if employee found
      if (found) {
        try {
          const permSummary = await getUserPermissionSummary(found.userId, tenantId);
          setSummary(permSummary);
        } catch (err) {
          console.error('Failed to load permission summary:', err);
        }
      }
    } catch (error) {
      console.error('Failed to load employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group permissions by service
  const groupedPermissions = React.useMemo(() => {
    if (!employee?.allPermissions) return {};
    
    const groups: Record<string, string[]> = {};
    
    employee.allPermissions.forEach(permission => {
      const servicePrefix = permission.split('.')[0] || 'other';
      if (!groups[servicePrefix]) {
        groups[servicePrefix] = [];
      }
      groups[servicePrefix].push(permission);
    });
    
    return groups;
  }, [employee]);

  // Filter permissions by search
  const filteredGroups = React.useMemo(() => {
    if (!searchQuery) return groupedPermissions;
    
    const filtered: Record<string, string[]> = {};
    Object.entries(groupedPermissions).forEach(([service, perms]) => {
      const matchingPerms = perms.filter(p => 
        p.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matchingPerms.length > 0) {
        filtered[service] = matchingPerms;
      }
    });
    
    return filtered;
  }, [groupedPermissions, searchQuery]);

  const totalPermissions = employee?.allPermissions?.length || 0;
  const filteredCount = Object.values(filteredGroups).flat().length;

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-slate-500">
          Đang tải dữ liệu...
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-slate-500 mb-4">User not found</p>
          <Link
            href={`/users/permissions?tenant=${tenantId}&tenantName=${encodeURIComponent(tenantName)}`}
            className="text-[#6B9B6E] hover:underline"
          >
            ← Back to User List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <Link href="/dashboard" className="hover:text-[#6B9B6E]">Dashboard</Link>
        <span>›</span>
        <Link
          href={`/users/permissions?tenant=${tenantId}&tenantName=${encodeURIComponent(tenantName)}`}
          className="hover:text-[#6B9B6E]"
        >
          {tenantName}
        </Link>
        <span>›</span>
        <span className="text-slate-700 font-medium">{username}</span>
      </div>

      {/* Back Link */}
      <Link
        href={`/users/permissions?tenant=${tenantId}&tenantName=${encodeURIComponent(tenantName)}`}
        className="inline-flex items-center text-[#6B9B6E] hover:underline mb-6"
      >
        ← Back to User List
      </Link>

      {/* User Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-[#6B9B6E] text-white rounded-full flex items-center justify-center font-bold text-2xl">
            {employee.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800 mb-1">
              {employee.username}
            </h1>
            <p className="text-slate-600 mb-3">📧 {employee.email}</p>
            <p className="text-slate-600 mb-4">🏢 Tenant: {tenantName}</p>

            {/* Roles */}
            <div className="mb-4">
              <span className="text-sm font-semibold text-slate-700">🎭 Roles:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {employee.assignedRoles.length === 0 ? (
                  <span className="text-sm text-slate-400 italic">No roles assigned</span>
                ) : (
                  employee.assignedRoles.map((role, idx) => (
                    <span
                      key={`${role.roleName}-${idx}`}
                      className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-[#6B9B6E] text-white uppercase"
                    >
                      {role.roleName}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Permission Summary */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-600">
                🔑 <span className="font-semibold text-lg">{totalPermissions}</span> total permissions
              </div>
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 bg-[#6B9B6E] text-white rounded-md hover:bg-[#5a8259] transition font-medium text-sm flex items-center gap-2"
              >
                ✏️ Edit Permissions
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Permission Breakdown */}
      {summary && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            📊 Permission Breakdown
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-700 font-medium mb-1">Inherited from Roles</div>
              <div className="text-2xl font-bold text-blue-800">{summary.inheritedFromRoles?.length || 0}</div>
              <div className="text-xs text-blue-600 mt-1">From assigned roles</div>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-700 font-medium mb-1">Granted Directly</div>
              <div className="text-2xl font-bold text-green-800">{summary.grantedPermissions?.length || 0}</div>
              <div className="text-xs text-green-600 mt-1">User-specific grants</div>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-700 font-medium mb-1">Denied</div>
              <div className="text-2xl font-bold text-red-800">{summary.deniedPermissions?.length || 0}</div>
              <div className="text-xs text-red-600 mt-1">Explicitly blocked</div>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-sm text-purple-700 font-medium mb-1">Effective</div>
              <div className="text-2xl font-bold text-purple-800">{summary.effectivePermissions?.length || 0}</div>
              <div className="text-xs text-purple-600 mt-1">Final permissions</div>
            </div>
          </div>
        </div>
      )}

      {/* Search Permissions */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="🔍 Search permissions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B9B6E]"
        />
        {searchQuery && (
          <p className="text-sm text-slate-600 mt-2">
            Showing {filteredCount} of {totalPermissions} permissions
          </p>
        )}
      </div>

      {/* Permissions List */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          🔑 Effective Permissions
        </h2>

        {Object.keys(filteredGroups).length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            {searchQuery 
              ? 'No permissions match your search'
              : 'No permissions assigned'
            }
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(filteredGroups)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([service, permissions]) => (
                <PermissionGroup
                  key={service}
                  service={service}
                  permissions={permissions}
                  searchQuery={searchQuery}
                />
              ))}
          </div>
        )}
      </div>

      {/* Export Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => {
            const permissions = employee?.allPermissions || [];
            const csv = [
              ['Permission', 'Service'],
              ...permissions.map(p => [p, p.split('.')[0]])
            ].map(row => row.join(',')).join('\n');
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${employee.username}_permissions.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          disabled={!employee || !employee.allPermissions || employee.allPermissions.length === 0}
          className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition font-medium flex items-center gap-2"
        >
          📥 Export to CSV
        </button>
      </div>

      {/* Edit Permissions Modal */}
      {showEditModal && employee && (
        <EditUserPermissionsModal
          userId={employee.userId}
          username={employee.username}
          tenantId={tenantId}
          tenantName={tenantName}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            loadEmployeeData();
          }}
        />
      )}
    </div>
  );
}

