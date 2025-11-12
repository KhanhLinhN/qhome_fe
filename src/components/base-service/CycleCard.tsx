import React from 'react';
import { useRouter } from 'next/navigation';
import { ReadingCycleDto, MeterReadingAssignmentDto } from '@/src/services/base/waterService';
import AssignmentTable from './AssignmentTable';

interface CycleCardProps {
  cycle: ReadingCycleDto;
  assignments: MeterReadingAssignmentDto[];
  isExpanded: boolean;
  onToggle: () => void;
  onViewAssignment: (assignment: MeterReadingAssignmentDto) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  canCompleteCycle?: boolean;
  onCompleteCycle?: (cycle: ReadingCycleDto) => void;
  isCompleting?: boolean;
}

const CycleCard = ({
  cycle,
  assignments,
  isExpanded,
  onToggle,
  onViewAssignment,
  onDeleteAssignment,
  canCompleteCycle = false,
  onCompleteCycle,
  isCompleting = false,
}: CycleCardProps) => {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700';
      case 'OPEN':
        return 'bg-yellow-100 text-yellow-700';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Cycle Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-[#02542D]">{cycle.name}</h2>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(cycle.status)}`}>
                {cycle.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Period: {new Date(cycle.periodFrom).toLocaleDateString()} -{' '}
              {new Date(cycle.periodTo).toLocaleDateString()}
            </p>
          </div>
          <div className="text-sm text-gray-600">
            {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Actions */}
        {cycle.status === 'IN_PROGRESS' && (
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/base/addAssignment?cycleId=${cycle.id}`);
              }}
              className="px-4 py-2 bg-[#02542D] text-white rounded-md hover:bg-[#024428] transition-colors"
            >
              Add Assignment
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (canCompleteCycle) {
                  onCompleteCycle?.(cycle);
                }
              }}
              disabled={!canCompleteCycle || isCompleting}
              className={`px-4 py-2 rounded-md text-white transition-colors ${
                canCompleteCycle
                  ? 'bg-blue-600 hover:bg-blue-500'
                  : 'bg-gray-300 cursor-not-allowed'
              } ${isCompleting ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isCompleting ? 'Completing...' : 'Mark Cycle Completed'}
            </button>
          </div>
        )}

        {/* Expand Icon */}
        <svg
          className={`ml-4 w-5 h-5 text-gray-600 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Assignments List */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {assignments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No assignments yet for this cycle
            </div>
          ) : (
            <AssignmentTable
              assignments={assignments}
              onView={onViewAssignment}
              onDelete={onDeleteAssignment}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default CycleCard;

