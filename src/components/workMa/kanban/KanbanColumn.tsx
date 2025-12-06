'use client';

import React from 'react';
import { WorkTask, TaskStatus } from '@/src/types/workTask';
import KanbanCard from './KanbanCard';

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: WorkTask[];
  color?: string;
  borderColor?: string;
  isDraggable: boolean;
  draggedTaskId?: string | null;
  onDragStart: (e: React.DragEvent, task: WorkTask) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: TaskStatus) => void;
  onAssignClick?: (task: WorkTask) => void;
}

export default function KanbanColumn({
  title,
  status,
  tasks,
  color,
  borderColor,
  isDraggable,
  draggedTaskId,
  onDragStart,
  onDragOver,
  onDrop,
  onAssignClick,
}: KanbanColumnProps) {
  const getStatusColor = () => {
    // Use provided colors from config, or fallback to defaults
    if (color && borderColor) {
      return `${color} ${borderColor}`;
    }
    
    // Fallback to default colors
    switch (status.toUpperCase()) {
      case 'TODO':
        return 'bg-gray-100 border-gray-300';
      case 'DOING':
        return 'bg-blue-100 border-blue-300';
      case 'DONE':
        return 'bg-green-100 border-green-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  return (
    <div className="flex-1 min-w-[300px] mx-2">
      <div className={`rounded-lg border-2 p-4 h-full ${getStatusColor()}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <span className="px-3 py-1 bg-white rounded-full text-sm font-semibold text-gray-700">
            {tasks.length}
          </span>
        </div>

        <div
          className="min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto"
          style={{ transition: 'none' }}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, status)}
        >
          {tasks.length === 0 ? (
            <div className="text-center text-gray-400 py-8 text-sm">
              Không có công việc nào
            </div>
          ) : (
            tasks.map((task) => (
              <KanbanCard
                key={task.id}
                task={task}
                isDraggable={isDraggable}
                isDragging={draggedTaskId === task.id}
                onDragStart={onDragStart}
                onAssignClick={onAssignClick}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

