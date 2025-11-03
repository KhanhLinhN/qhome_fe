'use client'
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/src/contexts/AuthContext';
import { getBuildings, Building } from '@/src/services/base/buildingService';
import { getUnitsByBuilding, Unit } from '@/src/services/base/unitService';
import Select from '@/src/components/customer-interaction/Select';
import {
  getMetersByBuilding,
  MeterDto,
  createMeterReadingAssignment,
  MeterReadingAssignmentCreateReq,
  getAssignmentsByCycle,
  MeterReadingAssignmentDto,
  getAllReadingCycles,
  getAssignmentById,
  getAssignmentsByStaff,
  getActiveAssignmentsByStaff,
  getMyAssignments,
  getMyActiveAssignments,
  completeAssignment,
  getMetersByAssignment,
  getAssignmentProgress,
  deleteAssignment,
  AssignmentProgressDto,
} from '@/src/services/base/waterService';
import { useNotifications } from '@/src/hooks/useNotifications';
import { useWaterPage } from '@/src/hooks/useWaterPage';

interface MeasuredApartment {
  unitId: string;
  unitName: string;
  unitCode: string;
  floor: number;
  measuredDate: string;
  reading: number;
  meterId: string;
}

interface UnmeasuredFloor {
  floor: number;
  apartments: Unit[];
}

