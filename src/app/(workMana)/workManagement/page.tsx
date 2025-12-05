'use client';

import React from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useKanbanTasks } from '@/src/hooks/useKanbanTasks';
import KanbanBoard from '@/src/components/workMa/kanban/KanbanBoard';

export default function WorkManagementPage() {
  const { user } = useAuth();
  const {
    tasksByStatus,
    employees,
    isAdmin,
    filter,
    loading,
    error,
    updateTaskStatus,
    assignTask,
    updateFilter,
  } = useKanbanTasks();

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Lỗi: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Quản lý công việc
        </h1>
        <p className="text-gray-600">
          {isAdmin 
            ? 'Xem và phân công công việc cho nhân viên' 
            : 'Quản lý công việc của bạn'}
        </p>
      </div>

      <KanbanBoard
        tasksByStatus={tasksByStatus}
        employees={employees}
        isAdmin={isAdmin}
        filter={filter}
        onFilterChange={updateFilter}
        onTaskStatusChange={updateTaskStatus}
        onTaskAssign={assignTask}
        loading={loading}
      />
    </div>
  );
}

