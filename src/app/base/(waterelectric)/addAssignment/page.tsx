'use client'
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/src/contexts/AuthContext';
import { getBuildings, Building } from '@/src/services/base/buildingService';
import {
  getAllReadingCycles,
  getAllServices,
  createMeterReadingAssignment,
  MeterReadingAssignmentCreateReq,
  ReadingCycleDto,
  ServiceDto,
} from '@/src/services/base/waterService';
import { useNotifications } from '@/src/hooks/useNotifications';
import Select from '@/src/components/customer-interaction/Select';
import DateBox from '@/src/components/customer-interaction/DateBox';
import { getEmployeesByRole, EmployeeRoleDto, getEmployeesByRoleNew } from '@/src/services/iam/employeeService';
import { getUnitsByBuilding, getUnitsByFloor, Unit } from '@/src/services/base/unitService';
import Checkbox from '@/src/components/customer-interaction/Checkbox';
import { getAssignmentsByCycle, MeterReadingAssignmentDto } from '@/src/services/base/waterService';

export default function AddAssignmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, hasRole } = useAuth();
  const { show } = useNotifications();

  const [loading, setLoading] = useState(false);
  const [cycles, setCycles] = useState<ReadingCycleDto[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [staffList, setStaffList] = useState<EmployeeRoleDto[]>([]);

  // Form fields
  const [selectedCycleId, setSelectedCycleId] = useState<string>(
    searchParams.get('cycleId') || ''
  );
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<string>>(new Set()); // All selected units
  const [expandedFloors, setExpandedFloors] = useState<Set<number>>(new Set()); // Floors with expanded dropdown
  const [allBuildingUnits, setAllBuildingUnits] = useState<Unit[]>([]); // All units in building
  const [note, setNote] = useState<string>('');
  const [availableFloors, setAvailableFloors] = useState<number[]>([]);
  const [unitsByFloor, setUnitsByFloor] = useState<Map<number, Unit[]>>(new Map());
  const [loadingUnits, setLoadingUnits] = useState<Map<number, boolean>>(new Map());
  const [assignedFloors, setAssignedFloors] = useState<Set<number>>(new Set());
  const [assignedUnitIds, setAssignedUnitIds] = useState<Set<string>>(new Set()); // Units already assigned for this cycle/service/building
  const [startDateError, setStartDateError] = useState<string>('');
  const [endDateError, setEndDateError] = useState<string>('');

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [cyclesData, buildingsData, servicesData] = await Promise.all([
          getAllReadingCycles(),
          getBuildings(),
          getAllServices()
        ]);

        setCycles(cyclesData);
        setBuildings(buildingsData);
        // Filter services that are active and require meter
        setServices(servicesData.filter(s => s.active && s.requiresMeter));

        // Load staff with technician role
        try {
          const staffData = await getEmployeesByRoleNew('technician');
          setStaffList(staffData);
        } catch (error) {
          console.error('Failed to load staff list:', error);
          // Don't show error, just continue without staff list
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        show('Failed to load data', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [show]);

  // Auto-fill dates when cycle is selected
  useEffect(() => {
    if (selectedCycleId) {
      const cycle = cycles.find(c => c.id === selectedCycleId);
      if (cycle) {
        setStartDate(cycle.periodFrom.split('T')[0]);
        setEndDate(cycle.periodTo.split('T')[0]);
      }
    }
  }, [selectedCycleId, cycles]);

  // Load assigned units for the current cycle/service/building
  useEffect(() => {
    const loadAssignedUnits = async () => {
      if (selectedCycleId && selectedServiceId && selectedBuildingId) {
        try {
          const assignments = await getAssignmentsByCycle(selectedCycleId);
          // Filter assignments with same cycle, service, and building
          const relevantAssignments = assignments.filter(
            (assignment: MeterReadingAssignmentDto) =>
              assignment.serviceId === selectedServiceId &&
              assignment.buildingId === selectedBuildingId
          );
          
          // Extract assigned unitIds from all relevant assignments
          const assignedUnitIdsSet = new Set<string>();
          relevantAssignments.forEach((assignment: MeterReadingAssignmentDto) => {
            if (assignment.unitIds && assignment.unitIds.length > 0) {
              assignment.unitIds.forEach(unitId => assignedUnitIdsSet.add(unitId));
            }
          });
          
          setAssignedUnitIds(assignedUnitIdsSet);
          
          // Also extract assigned floors for backward compatibility
          const assigned = new Set<number>();
          relevantAssignments.forEach((assignment: MeterReadingAssignmentDto) => {
            // Check both floor field (new) and floorFrom (old) for compatibility
            if (assignment.floor !== null && assignment.floor !== undefined) {
              assigned.add(assignment.floor);
            } else if (assignment.floorFrom !== null && assignment.floorFrom !== undefined) {
              // If floorFrom exists, add all floors from floorFrom to floorTo
              const from = assignment.floorFrom;
              const to = assignment.floorTo || assignment.floorFrom;
              for (let f = from; f <= to; f++) {
                assigned.add(f);
              }
            }
          });
          
          setAssignedFloors(assigned);
        } catch (error) {
          console.error('Failed to load assigned units:', error);
          setAssignedUnitIds(new Set());
          setAssignedFloors(new Set());
        }
      } else {
        setAssignedUnitIds(new Set());
        setAssignedFloors(new Set());
      }
    };

    loadAssignedUnits();
  }, [selectedCycleId, selectedServiceId, selectedBuildingId]);

  // Load available floors and all units when building is selected
  // Filter out units that are already assigned for this cycle/service/building
  useEffect(() => {
    const loadFloors = async () => {
      if (selectedBuildingId) {
        try {
          const units = await getUnitsByBuilding(selectedBuildingId);
          
          // Filter out units that are already assigned
          const availableUnits = units.filter(unit => !assignedUnitIds.has(unit.id));
          setAllBuildingUnits(availableUnits); // Store only available units for dropdown selection
          
          // Extract unique floors from available units and sort them
          const uniqueFloors = Array.from(
            new Set(availableUnits.map(unit => unit.floor).filter(floor => floor != null))
          ).sort((a, b) => a - b);
          
          // Filter out already assigned floors (for backward compatibility)
          const available = uniqueFloors.filter(floor => !assignedFloors.has(floor));
          setAvailableFloors(available);
          
          // Load units for each available floor (filter out assigned units)
          const unitsMap = new Map<number, Unit[]>();
          const loadingMap = new Map<number, boolean>();
          
          for (const floor of available) {
            loadingMap.set(floor, true);
            try {
              const floorUnits = await getUnitsByFloor(selectedBuildingId, floor);
              // Filter out units that are already assigned
              const availableFloorUnits = floorUnits.filter(unit => !assignedUnitIds.has(unit.id));
              unitsMap.set(floor, availableFloorUnits);
            } catch (error) {
              console.error(`Failed to load units for floor ${floor}:`, error);
              unitsMap.set(floor, []);
            } finally {
              loadingMap.set(floor, false);
            }
          }
          
          setUnitsByFloor(unitsMap);
          setLoadingUnits(loadingMap);
        } catch (error) {
          console.error('Failed to load floors from units:', error);
          setAvailableFloors([]);
          setAllBuildingUnits([]);
          setUnitsByFloor(new Map());
        }
      } else {
        setAvailableFloors([]);
        setAllBuildingUnits([]);
        setSelectedUnitIds(new Set());
        setExpandedFloors(new Set());
        setUnitsByFloor(new Map());
        setLoadingUnits(new Map());
      }
    };

    loadFloors();
  }, [selectedBuildingId, assignedFloors, assignedUnitIds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCycleId) {
      show('Please select a cycle', 'error');
      return;
    }

    if (!selectedServiceId) {
      show('Please select a service', 'error');
      return;
    }

    if (!assignedTo) {
      show('Please select a staff member to assign to', 'error');
      return;
    }

    setStartDateError('');
    setEndDateError('');

    const parseDateOnly = (value: string) => {
      const [datePart] = value.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    const selectedCycle = cycles.find(cycle => cycle.id === selectedCycleId);

    if (selectedCycle) {
      const cycleStartDate = parseDateOnly(selectedCycle.periodFrom);
      const cycleEndDate = parseDateOnly(selectedCycle.periodTo);

      if (startDate) {
        const startDateValue = parseDateOnly(startDate);
        if (startDateValue < cycleStartDate) {
          setStartDateError('Start date cannot be before the cycle start date');
          return;
        }
      }

      if (endDate) {
        const endDateValue = parseDateOnly(endDate);
        if (endDateValue > cycleEndDate) {
          setEndDateError('End date cannot be after the cycle end date');
          return;
        }
      }
    }

    // Validate: must select at least one unit when building is selected
    if (selectedBuildingId && selectedUnitIds.size === 0) {
      show('Please select at least one unit', 'error');
      return;
    }

    try {
      setLoading(true);

      // Calculate included unitIds (units that ARE selected)
      // If building is selected, send the selected units
      let includedUnitIds: string[] | undefined = undefined;
      
      if (selectedBuildingId && selectedUnitIds.size > 0) {
        // Send units that ARE selected
        includedUnitIds = Array.from(selectedUnitIds);
      }

      // Create one assignment with included unitIds (selected units)
      const req: MeterReadingAssignmentCreateReq = {
        cycleId: selectedCycleId,
        serviceId: selectedServiceId,
        assignedTo: assignedTo,
        buildingId: selectedBuildingId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        unitIds: includedUnitIds && includedUnitIds.length > 0 ? includedUnitIds : undefined,
        note: note || undefined,
      };

      const response = await createMeterReadingAssignment(req);

      if (response.id) {
        show('Successfully created assignment', 'success');
        router.push('/base/readingAssign');
      } else {
        show('Failed to create assignment', 'error');
      }
    } catch (error: any) {
      console.error('Failed to create assignment:', error);
      show(error?.response?.data?.message || error?.message || 'Failed to create assignment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading && cycles.length === 0) {
    return (
      <div className="px-[41px] py-12">
        <div className="bg-white p-6 rounded-xl text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#739559] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-[41px] py-12">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleCancel}
          className="text-gray-600 hover:text-gray-900"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-semibold text-[#02542D]">Add New Assignment</h1>
      </div>

      <div className="bg-white p-6 rounded-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">  
            {/* Reading Cycle */}
            <div className={`flex flex-col mb-4 col-span-1`}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reading Cycle <span className="text-red-500">*</span>
              </label>
              <Select
                options={cycles}
                value={selectedCycleId}
                onSelect={(cycle) => setSelectedCycleId(cycle.id)}
                renderItem={(cycle) => `${cycle.name} (${cycle.status}) - ${new Date(cycle.periodFrom).toLocaleDateString()} to ${new Date(cycle.periodTo).toLocaleDateString()}`}
                getValue={(cycle) => cycle.id}
                placeholder="Select a reading cycle..."
                disable={true}
              />
            </div>

            {/* Building (Optional) */}
            <div className={`flex flex-col mb-4 col-span-1`}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Building <span className="text-gray-500 text-xs">(Optional - leave empty for all buildings)</span>
              </label>
              <Select
                options={buildings}
                value={selectedBuildingId}
                onSelect={(building) => setSelectedBuildingId(building.id)}
                renderItem={(building) => `${building.name} (${building.code})`}
                getValue={(building) => building.id}
                placeholder="Select a building (optional)..."
              />
            </div>

            {/* Service */}
            <div className={`flex flex-col mb-4 col-span-1`}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service <span className="text-red-500">*</span>
              </label>
              <Select
                options={services}
                value={selectedServiceId}
                onSelect={(service) => setSelectedServiceId(service.id)}
                renderItem={(service) => `${service.name} (${service.code})`}
                getValue={(service) => service.id}
                placeholder="Select a service..."
              />
            </div>

            {/* Assigned To */}
            <div className={`flex flex-col mb-4 col-span-1`}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign To <span className="text-red-500">*</span>
              </label>
              <Select
                options={staffList}
                value={assignedTo}
                onSelect={(staff) => setAssignedTo(staff.userId)}
                renderItem={(staff) => `${staff.fullName || staff.username} (${staff.email})`}
                getValue={(staff) => staff.userId}
                placeholder="Select a staff member..."
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-gray-500 text-xs">(Optional - defaults to cycle start)</span>
              </label>
              <DateBox
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (startDateError) {
                    setStartDateError('');
                  }
                }}
                placeholderText="Select start date"
              />
              {startDateError && (
                <span className="text-red-500 text-xs mt-1">{startDateError}</span>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date <span className="text-gray-500 text-xs">(Optional - defaults to cycle end)</span>
              </label>
              <DateBox
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (endDateError) {
                    setEndDateError('');
                  }
                }}
                placeholderText="Select end date"
              />
              {endDateError && (
                <span className="text-red-500 text-xs mt-1">{endDateError}</span>
              )}
            </div>
          </div>

          {/* Floor/Unit Selection */}
          {selectedBuildingId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Units <span className="text-red-500">*</span>
                {assignedFloors.size > 0 && (
                  <span className="text-gray-500 text-xs ml-2">
                    ({assignedFloors.size} floor(s) already assigned and hidden)
                  </span>
                )}
              </label>
              
              {availableFloors.length === 0 ? (
                <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                  <p className="text-sm text-gray-600">
                    {assignedFloors.size > 0 
                      ? 'All floors have been assigned for this cycle and service. Please select a different cycle or service.'
                      : 'No floors available. Please make sure the building has units.'}
                  </p>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-md p-4 max-h-96 overflow-y-auto">
                  <div className="space-y-3">
                    {availableFloors.map((floor) => {
                      const floorUnits = unitsByFloor.get(floor) || [];
                      const isLoading = loadingUnits.get(floor);
                      const isExpanded = expandedFloors.has(floor);
                      
                      // Check if all units in floor are selected
                      const allUnitsSelected = floorUnits.length > 0 && 
                        floorUnits.every(unit => selectedUnitIds.has(unit.id));
                      // Check if at least one unit is selected
                      const someUnitsSelected = floorUnits.some(unit => selectedUnitIds.has(unit.id));
                      
                      return (
                        <div
                          key={floor}
                          className="border border-gray-200 rounded-md p-3 hover:border-[#739559] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="mt-0.5">
                              <Checkbox
                                checked={allUnitsSelected}
                                onClick={() => {
                                  const newSelectedUnitIds = new Set(selectedUnitIds);
                                  
                                  if (allUnitsSelected) {
                                    // Uncheck floor - remove all units in this floor
                                    floorUnits.forEach(unit => newSelectedUnitIds.delete(unit.id));
                                  } else {
                                    // Check floor - add all units in this floor
                                    floorUnits.forEach(unit => newSelectedUnitIds.add(unit.id));
                                  }
                                  
                                  setSelectedUnitIds(newSelectedUnitIds);
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-gray-700">
                                  Floor {floor}
                                </span>
                                {floorUnits.length > 0 && (
                                  <span className="text-xs text-gray-500">
                                    ({floorUnits.length} units)
                                  </span>
                                )}
                                {someUnitsSelected && !allUnitsSelected && (
                                  <span className="text-xs text-blue-600">
                                    ({floorUnits.filter(u => selectedUnitIds.has(u.id)).length} selected)
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newExpanded = new Set(expandedFloors);
                                    if (isExpanded) {
                                      newExpanded.delete(floor);
                                    } else {
                                      newExpanded.add(floor);
                                    }
                                    setExpandedFloors(newExpanded);
                                  }}
                                  className="ml-auto text-xs text-blue-600 hover:text-blue-800 underline"
                                >
                                  {isExpanded ? '▼ Hide' : '▶ Show'} units
                                </button>
                              </div>
                              
                              {isExpanded && (
                                <div className="mt-2 ml-6 space-y-1 border-l-2 border-gray-200 pl-3">
                                  {isLoading ? (
                                    <div className="text-xs text-gray-500 italic">Loading units...</div>
                                  ) : floorUnits.length > 0 ? (
                                    floorUnits.map((unit) => {
                                      const isUnitSelected = selectedUnitIds.has(unit.id);
                                      return (
                                        <div
                                          key={unit.id}
                                          className="flex items-center gap-2 py-1"
                                        >
                                          <Checkbox
                                            checked={isUnitSelected}
                                            onClick={() => {
                                              const newSelectedUnitIds = new Set(selectedUnitIds);
                                              
                                              if (isUnitSelected) {
                                                // Uncheck unit - remove from selected
                                                newSelectedUnitIds.delete(unit.id);
                                              } else {
                                                // Check unit - add to selected
                                                newSelectedUnitIds.add(unit.id);
                                              }
                                              
                                              setSelectedUnitIds(newSelectedUnitIds);
                                            }}
                                          />
                                          <span className="text-xs text-gray-700">{unit.code}</span>
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <div className="text-xs text-gray-400 italic">No units found</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {selectedUnitIds.size > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Selected: {selectedUnitIds.size} unit(s)
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedUnitIds(new Set())}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note <span className="text-gray-500 text-xs">(Optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#739559]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedCycleId || !selectedServiceId || !assignedTo}
              className="px-6 py-2 bg-[#02542D] text-white rounded-md hover:bg-[#024428] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

