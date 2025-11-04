'use client'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  getAllReadingCycles,
  getAssignmentsByCycle,
  MeterReadingAssignmentDto,
  ReadingCycleDto,
  getAssignmentProgress,
  getMetersByAssignment,
  completeAssignment,
  deleteAssignment,
  AssignmentProgressDto,
  MeterDto,
} from '@/src/services/base/waterService';
import { useNotifications } from '@/src/hooks/useNotifications';

interface CycleWithAssignments {
  cycle: ReadingCycleDto;
  assignments: MeterReadingAssignmentDto[];
}

export default function WaterAssignPage() {
  const router = useRouter();
  const { user, hasRole } = useAuth();
  const { show } = useNotifications();
  const [cyclesWithAssignments, setCyclesWithAssignments] = useState<CycleWithAssignments[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCycleId, setExpandedCycleId] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<MeterReadingAssignmentDto | null>(null);
  const [assignmentProgress, setAssignmentProgress] = useState<AssignmentProgressDto | null>(null);
  const [assignmentMeters, setAssignmentMeters] = useState<MeterDto[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Load cycles and assignments
  useEffect(() => {
    loadCyclesWithAssignments();
  }, []);

  const loadCyclesWithAssignments = async () => {
    try {
      setLoading(true);
      const cycles = await getAllReadingCycles();
      
      // Load assignments for each cycle
      const cyclesData: CycleWithAssignments[] = await Promise.all(
        cycles.map(async (cycle) => {
          try {
            const assignments = await getAssignmentsByCycle(cycle.id);
            return { cycle, assignments };
          } catch (error) {
            console.error(`Failed to load assignments for cycle ${cycle.id}:`, error);
            return { cycle, assignments: [] };
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

  const handleCompleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to mark this assignment as completed?')) return;

    try {
      await completeAssignment(assignmentId);
      show('Assignment completed successfully', 'success');
      loadCyclesWithAssignments();
      
      if (selectedAssignment?.id === assignmentId) {
        setIsDetailsOpen(false);
        setSelectedAssignment(null);
      }
    } catch (error: any) {
      show(error?.message || 'Failed to complete assignment', 'error');
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
          {cyclesWithAssignments.map(({ cycle, assignments }) => (
            <div key={cycle.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Cycle Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleCycle(cycle.id)}
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
                      Period: {new Date(cycle.periodFrom).toLocaleDateString()} - {new Date(cycle.periodTo).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-sm text-gray-600">
                    {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Add Assignment Button */}
                {cycle.status === 'IN_PROGRESS' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/base/addAssignment?cycleId=${cycle.id}`);
                    }}
                    className="ml-4 px-4 py-2 bg-[#02542D] text-white rounded-md hover:bg-[#024428] transition-colors"
                  >
                    Add Assignment
                  </button>
                )}

                {/* Expand Icon */}
                <svg
                  className={`ml-4 w-5 h-5 text-gray-600 transition-transform ${
                    expandedCycleId === cycle.id ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Assignments List */}
              {expandedCycleId === cycle.id && (
                <div className="border-t border-gray-200">
                  {assignments.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No assignments yet for this cycle
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Building</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Service</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Floors</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Assigned To</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Period</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Created</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Completed</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignments.map((assignment) => (
                            <tr key={assignment.id} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-[#024023]">
                                {assignment.buildingName || assignment.buildingCode || 'All Buildings'}
                              </td>
                              <td className="px-4 py-3 text-sm text-[#024023]">
                                {assignment.serviceName || assignment.serviceCode}
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-[#024023]">
                                {assignment.floorFrom != null && assignment.floorTo != null
                                  ? `${assignment.floorFrom}-${assignment.floorTo}`
                                  : 'All Floors'}
                              </td>
                              <td className="px-4 py-3 text-sm text-[#024023] font-medium">
                                {assignment.assignedTo}
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-[#024023]">
                                {new Date(assignment.startDate).toLocaleDateString()} - {new Date(assignment.endDate).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-[#024023]">
                                {new Date(assignment.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-[#024023]">
                                {assignment.completedAt 
                                  ? new Date(assignment.completedAt).toLocaleDateString()
                                  : '-'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => handleViewAssignment(assignment)}
                                    className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs"
                                  >
                                    View
                                  </button>
                                  {!assignment.completedAt && (
                                    <button
                                      onClick={() => handleCompleteAssignment(assignment.id)}
                                      className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-xs"
                                    >
                                      Complete
                                    </button>
                                  )}
                                  {!assignment.completedAt && (
                                    <button
                                      onClick={() => handleDeleteAssignment(assignment.id)}
                                      className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-xs"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {cyclesWithAssignments.length === 0 && !loading && (
            <div className="bg-white p-6 rounded-xl text-center text-gray-500">
              No reading cycles found
            </div>
          )}
        </div>
      )}

      {/* Assignment Details Modal */}
      {isDetailsOpen && selectedAssignment && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#E7E4E8CC]/80 z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-auto relative">
            <button
              onClick={() => {
                setIsDetailsOpen(false);
                setSelectedAssignment(null);
                setAssignmentProgress(null);
                setAssignmentMeters([]);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" height="16" width="16">
                <g fill="none" fillRule="evenodd">
                  <path d="M16 0v16H0V0h16Z"></path>
                  <path fill="#000000" d="m8 9.414666666666665 3.535333333333333 3.535333333333333a1 1 0 0 0 1.4146666666666665 -1.4146666666666665L9.413333333333332 8l3.536 -3.535333333333333a1 1 0 1 0 -1.4146666666666665 -1.414L8 6.585999999999999 4.464666666666666 3.0506666666666664a1 1 0 1 0 -1.4146666666666665 1.4133333333333333L6.586666666666667 8l-3.536 3.536a1 1 0 1 0 1.4146666666666665 1.4133333333333333L8 9.415333333333333Z" strokeWidth="0.6667"></path>
                </g>
              </svg>
            </button>

            <h2 className="text-2xl font-bold text-[#02542D] mb-6">Assignment Details</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-[#02542D] mb-2">Assignment Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Cycle</label>
                    <p className="text-[#024023] font-semibold">{selectedAssignment.cycleName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Building</label>
                    <p className="text-[#024023] font-semibold">
                      {selectedAssignment.buildingName || selectedAssignment.buildingCode || 'All Buildings'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Service</label>
                    <p className="text-[#024023] font-semibold">
                      {selectedAssignment.serviceName} ({selectedAssignment.serviceCode})
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Assigned To</label>
                    <p className="text-[#024023] font-semibold">{selectedAssignment.assignedTo}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Floors</label>
                    <p className="text-[#024023] font-semibold">
                      {selectedAssignment.floorFrom != null && selectedAssignment.floorTo != null
                        ? `Floor ${selectedAssignment.floorFrom} - ${selectedAssignment.floorTo}`
                        : 'All Floors'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Period</label>
                    <p className="text-[#024023] font-semibold">
                      {new Date(selectedAssignment.startDate).toLocaleDateString()} - {new Date(selectedAssignment.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Assigned At</label>
                    <p className="text-[#024023] font-semibold">
                      {new Date(selectedAssignment.assignedAt).toLocaleString()}
                    </p>
                  </div>
                  {selectedAssignment.completedAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Completed At</label>
                      <p className="text-[#024023] font-semibold">
                        {new Date(selectedAssignment.completedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {selectedAssignment.note && (
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-700">Note</label>
                      <p className="text-[#024023]">{selectedAssignment.note}</p>
                    </div>
                  )}
                </div>
              </div>

              {assignmentProgress && (
                <div>
                  <h3 className="text-lg font-semibold text-[#02542D] mb-2">Progress</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-2">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-sm font-semibold text-[#024023]">
                          {assignmentProgress.progressPercentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-[#739559] h-2.5 rounded-full transition-all"
                          style={{ width: `${assignmentProgress.progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Total Meters</label>
                        <p className="text-xl font-bold text-[#024023]">{assignmentProgress.totalMeters}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Read Meters</label>
                        <p className="text-xl font-bold text-green-600">{assignmentProgress.readMeters}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Remaining</label>
                        <p className="text-xl font-bold text-orange-600">{assignmentProgress.remainingMeters}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {assignmentMeters.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-[#02542D] mb-2">Meters in Assignment</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-solid border-[#14AE5C]">
                          <th className="px-4 py-3 text-left text-sm font-bold text-[#024023] uppercase">Meter Code</th>
                          <th className="px-4 py-3 text-center text-sm font-bold text-[#024023] uppercase">Type</th>
                          <th className="px-4 py-3 text-center text-sm font-bold text-[#024023] uppercase">Last Reading</th>
                          <th className="px-4 py-3 text-center text-sm font-bold text-[#024023] uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignmentMeters.map((meter) => (
                          <tr key={meter.id} className="border-b border-gray-200">
                            <td className="px-4 py-3 text-[#024023] font-semibold">{meter.meterCode}</td>
                            <td className="px-4 py-3 text-center text-[#024023] font-semibold">{meter.meterType}</td>
                            <td className="px-4 py-3 text-center text-[#024023] font-semibold">
                              {meter.lastReading != null ? meter.lastReading : '-'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                meter.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {meter.active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