export default function WaterAssignPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, hasRole } = useAuth();
  const { show } = useNotifications();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(
    searchParams.get('buildingId') || ''
  );
  const [waterServiceId, setWaterServiceId] = useState<string | null>(null);
  const [activeCycleId, setActiveCycleId] = useState<string | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [meters, setMeters] = useState<MeterDto[]>([]);
  const [measuredApartments, setMeasuredApartments] = useState<MeasuredApartment[]>([]);
  const [unmeasuredFloors, setUnmeasuredFloors] = useState<UnmeasuredFloor[]>([]);
  const [assignments, setAssignments] = useState<MeterReadingAssignmentDto[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<MeterReadingAssignmentDto[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<MeterReadingAssignmentDto | null>(null);
  const [assignmentProgress, setAssignmentProgress] = useState<AssignmentProgressDto | null>(null);
  const [assignmentMeters, setAssignmentMeters] = useState<MeterDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedFloors, setSelectedFloors] = useState<number[]>([]);
  const [assignedTo, setAssignedTo] = useState<string>(''); // Staff ID to assign to
  const [viewMode, setViewMode] = useState<'all' | 'my' | 'active'>('all');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');

  // Use water page hook
  const {
    loading: hookLoading,
    error: hookError,
    createAssignment,
    refresh,
  } = useWaterPage({
    buildingId: selectedBuildingId,
    serviceId: waterServiceId || undefined,
    autoLoad: false,
  });

  // Load buildings on mount
  useEffect(() => {
    const loadBuildings = async () => {
      try {
        setLoading(true);
        const data = await getBuildings();
        if (hasRole('admin')) {
          setBuildings(data);
        } else {
          const filtered = data.filter(b => b.tenantId === user?.tenantId);
          setBuildings(filtered);
        }
      } catch (error) {
        console.error('Failed to load buildings:', error);
        show('Failed to load buildings', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadBuildings();
  }, [user, hasRole, show]);

  // Load water service ID and active cycle
  useEffect(() => {
    const loadServiceAndCycle = async () => {
      if (!selectedBuildingId) return;

      try {
        const allMeters = await getMetersByBuilding(selectedBuildingId);
        const waterMeter = allMeters.find(m => 
          m.serviceId?.toLowerCase().includes('water') || 
          m.meterType?.toLowerCase().includes('water')
        );
        if (waterMeter?.serviceId) {
          setWaterServiceId(waterMeter.serviceId);
        } else if (allMeters.length > 0) {
          setWaterServiceId(allMeters[0].serviceId);
        }

        // Load active cycle for water service
        if (waterMeter?.serviceId || allMeters[0]?.serviceId) {
          const serviceId = waterMeter?.serviceId || allMeters[0].serviceId;
          const cycles = await getAllReadingCycles();
          const activeCycle = cycles.find(
            c => c.serviceId === serviceId && c.status === 'ACTIVE'
          );
          if (activeCycle) {
            setActiveCycleId(activeCycle.id);
            // Load assignments for this cycle
            const assignmentsData = await getAssignmentsByCycle(activeCycle.id);
            setAssignments(assignmentsData);
            setFilteredAssignments(assignmentsData);
          }
        }
      } catch (error) {
        console.error('Failed to load service and cycle:', error);
      }
    };

    loadServiceAndCycle();
  }, [selectedBuildingId]);

  // Load assignments based on view mode
  useEffect(() => {
    const loadAssignments = async () => {
      if (!selectedBuildingId || !activeCycleId) return;

      try {
        setLoading(true);
        let assignmentsData: MeterReadingAssignmentDto[] = [];

        if (viewMode === 'my') {
          assignmentsData = await getMyAssignments();
        } else if (viewMode === 'active') {
          assignmentsData = await getMyActiveAssignments();
        } else if (selectedStaffId) {
          assignmentsData = await getAssignmentsByStaff(selectedStaffId);
        } else {
          assignmentsData = await getAssignmentsByCycle(activeCycleId);
        }

        setAssignments(assignmentsData);
        setFilteredAssignments(assignmentsData);
      } catch (error) {
        console.error('Failed to load assignments:', error);
        show('Failed to load assignments', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, [selectedBuildingId, activeCycleId, viewMode, selectedStaffId, show]);

  // Load units and meters when building is selected
  useEffect(() => {
    const loadData = async () => {
      if (!selectedBuildingId) {
        setUnits([]);
        setMeters([]);
        setMeasuredApartments([]);
        setUnmeasuredFloors([]);
        return;
      }

      try {
        setLoading(true);
        const [unitsData, metersData] = await Promise.all([
          getUnitsByBuilding(selectedBuildingId),
          waterServiceId ? getMetersByBuilding(selectedBuildingId) : Promise.resolve([])
        ]);

        const activeUnits = unitsData.filter(unit => unit.status?.toUpperCase() !== 'INACTIVE');
        setUnits(activeUnits);

        if (waterServiceId) {
          const waterMeters = metersData.filter(m => m.serviceId === waterServiceId);
          setMeters(waterMeters);

          // Find measured apartments
          const measured: MeasuredApartment[] = [];
          const measuredUnitIds = new Set<string>();

          waterMeters.forEach(meter => {
            if (meter.lastReading != null && meter.lastReadingDate) {
              const unit = activeUnits.find(u => u.id === meter.unitId);
              if (unit) {
                measured.push({
                  unitId: unit.id,
                  unitName: unit.name,
                  unitCode: unit.code,
                  floor: unit.floor,
                  measuredDate: new Date(meter.lastReadingDate).toISOString().split('T')[0],
                  reading: meter.lastReading,
                  meterId: meter.id,
                });
                measuredUnitIds.add(unit.id);
              }
            }
          });

          setMeasuredApartments(measured);

          // Find unmeasured apartments
          const unmeasuredUnits = activeUnits.filter(unit => !measuredUnitIds.has(unit.id));
          
          // Group by floor
          const floorMap = new Map<number, Unit[]>();
          unmeasuredUnits.forEach(unit => {
            if (!floorMap.has(unit.floor)) {
              floorMap.set(unit.floor, []);
            }
            floorMap.get(unit.floor)!.push(unit);
          });

          const floors: UnmeasuredFloor[] = Array.from(floorMap.entries())
            .map(([floor, apartments]) => ({ floor, apartments }))
            .sort((a, b) => a.floor - b.floor);

          setUnmeasuredFloors(floors);
        } else {
          // If no water service found, mark all as unmeasured
          const floorMap = new Map<number, Unit[]>();
          activeUnits.forEach(unit => {
            if (!floorMap.has(unit.floor)) {
              floorMap.set(unit.floor, []);
            }
            floorMap.get(unit.floor)!.push(unit);
          });

          const floors: UnmeasuredFloor[] = Array.from(floorMap.entries())
            .map(([floor, apartments]) => ({ floor, apartments }))
            .sort((a, b) => a.floor - b.floor);

          setUnmeasuredFloors(floors);
          setMeasuredApartments([]);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        show('Failed to load data', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedBuildingId, waterServiceId, show]);

  const handleBuildingSelect = (building: Building) => {
    setSelectedBuildingId(building.id);
    setSelectedFloors([]);
  };

  const handleFloorToggle = (floor: number) => {
    setSelectedFloors(prev => 
      prev.includes(floor)
        ? prev.filter(f => f !== floor)
        : [...prev, floor]
    );
  };

  const handleAssign = async () => {
    if (selectedFloors.length === 0) {
      show('Please select at least one floor', 'error');
      return;
    }

    if (!activeCycleId) {
      show('No active reading cycle found', 'error');
      return;
    }

    if (!assignedTo && user?.userId) {
      setAssignedTo(user.userId);
    }

    try {
      const req: MeterReadingAssignmentCreateReq = {
        cycleId: activeCycleId,
        assignedTo: assignedTo || user?.userId || '',
        floors: selectedFloors,
        buildingId: selectedBuildingId,
      };

      await createAssignment(req);
      show(`Successfully assigned floors ${selectedFloors.join(', ')} for measurement`, 'success');
      
      setIsAssignOpen(false);
      setSelectedFloors([]);
      refresh();
      
      // Reload assignments
      if (activeCycleId) {
        const assignmentsData = await getAssignmentsByCycle(activeCycleId);
        setAssignments(assignmentsData);
        setFilteredAssignments(assignmentsData);
      }
    } catch (error: any) {
      console.error('Failed to create assignment:', error);
      show(error?.message || 'Failed to create assignment', 'error');
    }
  };

  const handleViewAssignment = async (assignment: MeterReadingAssignmentDto) => {
    try {
      setLoading(true);
      const [details, progress, meters] = await Promise.all([
        getAssignmentById(assignment.id),
        getAssignmentProgress(assignment.id),
        getMetersByAssignment(assignment.id)
      ]);
      
      setSelectedAssignment(details);
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
      refresh();
      
      // Reload assignments
      if (activeCycleId) {
        const assignmentsData = await getAssignmentsByCycle(activeCycleId);
        setAssignments(assignmentsData);
        setFilteredAssignments(assignmentsData);
      }
      
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
      refresh();
      
      // Reload assignments
      if (activeCycleId) {
        const assignmentsData = await getAssignmentsByCycle(activeCycleId);
        setAssignments(assignmentsData);
        setFilteredAssignments(assignmentsData);
      }
      
      if (selectedAssignment?.id === assignmentId) {
        setIsDetailsOpen(false);
        setSelectedAssignment(null);
      }
    } catch (error: any) {
      show(error?.message || 'Failed to delete assignment', 'error');
    }
  };

  const displayLoading = loading || hookLoading;

  return (
    <div className="px-[41px] py-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#02542D]">Water Assignment</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setIsAssignOpen(true)}
            className="px-4 py-2 bg-[#02542D] text-white rounded-md hover:bg-[#024428] transition-colors"
            disabled={!selectedBuildingId || !activeCycleId}
          >
            Assign
          </button>
        </div>
      </div>

      {/* Building Selector */}
      <div className="bg-white p-6 rounded-xl mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Building</label>
        <Select
          options={buildings}
          value={selectedBuildingId}
          onSelect={handleBuildingSelect}
          renderItem={(b) => `${b.name} (${b.code})`}
          getValue={(b) => b.id}
          placeholder="Choose a building..."
        />
      </div>

      {/* View Mode Filter */}
      {selectedBuildingId && activeCycleId && (
        <div className="bg-white p-4 rounded-xl mb-6">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">View:</label>
            <button
              onClick={() => {
                setViewMode('all');
                setSelectedStaffId('');
              }}
              className={`px-3 py-1 rounded-md text-sm ${
                viewMode === 'all' && !selectedStaffId
                  ? 'bg-[#739559] text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Assignments
            </button>
            <button
              onClick={() => {
                setViewMode('my');
                setSelectedStaffId('');
              }}
              className={`px-3 py-1 rounded-md text-sm ${
                viewMode === 'my'
                  ? 'bg-[#739559] text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              My Assignments
            </button>
            <button
              onClick={() => {
                setViewMode('active');
                setSelectedStaffId('');
              }}
              className={`px-3 py-1 rounded-md text-sm ${
                viewMode === 'active'
                  ? 'bg-[#739559] text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              My Active
            </button>
            {hasRole('admin') && (
              <div className="ml-4 flex items-center gap-2">
                <label className="text-sm text-gray-700">Staff ID:</label>
                <input
                  type="text"
                  value={selectedStaffId}
                  onChange={(e) => {
                    setSelectedStaffId(e.target.value);
                    setViewMode('all');
                  }}
                  placeholder="Enter staff ID"
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {hookError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {hookError}
        </div>
      )}

      {/* Assignments List */}
      {selectedBuildingId && filteredAssignments.length > 0 && (
        <div className="bg-white p-6 rounded-xl mb-6">
          <h2 className="text-xl font-semibold text-[#02542D] mb-4">Assignments</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-solid border-[#14AE5C]">
                  <th className="px-4 py-3 text-left text-sm font-bold text-[#024023] uppercase">Assigned To</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-[#024023] uppercase">Floors</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-[#024023] uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-[#024023] uppercase">Created</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-[#024023] uppercase">Completed</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-[#024023] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((assignment) => (
                  <tr key={assignment.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-[#024023] font-semibold">{assignment.assignedTo}</td>
                    <td className="px-4 py-3 text-center text-[#024023] font-semibold">
                      {assignment.floors.sort((a, b) => a - b).join(', ')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          assignment.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : assignment.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {assignment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-[#024023] font-semibold">
                      {new Date(assignment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center text-[#024023] font-semibold">
                      {assignment.completedAt 
                        ? new Date(assignment.completedAt).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleViewAssignment(assignment)}
                          className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                        >
                          View
                        </button>
                        {assignment.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleCompleteAssignment(assignment.id)}
                            className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                          >
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Measured Apartments */}
      {selectedBuildingId && measuredApartments.length > 0 && (
        <div className="bg-white p-6 rounded-xl mb-6">
          <h2 className="text-xl font-semibold text-[#02542D] mb-4">Measured Apartments</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-solid border-[#14AE5C]">
                  <th className="px-4 py-3 text-left text-sm font-bold text-[#024023] uppercase">Apartment</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-[#024023] uppercase">Code</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-[#024023] uppercase">Floor</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-[#024023] uppercase">Reading (m³)</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-[#024023] uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {measuredApartments.map((apt) => (
                  <tr key={apt.unitId} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-[#024023] font-semibold">{apt.unitName}</td>
                    <td className="px-4 py-3 text-center text-[#024023] font-semibold">{apt.unitCode}</td>
                    <td className="px-4 py-3 text-center text-[#024023] font-semibold">{apt.floor}</td>
                    <td className="px-4 py-3 text-center text-[#024023] font-semibold">{apt.reading}</td>
                    <td className="px-4 py-3 text-center text-[#024023] font-semibold">{apt.measuredDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedBuildingId && measuredApartments.length === 0 && !displayLoading && (
        <div className="bg-white p-6 rounded-xl text-center text-gray-500 mb-6">
          No apartments have been measured yet for this building
        </div>
      )}

      {displayLoading && (
        <div className="bg-white p-6 rounded-xl text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#739559] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      )}

      {/* Assign Modal */}
      {isAssignOpen && selectedBuildingId && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#E7E4E8CC]/80 z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto relative">
            <button
              onClick={() => setIsAssignOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" height="16" width="16">
                <g fill="none" fillRule="evenodd">
                  <path d="M16 0v16H0V0h16Z"></path>
                  <path fill="#000000" d="m8 9.414666666666665 3.535333333333333 3.535333333333333a1 1 0 0 0 1.4146666666666665 -1.4146666666666665L9.413333333333332 8l3.536 -3.535333333333333a1 1 0 1 0 -1.4146666666666665 -1.414L8 6.585999999999999 4.464666666666666 3.0506666666666664a1 1 0 1 0 -1.4146666666666665 1.4133333333333333L6.586666666666667 8l-3.536 3.536a1 1 0 1 0 1.4146666666666665 1.4133333333333333L8 9.415333333333333Z" strokeWidth="0.6667"></path>
                </g>
              </svg>
            </button>

            <h2 className="text-2xl font-bold text-[#02542D] mb-6">Assign Water Measurement</h2>

            {!activeCycleId && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-4">
                No active reading cycle found. Please create a cycle first.
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Assign To (Staff ID)</label>
              <input
                type="text"
                value={assignedTo || user?.userId || ''}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder={user?.userId || 'Enter staff ID'}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#739559]"
              />
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#02542D] mb-3">Select Floors Not Yet Measured</h3>
              {unmeasuredFloors.length === 0 ? (
                <p className="text-gray-500">All floors have been measured</p>
              ) : (
                <div className="space-y-2">
                  {unmeasuredFloors.map((floorData) => (
                    <div key={floorData.floor} className="flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                      <input
                        type="checkbox"
                        id={`floor-${floorData.floor}`}
                        checked={selectedFloors.includes(floorData.floor)}
                        onChange={() => handleFloorToggle(floorData.floor)}
                        className="w-4 h-4 text-[#739559] border-gray-300 rounded focus:ring-[#739559]"
                      />
                      <label
                        htmlFor={`floor-${floorData.floor}`}
                        className="flex-1 cursor-pointer"
                      >
                        <span className="font-semibold text-[#02542D]">Floor {floorData.floor}</span>
                        <span className="text-sm text-gray-600 ml-2">
                          ({floorData.apartments.length} apartments)
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsAssignOpen(false);
                  setSelectedFloors([]);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={selectedFloors.length === 0 || !activeCycleId}
                className="px-4 py-2 bg-[#739559] text-white rounded-md hover:bg-[#5a7347] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign
              </button>
            </div>
          </div>
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
                    <label className="text-sm font-medium text-gray-700">Assignment ID</label>
                    <p className="text-[#024023] font-semibold">{selectedAssignment.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <p className="text-[#024023] font-semibold">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        selectedAssignment.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-700'
                          : selectedAssignment.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {selectedAssignment.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Assigned To</label>
                    <p className="text-[#024023] font-semibold">{selectedAssignment.assignedTo}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Floors</label>
                    <p className="text-[#024023] font-semibold">
                      {selectedAssignment.floors.sort((a, b) => a - b).join(', ')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Created At</label>
                    <p className="text-[#024023] font-semibold">
                      {new Date(selectedAssignment.createdAt).toLocaleString()}
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
