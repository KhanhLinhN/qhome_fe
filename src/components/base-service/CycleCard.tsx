'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ReadingCycleDto,
  MeterReadingAssignmentDto,
  type ReadingCycleUnassignedInfoDto,
  createMissingMeters,
} from '@/src/services/base/waterService';
import AssignmentTable from './AssignmentTable';
import { useNotifications } from '@/src/hooks/useNotifications';

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
  onViewCycle?: (cycle: ReadingCycleDto) => void;
  assignmentBlockedReason?: string;
  onMetersCreated?: () => void;
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
  onViewCycle,
  assignmentBlockedReason,
  onMetersCreated,
}: CycleCardProps) => {
  const router = useRouter();
  const { show } = useNotifications();
  const [creatingMeters, setCreatingMeters] = useState<Set<string>>(new Set());

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
      { 
        title: string; 
        units: string[]; 
        unitIds: string[];
        buildingId?: string; 
        unitId?: string;
      }
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
        existing.unitIds.push(unit.unitId);
        if (!existing.unitId) {
          existing.unitId = unit.unitId;
        }
      } else {
        map.set(key, {
          title: `${buildingLabel}${floorLabel}`,
          units: [unitLabel],
          unitIds: [unit.unitId],
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

  const handleCreateMeters = async (
    event: React.MouseEvent<HTMLButtonElement>,
    group: { title: string; units: string[]; unitIds: string[]; buildingId?: string; unitId?: string }
  ) => {
    event.stopPropagation();
    
    if (!cycle.serviceId) {
      show('Không tìm thấy thông tin dịch vụ', 'error');
      return;
    }

    if (!group.buildingId) {
      show('Không tìm thấy thông tin tòa nhà', 'error');
      return;
    }

    const groupKey = `${group.buildingId}-${group.title}`;
    setCreatingMeters(prev => new Set(prev).add(groupKey));

    try {
      // Tạo công tơ cho tất cả units thiếu trong building này
      const createdMeters = await createMissingMeters(cycle.serviceId, group.buildingId);
      
      show(
        `Đã tự động tạo ${createdMeters.length} công tơ cho ${group.units.length} căn hộ trong ${group.title}`,
        'success'
      );
      
      // Callback to reload data if provided
      if (onMetersCreated) {
        onMetersCreated();
      } else {
        // Fallback: reload page after a short delay to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Không thể tạo công tơ';
      show(errorMessage, 'error');
    } finally {
      setCreatingMeters(prev => {
        const newSet = new Set(prev);
        newSet.delete(groupKey);
        return newSet;
      });
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
        <div className="flex items-center gap-2 ml-4">
          {onViewCycle && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewCycle(cycle);
              }}
              className="px-4 py-2 text-white bg-[#02542D] hover:bg-[#024428] rounded-md transition-colors"
            >
              View Cycle
            </button>
          )}
        </div>

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
              {missingMeterGroups.map((group) => {
                const groupKey = `${group.buildingId}-${group.title}`;
                const isCreating = creatingMeters.has(groupKey);
                
                return (
                  <div key={group.title} className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-semibold">{group.title}:</span> {group.units.join(', ')}
                    </div>
                    {group.buildingId && cycle.serviceId && (
                      <button
                        type="button"
                        onClick={(e) => handleCreateMeters(e, group)}
                        disabled={isCreating}
                        className={`text-[11px] font-semibold bg-white border border-[#02542D] rounded-full px-3 py-1 text-[#02542D] hover:bg-[#02542D] hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${
                          isCreating ? 'animate-pulse' : ''
                        }`}
                      >
                        {isCreating ? 'Đang tạo...' : 'Thêm công tơ'}
                      </button>
                    )}
                  </div>
                );
              })}
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

