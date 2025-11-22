'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAllReadingCycles,
  getAssignmentsByCycle,
  MeterReadingAssignmentDto,
  ReadingCycleDto,
  getAssignmentProgress,
  getMetersByAssignment,
  deleteAssignment,
  AssignmentProgressDto,
  MeterDto,
  exportMeterReadingsByCycle,
  MeterReadingImportResponse,
  completeAssignment,
  changeReadingCycleStatus,
  getCycleUnassignedInfo,
  type ReadingCycleUnassignedInfoDto,
} from '@/src/services/base/waterService';
import { getEmployees } from '@/src/services/iam/employeeService';
import { useNotifications } from '@/src/hooks/useNotifications';
import CycleCard from '@/src/components/base-service/CycleCard';
import AssignmentDetailsModal from '@/src/components/base-service/AssignmentDetailsModal';
import CycleDetailsModal from '@/src/components/base-service/CycleDetailsModal';

const getCycleReferenceDate = (cycle: ReadingCycleDto): Date | null => {
  const source = cycle.periodFrom || cycle.fromDate || cycle.periodTo || cycle.toDate;
  if (!source) {
    return null;
  }
  const parsed = new Date(source);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatMonthLabel = (date: Date | null): string => {
  if (!date) {
    return 'tháng chưa xác định';
  }
  return date.toLocaleString('vi-VN', { month: 'long', year: 'numeric' });
};

type UnassignedFloorDto = ReadingCycleUnassignedInfoDto['floors'][number];

interface CycleWithAssignments {
  cycle: ReadingCycleDto;
  assignments: MeterReadingAssignmentDto[];
  allAssignmentsCompleted: boolean;
  unassignedInfo?: ReadingCycleUnassignedInfoDto | null;
  canCompleteCycle: boolean;
}

interface ServiceCycleGroup {
  serviceId: string;
  serviceName: string | null;
  serviceCode: string | null;
  cycles: CycleWithAssignments[];
}

interface ReadingAssignDashboardProps {
  serviceCode?: string;
  serviceLabel?: string;
}

export default function ReadingAssignDashboard({
  serviceCode,
  serviceLabel,
}: ReadingAssignDashboardProps) {
  const router = useRouter();
  const { show } = useNotifications();
  const [cyclesWithAssignments, setCyclesWithAssignments] = useState<CycleWithAssignments[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCycleId, setExpandedCycleId] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<MeterReadingAssignmentDto | null>(null);
  const [assignmentProgress, setAssignmentProgress] = useState<AssignmentProgressDto | null>(null);
  const [assignmentMeters, setAssignmentMeters] = useState<MeterDto[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<CycleWithAssignments | null>(null);
  const [isCycleDetailsOpen, setIsCycleDetailsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [completingAssignmentId, setCompletingAssignmentId] = useState<string | null>(null);
  const [completingCycleId, setCompletingCycleId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activeUnassignedModal, setActiveUnassignedModal] = useState<{
    cycle: ReadingCycleDto;
    info: ReadingCycleUnassignedInfoDto;
    assignmentAllowed: boolean;
  } | null>(null);

  const normalizedServiceCode = serviceCode?.toUpperCase();
  const currentDate = useMemo(() => new Date(), []);
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentMonthLabel = currentDate.toLocaleString('vi-VN', { month: 'long', year: 'numeric' });

  const isCycleCurrentMonth = useCallback(
    (cycle: ReadingCycleDto) => {
      const referenceDate = getCycleReferenceDate(cycle);
      if (!referenceDate) {
        return false;
      }
      return (
        referenceDate.getFullYear() === currentYear && referenceDate.getMonth() === currentMonth
      );
    },
    [currentYear, currentMonth]
  );

  const hasRestrictedCycles = useMemo(
    () => cyclesWithAssignments.some(({ cycle }) => !isCycleCurrentMonth(cycle)),
    [cyclesWithAssignments, isCycleCurrentMonth]
  );

  const handleOpenUnassignedModal = useCallback(
    (cycle: ReadingCycleDto, info: ReadingCycleUnassignedInfoDto) => {
      const assignmentAllowed = isCycleCurrentMonth(cycle);
      setActiveUnassignedModal({ cycle, info, assignmentAllowed });
    },
    [isCycleCurrentMonth]
  );

  const handleCloseUnassignedModal = useCallback(() => {
    setActiveUnassignedModal(null);
  }, []);

  const buildingGroups = useMemo(() => {
    const info = activeUnassignedModal?.info;
    if (!info?.floors) {
      return [];
    }
    const map = new Map<
      string,
      {
        key: string;
        buildingId?: string;
        buildingCode?: string;
        buildingName?: string;
        floors: UnassignedFloorDto[];
      }
    >();

    for (const floor of info.floors) {
      const key = floor.buildingId ?? floor.buildingCode ?? floor.buildingName ?? 'unknown';
      const existing = map.get(key);
      if (existing) {
        existing.floors.push(floor);
        continue;
      }
      map.set(key, {
        key,
        buildingId: floor.buildingId ?? undefined,
        buildingCode: floor.buildingCode ?? undefined,
        buildingName: floor.buildingName ?? undefined,
        floors: [floor],
      });
    }

    return Array.from(map.values());
  }, [activeUnassignedModal]);

  const handleAssignBuilding = useCallback(
    (buildingId?: string) => {
      if (!activeUnassignedModal || !buildingId) return;
      if (!activeUnassignedModal.assignmentAllowed) {
        show('Chỉ được phân công chu kỳ trong tháng hiện tại', 'error');
        return;
      }
      const params = new URLSearchParams();
      params.set('cycleId', activeUnassignedModal.cycle.id);
      params.set('serviceId', activeUnassignedModal.info.serviceId);
      params.set('buildingId', buildingId);
      router.push(`/base/addAssignment?${params.toString()}`);
      setActiveUnassignedModal(null);
    },
    [activeUnassignedModal, router, show]
  );

  const handleAddAssignment = (cycle: ReadingCycleDto) => {
    const params = new URLSearchParams();
    params.set('cycleId', cycle.id);
    if (serviceCode) {
      params.set('serviceCode', serviceCode);
    }
    router.push(`/base/addAssignment?${params.toString()}`);
  };

  // Load cycles and assignments
  useEffect(() => {
    loadCyclesWithAssignments();
  }, [normalizedServiceCode]);

  const filteredCycles = useMemo(() => {
    if (statusFilter === 'ALL') {
      return cyclesWithAssignments;
    }
    return cyclesWithAssignments.filter(({ cycle }) => cycle.status === statusFilter);
  }, [cyclesWithAssignments, statusFilter]);

  const serviceCycleGroups = useMemo<ServiceCycleGroup[]>(() => {
    const groups = new Map<string, ServiceCycleGroup>();
    for (const cycleInfo of filteredCycles) {
      const serviceKey = cycleInfo.cycle.serviceId ?? 'unknown-service';
      const existing = groups.get(serviceKey);
      if (existing) {
        existing.cycles.push(cycleInfo);
        continue;
      }
      groups.set(serviceKey, {
        serviceId: serviceKey,
        serviceName: cycleInfo.cycle.serviceName ?? null,
        serviceCode: cycleInfo.cycle.serviceCode ?? null,
        cycles: [cycleInfo],
      });
    }
    return Array.from(groups.values());
  }, [filteredCycles]);

  const loadCyclesWithAssignments = async () => {
    try {
      setLoading(true);

      const cycles = await getAllReadingCycles();

      const parseDate = (...values: (string | null | undefined)[]) => {
        for (const value of values) {
          if (!value) continue;
          const time = new Date(value).getTime();
          if (!Number.isNaN(time)) {
            return time;
          }
        }
        return 0;
      };

      const sortedCycles = [...cycles].sort(
        (a, b) =>
          parseDate(b.periodFrom, b.fromDate, b.createdAt, b.updatedAt) -
          parseDate(a.periodFrom, a.fromDate, a.createdAt, a.updatedAt)
      );

      const relevantCycles = normalizedServiceCode
        ? sortedCycles.filter((cycle) => cycle.serviceCode?.toUpperCase() === normalizedServiceCode)
        : sortedCycles;

      let userMap: Map<string, string> = new Map();
      try {
        const employees = await getEmployees();
        userMap = new Map(
          employees
            .filter((emp) => emp.userId)
            .map((emp) => [emp.userId!, emp.username || emp.userId!])
        );
      } catch (error) {
        console.error('Failed to load employees:', error);
      }

      const cyclesData: CycleWithAssignments[] = await Promise.all(
        relevantCycles.map(async (cycle) => {
          try {
            const assignments = await getAssignmentsByCycle(cycle.id);
            const enrichedAssignments = await Promise.all(
              assignments.map(async (assignment) => {
                const enriched = { ...assignment, cycleId: assignment.cycleId || cycle.id };

                enriched.assignedToName = userMap.get(assignment.assignedTo) || assignment.assignedTo;

                try {
                  const progress = await getAssignmentProgress(assignment.id);
                  const totalUnits = assignment.unitIds?.length || 0;
                  const filledCount = progress.readingsDone || 0;
                  enriched.progressPercentage =
                    totalUnits > 0 ? Math.round((filledCount / totalUnits) * 100) : 0;
                } catch (error) {
                  console.error(`Failed to load progress for assignment ${assignment.id}:`, error);
                  enriched.progressPercentage = 0;
                }

                return enriched;
              })
            );

            const allAssignmentsCompleted =
              enrichedAssignments.length > 0
                ? enrichedAssignments.every((a) => Boolean(a.completedAt))
                : false;

            let unassignedInfo: ReadingCycleUnassignedInfoDto | null = null;
            try {
              unassignedInfo = await getCycleUnassignedInfo(cycle.id);
            } catch (error) {
              console.warn(
                `[ReadingAssignDashboard] Failed to load unassigned info for cycle ${cycle.id}:`,
                error
              );
            }

            const canCompleteCycle = allAssignmentsCompleted && !(unassignedInfo?.totalUnassigned ?? 0);

            return {
              cycle,
              assignments: enrichedAssignments,
              allAssignmentsCompleted,
              unassignedInfo,
              canCompleteCycle,
            };
          } catch (error) {
            console.error(`Failed to load assignments for cycle ${cycle.id}:`, error);
            return {
              cycle,
              assignments: [],
              allAssignmentsCompleted: false,
              unassignedInfo: null,
              canCompleteCycle: false,
            };
          }
        })
      );

      setCyclesWithAssignments(cyclesData);
    } catch (error) {
      console.error('Failed to load cycles:', error);
      show('Failed to load cycles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAssignment = async (assignment: MeterReadingAssignmentDto) => {
    try {
      setLoading(true);
      const [progress, meters] = await Promise.all([
        getAssignmentProgress(assignment.id),
        getMetersByAssignment(assignment.id),
      ]);

      setSelectedAssignment(assignment);
      setAssignmentProgress(progress);
      setAssignmentMeters(meters);
      setIsDetailsOpen(true);
    } catch (error: any) {
      show(error?.message || 'Failed to load assignment details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) return;

    try {
      await deleteAssignment(assignmentId);
      show('Assignment deleted successfully', 'success');
      loadCyclesWithAssignments();

      if (selectedAssignment?.id === assignmentId) {
        setIsDetailsOpen(false);
        setSelectedAssignment(null);
      }
    } catch (error: any) {
      show(error?.message || 'Failed to delete assignment', 'error');
    }
  };

  const toggleCycle = (cycleId: string) => {
    setExpandedCycleId(expandedCycleId === cycleId ? null : cycleId);
  };

  const handleCloseModal = () => {
    setIsDetailsOpen(false);
    setSelectedAssignment(null);
    setAssignmentProgress(null);
    setAssignmentMeters([]);
  };

  const handleViewCycle = (cycle: ReadingCycleDto) => {
    const cycleInfo = cyclesWithAssignments.find((item) => item.cycle.id === cycle.id);
    if (cycleInfo) {
      setSelectedCycle(cycleInfo);
      setIsCycleDetailsOpen(true);
    }
  };

  const handleCloseCycleModal = () => {
    setIsCycleDetailsOpen(false);
    setSelectedCycle(null);
  };

  const handleExportInvoices = async (cycle: ReadingCycleDto) => {
    const cycleInfo = cyclesWithAssignments.find((item) => item.cycle.id === cycle.id);
    if (!cycleInfo) {
      show('Unable to locate cycle in current view. Please refresh the page.', 'error');
      return;
    }

    try {
      setIsExporting(true);
      if (cycleInfo.cycle.status !== 'COMPLETED') {
        if (!cycleInfo.allAssignmentsCompleted) {
          show('All assignments in this cycle must be completed before exporting invoices.', 'error');
          return;
        }
        if ((cycleInfo.unassignedInfo?.totalUnassigned ?? 0) > 0) {
          const missingMessage =
            cycleInfo.unassignedInfo?.message ||
            'Còn một số căn hộ chưa được assign. Vui lòng kiểm tra lại.';
          show(missingMessage, 'error');
          return;
        }
        try {
          setCompletingCycleId(cycleInfo.cycle.id);
          await changeReadingCycleStatus(cycleInfo.cycle.id, 'COMPLETED');
          show('Cycle marked as completed. Proceeding with invoice export.', 'success');
        } catch (err: any) {
          const msg = err?.response?.data?.message || err?.message || 'Failed to update cycle status.';
          show(msg, 'error');
          return;
        } finally {
          setCompletingCycleId(null);
        }
      }
      const result: MeterReadingImportResponse = await exportMeterReadingsByCycle(cycle.id);
      const successMessage =
        result.message ||
        `Exported ${result.invoicesCreated} invoices from ${result.totalReadings} readings.`;
      show(successMessage, 'success');
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to export invoices. Please try again.';
      show(message, 'error');
    } finally {
      setIsExporting(false);
      await loadCyclesWithAssignments();
    }
  };

  const handleCompleteAssignment = async (assignment: MeterReadingAssignmentDto) => {
    if (!assignment.id) return;
    if (!confirm('Mark this assignment as completed?')) return;
    try {
      setCompletingAssignmentId(assignment.id);
      await completeAssignment(assignment.id);
      show('Assignment marked as completed.', 'success');
      await handleViewAssignment(assignment);
      await loadCyclesWithAssignments();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to complete assignment. Please try again.';
      show(message, 'error');
    } finally {
      setCompletingAssignmentId(null);
    }
  };

  const handleCompleteCycle = async (cycle: ReadingCycleDto) => {
    if (!cycle.id) return;
    if (!confirm('Mark this reading cycle as completed?')) return;
    try {
      setCompletingCycleId(cycle.id);
      await changeReadingCycleStatus(cycle.id, 'COMPLETED');
      show('Reading cycle marked as completed.', 'success');
      await loadCyclesWithAssignments();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to complete cycle. Please try again.';
      show(message, 'error');
    } finally {
      setCompletingCycleId(null);
    }
  };

  return (
    <div className="px-[41px] py-12">
      <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Assignment Management</p>
          <h1 className="text-2xl font-semibold text-[#02542D]">
            {serviceLabel ? `${serviceLabel} - Assignment Management` : 'Assignment Management'}
          </h1>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex items-center gap-2">
            <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Lọc theo trạng thái:
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#02542D] focus:border-transparent"
            >
              <option value="ALL">Tất cả</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>
          {serviceLabel && (
            <Link
              href="/base/readingAssign"
              className="text-sm text-[#02542D] font-semibold hover:underline whitespace-nowrap"
            >
              ← Chọn dịch vụ khác
            </Link>
          )}
        </div>
      </div>
      {hasRestrictedCycles && (
        <div className="text-sm text-gray-500 mb-4">
          Chỉ tạo assignment trong tháng {currentMonthLabel}; các chu kỳ còn lại chỉ để tham khảo.
        </div>
      )}

      {loading && cyclesWithAssignments.length === 0 ? (
        <div className="bg-white p-6 rounded-xl text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#739559] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {serviceCycleGroups.length === 0 ? (
            <div className="bg-white p-6 rounded-xl text-center text-gray-500">
              No reading cycles found
            </div>
          ) : (
            serviceCycleGroups.map((group) => (
              <section key={group.serviceId} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Dịch vụ
                    </p>
                    <h2 className="text-lg font-semibold text-[#02542D]">
                      {group.serviceName || group.serviceCode || 'Dịch vụ chưa xác định'}
                    </h2>
                    {group.serviceCode && (
                      <p className="text-sm text-gray-500">
                        Mã dịch vụ: {group.serviceCode}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-500">
                    {group.cycles.length} chu kỳ
                  </span>
                </div>

                <div className="mt-6 space-y-4">
                  {group.cycles.map(({ cycle, assignments, unassignedInfo, canCompleteCycle }) => {
                    const cycleMonthLabel = formatMonthLabel(getCycleReferenceDate(cycle));
                    let assignmentBlockedReason: string | undefined;
                    if (!isCycleCurrentMonth(cycle)) {
                      assignmentBlockedReason = `Chu kỳ ${cycleMonthLabel} chỉ được giao trong tháng ${cycleMonthLabel}.`;
                    } else if (cycle.status !== 'IN_PROGRESS') {
                      assignmentBlockedReason = 'Chu kỳ chưa chuyển sang trạng thái IN_PROGRESS nên chưa thể phân công.';
                    }
                    return (
                      <CycleCard
                        key={cycle.id}
                        cycle={cycle}
                        assignments={assignments}
                        isExpanded={expandedCycleId === cycle.id}
                        onToggle={() => toggleCycle(cycle.id)}
                        onViewAssignment={handleViewAssignment}
                        onDeleteAssignment={handleDeleteAssignment}
                        canCompleteCycle={canCompleteCycle}
                        unassignedInfo={unassignedInfo ?? undefined}
                        onCompleteCycle={handleCompleteCycle}
                        isCompleting={completingCycleId === cycle.id}
                        onAddAssignment={handleAddAssignment}
                        onViewUnassigned={handleOpenUnassignedModal}
                        onViewCycle={handleViewCycle}
                        assignmentBlockedReason={assignmentBlockedReason}
                      />
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      )}

      <AssignmentDetailsModal
        isOpen={isDetailsOpen}
        assignment={selectedAssignment}
        progress={assignmentProgress}
        meters={assignmentMeters}
        onClose={handleCloseModal}
        onComplete={handleCompleteAssignment}
        isCompleting={Boolean(completingAssignmentId && selectedAssignment?.id === completingAssignmentId)}
      />
      {selectedCycle && (
        <CycleDetailsModal
          isOpen={isCycleDetailsOpen}
          cycle={selectedCycle.cycle}
          assignments={selectedCycle.assignments}
          unassignedInfo={selectedCycle.unassignedInfo}
          allAssignmentsCompleted={selectedCycle.allAssignmentsCompleted}
          canCompleteCycle={selectedCycle.canCompleteCycle}
          onClose={handleCloseCycleModal}
          onExport={handleExportInvoices}
          isExporting={isExporting}
          onCompleteCycle={handleCompleteCycle}
          isCompleting={completingCycleId === selectedCycle.cycle.id}
        />
      )}
      {activeUnassignedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-w-4xl w-full rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden">
            <div className="flex items-start justify-between gap-4 px-6 py-4 border-b">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-gray-500">Chưa phân công</p>
                <h3 className="text-lg font-semibold text-[#02542D]">
                  Chu kỳ {activeUnassignedModal.cycle.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {activeUnassignedModal.info.totalUnassigned} căn hộ chưa được assign.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseUnassignedModal}
                className="text-gray-500 hover:text-gray-900 text-sm"
              >
                Đóng
              </button>
            </div>
            <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {activeUnassignedModal.info.message}
              </p>
              {buildingGroups.length === 0 ? (
                <p className="text-sm text-gray-500">Không có dữ liệu chi tiết.</p>
              ) : (
                <div className="space-y-4">
                  {buildingGroups.map((group) => (
                    <div key={group.key} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {group.buildingCode || group.buildingName || 'Tòa nhà chưa rõ'}
                          </p>
                          {group.buildingName && group.buildingName !== group.buildingCode && (
                            <p className="text-xs text-gray-500">{group.buildingName}</p>
                          )}
                        </div>
                        <div>
                          <button
                            type="button"
                            disabled={!group.buildingId || !activeUnassignedModal.assignmentAllowed}
                            onClick={() => handleAssignBuilding(group.buildingId)}
                            className="text-xs font-semibold text-[#02542D] hover:underline disabled:text-gray-400"
                          >
                            {group.buildingId
                              ? activeUnassignedModal.assignmentAllowed
                                ? 'Tạo assignment cho tòa này'
                                : 'Chu kỳ chưa được mở'
                              : 'Không có ID tòa'}
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-gray-700">
                        {group.floors.map((floor) => (
                          <div key={`${group.key}-${floor.floor}-${floor.unitCodes.join(',')}`}>
                            <span className="font-semibold">
                              Tầng {floor.floor ?? 'N/A'}:
                            </span>{' '}
                            {floor.unitCodes.join(', ')}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



