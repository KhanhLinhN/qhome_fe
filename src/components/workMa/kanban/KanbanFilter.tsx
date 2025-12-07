'use client';

import React, { useMemo } from 'react';
import { TaskFilter } from '@/src/types/workTask';
import { EmployeeRoleDto } from '@/src/services/iam/employeeService';
import Select from '@/src/components/customer-interaction/Select';

interface KanbanFilterProps {
  filter: TaskFilter;
  employees: EmployeeRoleDto[];
  isAdmin: boolean;
  userRole?: string; // User's role (if not admin)
  onFilterChange: (filter: Partial<TaskFilter>) => void;
}

interface RoleOption {
  id: string;
  name: string;
}

interface EmployeeOption {
  id: string;
  name: string;
  displayName: string;
}

export default function KanbanFilter({
  filter,
  employees,
  isAdmin,
  userRole,
  onFilterChange,
}: KanbanFilterProps) {
  // Define fixed roles: SUPPORTER, TECHNICIAN, ACCOUNTANT, ADMIN
  const fixedRoles = ['SUPPORTER', 'TECHNICIAN', 'ACCOUNTANT', 'ADMIN'];

  // Prepare role options with "All" option (only for admin)
  const roleOptions: RoleOption[] = useMemo(() => {
    if (!isAdmin && userRole) {
      // Non-admin: only show their role
      return [{ id: userRole, name: userRole }];
    }
    // Admin: show all roles + "All"
    const allOption: RoleOption = { id: 'all', name: 'Tất cả' };
    const roleOptionsList: RoleOption[] = fixedRoles.map(role => ({
      id: role,
      name: role,
    }));
    return [allOption, ...roleOptionsList];
  }, [isAdmin, userRole]);

  // Filter employees by selected role (cascade filter)
  // For non-admin, use userRole; for admin, use filter.role
  const effectiveRole = !isAdmin && userRole ? userRole : filter.role;
  const filteredEmployees = useMemo(() => {
    if (!effectiveRole || effectiveRole === 'all') {
      return employees;
    }
    return employees.filter(emp =>
      emp.assignedRoles.some(role => 
        role.roleName.toUpperCase() === effectiveRole?.toUpperCase()
      )
    );
  }, [employees, effectiveRole, isAdmin, userRole]);

  // Prepare employee options with "All" option (filtered by role)
  const employeeOptions: EmployeeOption[] = useMemo(() => {
    const allOption: EmployeeOption = { 
      id: 'all', 
      name: 'Tất cả',
      displayName: 'Tất cả'
    };
    const empOptionsList: EmployeeOption[] = filteredEmployees.map(emp => ({
      id: emp.userId,
      name: emp.username,
      displayName: `${emp.username}${emp.fullName ? ` (${emp.fullName})` : ''}`,
    }));
    return [allOption, ...empOptionsList];
  }, [filteredEmployees]);

  const handleRoleSelect = (item: RoleOption) => {
    if (item.id === 'all') {
      // Clear both role and employee when selecting "all"
      onFilterChange({ role: undefined, employeeId: undefined });
    } else {
      // Clear employee when changing role
      onFilterChange({ role: item.id, employeeId: undefined });
    }
  };

  const handleEmployeeSelect = (item: EmployeeOption) => {
    if (item.id === 'all') {
      onFilterChange({ employeeId: undefined });
    } else {
      onFilterChange({ employeeId: item.id });
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 mb-4 shadow-sm border border-gray-200">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Role Filter */}
        <div className="flex flex-col gap-2 min-w-[200px]">
          <label className="text-sm font-medium text-gray-700">
            Role:
          </label>
          <Select<RoleOption>
            options={roleOptions}
            value={!isAdmin && userRole ? userRole : (filter.role || 'all')}
            onSelect={handleRoleSelect}
            renderItem={(item) => item.name}
            getValue={(item) => item.id}
            placeholder="Chọn role"
            disable={!isAdmin} // Disable if not admin
          />
        </div>

        {/* Employee Filter */}
        <div className="flex flex-col gap-2 min-w-[250px]">
          <label className="text-sm font-medium text-gray-700">
            Nhân viên:
          </label>
          <Select<EmployeeOption>
            options={employeeOptions}
            value={filter.employeeId || 'all'}
            onSelect={handleEmployeeSelect}
            renderItem={(item) => item.displayName}
            getValue={(item) => item.id}
            placeholder="Chọn nhân viên"
          />
        </div>

        {/* Clear Filters */}
        {(filter.role || filter.employeeId) && (
          <button
            onClick={() => onFilterChange({ role: undefined, employeeId: undefined })}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>
    </div>
  );
}

