'use client';

import React from 'react';
import { WorkTask } from '@/src/types/workTask';
import clsx from 'clsx';
import checkboxChecked from "@/assets/change-group/checkbox-checked.svg";
import checkbox from "@/assets/change-group/checkbox.svg";
import Image from "next/image";

interface KanbanCardProps {
  task: WorkTask;
  isChecked: boolean;
  onToggle: () => void;
  isDragging?: boolean;
  isInSelectedGroup?: boolean;
  selectedCount?: number;
  isDraggedStaff?: boolean;
  movedTaskList?: string[];
  onAssignClick?: (task: WorkTask) => void;
}

export default function KanbanCard({ 
  task, 
  isChecked, 
  onToggle,
  isDragging,
  isInSelectedGroup,
  selectedCount,
  isDraggedStaff,
  movedTaskList = [],
  onAssignClick 
}: KanbanCardProps) {
  return (
    <div
      className={clsx(
        "relative flex flex-row items-center gap-x-2 p-4 transition-all duration-200 cursor-pointer mt-[4px]",
        isDragging && isDraggedStaff
          ? "bg-blue-100 shadow-2xl opacity-90 transform scale-105"
          : "hover:bg-gray-50",
        isDragging && !isDraggedStaff && isInSelectedGroup
          ? "bg-blue-50 shadow-lg opacity-60"
          : "",
        Array.isArray(movedTaskList) && movedTaskList.includes(task.id) 
          ? "bg-[#F5F7FA] rounded-[8px]" 
          : "",
      )}
      onClick={onToggle}
    >
      {/* Badge hiển thị số lượng tasks trong nhóm khi kéo */}
      {isDragging && isDraggedStaff && selectedCount && selectedCount > 1 && (
        <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg z-10">
          {selectedCount}
        </div>
      )}

      <Image
        src={isChecked ? checkboxChecked : checkbox}
        alt="checkbox"
        width={28}
        height={28}
        className="cursor-pointer"
      />
      <div className="font-normal text-[15px] text-primary-2 truncate flex-1">
        {task.title}
      </div>
      {task.assignedToName && (
        <div className="font-normal text-[15px] text-primary-2">｜</div>
      )}
      {task.assignedToName && (
        <div className="font-normal text-[15px] text-primary-2 truncate">
          {task.assignedToName}
        </div>
      )}
      {onAssignClick && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAssignClick(task);
          }}
          className="flex-shrink-0 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors ml-2"
        >
          {task.assignedToName ? 'Đổi' : '+ Gán'}
        </button>
      )}
    </div>
  );
}

