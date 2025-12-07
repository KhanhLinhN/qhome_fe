'use client';

import React, { useState, useCallback } from 'react';
import { WorkTask, TaskStatus, KanbanColumnConfig } from '@/src/types/workTask';
import { EmployeeRoleDto } from '@/src/services/iam/employeeService';
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import KanbanColumn from './KanbanColumn';
import KanbanFilter from './KanbanFilter';
import TaskAssignModal from './TaskAssignModal';

interface KanbanBoardProps {
  tasksByStatus: Record<string, WorkTask[]>;
  columnsConfig: KanbanColumnConfig[];
  employees: EmployeeRoleDto[];
  isAdmin: boolean;
  userRole?: string; // User's role (if not admin)
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
  userRole,
  filter,
  onFilterChange,
  onTaskStatusChange,
  onTaskAssign,
  loading,
}: KanbanBoardProps) {
  const [selectedTasks, setSelectedTasks] = useState<WorkTask[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string>('');
  const [draggedFromStatus, setDraggedFromStatus] = useState<string>('');
  const [movedTaskList, setMovedTaskList] = useState<string[]>([]);
  const [assignModalTask, setAssignModalTask] = useState<WorkTask | null>(null);

  // Get all tasks from all columns
  const allTasks = React.useMemo(() => {
    return Object.values(tasksByStatus).flat();
  }, [tasksByStatus]);

  const isSelectAll = React.useMemo(() => {
    return allTasks.length > 0 && selectedTasks.length === allTasks.length;
  }, [allTasks.length, selectedTasks.length]);

  const toggleTaskSelection = useCallback((task: WorkTask) => {
    setSelectedTasks(prev => {
      const isSelected = prev.some(t => t.id === task.id);
      if (isSelected) {
        return prev.filter(t => t.id !== task.id);
      } else {
        return [...prev, task];
      }
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (isSelectAll) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks([...allTasks]);
    }
  }, [isSelectAll, allTasks]);

  const handleDragStart = useCallback((result: any) => {
    setIsDragging(true);
    setDraggedTaskId(result.draggableId);
    const sourceDroppableId = result.source.droppableId;
    setDraggedFromStatus(sourceDroppableId);
  }, []);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    setIsDragging(false);
    setDraggedTaskId('');
    setDraggedFromStatus('');

    if (!result.destination) {
      return;
    }

    const { draggableId, source, destination } = result;

    // Don't allow drop if admin (read-only)
    if (isAdmin) {
      return;
    }

    // Don't update if dropped in the same position
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    // Find the task
    const task = allTasks.find(t => t.id === draggableId);
    if (!task) return;

    // Get target status from destination droppableId
    const targetStatus = destination.droppableId as TaskStatus;

    // Don't update if status hasn't changed
    if (task.status === targetStatus) {
      return;
    }

    try {
      await onTaskStatusChange(draggableId, targetStatus);
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  }, [allTasks, isAdmin, onTaskStatusChange]);

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

  // Show message if no columns config
  if (columnsConfig.length === 0) {
    return (
      <div className="w-full">
        <KanbanFilter
          filter={filter}
          employees={employees}
          isAdmin={isAdmin}
          userRole={userRole}
          onFilterChange={onFilterChange}
        />
        <div className="flex items-center justify-center w-full h-64 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-gray-500 mb-2">Đang tải cấu hình kanban...</div>
            <div className="text-sm text-gray-400">Vui lòng đợi trong giây lát</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <KanbanFilter
        filter={filter}
        employees={employees}
        isAdmin={isAdmin}
        userRole={userRole}
        onFilterChange={onFilterChange}
      />

      <DragDropContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-[18px] overflow-x-auto pb-4">
          {columnsConfig.map((column) => (
            <KanbanColumn
              key={column.id || column.status}
              title={column.title}
              droppableId={column.status}
              status={column.status}
              tasks={tasksByStatus[column.status] || []}
              selectedTasks={selectedTasks}
              isSelectAll={isSelectAll}
              onToggleSelectAll={toggleSelectAll}
              onToggleTaskSelection={toggleTaskSelection}
              isDragging={isDragging}
              draggedTaskId={draggedTaskId}
              draggedFromStatus={draggedFromStatus}
              movedTaskList={movedTaskList}
              onAssignClick={isAdmin ? handleAssignClick : undefined}
              isLoading={loading}
            />
          ))}
        </div>
      </DragDropContext>

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

