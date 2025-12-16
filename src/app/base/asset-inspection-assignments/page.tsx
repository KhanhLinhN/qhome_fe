'use client';

import { useEffect, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/src/contexts/AuthContext';
import { useNotifications } from '@/src/hooks/useNotifications';
import {
  AssetInspection,
  InspectionStatus,
  getAllInspections,
  getInspectionByContractId,
  getInspectionById,
  startInspection,
  updateInspectionItem,
  completeInspection,
  generateInvoice,
  type UpdateAssetInspectionItemRequest,
} from '@/src/services/base/assetInspectionService';
import { updateInvoiceStatus, getAllInvoicesForAdmin, type InvoiceDto } from '@/src/services/finance/invoiceAdminService';
import { getActivePricingTiersByService, type PricingTierDto } from '@/src/services/finance/pricingTierService';
import {
  getMetersByUnit,
  createMeterReading,
  getReadingCyclesByStatus,
  getAssignmentsByStaff,
  createMeterReadingAssignment,
  exportReadingsByCycle,
  type MeterDto,
  type MeterReadingCreateReq,
  type ReadingCycleDto,
  type MeterReadingAssignmentDto,
  type MeterReadingAssignmentCreateReq,
} from '@/src/services/base/waterService';
import { fetchContractDetail } from '@/src/services/base/contractService';
import { getUnit } from '@/src/services/base/unitService';
import { getAssetsByUnit, getAssetById } from '@/src/services/base/assetService';
import { type Asset } from '@/src/types/asset';

export default function TechnicianInspectionAssignmentsPage() {
  const { user, hasRole } = useAuth();
  const { show } = useNotifications();
  const t = useTranslations('TechnicianInspections');
  
  // Check if user is admin
  const isAdmin = hasRole('ADMIN') || hasRole('admin') || hasRole('ROLE_ADMIN') || hasRole('ROLE_admin');

  const [loading, setLoading] = useState(false);
  const [inspections, setInspections] = useState<AssetInspection[]>([]);
  const [selectedInspection, setSelectedInspection] = useState<AssetInspection | null>(null);
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);
  const [inspectorNotes, setInspectorNotes] = useState('');

  // Meter reading states
  const [unitMeters, setUnitMeters] = useState<MeterDto[]>([]);
  const [loadingMeters, setLoadingMeters] = useState(false);
  const [meterReadings, setMeterReadings] = useState<Record<string, { index: string; note?: string }>>({});
  const [readingDate, setReadingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeCycle, setActiveCycle] = useState<ReadingCycleDto | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<MeterReadingAssignmentDto | null>(null);
  
  // Unit assets (for preview when items not yet created)
  const [unitAssets, setUnitAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  
  // Map of assetId to Asset for quick lookup
  const [assetsMap, setAssetsMap] = useState<Record<string, Asset>>({});
  
  // Temporary inspection data (before items are created)
  const [tempInspectionData, setTempInspectionData] = useState<Record<string, { conditionStatus: string; notes: string; repairCost?: number }>>({});
  
  // Water/Electric invoices state
  const [waterElectricInvoices, setWaterElectricInvoices] = useState<InvoiceDto[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  
  // Pricing tiers and calculated prices
  const [pricingTiers, setPricingTiers] = useState<Record<string, PricingTierDto[]>>({});
  const [calculatedPrices, setCalculatedPrices] = useState<Record<string, number>>({}); // meterId -> calculated price

  useEffect(() => {
    if (user?.userId || isAdmin) {
      loadMyInspections();
    }
  }, [user?.userId, isAdmin]);

  // Load water/electric invoices when inspection is opened
  useEffect(() => {
    if (selectedInspection?.unitId) {
      // Load invoices for the unit, filter by cycle if available
      loadWaterElectricInvoices(selectedInspection.unitId, activeCycle?.id);
    }
  }, [selectedInspection?.unitId, activeCycle?.id]);

  const loadMyInspections = async () => {
    if (!user?.userId && !isAdmin) return;
    
    setLoading(true);
    try {
      // If admin, load all inspections; otherwise load only assigned inspections
      const data = isAdmin 
        ? await getAllInspections() // No userId parameter = get all inspections
        : await getAllInspections(user?.userId);
      setInspections(data);
    } catch (error: any) {
      show(error?.response?.data?.message || error?.message || t('errors.loadFailed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUnitMeters = async (unitId: string): Promise<MeterDto[]> => {
    if (!unitId) return [];
    setLoadingMeters(true);
    try {
      const meters = await getMetersByUnit(unitId);
      const activeMeters = meters.filter(m => m.active);
      setUnitMeters(activeMeters);
      
      const readings: Record<string, { index: string; note?: string }> = {};
      activeMeters.forEach(meter => {
        readings[meter.id] = { index: '' };
      });
      setMeterReadings(readings);
      return activeMeters;
    } catch (error: any) {
      setUnitMeters([]);
      return [];
    } finally {
      setLoadingMeters(false);
    }
  };

  const loadUnitAssets = async (unitId: string) => {
    if (!unitId) return;
    setLoadingAssets(true);
    try {
      const assets = await getAssetsByUnit(unitId);
      // Filter only active assets
      const activeAssets = assets.filter(a => a.active);
      setUnitAssets(activeAssets);
      
      // Create a map for quick lookup by assetId
      const map: Record<string, Asset> = {};
      activeAssets.forEach(asset => {
        map[asset.id] = asset;
        if (asset.assetCode) {
          map[asset.assetCode] = asset;
        }
      });
      setAssetsMap(map);
    } catch (error: any) {
      setUnitAssets([]);
      setAssetsMap({});
    } finally {
      setLoadingAssets(false);
    }
  };
  
  // Load individual asset if not found in unitAssets
  const loadAssetIfNeeded = async (assetId: string) => {
    if (!assetId || assetsMap[assetId]) return assetsMap[assetId];
    
    try {
      const asset = await getAssetById(assetId);
      if (asset) {
        setAssetsMap(prev => ({ ...prev, [assetId]: asset }));
        // Also add to unitAssets if not already there
        setUnitAssets(prev => {
          if (!prev.find(a => a.id === assetId)) {
            return [...prev, asset];
          }
          return prev;
        });
        return asset;
      }
    } catch (error: any) {
      // Asset not found
    }
    return null;
  };

  const loadActiveCycleAndAssignment = async (technicianId: string, unitId?: string, meters?: MeterDto[]) => {
    if (!technicianId) return;
    try {
      const openCycles = await getReadingCyclesByStatus('OPEN');
      const inProgressCycles = await getReadingCyclesByStatus('IN_PROGRESS');
      const activeCycles = [...openCycles, ...inProgressCycles];
      
      if (activeCycles.length > 0) {
        const cycle = activeCycles[0];
        setActiveCycle(cycle);
        
        const assignments = await getAssignmentsByStaff(technicianId);
        // Try to find assignment that matches cycle and building of meters
        let assignment = null;
        
        if (meters && meters.length > 0) {
          // Get buildingIds from meters
          const meterBuildingIds = [...new Set(meters.map(m => m.buildingId).filter(Boolean))];
          
          // Try to find assignment matching cycle and building
          assignment = assignments.find(a => 
            a.cycleId === cycle.id && 
            !a.completedAt &&
            (meterBuildingIds.length === 0 || meterBuildingIds.includes(a.buildingId || ''))
          );
        } else {
          // If no meters, just find any assignment for this cycle
          assignment = assignments.find(a => a.cycleId === cycle.id && !a.completedAt);
        }
        
        // If no assignment exists and we have unitId and meters, try to create one automatically
        if (!assignment && unitId && meters && meters.length > 0) {
          try {
            // Get unique serviceIds from meters
            const serviceIds = [...new Set(meters.map(m => m.serviceId).filter(Boolean))];
            
            // Get buildingId from meters - check if all meters have the same buildingId
            const buildingIds = [...new Set(meters.map(m => m.buildingId).filter(Boolean))];
            const buildingId = buildingIds.length === 1 ? buildingIds[0] : meters[0]?.buildingId;
            
            // Use first buildingId if meters have different buildings
            
            // Create assignment for each service (or first service if multiple)
            if (serviceIds.length > 0 && cycle.id && buildingId) {
              const serviceId = serviceIds[0]; // Use first service, or create multiple if needed
              
              const createReq: MeterReadingAssignmentCreateReq = {
                cycleId: cycle.id,
                serviceId: serviceId,
                assignedTo: technicianId,
                buildingId: buildingId,
                unitIds: [unitId],
              };
              
              const newAssignment = await createMeterReadingAssignment(createReq);
              assignment = newAssignment;
              show(t('success.assignmentCreated', { defaultValue: 'Đã tự động tạo assignment cho chu kỳ này' }), 'success');
            }
          } catch (createError: any) {
            // Failed to auto-create assignment, continue without it
          }
        }
        
        if (assignment) {
          setActiveAssignment(assignment);
        }
      }
    } catch (error: any) {
      // Failed to load active cycle/assignment
    }
  };

  // Calculate price based on usage and pricing tiers
  const calculatePriceFromUsage = (usage: number, serviceCode: string): number => {
    const tiers = pricingTiers[serviceCode] || [];
    if (tiers.length === 0) {
      console.warn(`No pricing tiers found for serviceCode: ${serviceCode}, available:`, Object.keys(pricingTiers));
      return 0;
    }
    
    // Sort tiers by tierOrder
    const sortedTiers = [...tiers].sort((a, b) => a.tierOrder - b.tierOrder);
    
    let totalPrice = 0;
    let remainingUsage = usage;
    
    for (const tier of sortedTiers) {
      if (remainingUsage <= 0) break;
      
      const minQty = tier.minQuantity || 0;
      const maxQty = tier.maxQuantity;
      const unitPrice = tier.unitPrice || 0;
      
      if (maxQty !== null && maxQty !== undefined) {
        // Tier has max quantity
        const tierUsage = Math.min(remainingUsage, maxQty - minQty);
        if (tierUsage > 0) {
          totalPrice += tierUsage * unitPrice;
          remainingUsage -= tierUsage;
        }
      } else {
        // Last tier (no max)
        totalPrice += remainingUsage * unitPrice;
        remainingUsage = 0;
      }
    }
    
    console.log(`Calculated price for ${serviceCode}: usage=${usage}, price=${totalPrice}, tiers used:`, sortedTiers.length);
    return totalPrice;
  };

  // Load pricing tiers for water and electric services
  const loadPricingTiers = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [waterTiers, electricTiers] = await Promise.all([
        getActivePricingTiersByService('WATER', today).catch((err) => {
          console.warn('Failed to load WATER pricing tiers:', err);
          return [];
        }),
        getActivePricingTiersByService('ELECTRIC', today).catch((err) => {
          console.warn('Failed to load ELECTRIC pricing tiers:', err);
          return [];
        })
      ]);
      
      console.log('Loaded pricing tiers:', {
        WATER: waterTiers.length,
        ELECTRIC: electricTiers.length,
        waterTiers: waterTiers,
        electricTiers: electricTiers
      });
      
      setPricingTiers({
        WATER: waterTiers,
        ELECTRIC: electricTiers
      });
    } catch (error) {
      console.warn('Failed to load pricing tiers:', error);
    }
  };

  // Calculate prices when meter readings change
  useEffect(() => {
    if (Object.keys(pricingTiers).length === 0) return;
    
    const newCalculatedPrices: Record<string, number> = {};
    
    unitMeters.forEach(meter => {
      const reading = meterReadings[meter.id];
      if (!reading?.index) return;
      
      const currentIndex = parseFloat(reading.index);
      if (isNaN(currentIndex)) return;
      
      const prevIndex = meter.lastReading !== null && meter.lastReading !== undefined ? meter.lastReading : 0;
      
      // Ensure usage is valid and not negative
      if (currentIndex < prevIndex) return;
      
      const usage = currentIndex - prevIndex;
      
      if (usage > 0) {
        // Normalize serviceCode - handle both uppercase and lowercase, and variations
        let serviceCode = (meter.serviceCode || '').toUpperCase();
        
        // Map variations to standard codes
        if (serviceCode.includes('ELECTRIC') || serviceCode.includes('ĐIỆN') || meter.serviceName?.toLowerCase().includes('điện')) {
          serviceCode = 'ELECTRIC';
        } else if (serviceCode.includes('WATER') || serviceCode.includes('NƯỚC') || meter.serviceName?.toLowerCase().includes('nước')) {
          serviceCode = 'WATER';
        }
        
        if (serviceCode === 'ELECTRIC' || serviceCode === 'WATER') {
          const price = calculatePriceFromUsage(usage, serviceCode);
          if (price > 0) {
            newCalculatedPrices[meter.id] = price;
          }
        }
      }
    });
    
    setCalculatedPrices(newCalculatedPrices);
  }, [meterReadings, unitMeters, pricingTiers]);

  const loadWaterElectricInvoices = async (unitId: string, cycleId?: string) => {
    if (!unitId) return;
    
    setLoadingInvoices(true);
    try {
      // Load invoices for WATER and ELECTRIC services
      const [waterInvoices, electricInvoices] = await Promise.all([
        getAllInvoicesForAdmin({ unitId, serviceCode: 'WATER' }).catch(() => []),
        getAllInvoicesForAdmin({ unitId, serviceCode: 'ELECTRIC' }).catch(() => [])
      ]);
      
      // Filter by cycleId if provided, otherwise show all invoices for this unit
      let allInvoices = [...waterInvoices, ...electricInvoices];
      if (cycleId) {
        allInvoices = allInvoices.filter(inv => inv.cycleId === cycleId);
      }
      
      // Also try to load invoices without serviceCode filter to catch any missed ones
      if (allInvoices.length === 0) {
        try {
          const allUnitInvoices = await getAllInvoicesForAdmin({ unitId });
          const waterElectricOnly = allUnitInvoices.filter(inv => {
            const serviceCodes = inv.lines?.map(line => line.serviceCode) || [];
            return serviceCodes.includes('WATER') || serviceCodes.includes('ELECTRIC');
          });
          
          if (cycleId) {
            allInvoices = waterElectricOnly.filter(inv => inv.cycleId === cycleId);
          } else {
            allInvoices = waterElectricOnly;
          }
        } catch (err) {
          // Ignore error, use what we have
        }
      }
      
      setWaterElectricInvoices(allInvoices);
    } catch (error: any) {
      console.warn('Failed to load water/electric invoices:', error);
      setWaterElectricInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleOpenInspection = async (inspection: AssetInspection) => {
    setInspectionModalOpen(true);
    setInspectorNotes(inspection.inspectorNotes || '');
    setMeterReadings({});
    setReadingDate(new Date().toISOString().split('T')[0]);
    setActiveCycle(null);
    setActiveAssignment(null);
    // Clear assets map when opening new inspection
    setAssetsMap({});
    setUnitAssets([]);
    setWaterElectricInvoices([]);

    // Load assets FIRST before loading inspection details
    if (inspection.unitId) {
      await loadUnitAssets(inspection.unitId);
      const meters = await loadUnitMeters(inspection.unitId);
      
      // Load pricing tiers for price calculation
      await loadPricingTiers();
      
      if (user?.userId) {
        // Pass unitId and meters to auto-create assignment if needed
        await loadActiveCycleAndAssignment(user.userId, inspection.unitId, meters);
      }
    }

    // Reload inspection with full details including items AFTER assets are loaded
    try {
      const fullInspection = await getInspectionByContractId(inspection.contractId);
      if (fullInspection) {
        setSelectedInspection(fullInspection);
        // Update inspector notes if available
        if (fullInspection.inspectorNotes) {
          setInspectorNotes(fullInspection.inspectorNotes);
        }
      } else {
        // Fallback to the inspection from list if API fails
        setSelectedInspection(inspection);
      }
    } catch (error: any) {
      // Fallback to the inspection from list if API fails
      setSelectedInspection(inspection);
    }
  };

  const handleStartInspection = async () => {
    if (!selectedInspection) return;
    try {
      const updated = await startInspection(selectedInspection.id);
      setSelectedInspection(updated);
      await loadMyInspections();
      show(t('success.startInspection'), 'success');
      
      // Retry loading inspection with items multiple times
      let retryCount = 0;
      const maxRetries = 5;
      const retryInterval = 2000; // 2 seconds
      
      const retryLoadItems = async () => {
        try {
          // Try by contract ID first (more reliable)
          let fullInspection = await getInspectionByContractId(selectedInspection.contractId);
          
          // If that fails, try by ID (but handle errors gracefully)
          if (!fullInspection) {
            try {
              fullInspection = await getInspectionById(updated.id);
            } catch (err) {
              // Ignore errors from getInspectionById, continue with contract-based lookup
            }
          }
          
          if (fullInspection && fullInspection.items && fullInspection.items.length > 0) {
            setSelectedInspection(fullInspection);
            show(t('success.itemsLoaded', { count: fullInspection.items.length, defaultValue: `Đã tải ${fullInspection.items.length} thiết bị` }), 'success');
            return;
          }
          
          retryCount++;
          if (retryCount < maxRetries) {
            setTimeout(retryLoadItems, retryInterval);
          } else {
            // Keep the updated inspection but show a message
            show(t('warnings.itemsNotReady', { defaultValue: 'Danh sách thiết bị đang được tạo. Vui lòng nhấn "Làm mới" sau vài giây.' }), 'info');
          }
        } catch (error: any) {
          retryCount++;
          if (retryCount < maxRetries) {
            setTimeout(retryLoadItems, retryInterval);
          }
        }
      };
      
      // Start retrying after initial delay
      setTimeout(retryLoadItems, 1000);
    } catch (error: any) {
      show(error?.response?.data?.message || error?.message || t('errors.startFailed'), 'error');
    }
  };

  const handleUpdateInspectionItem = async (itemId: string, conditionStatus: string, notes: string, repairCost?: number) => {
    if (!selectedInspection) return;
    try {
      // Build request object - only include fields that have values
      // NOTE: Do NOT set checked: true here - it will auto-complete inspection
      // Only set checked when user explicitly completes inspection
      const request: UpdateAssetInspectionItemRequest = {
        // checked: true, // REMOVED - will be set when completing inspection
      };
      
      // CRITICAL: Always include conditionStatus if provided (even if empty string)
      // Backend requires conditionStatus to calculate damageCost
      // If conditionStatus is empty string or null, backend will not save it
      if (conditionStatus !== undefined && conditionStatus !== null && conditionStatus.trim() !== '') {
        request.conditionStatus = conditionStatus.trim();
      } else {
        // Don't proceed with update if conditionStatus is missing - it's required!
        show(t('errors.conditionStatusRequired', { defaultValue: 'Vui lòng chọn tình trạng thiết bị trước khi lưu!' }), 'error');
        return;
      }
      
      // Include notes if provided
      if (notes && notes.trim() !== '') {
        request.notes = notes.trim();
      }
      
      // Always include damageCost if repairCost is provided (even if 0)
      // Backend will auto-calculate if not provided, but we want to use the technician's value
      if (repairCost !== undefined && repairCost !== null) {
        request.damageCost = repairCost;
      }
      // If repairCost is not provided but conditionStatus is not GOOD, backend will auto-calculate
      
      // CRITICAL: Verify conditionStatus is in request
      if (!request.conditionStatus) {
        show(t('errors.conditionStatusRequired', { defaultValue: 'Lỗi: Tình trạng thiết bị không được gửi. Vui lòng thử lại!' }), 'error');
        return;
      }
      
      const updatedItem = await updateInspectionItem(itemId, request);
      
      // Reload inspection to get updated totalDamageCost
      // Backend might need a moment to recalculate totalDamageCost, so we'll retry a few times
      let updated: AssetInspection | null = null;
      let retryCount = 0;
      const maxRetries = 3;
      const retryDelay = 500; // 500ms delay between retries
      
      while (retryCount < maxRetries && !updated) {
        try {
          const reloaded = await getInspectionByContractId(selectedInspection.contractId);
          if (reloaded) {
            const updatedItem = reloaded.items?.find(i => i.id === itemId);
            const expectedCost = repairCost !== undefined && repairCost !== null ? repairCost : 0;
            // Use robust cost extraction - prioritize repairCost, fallback to damageCost
            const actualCost = updatedItem 
              ? (updatedItem.repairCost !== undefined && updatedItem.repairCost !== null
                  ? updatedItem.repairCost
                  : (updatedItem.damageCost !== undefined && updatedItem.damageCost !== null ? updatedItem.damageCost : 0))
              : 0;
            
            // Check if the cost was updated correctly
            // Also check all items to ensure they're properly mapped
            const allItemsHaveCosts = reloaded.items?.every(item => {
              const hasRepairCost = item.repairCost !== undefined && item.repairCost !== null;
              const hasDamageCost = item.damageCost !== undefined && item.damageCost !== null;
              return hasRepairCost || hasDamageCost || item.conditionStatus === 'GOOD';
            });
            
            if (updatedItem && Math.abs(expectedCost - actualCost) < 0.01 && allItemsHaveCosts) {
              updated = reloaded;
              break;
            } else if (retryCount < maxRetries - 1) {
              // Cost doesn't match yet, wait and retry
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              retryCount++;
            } else {
              // Last retry, use what we have
              updated = reloaded;
            }
          }
        } catch (err) {
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }
      
      if (updated) {
        // Preserve modal state - don't close modal on update
        setSelectedInspection(updated);
        
        // Calculate total from items to verify - use robust cost extraction
        const calculatedTotal = updated.items?.reduce((sum, item) => {
          const cost = item.repairCost !== undefined && item.repairCost !== null
            ? item.repairCost
            : (item.damageCost !== undefined && item.damageCost !== null ? item.damageCost : 0);
          return sum + cost;
        }, 0) || 0;
        
        // Reload list in background (don't await to avoid blocking)
        loadMyInspections().catch(() => {});
        
        // Reload assets to ensure purchasePrice is up to date (don't await to avoid blocking)
        if (updated.unitId) {
          loadUnitAssets(updated.unitId).catch(() => {});
        }
      }
      show(t('success.updateItem', { defaultValue: 'Cập nhật thiết bị thành công' }), 'success');
    } catch (error: any) {
      show(error?.response?.data?.message || error?.message || t('errors.updateFailed'), 'error');
    }
  };

  const handleCompleteInspection = async () => {
    if (!selectedInspection) return;
    
    // VALIDATION 1: All items must have conditionStatus
    const itemsWithoutStatus = selectedInspection.items?.filter(item => 
      !item.conditionStatus || item.conditionStatus.trim() === ''
    ) || [];
    
    if (itemsWithoutStatus.length > 0) {
      show(
        t('errors.itemsMissingStatus', { 
          count: itemsWithoutStatus.length,
          defaultValue: `Vui lòng cập nhật tình trạng cho ${itemsWithoutStatus.length} thiết bị trước khi hoàn thành kiểm tra!` 
        }), 
        'error'
      );
      return;
    }
    
    // VALIDATION 2: Items with non-GOOD status must have damageCost > 0
    const itemsWithInvalidCost = selectedInspection.items?.filter(item => {
      if (item.conditionStatus === 'GOOD') return false; // GOOD items don't need cost
      const cost = item.repairCost || item.damageCost || 0;
      return cost <= 0;
    }) || [];
    
    if (itemsWithInvalidCost.length > 0) {
      show(
        t('errors.itemsInvalidCost', { 
          count: itemsWithInvalidCost.length,
          defaultValue: `Vui lòng nhập chi phí thiệt hại > 0 cho ${itemsWithInvalidCost.length} thiết bị có tình trạng không tốt!` 
        }), 
        'error'
      );
      return;
    }
    
    // VALIDATION 3: All water/electric meters must have index > 0
    if (unitMeters.length > 0) {
      const metersWithoutReading: string[] = [];
      const metersWithInvalidReading: string[] = [];
      
      for (const meter of unitMeters) {
        const reading = meterReadings[meter.id];
        if (!reading || !reading.index || reading.index.trim() === '') {
          metersWithoutReading.push(meter.meterCode || meter.id);
        } else {
          const indexValue = parseFloat(reading.index);
          if (isNaN(indexValue) || indexValue <= 0) {
            metersWithInvalidReading.push(meter.meterCode || meter.id);
          }
        }
      }
      
      if (metersWithoutReading.length > 0) {
        show(
          t('errors.metersMissingReading', { 
            count: metersWithoutReading.length,
            meters: metersWithoutReading.join(', '),
            defaultValue: `Vui lòng nhập chỉ số đồng hồ cho ${metersWithoutReading.length} đồng hồ: ${metersWithoutReading.join(', ')}!` 
          }), 
          'error'
        );
        return;
      }
      
      if (metersWithInvalidReading.length > 0) {
        show(
          t('errors.metersInvalidReading', { 
            count: metersWithInvalidReading.length,
            meters: metersWithInvalidReading.join(', '),
            defaultValue: `Chỉ số đồng hồ phải > 0 cho ${metersWithInvalidReading.length} đồng hồ: ${metersWithInvalidReading.join(', ')}!` 
          }), 
          'error'
        );
        return;
      }
    }
    
    try {
      // Create meter readings if meters exist and readings are provided
      if (unitMeters.length > 0 && activeAssignment) {
        const readingPromises: Promise<any>[] = [];
        let successCount = 0;
        let errorCount = 0;
        
        for (const meter of unitMeters) {
          const reading = meterReadings[meter.id];
          if (reading && reading.index && reading.index.trim() !== '') {
            try {
              // Validate required fields
              if (!activeAssignment?.id) {
                errorCount++;
                continue;
              }
              
              if (!meter?.id) {
                errorCount++;
                continue;
              }
              
              const indexValue = parseFloat(reading.index);
              if (isNaN(indexValue) || indexValue < 0) {
                errorCount++;
                continue;
              }
              
              // Format readingDate to YYYY-MM-DD format (LocalDate)
              let formattedDate = readingDate;
              if (!formattedDate) {
                formattedDate = new Date().toISOString().split('T')[0];
              } else if (formattedDate.includes('T')) {
                // If it's ISO format, extract date part
                formattedDate = formattedDate.split('T')[0];
              }
              
              // Get previous reading index (lastReading from meter or 0)
              const prevIndex = meter.lastReading !== null && meter.lastReading !== undefined 
                ? meter.lastReading 
                : 0;
              
              // Check if meter and assignment are in the same building
              const meterBuildingId = meter.buildingId;
              const assignmentBuildingId = activeAssignment.buildingId;
              
              // Only include assignmentId if buildings match (or both are null/undefined)
              const useAssignmentId = (!meterBuildingId && !assignmentBuildingId) || 
                                     (meterBuildingId && assignmentBuildingId && meterBuildingId === assignmentBuildingId);
              
              const readingReq: MeterReadingCreateReq = {
                ...(useAssignmentId && { assignmentId: activeAssignment.id }), // Only include if buildings match
                meterId: meter.id,
                readingDate: formattedDate, // YYYY-MM-DD format for LocalDate
                prevIndex: prevIndex, // Required by backend
                currIndex: indexValue,
                cycleId: activeCycle?.id, // Add cycleId if available
                note: reading.note || `Đo cùng với kiểm tra thiết bị`,
              };
              
              // Validate request object
              if (!readingReq.meterId || !readingReq.readingDate || readingReq.currIndex === undefined || readingReq.prevIndex === undefined) {
                errorCount++;
                continue;
              }
              
              readingPromises.push(createMeterReading(readingReq));
              successCount++;
            } catch (err) {
              errorCount++;
            }
          }
        }
        
        if (readingPromises.length > 0) {
          try {
            await Promise.all(readingPromises);
            if (errorCount > 0) {
              show(t('errors.someReadingsFailed', { count: errorCount }), 'error');
            }
            
            // Don't generate invoices here - will be generated when completing inspection
          } catch (err) {
            show(t('errors.someReadingsFailed', { count: errorCount }), 'error');
          }
        }
      }
      
      // Reload inspection to get latest totalDamageCost before completing
      const latestInspection = await getInspectionByContractId(selectedInspection.contractId);
      const inspectionToUseForCheck = latestInspection || selectedInspection;
      
      if (inspectionToUseForCheck) {
        const itemsWithCost = inspectionToUseForCheck.items?.filter(item => {
          const cost = item.repairCost || item.damageCost || 0;
          return cost > 0;
        }) || [];
        
        const itemsWithoutStatus = inspectionToUseForCheck.items?.filter(item => 
          !item.conditionStatus || item.conditionStatus.trim() === ''
        ) || [];
        
        // CRITICAL: Check again before completing (in case items weren't updated)
        if (itemsWithoutStatus.length > 0) {
          show(
            t('errors.itemsMissingStatus', { 
              count: itemsWithoutStatus.length,
              defaultValue: `Vui lòng cập nhật tình trạng cho ${itemsWithoutStatus.length} thiết bị trước khi hoàn thành kiểm tra!` 
            }), 
            'error'
          );
          return;
        }
      }
      
      // Before completing, mark all items as checked
      // This ensures backend knows all items are done
      // IMPORTANT: Include damageCost to preserve manual cost changes
      // Use latestInspection if available to get the most up-to-date costs
      if (inspectionToUseForCheck.items && inspectionToUseForCheck.items.length > 0) {
        const checkPromises = inspectionToUseForCheck.items.map(item => {
          // Get current cost - prioritize repairCost, fallback to damageCost
          const currentCost = item.repairCost !== undefined && item.repairCost !== null
            ? item.repairCost
            : (item.damageCost !== undefined && item.damageCost !== null ? item.damageCost : undefined);
          
          return updateInspectionItem(item.id, {
            checked: true,
            conditionStatus: item.conditionStatus, // Keep existing status
            notes: item.notes,
            // Include damageCost to preserve manual cost changes
            damageCost: currentCost !== undefined && currentCost !== null ? currentCost : undefined
          }).catch(() => {});
        });
        await Promise.all(checkPromises);
      }
      
      const updated = await completeInspection(selectedInspection.id, inspectorNotes);
      
      // Reload again to get updated totalDamageCost after complete
      const reloadedInspection = await getInspectionByContractId(selectedInspection.contractId);
      const inspectionToUse = reloadedInspection || updated;
      
      // Auto-generate invoice if there's damage cost
      let finalInspection = inspectionToUse;
      if (inspectionToUse.totalDamageCost && inspectionToUse.totalDamageCost > 0 && !inspectionToUse.invoiceId) {
        try {
          finalInspection = await generateInvoice(inspectionToUse.id);
          
          // Reload one more time to get the invoiceId
          const finalReload = await getInspectionByContractId(selectedInspection.contractId);
          if (finalReload && finalReload.invoiceId) {
            finalInspection = finalReload;
            
            // Update invoice status to PAID for invoices generated from asset inspection
            try {
              await updateInvoiceStatus(finalReload.invoiceId, 'PAID');
            } catch (statusError: any) {
              // Log but don't fail - invoice was created successfully
              console.warn('Failed to update invoice status to PAID:', statusError);
            }
          }
          
          show(t('success.invoiceGenerated', { defaultValue: 'Đã tự động tạo hóa đơn cho thiệt hại thiết bị' }), 'success');
        } catch (invoiceError: any) {
          // Don't fail the whole operation if invoice generation fails
          show(t('warnings.invoiceGenerationFailed', { defaultValue: 'Đã hoàn thành kiểm tra nhưng không thể tạo hóa đơn tự động' }), 'info');
        }
      }
      
      // Generate invoices for water/electric after completing inspection
      if (activeCycle?.id && unitMeters.length > 0 && finalInspection.unitId) {
        // Check if we have meter readings
        const hasReadings = Object.values(meterReadings).some(r => r.index && r.index.trim() !== '');
        
        if (hasReadings) {
          try {
            const importResponse = await exportReadingsByCycle(activeCycle.id);
            if (importResponse.invoicesCreated > 0) {
              show(
                t('success.invoicesGenerated', { 
                  count: importResponse.invoicesCreated,
                  defaultValue: `Đã tự động tạo ${importResponse.invoicesCreated} hóa đơn điện nước` 
                }), 
                'success'
              );
            }
          } catch (invoiceError: any) {
            // Log but don't fail - inspection was completed successfully
            console.warn('Failed to generate invoices from meter readings:', invoiceError);
          }
        }
      }
      
      setSelectedInspection(finalInspection);
      await loadMyInspections();
      
      // Reload water/electric invoices after completing inspection
      if (finalInspection.unitId) {
        await loadWaterElectricInvoices(finalInspection.unitId, activeCycle?.id);
      }
      
      if (unitMeters.length > 0 && activeAssignment) {
        const readingsCount = Object.values(meterReadings).filter(r => r.index && r.index.trim() !== '').length;
        if (readingsCount > 0) {
          show(t('success.completeWithReadings', { readingCount: readingsCount }), 'success');
        } else {
          show(t('success.completeInspection'), 'success');
        }
      } else {
        show(t('success.completeInspection'), 'success');
      }
    } catch (error: any) {
      show(error?.response?.data?.message || error?.message || t('errors.completeFailed'), 'error');
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('vi-VN');
  };

  const getStatusLabel = (status: InspectionStatus) => {
    switch (status) {
      case InspectionStatus.PENDING:
        return t('status.pending');
      case InspectionStatus.IN_PROGRESS:
        return t('status.inProgress');
      case InspectionStatus.COMPLETED:
        return t('status.completed');
      case InspectionStatus.CANCELLED:
        return t('status.cancelled');
      default:
        return status;
    }
  };

  const getStatusColor = (status: InspectionStatus) => {
    switch (status) {
      case InspectionStatus.PENDING:
        return 'bg-yellow-100 text-yellow-700';
      case InspectionStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-700';
      case InspectionStatus.COMPLETED:
        return 'bg-green-100 text-green-700';
      case InspectionStatus.CANCELLED:
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const pendingInspections = inspections.filter(i => i.status === InspectionStatus.PENDING);
  const inProgressInspections = inspections.filter(i => i.status === InspectionStatus.IN_PROGRESS);
  const completedInspections = inspections.filter(i => i.status === InspectionStatus.COMPLETED);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title', { defaultValue: 'Nhiệm vụ kiểm tra thiết bị' })}</h1>
        <p className="mt-2 text-sm text-gray-600">
          {t('subtitle', { defaultValue: 'Danh sách các nhiệm vụ kiểm tra thiết bị được gán cho bạn' })}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">{t('loading', { defaultValue: 'Đang tải...' })}</div>
      ) : (
        <div className="space-y-6">
          {/* Pending Inspections */}
          {pendingInspections.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('sections.pending', { defaultValue: 'Chờ thực hiện' })} ({pendingInspections.length})
              </h2>
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.unitCode', { defaultValue: 'Mã căn hộ' })}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.inspectionDate', { defaultValue: 'Ngày kiểm tra' })}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.status', { defaultValue: 'Trạng thái' })}</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('table.actions', { defaultValue: 'Thao tác' })}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingInspections.map((inspection) => (
                      <tr key={inspection.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {inspection.unitCode || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(inspection.inspectionDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(inspection.status)}`}>
                            {getStatusLabel(inspection.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleOpenInspection(inspection)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {t('table.view', { defaultValue: 'Xem' })}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* In Progress Inspections */}
          {inProgressInspections.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('sections.inProgress', { defaultValue: 'Đang thực hiện' })} ({inProgressInspections.length})
              </h2>
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.unitCode', { defaultValue: 'Mã căn hộ' })}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.inspectionDate', { defaultValue: 'Ngày kiểm tra' })}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.status', { defaultValue: 'Trạng thái' })}</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('table.actions', { defaultValue: 'Thao tác' })}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inProgressInspections.map((inspection) => (
                      <tr key={inspection.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {inspection.unitCode || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(inspection.inspectionDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(inspection.status)}`}>
                            {getStatusLabel(inspection.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleOpenInspection(inspection)}
                            className="text-green-600 hover:text-green-900"
                          >
                            {t('table.continue', { defaultValue: 'Tiếp tục' })}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Completed Inspections */}
          {completedInspections.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('sections.completed', { defaultValue: 'Đã hoàn thành' })} ({completedInspections.length})
              </h2>
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.unitCode', { defaultValue: 'Mã căn hộ' })}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.inspectionDate', { defaultValue: 'Ngày kiểm tra' })}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.completedAt', { defaultValue: 'Ngày hoàn thành' })}</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('table.actions', { defaultValue: 'Thao tác' })}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {completedInspections.map((inspection) => (
                      <tr key={inspection.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {inspection.unitCode || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(inspection.inspectionDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(inspection.completedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleOpenInspection(inspection)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            {t('table.view', { defaultValue: 'Xem' })}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {inspections.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">{t('empty.noInspections', { defaultValue: 'Bạn chưa có nhiệm vụ kiểm tra thiết bị nào.' })}</p>
            </div>
          )}
        </div>
      )}

      {/* Inspection Detail Modal */}
      {inspectionModalOpen && selectedInspection && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setInspectionModalOpen(false);
              setSelectedInspection(null);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] flex flex-col relative z-50">
            <div className="p-6 flex-shrink-0 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {t('modal.title', { defaultValue: 'Chi tiết kiểm tra thiết bị' })}
              </h2>
              <button
                onClick={() => {
                  setInspectionModalOpen(false);
                  setSelectedInspection(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="px-6 py-6 flex-1 min-h-0 overflow-y-auto">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('modal.unitCode', { defaultValue: 'Mã căn hộ' })}</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedInspection.unitCode || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('modal.inspectionDate', { defaultValue: 'Ngày kiểm tra' })}</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedInspection.inspectionDate)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('modal.status', { defaultValue: 'Trạng thái' })}</label>
                    <span className={`mt-1 inline-block px-2 py-1 text-xs font-medium rounded ${getStatusColor(selectedInspection.status)}`}>
                      {getStatusLabel(selectedInspection.status)}
                    </span>
                  </div>
                  {(selectedInspection.totalDamageCost !== undefined && selectedInspection.totalDamageCost !== null) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t('modal.totalDamageCost', { defaultValue: 'Tổng chi phí thiệt hại' })}
                      </label>
                      <p className={`mt-1 text-lg font-semibold ${
                        selectedInspection.totalDamageCost > 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {selectedInspection.totalDamageCost > 0 
                          ? `${selectedInspection.totalDamageCost.toLocaleString('vi-VN')} VNĐ`
                          : '0 VNĐ'}
                      </p>
                      {selectedInspection.invoiceId && (
                        <p className="mt-1 text-xs text-gray-500">
                          {t('modal.invoiceId', { defaultValue: 'Mã hóa đơn' })}: {selectedInspection.invoiceId}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {selectedInspection.status === InspectionStatus.PENDING && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                      <p className="text-sm text-blue-800 mb-3">
                        {t('modal.startInspectionDesc', { defaultValue: 'Nhấn nút bên dưới để bắt đầu kiểm tra thiết bị. Sau khi bắt đầu, bạn sẽ có thể nhập tình trạng và ghi chú cho từng thiết bị.' })}
                      </p>
                    </div>
                    <button
                      onClick={handleStartInspection}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-lg shadow-md hover:shadow-lg transition-all"
                    >
                      ▶️ {t('modal.startInspection', { defaultValue: 'Bắt đầu kiểm tra' })}
                    </button>
                  </div>
                )}

                {selectedInspection.status === InspectionStatus.IN_PROGRESS && (
                  <>
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {t('modal.equipmentList', { defaultValue: 'Danh sách thiết bị' })}
                        </h3>
                        <button
                          onClick={async () => {
                            if (selectedInspection) {
                              try {
                                // Try by contract ID first (more reliable)
                                let fullInspection = await getInspectionByContractId(selectedInspection.contractId);
                                
                                // If that fails, try by ID (but handle errors gracefully)
                                if (!fullInspection || !fullInspection.items || fullInspection.items.length === 0) {
                                  try {
                                    const inspectionById = await getInspectionById(selectedInspection.id);
                                    if (inspectionById && inspectionById.items && inspectionById.items.length > 0) {
                                      fullInspection = inspectionById;
                                    }
                                  } catch (err) {
                                    // Ignore errors from getInspectionById, continue with contract-based result
                                  }
                                }
                                
                                if (fullInspection) {
                                  // If items are now available, try to sync temp data
                                  if (fullInspection.items && fullInspection.items.length > 0) {
                                    // Try to match temp data with items and update them
                                    const itemsToUpdate: Promise<any>[] = [];
                                    fullInspection.items.forEach(item => {
                                      const asset = unitAssets.find(a => a.id === item.assetId || a.assetCode === item.assetCode) ||
                                                   assetsMap[item.assetId] ||
                                                   assetsMap[item.assetCode || ''];
                                      if (asset && tempInspectionData[asset.id]) {
                                        const tempData = tempInspectionData[asset.id];
                                        if (tempData.conditionStatus && !item.checked) {
                                          itemsToUpdate.push(
                                            updateInspectionItem(item.id, {
                                              conditionStatus: tempData.conditionStatus,
                                              notes: tempData.notes || undefined,
                                              damageCost: tempData.repairCost !== undefined ? tempData.repairCost : undefined, // Backend expects 'damageCost'
                                              checked: true
                                            }).catch(() => {})
                                          );
                                        }
                                      }
                                    });
                                    
                                    if (itemsToUpdate.length > 0) {
                                      Promise.all(itemsToUpdate).then(() => {
                                        // Reload inspection after syncing
                                        getInspectionByContractId(selectedInspection.contractId).then(updated => {
                                          if (updated) setSelectedInspection(updated);
                                        });
                                      });
                                    }
                                    
                                    setSelectedInspection(fullInspection);
                                    // Clear temp data after syncing
                                    setTempInspectionData({});
                                    show(t('success.refreshItems', { defaultValue: `Đã làm mới danh sách thiết bị (${fullInspection.items.length} thiết bị)` }), 'success');
                                  } else {
                                    setSelectedInspection(fullInspection);
                                    show(t('warnings.itemsNotReady', { defaultValue: 'Danh sách thiết bị chưa được tạo. Vui lòng thử lại sau.' }), 'info');
                                  }
                                } else {
                                  show(t('warnings.itemsNotReady', { defaultValue: 'Danh sách thiết bị chưa được tạo. Vui lòng thử lại sau.' }), 'info');
                                }
                              } catch (error: any) {
                                show(t('errors.refreshFailed', { defaultValue: 'Không thể làm mới danh sách thiết bị' }), 'error');
                              }
                            }
                          }}
                          className="px-3 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md border border-blue-200 font-medium"
                        >
                          🔄 {t('modal.refresh', { defaultValue: 'Làm mới' })}
                        </button>
                      </div>
                      <div className="space-y-3">
                        {selectedInspection.items && selectedInspection.items.length > 0 ? (
                          selectedInspection.items.map((item) => {
                            // Find corresponding asset to get purchasePrice
                            // Try multiple ways to find the asset
                            let asset = assetsMap[item.assetId] || 
                                       assetsMap[item.assetCode || ''] ||
                                       unitAssets.find(a => a.id === item.assetId || a.assetCode === item.assetCode);
                            
                            // Try to load asset if not found
                            if (!asset && item.assetId) {
                              loadAssetIfNeeded(item.assetId).then(loadedAsset => {
                                if (loadedAsset) {
                                  // Force re-render by updating selectedInspection
                                  setSelectedInspection(prev => prev ? { ...prev } : null);
                                }
                              });
                            }
                            
                            return (
                              <InspectionItemRow
                                key={`${item.id}-${asset?.id || 'no-asset'}-${asset?.purchasePrice || 'no-price'}`}
                                item={item}
                                asset={asset}
                                onUpdate={(conditionStatus, notes, repairCost) => handleUpdateInspectionItem(item.id, conditionStatus, notes, repairCost)}
                                disabled={false}
                              />
                            );
                          })
                        ) : unitAssets.length > 0 ? (
                          <div className="space-y-2">
                            {unitAssets.map((asset) => (
                              <div key={asset.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h4 className="font-medium text-gray-900">{asset.name || asset.assetCode}</h4>
                                    <p className="text-sm text-gray-500">{asset.assetType}</p>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  {/* Original Price */}
                                  {asset.purchasePrice !== undefined && asset.purchasePrice !== null && asset.purchasePrice > 0 ? (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                      <p className="text-sm font-medium text-blue-900">
                                        <span>{t('modal.item.originalPrice', { defaultValue: 'Giá gốc' })}:</span>{' '}
                                        <span className="text-lg">{asset.purchasePrice.toLocaleString('vi-VN')} VNĐ</span>
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                      <p className="text-xs text-yellow-700">
                                        {t('modal.item.noPrice', { defaultValue: '⚠️ Chưa có thông tin giá gốc' })}
                                      </p>
                                    </div>
                                  )}

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      {t('modal.item.condition', { defaultValue: 'Tình trạng' })}
                                    </label>
                                    <select
                                      value={tempInspectionData[asset.id]?.conditionStatus || ''}
                                      onChange={(e) => {
                                        const newStatus = e.target.value;
                                        // Calculate default cost based on condition status
                                        let newRepairCost: number | undefined = undefined;
                                        
                                        if (newStatus && asset.purchasePrice) {
                                          switch (newStatus) {
                                            case 'GOOD':
                                              newRepairCost = 0;
                                              break;
                                            case 'DAMAGED':
                                              newRepairCost = Math.round(asset.purchasePrice * 0.3);
                                              break;
                                            case 'MISSING':
                                              newRepairCost = asset.purchasePrice;
                                              break;
                                            case 'REPAIRED':
                                              newRepairCost = Math.round(asset.purchasePrice * 0.2);
                                              break;
                                            case 'REPLACED':
                                              newRepairCost = asset.purchasePrice;
                                              break;
                                          }
                                        }

                                        setTempInspectionData(prev => ({
                                          ...prev,
                                          [asset.id]: {
                                            ...prev[asset.id],
                                            conditionStatus: newStatus,
                                            notes: prev[asset.id]?.notes || '',
                                            repairCost: newRepairCost
                                          }
                                        }));
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                      <option value="">{t('modal.item.selectCondition', { defaultValue: 'Chọn tình trạng' })}</option>
                                      <option value="GOOD">{t('modal.condition.good', { defaultValue: 'Tốt' })}</option>
                                      <option value="DAMAGED">{t('modal.condition.damaged', { defaultValue: 'Hư hỏng' })}</option>
                                      <option value="MISSING">{t('modal.condition.missing', { defaultValue: 'Thiếu' })}</option>
                                      <option value="REPAIRED">{t('modal.condition.repaired', { defaultValue: 'Đã sửa' })}</option>
                                      <option value="REPLACED">{t('modal.condition.replaced', { defaultValue: 'Đã thay thế' })}</option>
                                    </select>
                                  </div>

                                  {/* Repair Cost */}
                                  {tempInspectionData[asset.id]?.conditionStatus && tempInspectionData[asset.id]?.conditionStatus !== 'GOOD' && (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('modal.item.repairCost', { defaultValue: 'Chi phí sửa chữa/thay thế (VNĐ)' })}
                                      </label>
                                      {(() => {
                                        const conditionStatus = tempInspectionData[asset.id]?.conditionStatus;
                                        const repairCost = tempInspectionData[asset.id]?.repairCost;
                                        const purchasePrice = asset.purchasePrice;
                                        let explanation = '';
                                        
                                        if (conditionStatus && purchasePrice && repairCost !== undefined) {
                                          const percentage = Math.round((repairCost / purchasePrice) * 100);
                                          if (conditionStatus === 'DAMAGED' && percentage === 30) {
                                            explanation = t('modal.item.costExplanation.damaged', { 
                                              purchasePrice: purchasePrice.toLocaleString('vi-VN'),
                                              repairCost: repairCost.toLocaleString('vi-VN'),
                                              defaultValue: `Tự động tính: 30% giá gốc (${purchasePrice.toLocaleString('vi-VN')} VNĐ × 30% = ${repairCost.toLocaleString('vi-VN')} VNĐ)` 
                                            });
                                          } else if ((conditionStatus === 'MISSING' || conditionStatus === 'REPLACED') && repairCost === purchasePrice) {
                                            explanation = t('modal.item.costExplanation.replacement', { 
                                              defaultValue: `Tự động tính: 100% giá gốc (Thay thế hoàn toàn)` 
                                            });
                                          } else if (conditionStatus === 'REPAIRED' && percentage === 20) {
                                            explanation = t('modal.item.costExplanation.repaired', { 
                                              purchasePrice: purchasePrice.toLocaleString('vi-VN'),
                                              repairCost: repairCost.toLocaleString('vi-VN'),
                                              defaultValue: `Tự động tính: 20% giá gốc (${purchasePrice.toLocaleString('vi-VN')} VNĐ × 20% = ${repairCost.toLocaleString('vi-VN')} VNĐ)` 
                                            });
                                          } else {
                                            explanation = t('modal.item.costExplanation.custom', { 
                                              defaultValue: `Giá đã được chỉnh sửa thủ công` 
                                            });
                                          }
                                        }
                                        
                                        return explanation ? (
                                          <p className="text-xs text-blue-600 mb-2 bg-blue-50 p-2 rounded border border-blue-200">
                                            💡 {explanation}
                                          </p>
                                        ) : null;
                                      })()}
                                      <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={tempInspectionData[asset.id]?.repairCost !== undefined ? tempInspectionData[asset.id]?.repairCost : ''}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          let repairCost: number | undefined = undefined;
                                          if (value !== '' && value !== null && value !== undefined) {
                                            const numValue = parseFloat(value);
                                            if (!isNaN(numValue) && numValue >= 0) {
                                              repairCost = numValue;
                                            }
                                          }
                                          setTempInspectionData(prev => ({
                                            ...prev,
                                            [asset.id]: {
                                              ...prev[asset.id],
                                              conditionStatus: prev[asset.id]?.conditionStatus || '',
                                              notes: prev[asset.id]?.notes || '',
                                              repairCost: repairCost
                                            }
                                          }));
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder={t('modal.item.repairCostPlaceholder', { defaultValue: 'Nhập chi phí hoặc để tự động tính' })}
                                      />
                                      {tempInspectionData[asset.id]?.repairCost !== undefined && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          {tempInspectionData[asset.id]?.repairCost?.toLocaleString('vi-VN')} VNĐ
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      {t('modal.item.notes', { defaultValue: 'Ghi chú' })}
                                    </label>
                                    <textarea
                                      value={tempInspectionData[asset.id]?.notes || ''}
                                      onChange={(e) => {
                                        setTempInspectionData(prev => ({
                                          ...prev,
                                          [asset.id]: {
                                            ...prev[asset.id],
                                            conditionStatus: prev[asset.id]?.conditionStatus || '',
                                            notes: e.target.value,
                                            repairCost: prev[asset.id]?.repairCost
                                          }
                                        }));
                                      }}
                                      rows={2}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder={t('modal.item.notesPlaceholder', { defaultValue: 'Ghi chú về tình trạng thiết bị...' })}
                                    />
                                  </div>
                                  <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                                    {t('modal.tempFormNote', { defaultValue: '💡 Dữ liệu sẽ được lưu tự động khi danh sách thiết bị được tạo. Vui lòng nhấn "Làm mới" để kiểm tra.' })}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-yellow-800 mb-2">
                              {t('modal.noEquipment', { defaultValue: 'Chưa có thiết bị nào' })}
                            </p>
                            <p className="text-sm text-yellow-700">
                              {t('modal.noEquipmentDesc', { defaultValue: 'Danh sách thiết bị sẽ được tạo tự động khi bắt đầu kiểm tra. Vui lòng nhấn "Bắt đầu kiểm tra" hoặc làm mới trang.' })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Meter Reading Section */}
                    {selectedInspection.unitId && (
                      <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          {t('modal.meterReadings', { defaultValue: 'Đo chỉ số đồng hồ điện nước' })}
                        </h3>
                        {loadingMeters ? (
                          <div className="text-sm text-gray-500 py-2">{t('modal.loadingMeters', { defaultValue: 'Đang tải danh sách đồng hồ đo...' })}</div>
                        ) : unitMeters.length > 0 ? (
                          <>
                            <div className="mb-4 relative z-10">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('modal.readingDate', { defaultValue: 'Ngày đo' })}
                              </label>
                              <input
                                type="date"
                                value={readingDate}
                                onChange={(e) => setReadingDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 relative z-10"
                              />
                            </div>
                            {activeCycle && (
                              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <p className="text-sm text-blue-800">
                                  <strong>{t('modal.activeCycle', { defaultValue: 'Chu kỳ đọc' })}:</strong> {activeCycle.name}
                                  {activeCycle.periodFrom && activeCycle.periodTo && (
                                    <span className="ml-2">
                                      ({new Date(activeCycle.periodFrom).toLocaleDateString('vi-VN')} - {new Date(activeCycle.periodTo).toLocaleDateString('vi-VN')})
                                    </span>
                                  )}
                                </p>
                              </div>
                            )}
                            <div className="space-y-3">
                              {unitMeters.map((meter) => {
                                // Calculate usage and estimated cost if readings are provided
                                const reading = meterReadings[meter.id];
                                const currentIndex = reading?.index ? parseFloat(reading.index) : null;
                                const prevIndex = meter.lastReading !== null && meter.lastReading !== undefined ? meter.lastReading : 0;
                                // Ensure usage is valid and not negative
                                const usage = currentIndex !== null && !isNaN(currentIndex) && currentIndex >= prevIndex 
                                  ? currentIndex - prevIndex 
                                  : null;
                                const unit = meter.serviceCode === 'ELECTRIC' || meter.serviceName?.toLowerCase().includes('điện') ? 'kWh' : 'm³';
                                
                                return (
                                <div key={meter.id} className="border border-gray-200 rounded-lg p-4">
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <h4 className="font-medium text-gray-900">{meter.meterCode}</h4>
                                      <p className="text-sm text-gray-500">
                                        {meter.serviceName || meter.serviceCode || 'Unknown Service'}
                                      </p>
                                      {usage !== null && usage > 0 && (
                                        <>
                                          <p className="text-xs text-blue-600 mt-1 font-medium">
                                            {t('modal.meterUsage', { 
                                              usage: usage.toLocaleString('vi-VN'),
                                              unit: unit,
                                              defaultValue: `Sử dụng: ${usage.toLocaleString('vi-VN')} ${unit}`
                                            })}
                                          </p>
                                          {calculatedPrices[meter.id] !== undefined && calculatedPrices[meter.id] > 0 ? (
                                            <p className="text-xs text-green-600 mt-1 font-semibold">
                                              {t('modal.estimatedCost', { 
                                                cost: calculatedPrices[meter.id].toLocaleString('vi-VN'),
                                                defaultValue: `Dự tính: ${calculatedPrices[meter.id].toLocaleString('vi-VN')} VNĐ`
                                              })}
                                            </p>
                                          ) : (
                                            <p className="text-xs text-gray-400 mt-1 italic">
                                              {t('modal.noPricingTiers', { defaultValue: 'Chưa có bảng giá để tính toán' })}
                                            </p>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    {/* Previous Index Display */}
                                    {meter.lastReading !== null && meter.lastReading !== undefined && (
                                      <div className="p-2 bg-gray-50 border border-gray-200 rounded-md">
                                        <p className="text-sm text-gray-700">
                                          <span className="font-medium">{t('modal.lastReading', { defaultValue: 'Chỉ số trước' })}:</span>{' '}
                                          <span className="text-lg font-semibold text-gray-900">{meter.lastReading}</span>
                                        </p>
                                      </div>
                                    )}
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('modal.currentIndex', { defaultValue: 'Chỉ số hiện tại' })} <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={meterReadings[meter.id]?.index || ''}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          setMeterReadings(prev => ({
                                            ...prev,
                                            [meter.id]: {
                                              ...prev[meter.id],
                                              index: value
                                            }
                                          }));
                                        }}
                                        placeholder={t('modal.indexPlaceholder', { defaultValue: 'Nhập chỉ số đồng hồ' })}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                          (() => {
                                            const indexValue = meterReadings[meter.id]?.index;
                                            if (indexValue && indexValue.trim() !== '') {
                                              const numValue = parseFloat(indexValue);
                                              if (!isNaN(numValue) && numValue < 0) {
                                                return 'border-red-500 focus:ring-red-500';
                                              }
                                            }
                                            return 'border-gray-300 focus:ring-blue-500';
                                          })()
                                        }`}
                                      />
                                      {(() => {
                                        const indexValue = meterReadings[meter.id]?.index;
                                        if (indexValue && indexValue.trim() !== '') {
                                          const numValue = parseFloat(indexValue);
                                          if (!isNaN(numValue) && numValue < 0) {
                                            return (
                                              <p className="mt-1 text-sm text-red-600">
                                                {t('modal.errors.invalidIndex', { defaultValue: 'Chỉ số đồng hồ phải lớn hơn hoặc bằng 0' })}
                                              </p>
                                            );
                                          }
                                        }
                                        return null;
                                      })()}
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('modal.note', { defaultValue: 'Ghi chú' })}
                                      </label>
                                      <input
                                        type="text"
                                        value={meterReadings[meter.id]?.note || ''}
                                        onChange={(e) => {
                                          setMeterReadings(prev => ({
                                            ...prev,
                                            [meter.id]: {
                                              ...prev[meter.id],
                                              note: e.target.value
                                            }
                                          }));
                                        }}
                                        placeholder={t('modal.notePlaceholder', { defaultValue: 'Ghi chú (tùy chọn)' })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    </div>
                                  </div>
                                </div>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                            <p className="text-sm text-gray-600">
                              {t('modal.noMeters', { defaultValue: 'Căn hộ này chưa có đồng hồ đo điện nước.' })}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Total Price Summary - Display at end before inspection notes */}
                    {/* Key forces re-render when items change */}
                    {(selectedInspection.totalDamageCost !== undefined && selectedInspection.totalDamageCost !== null) && (() => {
                      // Create a key based on items to force re-render when they change
                      const itemsKey = selectedInspection.items?.map(item => 
                        `${item.id}-${item.repairCost || item.damageCost || 0}`
                      ).join(',') || 'no-items';
                      // Filter items with damage cost > 0
                      // Use a more robust cost extraction that handles both repairCost and damageCost
                      const damagedItems = selectedInspection.items?.filter(item => {
                        const cost = item.repairCost !== undefined && item.repairCost !== null
                          ? item.repairCost
                          : (item.damageCost !== undefined && item.damageCost !== null ? item.damageCost : 0);
                        return cost > 0 && item.conditionStatus !== 'GOOD';
                      }) || [];
                      
                      // Calculate total from items as fallback/verification
                      const calculatedTotal = damagedItems.reduce((sum, item) => {
                        const cost = item.repairCost !== undefined && item.repairCost !== null
                          ? item.repairCost
                          : (item.damageCost !== undefined && item.damageCost !== null ? item.damageCost : 0);
                        return sum + cost;
                      }, 0);
                      
                      // Use calculated total if backend total doesn't match (backend might be delayed)
                      const displayTotal = calculatedTotal > 0 && Math.abs(calculatedTotal - (selectedInspection.totalDamageCost || 0)) > 0.01
                        ? calculatedTotal
                        : (selectedInspection.totalDamageCost || 0);
                      
                      // Calculate total water/electric invoice amount
                      // Use calculated prices if invoices not yet generated, otherwise use invoice amounts
                      const calculatedWaterElectricTotal = Object.values(calculatedPrices).reduce((sum, price) => sum + price, 0);
                      const invoiceWaterElectricTotal = waterElectricInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
                      const waterElectricTotal = invoiceWaterElectricTotal > 0 ? invoiceWaterElectricTotal : calculatedWaterElectricTotal;
                      const grandTotal = displayTotal + waterElectricTotal;
                      
                      return (
                      <div className="border-t border-gray-200 pt-4">
                        <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-lg shadow-md">
                          <div className="mb-3">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-lg font-semibold text-gray-900">
                                {t('modal.totalDamageCost', { defaultValue: 'Tổng chi phí thiệt hại' })}:
                              </span>
                              <span className={`text-3xl font-bold ${
                                displayTotal > 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {displayTotal > 0 
                                  ? `${displayTotal.toLocaleString('vi-VN')} VNĐ`
                                  : '0 VNĐ'}
                              </span>
                            </div>
                            {selectedInspection.invoiceId && (
                              <p className="text-sm text-gray-600">
                                {t('modal.invoiceId', { defaultValue: 'Mã hóa đơn' })}: <span className="font-mono font-medium">{selectedInspection.invoiceId}</span>
                              </p>
                            )}
                            
                            {/* Water/Electric Invoice Total - Always show if there are meters */}
                            {(unitMeters.length > 0 || waterElectricInvoices.length > 0 || calculatedWaterElectricTotal > 0) && (
                              <div className="mt-3 pt-3 border-t border-red-200">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-gray-700">
                                    {t('modal.waterElectricTotal', { defaultValue: 'Tổng tiền điện nước' })}:
                                  </span>
                                  {loadingInvoices ? (
                                    <span className="text-sm text-gray-500">Đang tải...</span>
                                  ) : (
                                    <span className={`text-xl font-semibold ${
                                      waterElectricTotal > 0 ? 'text-blue-600' : 'text-gray-400'
                                    }`}>
                                      {waterElectricTotal > 0 
                                        ? `${waterElectricTotal.toLocaleString('vi-VN')} VNĐ`
                                        : calculatedWaterElectricTotal > 0
                                        ? `${calculatedWaterElectricTotal.toLocaleString('vi-VN')} VNĐ (dự tính)`
                                        : 'Chưa có hóa đơn'}
                                    </span>
                                  )}
                                </div>
                                {waterElectricInvoices.length > 0 && (
                                  <div className="text-xs text-gray-500 space-y-1">
                                    {waterElectricInvoices.map(inv => (
                                      <div key={inv.id} className="flex justify-between">
                                        <span>{inv.lines?.[0]?.serviceCode === 'WATER' ? 'Nước' : 'Điện'}</span>
                                        <span>{inv.totalAmount.toLocaleString('vi-VN')} VNĐ</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {waterElectricInvoices.length === 0 && !loadingInvoices && unitMeters.length > 0 && (
                                  <p className="text-xs text-gray-400 italic">
                                    Hóa đơn sẽ được tạo sau khi hoàn thành kiểm tra và đo chỉ số đồng hồ
                                  </p>
                                )}
                              </div>
                            )}
                            
                            {/* Grand Total */}
                            {waterElectricTotal > 0 && displayTotal > 0 && (
                              <div className="mt-3 pt-3 border-t-2 border-red-400">
                                <div className="flex justify-between items-center">
                                  <span className="text-lg font-bold text-gray-900">
                                    {t('modal.grandTotal', { defaultValue: 'Tổng cộng' })}:
                                  </span>
                                  <span className="text-3xl font-bold text-red-700">
                                    {grandTotal.toLocaleString('vi-VN')} VNĐ
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Breakdown of damaged assets */}
                          {damagedItems.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-red-200">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                {t('modal.damagedAssetsBreakdown', { defaultValue: 'Chi tiết thiết bị bị hư hỏng' })}:
                              </h4>
                              <div className="space-y-2">
                                {damagedItems.map((item) => {
                                  // Get cost - prioritize repairCost, fallback to damageCost
                                  const cost = item.repairCost !== undefined && item.repairCost !== null
                                    ? item.repairCost
                                    : (item.damageCost !== undefined && item.damageCost !== null ? item.damageCost : 0);
                                  
                                  return (
                                    <div key={item.id} className="flex justify-between items-center py-2 px-3 bg-white rounded-md border border-red-100">
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">
                                          {item.assetName || item.assetCode}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {item.assetType}
                                          {item.conditionStatus && (
                                            <span className="ml-2">
                                              ({item.conditionStatus === 'DAMAGED' ? t('modal.condition.damaged', { defaultValue: 'Hư hỏng' }) :
                                                item.conditionStatus === 'MISSING' ? t('modal.condition.missing', { defaultValue: 'Thiếu' }) :
                                                item.conditionStatus === 'REPLACED' ? t('modal.condition.replaced', { defaultValue: 'Đã thay thế' }) :
                                                item.conditionStatus === 'REPAIRED' ? t('modal.condition.repaired', { defaultValue: 'Đã sửa' }) :
                                                item.conditionStatus})
                                            </span>
                                          )}
                                        </p>
                                      </div>
                                      <span className="text-sm font-semibold text-red-600 ml-4">
                                        {cost.toLocaleString('vi-VN')} VNĐ
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      );
                    })()}

                    <div className="border-t border-gray-200 pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('modal.inspectionNotes', { defaultValue: 'Ghi chú kiểm tra' })}
                      </label>
                      <textarea
                        value={inspectorNotes}
                        onChange={(e) => setInspectorNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={t('modal.notesPlaceholder', { defaultValue: 'Nhập ghi chú về tình trạng thiết bị...' })}
                      />
                    </div>

                    <button
                      onClick={handleCompleteInspection}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      {t('modal.completeInspection', { defaultValue: 'Hoàn thành kiểm tra' })}
                    </button>
                  </>
                )}

                {selectedInspection.status === InspectionStatus.COMPLETED && (
                  <>
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {t('modal.results', { defaultValue: 'Kết quả kiểm tra' })}
                      </h3>
                      <div className="space-y-3">
                        {selectedInspection.items && selectedInspection.items.map((item) => (
                          <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium text-gray-900">{item.assetName || item.assetCode}</h4>
                                <p className="text-sm text-gray-500">{item.assetType}</p>
                              </div>
                              <span className={`px-2 py-1 text-xs font-medium rounded ${
                                item.conditionStatus === 'GOOD' ? 'bg-green-100 text-green-700' :
                                item.conditionStatus === 'DAMAGED' ? 'bg-red-100 text-red-700' :
                                item.conditionStatus === 'MISSING' ? 'bg-gray-100 text-gray-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {item.conditionStatus === 'GOOD' ? t('modal.condition.good', { defaultValue: 'Tốt' }) :
                                 item.conditionStatus === 'DAMAGED' ? t('modal.condition.damaged', { defaultValue: 'Hư hỏng' }) :
                                 item.conditionStatus === 'MISSING' ? t('modal.condition.missing', { defaultValue: 'Thiếu' }) :
                                 item.conditionStatus || t('modal.condition.notInspected', { defaultValue: 'Chưa kiểm tra' })}
                              </span>
                            </div>
                            {item.notes && (
                              <p className="text-sm text-gray-700 mt-2">{item.notes}</p>
                            )}
                            {(item.repairCost || item.damageCost) && (item.repairCost !== 0 || item.damageCost !== 0) && (
                              <p className="text-sm text-red-600 font-medium mt-2">
                                {t('modal.item.damageCost', { defaultValue: 'Chi phí thiệt hại' })}: {(item.repairCost || item.damageCost || 0).toLocaleString('vi-VN')} VNĐ
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                      {(selectedInspection.totalDamageCost !== undefined && selectedInspection.totalDamageCost !== null && selectedInspection.totalDamageCost > 0) && (
                        <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-gray-900">
                              {t('modal.totalDamageCost', { defaultValue: 'Tổng chi phí thiệt hại' })}:
                            </span>
                            <span className="text-2xl font-bold text-red-600">
                              {selectedInspection.totalDamageCost.toLocaleString('vi-VN')} VNĐ
                            </span>
                          </div>
                          {selectedInspection.invoiceId && (
                            <p className="mt-2 text-sm text-gray-600">
                              {t('modal.invoiceId', { defaultValue: 'Mã hóa đơn' })}: <span className="font-mono">{selectedInspection.invoiceId}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    {selectedInspection.inspectorNotes && (
                      <div className="border-t border-gray-200 pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('modal.inspectionNotes', { defaultValue: 'Ghi chú kiểm tra' })}</label>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedInspection.inspectorNotes}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <div className="px-6 pb-6 flex-shrink-0 border-t border-gray-200 pt-4">
              <button
                onClick={() => {
                  setInspectionModalOpen(false);
                  setSelectedInspection(null);
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                {t('modal.close', { defaultValue: 'Đóng' })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for inspection item row
function InspectionItemRow({ 
  item, 
  asset,
  onUpdate, 
  disabled 
}: { 
  item: any;
  asset?: Asset | null;
  onUpdate: (conditionStatus: string, notes: string, repairCost?: number) => void;
  disabled: boolean;
}) {
  const t = useTranslations('TechnicianInspections.modal');
  const [conditionStatus, setConditionStatus] = useState(item.conditionStatus || '');
  const [notes, setNotes] = useState(item.notes || '');
  // Backend returns damageCost, but we use repairCost in UI
  const [repairCost, setRepairCost] = useState<number | undefined>(item.repairCost || item.damageCost);
  // Track if user has manually changed the cost
  const [isManualCost, setIsManualCost] = useState(false);

  // Calculate default cost based on condition status
  const calculateDefaultCost = (status: string, purchasePrice?: number): number | undefined => {
    if (!purchasePrice) return undefined;
    
    switch (status) {
      case 'GOOD':
        return 0; // No cost if good
      case 'DAMAGED':
        return Math.round(purchasePrice * 0.3); // 30% of purchase price
      case 'MISSING':
        return purchasePrice; // Full replacement cost
      case 'REPAIRED':
        return Math.round(purchasePrice * 0.2); // 20% repair cost
      case 'REPLACED':
        return purchasePrice; // Full replacement cost
      default:
        return undefined;
    }
  };

  const handleConditionChange = (newStatus: string) => {
    setConditionStatus(newStatus);
    
    const price = asset?.purchasePrice || item.purchasePrice;
    let costToSave: number | undefined = undefined;
    
    // When status changes, always auto-calculate (reset manual cost flag)
    // User can then manually adjust if needed
    if (newStatus && price) {
      const calculatedCost = calculateDefaultCost(newStatus, price);
      if (calculatedCost !== undefined) {
        setRepairCost(calculatedCost);
        costToSave = calculatedCost;
        // Reset manual cost flag when status changes - allows auto-calculation
        setIsManualCost(false);
      }
    } else if (newStatus === 'GOOD') {
      setRepairCost(0);
      costToSave = 0;
      setIsManualCost(false);
    } else {
      // Clear cost if no status or no price
      setRepairCost(undefined);
      costToSave = undefined;
      setIsManualCost(false);
    }
    
    // Auto-save when conditionStatus changes (if not empty)
    if (newStatus && newStatus.trim() !== '') {
      // Use calculated cost
      onUpdate(newStatus, notes, costToSave);
    }
  };

  const handleSave = () => {
    // Always call onUpdate if conditionStatus is selected (even if empty string)
    // Empty string means no status selected, which should still be sent to backend
    if (conditionStatus !== undefined && conditionStatus !== null) {
      onUpdate(conditionStatus, notes, repairCost);
    } else {
      // If no conditionStatus is selected, still update notes and repairCost
      onUpdate('', notes, repairCost);
    }
  };

  const purchasePrice = asset?.purchasePrice || item.purchasePrice;
  
  // Sync local state with item prop when item is updated from backend
  // Use a ref to track if we're currently saving to avoid overwriting during save
  const isSavingRef = useRef(false);
  
  useEffect(() => {
    // Skip sync if we're currently saving (to avoid race conditions)
    if (isSavingRef.current) {
      return;
    }
    
    const itemRepairCost = item.repairCost !== undefined && item.repairCost !== null 
      ? item.repairCost 
      : (item.damageCost !== undefined && item.damageCost !== null ? item.damageCost : undefined);
    const itemConditionStatus = item.conditionStatus || '';
    const itemNotes = item.notes || '';
    
    // Only update if the item values have actually changed (to avoid overwriting user input)
    if (itemConditionStatus && itemConditionStatus !== conditionStatus) {
      setConditionStatus(itemConditionStatus);
    }
    
    if (itemNotes !== notes) {
      setNotes(itemNotes);
    }
    
    // Sync repairCost - only if it's different and user hasn't manually changed it
    if (itemRepairCost !== undefined && itemRepairCost !== null) {
      const currentRepairCost = repairCost !== undefined ? repairCost : null;
      // Only sync if values are actually different (with small tolerance for floating point)
      // AND user hasn't manually changed the cost
      if (Math.abs((itemRepairCost || 0) - (currentRepairCost || 0)) > 0.01 && !isManualCost) {
        setRepairCost(itemRepairCost);
        setIsManualCost(false);
      }
    } else if (repairCost !== undefined && repairCost !== null && repairCost > 0) {
      // If item has no cost but local state does, and status is GOOD, clear it
      if (itemConditionStatus === 'GOOD' && !isManualCost) {
        setRepairCost(0);
        setIsManualCost(false);
      }
    }
  }, [item.id, item.repairCost, item.damageCost, item.conditionStatus, item.notes]);

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-medium text-gray-900">{item.assetName || item.assetCode}</h4>
          <p className="text-sm text-gray-500">{item.assetType}</p>
        </div>
        {item.checked && (
          <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">
            {t('item.inspected', { defaultValue: 'Đã kiểm tra' })}
          </span>
        )}
      </div>
      
      {!disabled && (
        <div className="space-y-3 mt-3">
          {/* Always show price section */}
          <div className={`p-3 border rounded-md ${
            purchasePrice !== undefined && purchasePrice !== null && purchasePrice > 0
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <p className={`text-sm ${
              purchasePrice !== undefined && purchasePrice !== null && purchasePrice > 0
                ? 'font-medium text-blue-900' 
                : 'text-yellow-700'
            }`}>
              <span className="font-medium">{t('item.originalPrice', { defaultValue: 'Giá gốc' })}:</span>{' '}
              {purchasePrice !== undefined && purchasePrice !== null && purchasePrice > 0 ? (
                <span className="text-lg">{purchasePrice.toLocaleString('vi-VN')} VNĐ</span>
              ) : (
                <span className="text-xs">
                  {t('item.noPrice', { defaultValue: '⚠️ Chưa có thông tin giá gốc' })}
                  {asset ? ` (Asset ID: ${asset.id})` : item.assetId ? ` (Asset ID: ${item.assetId})` : ''}
                </span>
              )}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('item.condition', { defaultValue: 'Tình trạng' })}</label>
            <select
              value={conditionStatus}
              onChange={(e) => {
                handleConditionChange(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('item.selectCondition', { defaultValue: 'Chọn tình trạng' })}</option>
              <option value="GOOD">{t('condition.good', { defaultValue: 'Tốt' })}</option>
              <option value="DAMAGED">{t('condition.damaged', { defaultValue: 'Hư hỏng' })}</option>
              <option value="MISSING">{t('condition.missing', { defaultValue: 'Thiếu' })}</option>
              <option value="REPAIRED">{t('condition.repaired', { defaultValue: 'Đã sửa' })}</option>
              <option value="REPLACED">{t('condition.replaced', { defaultValue: 'Đã thay thế' })}</option>
            </select>
          </div>
          
          {conditionStatus && conditionStatus !== 'GOOD' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('item.repairCost', { defaultValue: 'Chi phí sửa chữa/thay thế (VNĐ)' })}
              </label>
              {(() => {
                let explanation = '';
                
                if (conditionStatus && purchasePrice && repairCost !== undefined) {
                  const percentage = Math.round((repairCost / purchasePrice) * 100);
                  if (conditionStatus === 'DAMAGED' && percentage === 30) {
                    explanation = t('item.costExplanation.damaged', { 
                      purchasePrice: purchasePrice.toLocaleString('vi-VN'),
                      repairCost: repairCost.toLocaleString('vi-VN'),
                      defaultValue: `Tự động tính: 30% giá gốc (${purchasePrice.toLocaleString('vi-VN')} VNĐ × 30% = ${repairCost.toLocaleString('vi-VN')} VNĐ)` 
                    });
                  } else if ((conditionStatus === 'MISSING' || conditionStatus === 'REPLACED') && repairCost === purchasePrice) {
                    explanation = t('item.costExplanation.replacement', { 
                      defaultValue: `Tự động tính: 100% giá gốc (Thay thế hoàn toàn)` 
                    });
                  } else if (conditionStatus === 'REPAIRED' && percentage === 20) {
                    explanation = t('item.costExplanation.repaired', { 
                      purchasePrice: purchasePrice.toLocaleString('vi-VN'),
                      repairCost: repairCost.toLocaleString('vi-VN'),
                      defaultValue: `Tự động tính: 20% giá gốc (${purchasePrice.toLocaleString('vi-VN')} VNĐ × 20% = ${repairCost.toLocaleString('vi-VN')} VNĐ)` 
                    });
                  } else {
                    explanation = t('item.costExplanation.custom', { 
                      defaultValue: `Giá đã được chỉnh sửa thủ công` 
                    });
                  }
                }
                
                return explanation ? (
                  <p className="text-xs text-blue-600 mb-2 bg-blue-50 p-2 rounded border border-blue-200">
                    💡 {explanation}
                  </p>
                ) : null;
              })()}
              <input
                type="number"
                min="0"
                step="1000"
                value={repairCost !== undefined ? repairCost : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || value === null || value === undefined) {
                    setRepairCost(undefined);
                    setIsManualCost(false);
                  } else {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue) && numValue >= 0) {
                      setRepairCost(numValue);
                      // Mark as manual cost when user types
                      setIsManualCost(true);
                    }
                  }
                }}
                onBlur={() => {
                  // Auto-save when user finishes editing repairCost (if conditionStatus is set)
                  if (conditionStatus && conditionStatus.trim() !== '') {
                    handleSave();
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('item.repairCostPlaceholder', { defaultValue: 'Nhập chi phí hoặc để tự động tính' })}
              />
              {repairCost !== undefined && (
                <p className="text-xs text-gray-500 mt-1">
                  {repairCost.toLocaleString('vi-VN')} VNĐ
                </p>
              )}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('item.notes', { defaultValue: 'Ghi chú' })}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('item.notesPlaceholder', { defaultValue: 'Ghi chú về tình trạng thiết bị...' })}
            />
          </div>
          
          <button
            onClick={() => {
              if (!conditionStatus) {
                return;
              }
              handleSave();
            }}
            disabled={!conditionStatus}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {t('item.save', { defaultValue: 'Lưu' })}
          </button>
        </div>
      )}
    </div>
  );
}


