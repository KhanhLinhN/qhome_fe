import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ReadingCycleDto,
  MeterReadingAssignmentDto,
  type ReadingCycleUnassignedInfoDto,
} from '@/src/services/base/waterService';
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
  unassignedInfo?: ReadingCycleUnassignedInfoDto;
  onAddAssignment?: (cycle: ReadingCycleDto) => void;
  onViewUnassigned?: (cycle: ReadingCycleDto, info: ReadingCycleUnassignedInfoDto) => void;
  assignmentBlockedReason?: string;
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
  unassignedInfo,
  onAddAssignment,
  onViewUnassigned,
  assignmentBlockedReason,
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

  const assignmentAllowed = !Boolean(assignmentBlockedReason);

  const missingMeterGroups = useMemo(() => {
    if (!unassignedInfo?.missingMeterUnits || unassignedInfo.missingMeterUnits.length === 0) {
      return [];
    }

    const map = new Map<
      string,
      { title: string; units: string[]; buildingId?: string; unitId?: string }
    >();
    unassignedInfo.missingMeterUnits.forEach((unit) => {
      const buildingLabel =
        unit.buildingCode || unit.buildingName || 'Tòa nhà chưa rõ';
      const floorLabel = unit.floor != null ? ` - Tầng ${unit.floor}` : '';
      const key = buildingLabel + floorLabel;
      const existing = map.get(key);
      const unitLabel = unit.unitCode || unit.unitId;
      if (existing) {
        existing.units.push(unitLabel);
        if (!existing.unitId) {
          existing.unitId = unit.unitId;
        }
      } else {
        map.set(key, {
          title: `${buildingLabel}${floorLabel}`,
          units: [unitLabel],
          buildingId: unit.buildingId,
          unitId: unit.unitId,
        });
      }
    });

    return Array.from(map.values());
  }, [unassignedInfo]);

  const handleAddAssignmentClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!assignmentAllowed) {
      return;
    }
    if (onAddAssignment) {
      onAddAssignment(cycle);
      return;
    }
    router.push(`/base/addAssignment?cycleId=${cycle.id}`);
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
          {assignmentBlockedReason && (
            <p className="text-xs text-red-500 mt-1">{assignmentBlockedReason}</p>
          )}
            <p className="text-sm text-gray-500">
              {cycle.serviceName
                ? `Dịch vụ: ${cycle.serviceName}`
                : cycle.serviceCode
                ? `Mã: ${cycle.serviceCode}`
                : 'Dịch vụ chưa xác định'}
            </p>
            <button
              type="button"
              onClick={(e) => {
                handleAddAssignmentClick(e);
              }}
              className={`mt-3 text-sm font-semibold ${
                assignmentAllowed ? 'text-[#02542D] hover:underline' : 'text-gray-400'
              }`}
              aria-label="Add assignment for this cycle"
              disabled={!assignmentAllowed}
            >
              Thêm assignment cho chu kỳ này
            </button>
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
                handleAddAssignmentClick(e);
              }}
              className={`px-4 py-2 text-white rounded-md transition-colors ${
                assignmentAllowed ? 'bg-[#02542D] hover:bg-[#024428]' : 'bg-gray-300 cursor-not-allowed'
              }`}
              disabled={!assignmentAllowed}
              aria-disabled={!assignmentAllowed}
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

        {assignmentBlockedReason && (
          <div className="px-4 pb-2 text-xs text-red-600">{assignmentBlockedReason}</div>
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

      {!assignmentBlockedReason && unassignedInfo?.totalUnassigned ? (
        <div className="border-t border-b border-yellow-200 bg-yellow-50 text-yellow-800 text-sm space-y-2">
          <div className="px-4 py-2 whitespace-pre-line">{unassignedInfo.message}</div>
          {onViewUnassigned && (
            <div className="px-4 pb-3 flex justify-end">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onViewUnassigned(cycle, unassignedInfo);
                }}
                className="text-xs font-semibold text-[#02542D] hover:underline"
              >
                Xem danh sách chưa được phân công
              </button>
            </div>
          )}
          {missingMeterGroups.length > 0 && (
            <div className="px-4 pb-3 border-t border-yellow-200 pt-2 text-[#6b4500] text-xs space-y-1">
              <div className="font-semibold text-sm">Các căn chưa có công tơ</div>
              {missingMeterGroups.map((group) => (
                <div key={group.title} className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-semibold">{group.title}:</span> {group.units.join(', ')}
                  </div>
                  {group.buildingId && (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/base/building/buildingDetail/${group.buildingId}?unitId=${group.unitId ?? ''}&serviceId=${cycle.serviceId}`
                        )
                      }
                      className="text-[11px] font-semibold bg-white border border-[#02542D] rounded-full px-3 py-1 text-[#02542D] hover:bg-[#02542D] hover:text-white transition"
                    >
                      Thêm công tơ
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

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

