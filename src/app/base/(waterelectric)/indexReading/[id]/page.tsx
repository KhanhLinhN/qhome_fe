'use client'
import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  getAssignmentById,
  getMetersByStaffAndCycle,
  createMeterReading,
  getAssignmentProgress,
  getMetersByUnit,
  createMeter,
  getMeterReadingsByCycleAndAssignmentAndUnit,
  MeterReadingAssignmentDto,
  MeterDto,
  MeterReadingCreateReq,
  AssignmentProgressDto,
  MeterCreateReq,
  MeterReadingDto,
} from '@/src/services/base/waterService';
import { useNotifications } from '@/src/hooks/useNotifications';
import { getErrorMessage } from '@/src/types/error';
import { getUnit, Unit } from '@/src/services/base/unitService';

interface ReadingData {
  meterId: string;
  currIndex: number;
  prevIndex?: number;
  note?: string;
}

interface UnitReadingData {
  unitId: string;
  currIndex: number | ''; // This is the reading value (current index)
}

export default function IndexReadingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { show } = useNotifications();
  const params = useParams();
  const searchParams = useSearchParams();

  const assignmentId = params.id as string;
  const [isViewOnly, setIsViewOnly] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [assignment, setAssignment] = useState<MeterReadingAssignmentDto | null>(null);
  const [meters, setMeters] = useState<MeterDto[]>([]);
  const [readings, setReadings] = useState<Record<string, ReadingData>>({});
  const [unitReadings, setUnitReadings] = useState<Record<string, UnitReadingData>>({});
  const [readingDate, setReadingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [unitsData, setUnitsData] = useState<Record<string, Unit>>({});
  const [progress, setProgress] = useState<AssignmentProgressDto | null>(null);
  // Store initial values to compare for changes
  const [initialReadings, setInitialReadings] = useState<Record<string, ReadingData>>({});
  const [initialUnitReadings, setInitialUnitReadings] = useState<Record<string, UnitReadingData>>({});
  // Store existing readings from API for each unit
  const [existingReadingsByUnit, setExistingReadingsByUnit] = useState<Record<string, MeterReadingDto[]>>({});

  useEffect(() => {
    if (assignmentId) {
      loadData();
    }
  }, [assignmentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      // First load assignment to get staffId and cycleId
      const assignmentData = await getAssignmentById(assignmentId);
      setAssignment(assignmentData);
      
      // Check if assignment is completed or viewOnly from URL
      const urlViewOnly = searchParams.get('viewOnly') === 'true';
      const isCompleted = assignmentData.completedAt !== null && assignmentData.completedAt !== undefined;
      setIsViewOnly(urlViewOnly || isCompleted);
      
      // Then load meters using staffId and cycleId
      const [metersData, progressData] = await Promise.all([
        getMetersByStaffAndCycle(assignmentData.assignedTo, assignmentData.cycleId),
        getAssignmentProgress(assignmentId),
        // getReadingsByAssignment(assignmentId).catch(() => []), // Load existing readings, ignore if fails
      ]);
      console.log('metersData', metersData);
      setMeters(metersData);
      setProgress(progressData);

      // Load existing readings for each unit using the new API
      const unitIds = assignmentData.unitIds || [];
      const unitsMap: Record<string, Unit> = {};
      const initialReadingsData: Record<string, ReadingData> = {};
      const initialUnitReadingsData: Record<string, UnitReadingData> = {};
      const existingReadingsMap: Record<string, MeterReadingDto[]> = {};
      
      // Load readings for each unit
      for (const unitId of unitIds) {
        try {
          const unit = await getUnit(unitId);
          unitsMap[unitId] = unit;
          
          // Get existing readings for this unit in this cycle/assignment
          const existingReadings = await getMeterReadingsByCycleAndAssignmentAndUnit(
            assignmentData.cycleId,
            unitId,
            assignmentId
          );
          console.log('existingReadings', existingReadings);
          
          // Store existing readings for this unit
          existingReadingsMap[unitId] = existingReadings;
          
          // Find meter for this unit
          const meterForUnit = metersData.find(m => m.unitId === unitId);
          
          if (meterForUnit) {
            // Unit has a meter - check if there's a reading for this meter
            const readingForMeter = existingReadings.find(r => r.meterId === meterForUnit.id);
            if (readingForMeter) {
              // Use existing reading
              initialReadingsData[meterForUnit.id] = {
                meterId: meterForUnit.id,
                currIndex: readingForMeter.currentIndex || 0,
                prevIndex: readingForMeter.prevIndex,
                note: readingForMeter.note,
              };
            } else {
              // No reading yet, use lastReading from meter
              initialReadingsData[meterForUnit.id] = {
                meterId: meterForUnit.id,
                currIndex: meterForUnit.lastReading || 0,
                prevIndex: meterForUnit.lastReading,
              };
            }
          } else {
            // Unit has no meter - check if there's any reading for this unit
            if (existingReadings.length > 0) {
              // Use the first reading found (should be only one per unit typically)
              const reading = existingReadings[0];
              initialUnitReadingsData[unitId] = {
                unitId,
                currIndex: reading.currentIndex || '',
              };
            } else {
              // No reading yet
              initialUnitReadingsData[unitId] = {
                unitId,
                currIndex: '',
              };
            }
          }
        } catch (error) {
          console.error(`Failed to load unit ${unitId} or readings:`, error);
          // Fallback: initialize with meter's lastReading if meter exists
          const meterForUnit = metersData.find(m => m.unitId === unitId);
          if (meterForUnit) {
            initialReadingsData[meterForUnit.id] = {
              meterId: meterForUnit.id,
              currIndex: meterForUnit.lastReading || 0,
              prevIndex: meterForUnit.lastReading,
            };
          } else {
            initialUnitReadingsData[unitId] = {
              unitId,
              currIndex: '',
            };
          }
          // Store empty array for failed units
          existingReadingsMap[unitId] = [];
        }
      }
      
      // Also initialize readings for meters that don't have units in unitIds (shouldn't happen, but just in case)
      metersData.forEach((meter) => {
        if (!initialReadingsData[meter.id] && meter.unitId) {
          // Check if unitId is in unitIds
          if (!unitIds.includes(meter.unitId)) {
            initialReadingsData[meter.id] = {
              meterId: meter.id,
              currIndex: meter.lastReading || 0,
              prevIndex: meter.lastReading,
            };
          }
        }
      });
      
      setInitialReadings(initialReadingsData);
      setReadings(initialReadingsData);
      setInitialUnitReadings(initialUnitReadingsData);
      setUnitReadings(initialUnitReadingsData);
      setUnitsData(unitsMap);
      setExistingReadingsByUnit(existingReadingsMap);
    } catch (error: unknown) {
      console.error('Failed to load data:', error);
      show(getErrorMessage(error, 'Failed to load data'), 'error');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const updateReading = (meterId: string, field: 'currIndex' | 'note', value: number | string) => {
    setReadings((prev) => ({
      ...prev,
      [meterId]: {
        ...prev[meterId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!assignment) {
      show('Assignment not found', 'error');
      return;
    }

    try {
      setSubmitting(true);

      // Create readings for all meters that have currIndex
      const readingPromises: Promise<unknown>[] = [];
      const today = readingDate || new Date().toISOString().split('T')[0];

      // Process all readings (both existing meters and units without meters)
      // Track created meters to avoid duplicates
      const createdMeters: Record<string, MeterDto> = {};
      
      // Helper function to find or create meter for a unit
      const findOrCreateMeter = async (unitId: string): Promise<MeterDto | null> => {
        // Check if we already created a meter for this unit in this submit
        if (createdMeters[unitId]) {
          return createdMeters[unitId];
        }
        
        // First check if meter exists in the already loaded meters list
        let meter = meters.find(m => m.unitId === unitId && m.serviceId === assignment.serviceId && m.active);
        
        // If not found, try to get meters for this unit from API
        if (!meter) {
          try {
            const unitMeters = await getMetersByUnit(unitId);
            // Find meter matching the assignment service
            meter = unitMeters.find(m => m.serviceId === assignment.serviceId && m.active);
          } catch (error) {
            console.error(`Failed to load meters for unit ${unitId}:`, error);
          }
        }
        
        // If meter still not found, create a new meter for this unit and service
        if (!meter) {
          try {
            // Generate meter code from unit code and service
            const unitCode = unitsData[unitId]?.code || unitId.substring(0, 8);
            const serviceCode = assignment.serviceCode || 'SRV';
            const meterCode = `${unitCode}-${serviceCode}`;
            
            const meterReq: MeterCreateReq = {
              unitId: unitId,
              serviceId: assignment.serviceId,
              meterCode: meterCode,
              meterType: assignment.serviceName || 'Standard',
              location: undefined,
            };
            
            // Create meter - await here to get meterId
            meter = await createMeter(meterReq);
            createdMeters[unitId] = meter; // Cache created meter to avoid duplicates
            console.log(`Created new meter ${meter.id} for unit ${unitId}`);
          } catch (error: unknown) {
            console.error(`Failed to create meter for unit ${unitId}:`, error);
            const message = getErrorMessage(error, 'Failed to create meter');
            show(`Failed to create meter for unit ${unitsData[unitId]?.code || unitId}: ${message}`, 'error');
            return null;
          }
        }
        
        return meter || null;
      };
      
      // Process readings for existing meters
      // Only submit if value has changed from initial value
      for (const meterId in readings) {
        const reading = readings[meterId];
        const initialReading = initialReadings[meterId];
        
        // Check if value has changed from initial value
        const hasChanged = initialReading 
          ? Number(reading.currIndex) !== Number(initialReading.currIndex)
          : reading.currIndex !== null && reading.currIndex !== undefined;
        
        // Only submit if value has changed and is a valid number
        if (hasChanged && reading.currIndex !== null && reading.currIndex !== undefined) {
          // Backend will check if reading exists with meterId + assignmentId and update if exists
          // Only send currIndex, not prevIndex
          const req: MeterReadingCreateReq = {
            assignmentId: assignmentId,
            meterId: meterId,
            readingDate: today,
            currIndex: Number(reading.currIndex),
            cycleId: assignment?.cycleId,
            note: reading.note,
          };

          readingPromises.push(createMeterReading(req));
        }
      }

      // Process unitReadings (units without meters - need to find or create meter first)
      // This must be done sequentially because we need meterId before creating reading
      // Only submit if value has changed from initial value (which is empty string)
      for (const unitId in unitReadings) {
        const unitReading = unitReadings[unitId];
        const initialUnitReading = initialUnitReadings[unitId];
        
        // Check if value has changed from initial value (initial is empty string)
        const hasChanged = initialUnitReading
          ? unitReading.currIndex !== initialUnitReading.currIndex && 
            unitReading.currIndex !== '' && 
            unitReading.currIndex !== null && 
            unitReading.currIndex !== undefined
          : unitReading.currIndex !== '' && 
            unitReading.currIndex !== null && 
            unitReading.currIndex !== undefined;
        
        if (hasChanged) {
          // Find or create meter for this unit
          const meter = await findOrCreateMeter(unitId);
          
          if (meter && meter.id) {
            // Backend will check if reading exists with meterId + assignmentId and update if exists
            // If not exists, create new reading with these fields
            // Only send currIndex, not prevIndex
            const req: MeterReadingCreateReq = {
              assignmentId: assignmentId,
              meterId: meter.id,
              readingDate: today,
              currIndex: Number(unitReading.currIndex),
              cycleId: assignment?.cycleId,
              note: undefined,
            };

            readingPromises.push(createMeterReading(req));
          }
        }
      }

      if (readingPromises.length === 0) {
        show('No changes detected. Please modify at least one reading before submitting.', 'info');
        return;
      }

      // Wait for all promises to complete (both success and failure)
      const results = await Promise.allSettled(readingPromises);
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failedCount = results.filter(r => r.status === 'rejected').length;
      const totalCount = meters.length;
      
      // Log any errors for debugging
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to submit reading ${index}:`, result.reason);
        }
      });

      if (failedCount > 0) {
        show(`Failed to submit ${failedCount} reading(s). ${successCount} reading(s) submitted successfully.`, 'error');
      } else if (successCount === totalCount) {
        show(`Successfully submitted ${successCount} reading(s)`, 'success');
      } else {
        show(`Successfully submitted ${successCount} of ${totalCount} reading(s)`, 'success');
      }

      // Reload data after successful submissions to update UI with saved readings
      if (successCount > 0 && assignment) {
        try {
          // Reload meters first to include newly created ones
          const updatedMeters = await getMetersByStaffAndCycle(assignment.assignedTo, assignment.cycleId);
          setMeters(updatedMeters);
          
          // Create maps for updating state
          const updatedReadingsMap: Record<string, ReadingData> = {};
          const updatedUnitReadingsMap: Record<string, UnitReadingData> = {};
          
          // Initialize readings for all meters (existing and newly created)
          // Use lastReading from meter as the current value
          updatedMeters.forEach((meter) => {
            updatedReadingsMap[meter.id] = {
              meterId: meter.id,
              currIndex: meter.lastReading || 0,
              prevIndex: meter.lastReading,
            };
          });
          
          // Initialize unitReadings for all units
          const allUnitIds = assignment?.unitIds || [];
          allUnitIds.forEach((unitId) => {
            // Check if there's a meter for this unit
            const meterForUnit = updatedMeters.find(m => m.unitId === unitId);
            if (!meterForUnit) {
              // No meter for this unit, initialize empty
              updatedUnitReadingsMap[unitId] = {
                unitId,
                currIndex: '',
              };
            }
          });
          
          // Update both current and initial values after reload
          setInitialReadings(updatedReadingsMap);
          setReadings(updatedReadingsMap);
          setInitialUnitReadings(updatedUnitReadingsMap);
          setUnitReadings(updatedUnitReadingsMap);
          
          // Reload progress
          const updatedProgress = await getAssignmentProgress(assignmentId);
          setProgress(updatedProgress);
        } catch (error: unknown) {
          console.error('Failed to reload data:', error);
          // Don't show error to user if reload fails, just log it
          // The submit was successful, so we don't want to confuse the user
        }
      }
    } catch (error: unknown) {
      console.error('Failed to submit readings:', error);
      show(getErrorMessage(error, 'Failed to submit readings'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="px-[41px] py-12">
        <div className="bg-white p-6 rounded-xl text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#739559] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="px-[41px] py-12">
        <div className="bg-white p-6 rounded-xl text-center">
          <p className="text-gray-600">Assignment not found</p>
        </div>
      </div>
    );
  }

  // Group meters by unit
  const metersByUnit = meters.reduce((acc, meter) => {
    const unitId = meter.unitId || 'unknown';
    if (!acc[unitId]) {
      acc[unitId] = [];
    }
    acc[unitId].push(meter);
    return acc;
  }, {} as Record<string, MeterDto[]>);

  // Get all unit IDs from assignment (including units without meters)
  const allUnitIds = assignment?.unitIds || [];
  
  // Total count: all units in assignment
  const totalCount = allUnitIds.length;
  
  // Filled count: number of meters that have been saved (from database)
  const filledCount = progress?.readingsDone || 0;

  return (
    <div className="px-[41px] py-12">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <h1 className="text-2xl font-semibold text-[#02542D]">
            {isViewOnly ? 'Meter Reading Details' : 'Meter Reading'}
          </h1>
        </button>
        <div className="mt-2 text-sm text-gray-600 bg-white rounded-xl p-6">
          <p><strong>Cycle:</strong> {assignment.cycleName}</p>
          <p><strong>Service:</strong> {assignment.serviceName} ({assignment.serviceCode})</p>
          {assignment.buildingName && (
            <p><strong>Building:</strong> {assignment.buildingName} ({assignment.buildingCode})</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl mb-4">
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm font-medium text-gray-700">
            Reading Date:
          </label>
          <input
            type="date"
            value={readingDate}
            onChange={(e) => setReadingDate(e.target.value)}
            readOnly
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#739559]"
          />
        </div>
        <div className="text-sm text-gray-600">
          Progress: {filledCount} / {totalCount} readings entered
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Unit</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Meter Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {allUnitIds.map((unitId) => {
                const unit = unitsData[unitId];
                const unitMeters = metersByUnit[unitId] || [];
                // Get existing readings for this unit from API
                const existingReadings = existingReadingsByUnit[unitId] || [];
                // Get the first existing reading if available (should be only one per unit typically)
                const existingReading = existingReadings.length > 0 ? existingReadings[0] : null;
                // Use existing reading value if available, otherwise use unitReadings state
                const unitReading = unitReadings[unitId] || { unitId, currIndex: '' };
                const displayValue = existingReading?.currentIndex !== undefined && existingReading.currentIndex !== null
                  ? existingReading.currentIndex
                  : (unitReading.currIndex !== '' ? unitReading.currIndex : '');
                
                // If unit has no meters, show input for reading
                if (unitMeters.length === 0) {
                  return (
                    <tr key={unitId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800">
                        <div className="font-medium">{unit?.code || unitId}</div>
                        {unit?.floor && (
                          <div className="text-xs text-gray-500">Floor {unit.floor}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          value={displayValue}
                          onChange={(e) => setUnitReadings(prev => ({
                            ...prev,
                            [unitId]: { ...prev[unitId], currIndex: e.target.value === '' ? '' : parseFloat(e.target.value) }
                          }))}
                          disabled={isViewOnly}
                          placeholder="Enter reading"
                          className={`w-full max-w-[200px] border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#739559] text-sm ${
                            isViewOnly ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                        />
                      </td>
                    </tr>
                  );
                }

                return unitMeters.map((meter, index) => {
                  const reading = readings[meter.id] || { meterId: meter.id, currIndex: meter.lastReading};
                  const isFirstMeter = index === 0;
                  
                  return (
                    <tr key={meter.id} className="hover:bg-gray-50">
                      {isFirstMeter && (
                        <td 
                          rowSpan={unitMeters.length} 
                          className="px-4 py-3 text-sm text-gray-800 align-top"
                        >
                          <div className="font-medium">{unit?.code || unitId}</div>
                          {unit?.floor && (
                            <div className="text-xs text-gray-500">Floor {unit.floor}</div>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={reading.currIndex}
                            onChange={(e) => updateReading(meter.id, 'currIndex', e.target.value === '' ? '' : parseFloat(e.target.value))}
                            disabled={isViewOnly}
                            placeholder="Enter reading"
                            className={`flex-1 max-w-[200px] border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#739559] text-sm ${
                              isViewOnly ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </div>

      {!isViewOnly && (
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-[#02542D] text-white rounded-md hover:bg-[#024428] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      )}
    </div>
  );
}

