import { WorkTask } from "@/src/types/workTask";

interface KanbanGhostItemsProps {
  selectedTasks: WorkTask[];
  draggedTaskId: string;
}

const KanbanGhostItems = ({ selectedTasks, draggedTaskId }: KanbanGhostItemsProps) => (
  <div className="absolute top-0 left-0 w-full pointer-events-none">
    {selectedTasks
      .filter((t) => t.id !== draggedTaskId)
      .slice(0, 3)
      .map((ghostTask, ghostIndex) => (
        <div
          key={`ghost-${ghostTask.id}`}
          className="bg-blue-100 shadow-lg opacity-60 border border-blue-200 rounded-lg"
          style={{
            transform: `translateX(${(ghostIndex + 1) * 6}px) translateY(${
              (ghostIndex + 1) * 6
            }px) scale(${0.95 - ghostIndex * 0.02})`,
            zIndex: -ghostIndex - 1,
          }}
        >
          <div className="flex flex-row items-center gap-x-2 p-4">
            <div className="w-7 h-7 bg-blue-300 rounded flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded"></div>
            </div>
            <div className="font-normal text-[13px] text-blue-700">
              {ghostTask.title}
            </div>
          </div>
        </div>
      ))}
  </div>
);

export default KanbanGhostItems;

