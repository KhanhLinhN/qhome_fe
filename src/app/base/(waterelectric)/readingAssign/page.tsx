'use client'
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
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
} from '@/src/services/base/waterService';
import { getEmployees } from '@/src/services/iam/employeeService';
import { useNotifications } from '@/src/hooks/useNotifications';
import CycleCard from '@/src/components/base-service/CycleCard';
import AssignmentDetailsModal from '@/src/components/base-service/AssignmentDetailsModal';

interface CycleWithAssignments {
  cycle: ReadingCycleDto;
  assignments: MeterReadingAssignmentDto[];
  allAssignmentsCompleted: boolean;
}

export default function WaterAssignPage() {
  const { user, hasRole } = useAuth();
  const { show } = useNotifications();
  const [cyclesWithAssignments, setCyclesWithAssignments] = useState<CycleWithAssignments[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCycleId, setExpandedCycleId] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<MeterReadingAssignmentDto | null>(null);
  const [assignmentProgress, setAssignmentProgress] = useState<AssignmentProgressDto | null>(null);
  const [assignmentMeters, setAssignmentMeters] = useState<MeterDto[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [completingAssignmentId, setCompletingAssignmentId] = useState<string | null>(null);
  const [completingCycleId, setCompletingCycleId] = useState<string | null>(null);

  // Load cycles and assignments
  useEffect(() => {
    loadCyclesWithAssignments();
  }, []);

  const loadCyclesWithAssignments = async () => {
    try {
      setLoading(true);
      
      console.log('[WaterAssignPage] Loading reading cycles...');
      // Load cycles
      const cycles = await getAllReadingCycles();
      console.log('[WaterAssignPage] Loaded reading cycles:', cycles.map((c: ReadingCycleDto) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        periodFrom: c.periodFrom,
        periodTo: c.periodTo,
      })));
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

      // Load employees to get username mapping
      let userMap: Map<string, string> = new Map();
      try {
          const employees = await getEmployees();
          userMap = new Map(
            employees
              .filter(emp => emp.userId) // Filter out undefined userIds
              .map(emp => [emp.userId!, emp.username || emp.userId!])
          );
      } catch (error) {
        console.error('Failed to load employees:', error);
      }
      
      // Load assignments for each cycle and enrich with username and progress
      const cyclesData: CycleWithAssignments[] = await Promise.all(
        sortedCycles.map(async (cycle) => {
          try {
            const assignments = await getAssignmentsByCycle(cycle.id);
            console.log('[WaterAssignPage] Assignments for cycle', cycle.id, assignments.map((a: MeterReadingAssignmentDto) => ({
              id: a.id,
              cycleId: a.cycleId,
              completedAt: a.completedAt,
              unitCount: a.unitIds?.length ?? 0,
            })));
            
            // Enrich each assignment with username and progress
            const enrichedAssignments = await Promise.all(
              assignments.map(async (assignment) => {
                const enriched = { ...assignment, cycleId: assignment.cycleId || cycle.id };
                
                // Add username
                enriched.assignedToName = userMap.get(assignment.assignedTo) || assignment.assignedTo;
                
                // Fetch progress to enable/disable Complete button
                try {
                  const progress = await getAssignmentProgress(assignment.id);
                  // Calculate progress: readingsDone / totalUnits (same logic as in modal)
                  const totalUnits = assignment.unitIds?.length || 0;
                  const filledCount = progress.readingsDone || 0;
                  const progressPercent = totalUnits > 0 
                    ? Math.round((filledCount / totalUnits) * 100) 
                    : 0;
                  enriched.progressPercentage = progressPercent;
                } catch (error) {
                  console.error(`Failed to load progress for assignment ${assignment.id}:`, error);
                  enriched.progressPercentage = 0;
                }
                
                return enriched;
              })
            );
            const allAssignmentsCompleted = enrichedAssignments.length > 0
              ? enrichedAssignments.every(a => Boolean(a.completedAt))
              : false;
            
            return { cycle, assignments: enrichedAssignments, allAssignmentsCompleted };
          } catch (error) {
            console.error(`Failed to load assignments for cycle ${cycle.id}:`, error);
            return { cycle, assignments: [], allAssignmentsCompleted: false };
          }
        })
      );

      const activeCycles = cyclesData.filter(({ cycle }) =>
        cycle.status === 'IN_PROGRESS' || cycle.status === 'OPEN'
      );
      console.log('[WaterAssignPage] Active cycles after enrichment:', activeCycles.map(({ cycle, assignments }) => ({
        id: cycle.id,
        status: cycle.status,
        assignmentIds: assignments.map((a) => ({ id: a.id, cycleId: a.cycleId })),
      })));

      setCyclesWithAssignments(activeCycles);
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
        getMetersByAssignment(assignment.id)
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

  const handleExportInvoices = async (assignment: MeterReadingAssignmentDto) => {
    if (!assignment.cycleId) {
      show('Cannot export invoices: cycle information is missing.', 'error');
      return;
    }
    console.log('[WaterAssignPage] Export requested for assignment', {
      assignmentId: assignment.id,
      assignmentCycleId: assignment.cycleId,
      assignmentCompletedAt: assignment.completedAt,
    });
    const cycleInfo = cyclesWithAssignments.find(item => item.cycle.id === assignment.cycleId);
    if (!cycleInfo) {
      console.warn('[WaterAssignPage] Cycle not found in state for assignment', {
        assignmentId: assignment.id,
        assignmentCycleId: assignment.cycleId,
        availableCycles: cyclesWithAssignments.map(({ cycle }) => cycle.id),
      });
      show('Unable to locate cycle in current view. Please refresh the page.', 'error');
      return;
    }
    console.log('[WaterAssignPage] Export cycle data', {
      cycleId: cycleInfo.cycle.id,
      cycleStatus: cycleInfo.cycle.status,
      assignmentsInCycle: cycleInfo.assignments.map((a) => ({ id: a.id, cycleId: a.cycleId })),
      allAssignmentsCompleted: cycleInfo.allAssignmentsCompleted,
    });
    try {
      setIsExporting(true);
      if (cycleInfo.cycle.status !== 'COMPLETED') {
        if (!cycleInfo.allAssignmentsCompleted) {
          show('All assignments in this cycle must be completed before exporting invoices.', 'error');
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
      const result: MeterReadingImportResponse = await exportMeterReadingsByCycle(assignment.cycleId);
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#02542D]">Water Assignment Management</h1>
      </div>

      {loading && cyclesWithAssignments.length === 0 ? (
        <div className="bg-white p-6 rounded-xl text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#739559] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cyclesWithAssignments.map(({ cycle, assignments, allAssignmentsCompleted }) => (
            <CycleCard
              key={cycle.id}
              cycle={cycle}
              assignments={assignments}
              isExpanded={expandedCycleId === cycle.id}
              onToggle={() => toggleCycle(cycle.id)}
              onViewAssignment={handleViewAssignment}
              onDeleteAssignment={handleDeleteAssignment}
              canCompleteCycle={allAssignmentsCompleted}
              onCompleteCycle={handleCompleteCycle}
              isCompleting={completingCycleId === cycle.id}
            />
          ))}

          {cyclesWithAssignments.length === 0 && !loading && (
            <div className="bg-white p-6 rounded-xl text-center text-gray-500">
              No reading cycles found
            </div>
          )}
        </div>
      )}

      {/* Assignment Details Modal */}
      <AssignmentDetailsModal
        isOpen={isDetailsOpen}
        assignment={selectedAssignment}
        progress={assignmentProgress}
        meters={assignmentMeters}
        onClose={handleCloseModal}
        onExport={handleExportInvoices}
        isExporting={isExporting}
        onComplete={handleCompleteAssignment}
        isCompleting={Boolean(completingAssignmentId && selectedAssignment?.id === completingAssignmentId)}
      />
    </div>
  );
}
