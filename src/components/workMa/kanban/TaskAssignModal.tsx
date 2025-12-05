'use client';

import React, { useState, useEffect } from 'react';
import { WorkTask } from '@/src/types/workTask';
import { EmployeeRoleDto } from '@/src/services/iam/employeeService';

interface TaskAssignModalProps {
  task: WorkTask | null;
  employees: EmployeeRoleDto[];
  isOpen: boolean;
  onClose: () => void;
  onAssign: (taskId: string, employeeId: string) => Promise<void>;
}

export default function TaskAssignModal({
  task,
  employees,
  isOpen,
  onClose,
  onAssign,
}: TaskAssignModalProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task && isOpen) {
      setSelectedEmployeeId(task.assignedTo || '');
    }
  }, [task, isOpen]);

  const handleAssign = async () => {
    if (!task || !selectedEmployeeId) return;

    setLoading(true);
    try {
      await onAssign(task.id, selectedEmployeeId);
      onClose();
      setSelectedEmployeeId('');
    } catch (error) {
      console.error('Failed to assign task:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Gán công việc
          </h2>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Công việc:</span> {task.title}
            </p>
            {task.description && (
              <p className="text-sm text-gray-600 mb-4">
                {task.description}
              </p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn nhân viên:
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">-- Chọn nhân viên --</option>
              {employees.map((emp) => (
                <option key={emp.userId} value={emp.userId}>
                  {emp.username} {emp.fullName ? `(${emp.fullName})` : ''}
                  {emp.assignedRoles.length > 0 && ` - ${emp.assignedRoles.map(r => r.roleName).join(', ')}`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={handleAssign}
              disabled={loading || !selectedEmployeeId}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang xử lý...' : 'Gán'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

