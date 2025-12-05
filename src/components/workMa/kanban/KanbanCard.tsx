'use client';

import React from 'react';
import { WorkTask } from '@/src/types/workTask';

interface KanbanCardProps {
  task: WorkTask;
  isDraggable: boolean;
  isDragging?: boolean;
  onDragStart: (e: React.DragEvent, task: WorkTask) => void;
  onAssignClick?: (task: WorkTask) => void;
}

export default function KanbanCard({ task, isDraggable, isDragging = false, onDragStart, onAssignClick }: KanbanCardProps) {
  const getPriorityColor = (priority?: string) => {
    switch (priority?.toUpperCase()) {
      case 'URGENT':
        return 'border-l-red-600 bg-red-50';
      case 'HIGH':
        return 'border-l-orange-500 bg-orange-50';
      case 'MEDIUM':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'LOW':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-300 bg-white';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div
      draggable={isDraggable}
      onDragStart={(e) => onDragStart(e, task)}
      className={`mb-3 p-4 rounded-lg border-l-4 ${getPriorityColor(task.priority)} ${isDraggable ? 'cursor-move' : 'cursor-default'} ${isDragging ? 'opacity-50' : ''}`}
      style={{ 
        opacity: isDraggable ? (isDragging ? 0.5 : 1) : 0.7,
        boxShadow: isDragging ? 'none' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 flex-1">
          {task.title}
        </h3>
        {task.priority && (
          <span className={`ml-2 px-2 py-1 text-xs rounded ${
            task.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
            task.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
            task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {task.priority}
          </span>
        )}
      </div>

      {task.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-2">
        {task.category && (
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
            {task.category}
          </span>
        )}
        {task.location && (
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
            📍 {task.location}
          </span>
        )}
      </div>

      {task.assignedToName && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
          <div className="flex items-center text-xs text-gray-600">
            <span className="font-medium">👤 {task.assignedToName}</span>
          </div>
          {onAssignClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAssignClick(task);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Đổi
            </button>
          )}
        </div>
      )}

      {!task.assignedToName && onAssignClick && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAssignClick(task);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            + Gán công việc
          </button>
        </div>
      )}

      <div className="mt-2 text-xs text-gray-500">
        {formatDate(task.createdAt)}
      </div>
    </div>
  );
}

