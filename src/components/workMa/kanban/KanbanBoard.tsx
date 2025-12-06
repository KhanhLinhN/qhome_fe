'use client';

import React, { useState } from 'react';
import { WorkTask, TaskStatus, KanbanColumnConfig } from '@/src/types/workTask';
import { EmployeeRoleDto } from '@/src/services/iam/employeeService';
import KanbanColumn from './KanbanColumn';
import KanbanFilter from './KanbanFilter';
import TaskAssignModal from './TaskAssignModal';

interface KanbanBoardProps {
  tasksByStatus: Record<string, WorkTask[]>;
  columnsConfig: KanbanColumnConfig[];
  employees: EmployeeRoleDto[];
  isAdmin: boolean;
  filter: any;
  onFilterChange: (filter: any) => void;
  onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onTaskAssign: (taskId: string, employeeId: string) => Promise<void>;
  loading?: boolean;
}

export default function KanbanBoard({
  tasksByStatus,
  columnsConfig,
  employees,
  isAdmin,
  filter,
  onFilterChange,
  onTaskStatusChange,
  onTaskAssign,
  loading,
}: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<WorkTask | null>(null);
  const [assignModalTask, setAssignModalTask] = useState<WorkTask | null>(null);

  const handleDragStart = (e: React.DragEvent, task: WorkTask) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    
    if (!draggedTask) return;

    // Don't allow drop if admin (read-only)
    if (isAdmin) {
      setDraggedTask(null);
      return;
    }

    // Don't update if status hasn't changed
    if (draggedTask.status === targetStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      await onTaskStatusChange(draggedTask.id, targetStatus);
    } catch (error) {
      console.error('Failed to update task status:', error);
    } finally {
      setDraggedTask(null);
    }
  };

  const handleAssignClick = (task: WorkTask) => {
    setAssignModalTask(task);
  };

  const handleAssign = async (taskId: string, employeeId: string) => {
    await onTaskAssign(taskId, employeeId);
    setAssignModalTask(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <KanbanFilter
        filter={filter}
        employees={employees}
        isAdmin={isAdmin}
        onFilterChange={onFilterChange}
      />

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columnsConfig.length > 0 ? (
          columnsConfig.map((column) => (
            <KanbanColumn
              key={column.id}
              title={column.title}
              status={column.status}
              tasks={tasksByStatus[column.status] || []}
              color={column.color}
              borderColor={column.borderColor}
              isDraggable={!isAdmin}
              draggedTaskId={draggedTask?.id}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onAssignClick={isAdmin ? handleAssignClick : undefined}
            />
          ))
        ) : (
          <div className="flex items-center justify-center w-full h-64">
            <div className="text-gray-500">Đang tải cấu hình...</div>
          </div>
        )}
      </div>

      <TaskAssignModal
        task={assignModalTask}
        employees={employees}
        isOpen={!!assignModalTask}
        onClose={() => setAssignModalTask(null)}
        onAssign={handleAssign}
      />
    </div>
  );
}

