'use client'
import React, { useEffect, useState } from 'react';
import {
  getAllReadingCycles,
  ReadingCycleDto,
  getAssignmentsByCycle,
  MeterReadingAssignmentDto,
  getMeterReadingsByCycleAndAssignmentAndUnit,
  MeterReadingDto,
  exportReadingsByCycle,
  MeterReadingImportResponse,
} from '@/src/services/base/waterService';
import { useNotifications } from '@/src/hooks/useNotifications';
import { getBuildings } from '@/src/services/base/buildingService';
import { getUnit, Unit } from '@/src/services/base/unitService';

type Building = {
  id: string;
  code: string;
  name: string;
};

interface BillingUnitData {
  unitId: string;
  unitCode: string;
  meterCode: string;
  prevIndex: number;
  currentIndex: number;
  usage: number;
  amount: number;
}

interface BillingBuildingData {
  buildingId: string;
  buildingCode: string;
  buildingName: string;
  units: BillingUnitData[];
}

interface PricingFormula {
  id: string;
  serviceCode: string;
  ranges: Array<{
    from: number;
    to: number | null;
    price: number;
  }>;
}

export default function ElectricBillingTab() {
  const { show } = useNotifications();
  
  const [cycles, setCycles] = useState<ReadingCycleDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCycles, setExpandedCycles] = useState<Set<string>>(new Set());
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());
  const [billingData, setBillingData] = useState<Record<string, Record<string, BillingBuildingData>>>({});
  const [pricingFormula, setPricingFormula] = useState<PricingFormula | null>(null);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [showEditFormulaModal, setShowEditFormulaModal] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    loadCycles();
    loadPricingFormula();
  }, []);

  const loadCycles = async () => {
    try {
      setLoading(true);
      setIsInitialLoad(true);
      const data = await getAllReadingCycles();
      // Filter cycles that are completed or in progress
      const filteredCycles = data.filter(cycle => 
        cycle.status === 'COMPLETED' || cycle.status === 'IN_PROGRESS'
      );
      setCycles(filteredCycles);
      
      // Auto-expand first cycle
      if (filteredCycles.length > 0) {
        setExpandedCycles(new Set([filteredCycles[0].id]));
        await loadBillingDataForCycle(filteredCycles[0].id);
      }
    } catch (error: any) {
      console.error('Failed to load cycles:', error);
      show(error?.response?.data?.message || error?.message || 'Failed to load cycles', 'error');
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  const loadBillingDataForCycle = async (cycleId: string) => {
    try {
      setLoading(true);
      // Get all assignments for this cycle
      const assignments = await getAssignmentsByCycle(cycleId);
      
      // Filter by ELECTRIC service
      const serviceAssignments = assignments.filter(a => 
        a.serviceCode === 'ELECTRIC'
      );

      // Get all readings for these assignments using the new API
      const allReadings: MeterReadingDto[] = [];
      const processedUnits = new Set<string>(); // Track processed unitIds to avoid duplicates
      
      for (const assignment of serviceAssignments) {
        if (!assignment.unitIds || assignment.unitIds.length === 0) continue;
        
        // Get readings for each unit in this assignment
        for (const unitId of assignment.unitIds) {
          // Skip if already processed (to avoid duplicates across assignments)
          if (processedUnits.has(unitId)) continue;
          
          try {
            const readings = await getMeterReadingsByCycleAndAssignmentAndUnit(
              cycleId,
              unitId,
              assignment.id
            );
            
            // Only add the first reading for this unit (should be only one per unit typically)
            if (readings.length > 0) {
              allReadings.push(readings[0]);
              processedUnits.add(unitId);
            }
          } catch (error) {
            console.error(`Failed to load readings for assignment ${assignment.id}, unit ${unitId}:`, error);
          }
        }
      }

      // Group by building
      const buildingsMap: Record<string, BillingBuildingData> = {};
      
      // Load all buildings once
      let allBuildings: Building[] = [];
      try {
        allBuildings = await getBuildings();
      } catch (error) {
        console.error('Failed to load buildings:', error);
      }
      
      // Cache units to avoid duplicate API calls
      const unitsCache: Record<string, Unit> = {};
      
      for (const reading of allReadings) {
        if (!reading.unitId || !reading.meterCode) continue;
        
        // Get unit to find building (use cache if available)
        let unit: Unit | null = unitsCache[reading.unitId] || null;
        if (!unit) {
          try {
            unit = await getUnit(reading.unitId);
            unitsCache[reading.unitId] = unit;
          } catch (error) {
            console.error(`Failed to load unit ${reading.unitId}:`, error);
            continue;
          }
        }

        if (!unit?.buildingId) continue;

        // Get building from pre-loaded list
        const building = allBuildings.find(b => b.id === unit.buildingId);
        if (!building) continue;

        const buildingId = building.id;
        if (!buildingsMap[buildingId]) {
          buildingsMap[buildingId] = {
            buildingId,
            buildingCode: building.code,
            buildingName: building.name,
            units: [],
          };
        }

        const prevIndex = reading.prevIndex || 0;
        const currentIndex = reading.currentIndex || 0;
        const usage = currentIndex - prevIndex;
        const amount = calculateAmount(usage);

        buildingsMap[buildingId].units.push({
          unitId: reading.unitId,
          unitCode: unit.code,
          meterCode: reading.meterCode,
          prevIndex,
          currentIndex,
          usage,
          amount,
        });
      }

      setBillingData(prev => ({
        ...prev,
        [cycleId]: buildingsMap,
      }));
    } catch (error: any) {
      console.error(`Failed to load billing data for cycle ${cycleId}:`, error);
      show(error?.response?.data?.message || error?.message || 'Failed to load billing data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateAmount = (usage: number): number => {
    if (!pricingFormula || usage <= 0) return 0;
    
    let total = 0;
    
    // Sort ranges by 'from' value (ascending)
    const sortedRanges = [...pricingFormula.ranges].sort((a, b) => a.from - b.from);
    
    let remainingUsage = usage;
    
    for (const range of sortedRanges) {
      if (remainingUsage <= 0) break;
      
      // Skip if usage hasn't reached this range yet
      if (usage <= range.from) continue;
      
      // Calculate how much usage falls in this range
      const rangeStart = range.from;
      const rangeEnd = range.to === null ? usage : Math.min(range.to, usage);
      const rangeUsage = Math.min(rangeEnd - rangeStart, remainingUsage);
      
      if (rangeUsage > 0) {
        total += rangeUsage * range.price;
        remainingUsage -= rangeUsage;
      }
      
      // If we've covered all usage, break
      if (range.to !== null && usage <= range.to) break;
    }
    
    return total;
  };

  const loadPricingFormula = async () => {
    // TODO: Implement API call to get pricing formula
    // For now, use default formula
    setPricingFormula({
      id: 'default',
      serviceCode: 'ELECTRIC',
      ranges: [
        { from: 0, to: 50, price: 1500 },
        { from: 50, to: 100, price: 2000 },
        { from: 100, to: 200, price: 2500 },
        { from: 200, to: null, price: 3000 },
      ],
    });
  };

  const toggleCycle = async (cycleId: string) => {
    const newExpanded = new Set(expandedCycles);
    if (newExpanded.has(cycleId)) {
      newExpanded.delete(cycleId);
    } else {
      newExpanded.add(cycleId);
      // Load billing data if not already loaded
      if (!billingData[cycleId]) {
        await loadBillingDataForCycle(cycleId);
      }
    }
    setExpandedCycles(newExpanded);
  };

  const toggleBuilding = (buildingId: string) => {
    const newExpanded = new Set(expandedBuildings);
    if (newExpanded.has(buildingId)) {
      newExpanded.delete(buildingId);
    } else {
      newExpanded.add(buildingId);
    }
    setExpandedBuildings(newExpanded);
  };

  const handleExportInvoice = async (cycleId: string) => {
    try {
      const response: MeterReadingImportResponse = await exportReadingsByCycle(cycleId);
      show(`Exported ${response.totalReadings} readings. ${response.invoicesCreated} invoices created.`, 'success');
    } catch (error: any) {
      console.error('Failed to export invoice:', error);
      show(error?.response?.data?.message || error?.message || 'Failed to export invoice', 'error');
    }
  };

  if (isInitialLoad || loading) {
    return (
      <div className="bg-white p-6 rounded-xl text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#739559] mx-auto mb-4"></div>
        <p className="text-gray-600">Loading billing data...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Cycles List */}
      <div className="space-y-4">
        {cycles.map((cycle) => {
          const isExpanded = expandedCycles.has(cycle.id);
          const cycleBuildings = billingData[cycle.id] || {};
          const buildingsList = Object.values(cycleBuildings);

          return (
            <div key={cycle.id} className="bg-white rounded-xl overflow-hidden">
              {/* Cycle Header */}
              <div className="p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer flex items-center justify-between border-b border-gray-200">
                <div
                  onClick={() => toggleCycle(cycle.id)}
                  className="flex-1 flex items-center gap-4"
                >
                  <svg
                    className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{cycle.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(cycle.periodFrom).toLocaleDateString()} - {new Date(cycle.periodTo).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleExportInvoice(cycle.id)}
                  className="ml-4 px-4 py-2 bg-[#739559] text-white rounded-md hover:bg-[#5a7447] transition-colors text-sm font-medium"
                >
                  Xuất Hóa Đơn
                </button>
              </div>

              {/* Buildings List */}
              {isExpanded && (
                <div className="p-4 space-y-3">
                  {buildingsList.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No buildings with readings found</p>
                  ) : (
                    buildingsList.map((building) => {
                      const isBuildingExpanded = expandedBuildings.has(building.buildingId);
                      const totalAmount = building.units.reduce((sum, unit) => sum + unit.amount, 0);

                      return (
                        <div
                          key={building.buildingId}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          {/* Building Header */}
                          <div
                            onClick={() => toggleBuilding(building.buildingId)}
                            className="p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <svg
                                className={`w-4 h-4 text-gray-600 transition-transform ${isBuildingExpanded ? 'rotate-90' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <span className="font-medium text-gray-800">
                                {building.buildingName} ({building.buildingCode})
                              </span>
                              <span className="text-sm text-gray-600">
                                {building.units.length} unit(s)
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-[#02542D]">
                              Total: {totalAmount.toLocaleString('vi-VN')} VNĐ
                            </span>
                          </div>

                          {/* Units Table */}
                          {isBuildingExpanded && (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Unit ID</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Meter Code</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Prev Index</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Current Index</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Usage</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Amount</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {building.units.map((unit, index) => (
                                    <tr key={unit.unitId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="px-4 py-2 text-sm text-gray-800">{unit.unitCode}</td>
                                      <td className="px-4 py-2 text-sm text-gray-800">{unit.meterCode}</td>
                                      <td className="px-4 py-2 text-sm text-gray-800 text-right">{unit.prevIndex.toFixed(2)}</td>
                                      <td className="px-4 py-2 text-sm text-gray-800 text-right">{unit.currentIndex.toFixed(2)}</td>
                                      <td className="px-4 py-2 text-sm text-gray-800 text-right">{unit.usage.toFixed(2)}</td>
                                      <td className="px-4 py-2 text-sm font-semibold text-[#02542D] text-right">
                                        {unit.amount.toLocaleString('vi-VN')} VNĐ
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Formula Modal */}
      {showFormulaModal && pricingFormula && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#02542D]">Công Thức Tính - ELECTRIC</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEditFormulaModal(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this formula?')) {
                      // TODO: Implement delete formula
                      show('Formula deleted', 'success');
                      setShowFormulaModal(false);
                    }
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowFormulaModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {pricingFormula.ranges.map((range, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                  <span className="text-sm font-medium text-gray-700">
                    {range.from} - {range.to === null ? '∞' : range.to}
                  </span>
                  <span className="text-sm text-gray-600">→</span>
                  <span className="text-sm font-semibold text-[#02542D]">
                    {range.price.toLocaleString('vi-VN')} VNĐ/unit
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Formula Modal */}
      {showEditFormulaModal && pricingFormula && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-xl font-semibold text-[#02542D] mb-4">Edit Công Thức Tính - ELECTRIC</h2>
            {/* TODO: Implement edit formula form */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowEditFormulaModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: Implement save formula
                  show('Formula updated', 'success');
                  setShowEditFormulaModal(false);
                  setShowFormulaModal(false);
                }}
                className="px-4 py-2 bg-[#739559] text-white rounded-md hover:bg-[#5a7447]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

