'use client';

import React from 'react';
import { TaskFilter } from '@/src/types/workTask';
import { EmployeeRoleDto } from '@/src/services/iam/employeeService';

interface KanbanFilterProps {
  filter: TaskFilter;
  employees: EmployeeRoleDto[];
  isAdmin: boolean;
  onFilterChange: (filter: Partial<TaskFilter>) => void;
}

export default function KanbanFilter({
  filter,
  employees,
  isAdmin,
  onFilterChange,
}: KanbanFilterProps) {
  // Get unique roles from employees
  const roles = React.useMemo(() => {
    const roleSet = new Set<string>();
    employees.forEach(emp => {
      emp.assignedRoles.forEach(role => {
        roleSet.add(role.roleName);
      });
    });
    return Array.from(roleSet).sort();
  }, [employees]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-gray-200">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Show All Toggle */}
        {!isAdmin && (
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filter.showAll || false}
                onChange={(e) => onFilterChange({ showAll: e.target.checked })}
                className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Hiển thị tất cả
              </span>
            </label>
          </div>
        )}

        {/* Role Filter */}
        <div className="flex items-center">
          <label className="text-sm font-medium text-gray-700 mr-2">
            Role:
          </label>
          <select
            value={filter.role || 'all'}
            onChange={(e) => onFilterChange({ role: e.target.value === 'all' ? undefined : e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        {/* Employee Filter */}
        <div className="flex items-center">
          <label className="text-sm font-medium text-gray-700 mr-2">
            Nhân viên:
          </label>
          <select
            value={filter.employeeId || 'all'}
            onChange={(e) => onFilterChange({ employeeId: e.target.value === 'all' ? undefined : e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả</option>
            {employees.map((emp) => (
              <option key={emp.userId} value={emp.userId}>
                {emp.username} {emp.fullName ? `(${emp.fullName})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {(filter.role || filter.employeeId) && (
          <button
            onClick={() => onFilterChange({ role: undefined, employeeId: undefined })}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>
    </div>
  );
}

