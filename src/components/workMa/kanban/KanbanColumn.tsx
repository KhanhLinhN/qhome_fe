'use client';

import React from 'react';
import { WorkTask, TaskStatus } from '@/src/types/workTask';
import { Droppable } from "@hello-pangea/dnd";
import clsx from "clsx";
import DraggableKanbanCard from "./DraggableKanbanCard";
import SelectAllHeader from "./SelectAllHeader";

interface KanbanColumnProps {
  title: string;
  droppableId: string;
  status: TaskStatus;
  tasks: WorkTask[];
  selectedTasks: WorkTask[];
  isSelectAll: boolean;
  onToggleSelectAll: () => void;
  onToggleTaskSelection: (task: WorkTask) => void;
  isDragging: boolean;
  draggedTaskId: string;
  draggedFromStatus: string;
  movedTaskList: string[];
  onAssignClick?: (task: WorkTask) => void;
  isLoading?: boolean;
}

export default function KanbanColumn({
  title,
  droppableId,
  status,
  tasks,
  selectedTasks,
  isSelectAll,
  onToggleSelectAll,
  onToggleTaskSelection,
  isDragging,
  draggedTaskId,
  draggedFromStatus,
  movedTaskList,
  onAssignClick,
  isLoading = false,
}: KanbanColumnProps) {
  return (
    <div className="flex-1 min-w-[300px]">
      <div className="group-staff-height flex flex-col flex-1 bg-white rounded-2xl p-6 gap-2.5 min-h-[480px]">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-primary-2">{title}</h2>
          <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-semibold text-gray-700">
            {tasks.length}
          </span>
        </div>

        <SelectAllHeader
          isSelectAll={isSelectAll}
          onToggleSelectAll={onToggleSelectAll}
          taskCount={tasks.length}
          taskSelected={selectedTasks.length}
        />

        <Droppable droppableId={droppableId}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={clsx(
                "overflow-y-auto flex-1 transition-colors duration-200",
                snapshot.isDraggingOver ? "bg-blue-25" : ""
              )}
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-2 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">データ取得中。。。</p>
                  </div>
                </div>
              ) : tasks.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-sm text-gray-500 text-center px-4">
                    Không có công việc nào
                  </p>
                </div>
              ) : (
                tasks.map((task, index) => {
                  const isChecked = selectedTasks.some((t) => t.id === task.id);
                  const isInSelectedGroup = selectedTasks.length > 1 && isChecked;

                  return (
                    <DraggableKanbanCard
                      key={task.id}
                      task={task}
                      index={index}
                      isChecked={isChecked}
                      onToggle={() => onToggleTaskSelection(task)}
                      isInSelectedGroup={isInSelectedGroup}
                      selectedTasks={selectedTasks}
                      draggedTaskId={draggedTaskId}
                      isDragging={isDragging}
                      draggedFromStatus={draggedFromStatus}
                      status={status}
                      movedTaskList={movedTaskList}
                      onAssignClick={onAssignClick}
                    />
                  );
                })
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </div>
  );
}

