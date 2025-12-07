import { WorkTask } from "@/src/types/workTask";
import { Draggable } from "@hello-pangea/dnd";
import KanbanGhostItems from "./KanbanGhostItems";
import KanbanCard from "./KanbanCard";

interface DraggableKanbanCardProps {
  task: WorkTask;
  index: number;
  isChecked: boolean;
  onToggle: () => void;
  isInSelectedGroup: boolean;
  selectedTasks: WorkTask[];
  draggedTaskId: string;
  isDragging: boolean;
  draggedFromStatus: string;
  status: string;
  movedTaskList: string[];
  onAssignClick?: (task: WorkTask) => void;
}

const DraggableKanbanCard = ({
  task,
  index,
  isChecked,
  onToggle,
  isInSelectedGroup,
  selectedTasks,
  draggedTaskId,
  isDragging,
  draggedFromStatus,
  status,
  movedTaskList,
  onAssignClick,
}: DraggableKanbanCardProps) => {
  const isDraggedTask = task.id === draggedTaskId;

  // Ẩn task được chọn khi đang kéo (trừ task đang được kéo)
  const shouldHide =
    isDragging &&
    draggedFromStatus === status &&
    isChecked &&
    !isDraggedTask &&
    selectedTasks.length > 1;

  if (shouldHide) {
    return null;
  }

  return (
    <Draggable
      key={task.id}
      draggableId={task.id}
      index={index}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
          }}
        >
          <KanbanCard
            task={task}
            isChecked={isChecked}
            onToggle={onToggle}
            isDragging={snapshot.isDragging}
            isInSelectedGroup={isInSelectedGroup}
            selectedCount={
              isChecked && selectedTasks.length > 1
                ? selectedTasks.length
                : undefined
            }
            isDraggedStaff={snapshot.isDragging}
            movedTaskList={movedTaskList}
            onAssignClick={onAssignClick}
          />

          {/* Hiển thị ghost items khi kéo nhóm */}
          {snapshot.isDragging && isChecked && selectedTasks.length > 1 && (
            <KanbanGhostItems
              selectedTasks={selectedTasks}
              draggedTaskId={task.id}
            />
          )}
        </div>
      )}
    </Draggable>
  );
};

export default DraggableKanbanCard;

