'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useNotifications } from '@/src/hooks/useNotifications';
import { getBuildings, type Building } from '@/src/services/base/buildingService';
import { getUnitsByBuilding, type Unit } from '@/src/services/base/unitService';
import {
  ContractDetail,
  ContractSummary,
  fetchContractDetail,
  getAllRentalContracts,
} from '@/src/services/base/contractService';
import {
  AssetInspection,
  AssetInspectionItem,
  InspectionStatus,
  getInspectionByContractId,
  createInspection,
  updateInspectionItem,
  startInspection,
  completeInspection,
  type CreateAssetInspectionRequest,
  type UpdateAssetInspectionItemRequest,
} from '@/src/services/base/assetInspectionService';

interface RentalContractWithUnit extends ContractSummary {
  unitCode?: string;
  unitName?: string;
  buildingCode?: string;
  buildingName?: string;
  monthlyRent?: number | null;
}

export default function RentalContractReviewPage() {
  const { show } = useNotifications();

  const [contracts, setContracts] = useState<RentalContractWithUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitsMap, setUnitsMap] = useState<Map<string, Unit>>(new Map());
  const [buildingsMap, setBuildingsMap] = useState<Map<string, Building>>(new Map());
  
  // Filters
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'expiring'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailContract, setDetailContract] = useState<ContractDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Inspection modal
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);
  const [currentInspection, setCurrentInspection] = useState<AssetInspection | null>(null);
  const [currentContract, setCurrentContract] = useState<RentalContractWithUnit | null>(null);
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [creatingInspection, setCreatingInspection] = useState(false);
  const [inspectorName, setInspectorName] = useState('');
  const [inspectorNotes, setInspectorNotes] = useState('');

  // Load buildings and contracts on mount
  useEffect(() => {
    loadBuildings();
    loadContracts();
  }, []);

  // Load units when building changes
  useEffect(() => {
    if (selectedBuildingId) {
      loadUnits(selectedBuildingId);
    } else {
      setUnits([]);
      setSelectedUnitId('');
    }
  }, [selectedBuildingId]);

  const loadBuildings = async () => {
    try {
      const data = await getBuildings();
      const buildingsList = Array.isArray(data) ? data : (data?.content || data?.data || []);
      setBuildings(buildingsList);
      
      // Create map for quick lookup
      const map = new Map<string, Building>();
      buildingsList.forEach(building => {
        map.set(building.id, building);
      });
      setBuildingsMap(map);
    } catch (error: any) {
      console.error('Failed to load buildings:', error);
      show(error?.response?.data?.message || error?.message || 'Không thể tải danh sách tòa nhà', 'error');
    }
  };

  const loadUnits = async (buildingId: string) => {
    try {
      const unitsData = await getUnitsByBuilding(buildingId);
      setUnits(unitsData);
      
      // Create map for quick lookup
      const map = new Map<string, Unit>();
      unitsData.forEach(unit => {
        map.set(unit.id, unit);
      });
      setUnitsMap(prev => {
        const newMap = new Map(prev);
        unitsData.forEach(unit => {
          newMap.set(unit.id, unit);
        });
        return newMap;
      });
    } catch (error: any) {
      console.error('Failed to load units:', error);
      show(error?.response?.data?.message || error?.message || 'Không thể tải danh sách căn hộ', 'error');
    }
  };

  const loadContracts = async () => {
    setLoading(true);
    try {
      const allContracts = await getAllRentalContracts();
      
      // Enrich contracts with unit and building info from existing maps
      const enrichedContracts: RentalContractWithUnit[] = allContracts.map(contract => {
        const unit = unitsMap.get(contract.unitId);
        const building = unit ? buildingsMap.get(unit.buildingId) : null;
        
        return {
          ...contract,
          unitCode: unit?.code,
          unitName: unit?.name,
          buildingCode: building?.code,
          buildingName: building?.name,
        };
      });
      
      setContracts(enrichedContracts);
      
      // Load units for contracts that don't have unit info yet
      const contractsWithoutUnitInfo = enrichedContracts.filter(c => !c.unitCode);
      if (contractsWithoutUnitInfo.length > 0 && buildings.length > 0) {
        // Load units for all buildings in background
        loadUnitsForAllBuildings();
      }
    } catch (error: any) {
      console.error('Failed to load rental contracts:', error);
      show(error?.response?.data?.message || error?.message || 'Không thể tải danh sách hợp đồng', 'error');
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUnitsForAllBuildings = async () => {
    // Load units for all buildings to populate the map
    for (const building of buildings) {
      try {
        const buildingUnits = await getUnitsByBuilding(building.id);
        setUnitsMap(prev => {
          const newMap = new Map(prev);
          buildingUnits.forEach(unit => {
            newMap.set(unit.id, unit);
          });
          return newMap;
        });
        
        // Update contracts with new unit info
        setContracts(prev => {
          return prev.map(contract => {
            const unit = buildingUnits.find(u => u.id === contract.unitId);
            if (unit && !contract.unitCode) {
              const building = buildingsMap.get(unit.buildingId);
              return {
                ...contract,
                unitCode: unit.code,
                unitName: unit.name,
                buildingCode: building?.code,
                buildingName: building?.name,
              };
            }
            return contract;
          });
        });
      } catch (err) {
        console.warn(`Failed to load units for building ${building.id}:`, err);
      }
    }
  };

  const handleViewDetail = async (contractId: string) => {
    setDetailLoading(true);
    setDetailModalOpen(true);
    try {
      const detail = await fetchContractDetail(contractId);
      setDetailContract(detail);
    } catch (error: any) {
      console.error('Failed to load contract detail:', error);
      show(error?.response?.data?.message || error?.message || 'Không thể tải chi tiết hợp đồng', 'error');
      setDetailContract(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenInspection = async (contract: RentalContractWithUnit) => {
    setCurrentContract(contract);
    setInspectionLoading(true);
    setInspectionModalOpen(true);
    try {
      // Try to get existing inspection
      const existingInspection = await getInspectionByContractId(contract.id);
      if (existingInspection) {
        setCurrentInspection(existingInspection);
      } else {
        // No inspection exists yet, will need to create one
        setCurrentInspection(null);
      }
    } catch (error: any) {
      console.error('Failed to load inspection:', error);
      // If inspection doesn't exist, that's okay - we'll create one
      setCurrentInspection(null);
    } finally {
      setInspectionLoading(false);
    }
  };

  const handleCreateInspection = async (contract: RentalContractWithUnit) => {
    if (!inspectorName.trim()) {
      show('Vui lòng nhập tên người kiểm tra', 'error');
      return;
    }

    setCreatingInspection(true);
    try {
      const request: CreateAssetInspectionRequest = {
        contractId: contract.id,
        unitId: contract.unitId,
        inspectionDate: new Date().toISOString().split('T')[0],
        inspectorName: inspectorName.trim(),
      };
      const inspection = await createInspection(request);
      setCurrentInspection(inspection);
      show('Tạo checklist kiểm tra thiết bị thành công', 'success');
    } catch (error: any) {
      console.error('Failed to create inspection:', error);
      show(error?.response?.data?.message || error?.message || 'Không thể tạo checklist', 'error');
    } finally {
      setCreatingInspection(false);
    }
  };

  const handleStartInspection = async () => {
    if (!currentInspection) return;
    try {
      const updated = await startInspection(currentInspection.id);
      setCurrentInspection(updated);
      show('Bắt đầu kiểm tra thiết bị', 'success');
    } catch (error: any) {
      console.error('Failed to start inspection:', error);
      show(error?.response?.data?.message || error?.message || 'Không thể bắt đầu kiểm tra', 'error');
    }
  };

  const handleUpdateInspectionItem = async (item: AssetInspectionItem, conditionStatus: string, notes: string) => {
    if (!currentInspection) return;
    try {
      const request: UpdateAssetInspectionItemRequest = {
        conditionStatus,
        notes: notes || undefined,
        checked: true,
      };
      await updateInspectionItem(item.id, request);
      // Reload inspection
      const updated = await getInspectionByContractId(currentInspection.contractId);
      if (updated) {
        setCurrentInspection(updated);
      }
    } catch (error: any) {
      console.error('Failed to update inspection item:', error);
      show(error?.response?.data?.message || error?.message || 'Không thể cập nhật', 'error');
    }
  };

  const handleCompleteInspection = async () => {
    if (!currentInspection) return;
    try {
      const updated = await completeInspection(currentInspection.id, inspectorNotes);
      setCurrentInspection(updated);
      show('Hoàn thành kiểm tra thiết bị', 'success');
    } catch (error: any) {
      console.error('Failed to complete inspection:', error);
      show(error?.response?.data?.message || error?.message || 'Không thể hoàn thành kiểm tra', 'error');
    }
  };

  const isContractExpired = (contract: RentalContractWithUnit): boolean => {
    if (contract.status !== 'ACTIVE') return true;
    if (!contract.endDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(contract.endDate);
    endDate.setHours(0, 0, 0, 0);
    return endDate <= today;
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Filter contracts
  const filteredContracts = useMemo(() => {
    let filtered = [...contracts];

    // Filter by building
    if (selectedBuildingId) {
      filtered = filtered.filter(c => {
        const unit = unitsMap.get(c.unitId);
        return unit?.buildingId === selectedBuildingId;
      });
    }

    // Filter by unit
    if (selectedUnitId) {
      filtered = filtered.filter(c => c.unitId === selectedUnitId);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(c => {
        if (statusFilter === 'active') {
          if (c.status !== 'ACTIVE') return false;
          if (!c.endDate) return true;
          const endDate = new Date(c.endDate);
          endDate.setHours(0, 0, 0, 0);
          return endDate > today;
        } else if (statusFilter === 'expired') {
          if (c.status !== 'ACTIVE') return true;
          if (!c.endDate) return false;
          const endDate = new Date(c.endDate);
          endDate.setHours(0, 0, 0, 0);
          return endDate <= today;
        } else if (statusFilter === 'expiring') {
          // Hợp đồng còn <= 30 ngày (tính từ startDate đến endDate)
          if (c.status !== 'ACTIVE') return false;
          if (!c.endDate || !c.startDate) return false;
          
          const parseDateOnly = (dateStr: string): Date => {
            const [year, month, day] = dateStr.split('-').map(Number);
            const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
            return new Date(utcDate.getFullYear(), utcDate.getMonth(), utcDate.getDate());
          };
          
          let startDate: Date;
          let endDate: Date;
          
          try {
            if (c.startDate.includes('T')) {
              const isoDate = new Date(c.startDate);
              startDate = new Date(isoDate.getFullYear(), isoDate.getMonth(), isoDate.getDate());
            } else {
              startDate = parseDateOnly(c.startDate);
            }
            startDate.setHours(0, 0, 0, 0);
            
            if (c.endDate.includes('T')) {
              const isoDate = new Date(c.endDate);
              endDate = new Date(isoDate.getFullYear(), isoDate.getMonth(), isoDate.getDate());
            } else {
              endDate = parseDateOnly(c.endDate);
            }
            endDate.setHours(0, 0, 0, 0);
          } catch (e) {
            const fallbackStart = new Date(c.startDate);
            startDate = new Date(fallbackStart.getFullYear(), fallbackStart.getMonth(), fallbackStart.getDate());
            startDate.setHours(0, 0, 0, 0);
            
            const fallbackEnd = new Date(c.endDate);
            endDate = new Date(fallbackEnd.getFullYear(), fallbackEnd.getMonth(), fallbackEnd.getDate());
            endDate.setHours(0, 0, 0, 0);
          }
          
          if (endDate < today) return false; // Đã hết hạn
          
          // Calculate remaining days: from start date to end date
          const remainingDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          return remainingDays <= 30 && remainingDays > 0; // Còn <= 30 ngày
        }
        return true;
      });
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(c => {
        return (
          c.contractNumber?.toLowerCase().includes(term) ||
          c.unitCode?.toLowerCase().includes(term) ||
          c.unitName?.toLowerCase().includes(term) ||
          c.buildingCode?.toLowerCase().includes(term) ||
          c.buildingName?.toLowerCase().includes(term)
        );
      });
    }

    // Sort by start date (newest first)
    filtered.sort((a, b) => {
      if (!a.startDate && !b.startDate) return 0;
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });

    return filtered;
  }, [contracts, selectedBuildingId, selectedUnitId, statusFilter, searchTerm, unitsMap]);

  const getContractStatusLabel = (contract: RentalContractWithUnit) => {
    if (contract.status !== 'ACTIVE') {
      return { label: 'Đã hết hiệu lực', className: 'bg-gray-100 text-gray-700' };
    }
    
    if (!contract.endDate || !contract.startDate) {
      return { label: 'Đang hoạt động', className: 'bg-green-100 text-green-700' };
    }
    
    // Parse date string properly (YYYY-MM-DD format from API) - avoid timezone issues
    const parseDateOnly = (dateStr: string): Date => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      return new Date(utcDate.getFullYear(), utcDate.getMonth(), utcDate.getDate());
    };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let startDate: Date;
    let endDate: Date;
    
    try {
      // Parse start date
      if (contract.startDate.includes('T')) {
        const isoDate = new Date(contract.startDate);
        startDate = new Date(isoDate.getFullYear(), isoDate.getMonth(), isoDate.getDate());
      } else {
        startDate = parseDateOnly(contract.startDate);
      }
      startDate.setHours(0, 0, 0, 0);
      
      // Parse end date
      if (contract.endDate.includes('T')) {
        const isoDate = new Date(contract.endDate);
        endDate = new Date(isoDate.getFullYear(), isoDate.getMonth(), isoDate.getDate());
      } else {
        endDate = parseDateOnly(contract.endDate);
      }
      endDate.setHours(0, 0, 0, 0);
    } catch (e) {
      const fallbackStart = new Date(contract.startDate);
      startDate = new Date(fallbackStart.getFullYear(), fallbackStart.getMonth(), fallbackStart.getDate());
      startDate.setHours(0, 0, 0, 0);
      
      const fallbackEnd = new Date(contract.endDate);
      endDate = new Date(fallbackEnd.getFullYear(), fallbackEnd.getMonth(), fallbackEnd.getDate());
      endDate.setHours(0, 0, 0, 0);
    }
    
    if (endDate < today) {
      return { label: 'Đã hết hạn', className: 'bg-red-100 text-red-700' };
    }
    
    // Calculate remaining days: from start date to end date (contract duration)
    const remainingDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    if (remainingDays <= 30 && remainingDays > 0) {
      return { label: `Sắp hết hạn (còn ${remainingDays} ngày)`, className: 'bg-yellow-100 text-yellow-700' };
    }
    
    return { label: 'Đang hoạt động', className: 'bg-green-100 text-green-700' };
  };

  // Calculate statistics
  const expiringContractsCount = useMemo(() => {
    const parseDateOnly = (dateStr: string): Date => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      return new Date(utcDate.getFullYear(), utcDate.getMonth(), utcDate.getDate());
    };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return contracts.filter(c => {
      if (c.status !== 'ACTIVE') return false;
      if (!c.endDate || !c.startDate) return false;
      
      let startDate: Date;
      let endDate: Date;
      
      try {
        if (c.startDate.includes('T')) {
          const isoDate = new Date(c.startDate);
          startDate = new Date(isoDate.getFullYear(), isoDate.getMonth(), isoDate.getDate());
        } else {
          startDate = parseDateOnly(c.startDate);
        }
        startDate.setHours(0, 0, 0, 0);
        
        if (c.endDate.includes('T')) {
          const isoDate = new Date(c.endDate);
          endDate = new Date(isoDate.getFullYear(), isoDate.getMonth(), isoDate.getDate());
        } else {
          endDate = parseDateOnly(c.endDate);
        }
        endDate.setHours(0, 0, 0, 0);
      } catch (e) {
        const fallbackStart = new Date(c.startDate);
        startDate = new Date(fallbackStart.getFullYear(), fallbackStart.getMonth(), fallbackStart.getDate());
        startDate.setHours(0, 0, 0, 0);
        
        const fallbackEnd = new Date(c.endDate);
        endDate = new Date(fallbackEnd.getFullYear(), fallbackEnd.getMonth(), fallbackEnd.getDate());
        endDate.setHours(0, 0, 0, 0);
      }
      
      if (endDate < today) return false;
      
      // Calculate remaining days: from start date to end date
      const remainingDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return remainingDays <= 30 && remainingDays > 0;
    }).length;
  }, [contracts]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Xét hợp đồng các căn hộ cho thuê</h1>
        <p className="text-gray-600 mt-2">Quản lý và xem xét tất cả hợp đồng cho thuê trong hệ thống</p>
      </div>

      {/* Statistics Cards */}
      {contracts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Tổng số hợp đồng</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{contracts.length}</div>
          </div>
          {expiringContractsCount > 0 && (
            <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 p-4">
              <div className="text-sm text-yellow-700 font-medium">Hợp đồng sắp hết hạn</div>
              <div className="text-2xl font-bold text-yellow-900 mt-1">{expiringContractsCount}</div>
              <div className="text-xs text-yellow-600 mt-1">Còn ≤ 30 ngày</div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tòa nhà
            </label>
            <select
              value={selectedBuildingId}
              onChange={(e) => {
                setSelectedBuildingId(e.target.value);
                setSelectedUnitId('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả tòa nhà</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.code} - {building.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Căn hộ
            </label>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!selectedBuildingId}
            >
              <option value="">Tất cả căn hộ</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.code} - {unit.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'expired' | 'expiring')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="expiring">Sắp hết hạn (≤30 ngày)</option>
              <option value="expired">Đã hết hạn</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Số hợp đồng, mã căn hộ..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : filteredContracts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {contracts.length === 0 
              ? 'Chưa có hợp đồng cho thuê nào'
              : 'Không tìm thấy hợp đồng nào phù hợp với bộ lọc'}
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Danh sách hợp đồng ({filteredContracts.length})
                </h2>
                <button
                  onClick={loadContracts}
                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  🔄 Làm mới
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số hợp đồng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tòa nhà
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Căn hộ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày bắt đầu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày kết thúc
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tiền thuê/tháng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredContracts.map((contract) => {
                    const statusInfo = getContractStatusLabel(contract);
                    return (
                      <tr key={contract.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {contract.contractNumber || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {contract.buildingCode || '-'}
                          </div>
                          {contract.buildingName && (
                            <div className="text-xs text-gray-500">
                              {contract.buildingName}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {contract.unitCode || '-'}
                          </div>
                          {contract.unitName && (
                            <div className="text-xs text-gray-500">
                              {contract.unitName}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(contract.startDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(contract.endDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(contract.monthlyRent)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${statusInfo.className}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleViewDetail(contract.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Xem chi tiết
                            </button>
                            {isContractExpired(contract) && (
                              <button
                                onClick={() => handleOpenInspection(contract)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Kiểm tra thiết bị
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {detailModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDetailModalOpen(false);
              setDetailContract(null);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="p-6 flex-shrink-0 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Chi tiết hợp đồng</h2>
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  setDetailContract(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="px-6 py-6 flex-1 min-h-0 overflow-y-auto">
              {detailLoading ? (
                <div className="text-center text-gray-500">Đang tải...</div>
              ) : detailContract ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Số hợp đồng</label>
                      <p className="mt-1 text-sm text-gray-900">{detailContract.contractNumber || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Loại hợp đồng</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {detailContract.contractType === 'RENTAL' ? 'Cho thuê' : 'Mua bán'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ngày bắt đầu</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(detailContract.startDate)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ngày kết thúc</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(detailContract.endDate)}</p>
                    </div>
                    {detailContract.monthlyRent && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tiền thuê/tháng</label>
                        <p className="mt-1 text-sm text-gray-900">{formatCurrency(detailContract.monthlyRent)}</p>
                      </div>
                    )}
                    {detailContract.paymentMethod && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phương thức thanh toán</label>
                        <p className="mt-1 text-sm text-gray-900">{detailContract.paymentMethod}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                      <p className="mt-1 text-sm text-gray-900">{detailContract.status || '-'}</p>
                    </div>
                  </div>
                  {detailContract.paymentTerms && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Điều khoản thanh toán</label>
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{detailContract.paymentTerms}</p>
                    </div>
                  )}
                  {detailContract.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{detailContract.notes}</p>
                    </div>
                  )}
                  {detailContract.files && detailContract.files.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tệp đính kèm</label>
                      <div className="space-y-2">
                        {detailContract.files.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-900">{file.originalFileName || file.fileName || 'Tệp'}</span>
                            {file.fileUrl && (
                              <a
                                href={file.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                Xem
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500">Không tìm thấy chi tiết hợp đồng</div>
              )}
            </div>
            
            <div className="px-6 pb-6 flex-shrink-0 border-t border-gray-200 pt-4">
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  setDetailContract(null);
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspection Modal */}
      {inspectionModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setInspectionModalOpen(false);
              setCurrentInspection(null);
              setInspectorName('');
              setInspectorNotes('');
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="p-6 flex-shrink-0 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Kiểm tra thiết bị khi hợp đồng hết hạn</h2>
              <button
                onClick={() => {
                  setInspectionModalOpen(false);
                  setCurrentInspection(null);
                  setInspectorName('');
                  setInspectorNotes('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="px-6 py-6 flex-1 min-h-0 overflow-y-auto">
              {inspectionLoading ? (
                <div className="text-center text-gray-500">Đang tải...</div>
              ) : !currentInspection ? (
                <div className="space-y-4">
                  <p className="text-gray-700">Chưa có checklist kiểm tra thiết bị cho hợp đồng này.</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên người kiểm tra <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={inspectorName}
                      onChange={(e) => setInspectorName(e.target.value)}
                      placeholder="Nhập tên người kiểm tra"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (currentContract) {
                        handleCreateInspection(currentContract);
                      }
                    }}
                    disabled={creatingInspection || !inspectorName.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {creatingInspection ? 'Đang tạo...' : 'Tạo checklist kiểm tra'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ngày kiểm tra</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(currentInspection.inspectionDate)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                      <span className={`mt-1 inline-block px-2 py-1 text-xs font-medium rounded ${
                        currentInspection.status === InspectionStatus.COMPLETED ? 'bg-green-100 text-green-700' :
                        currentInspection.status === InspectionStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {currentInspection.status === InspectionStatus.PENDING ? 'Chờ kiểm tra' :
                         currentInspection.status === InspectionStatus.IN_PROGRESS ? 'Đang kiểm tra' :
                         currentInspection.status === InspectionStatus.COMPLETED ? 'Đã hoàn thành' : 'Đã hủy'}
                      </span>
                    </div>
                    {currentInspection.inspectorName && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Người kiểm tra</label>
                        <p className="mt-1 text-sm text-gray-900">{currentInspection.inspectorName}</p>
                      </div>
                    )}
                  </div>

                  {currentInspection.status === InspectionStatus.PENDING && (
                    <button
                      onClick={handleStartInspection}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Bắt đầu kiểm tra
                    </button>
                  )}

                  {currentInspection.status === InspectionStatus.IN_PROGRESS && (
                    <>
                      <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Danh sách thiết bị cần kiểm tra</h3>
                        <div className="space-y-3">
                          {currentInspection.items && currentInspection.items.length > 0 ? (
                            currentInspection.items.map((item) => (
                              <InspectionItemRow
                                key={item.id}
                                item={item}
                                onUpdate={(conditionStatus, notes) => handleUpdateInspectionItem(item, conditionStatus, notes)}
                                disabled={item.checked}
                              />
                            ))
                          ) : (
                            <p className="text-gray-500">Chưa có thiết bị nào trong checklist</p>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ghi chú kiểm tra
                        </label>
                        <textarea
                          value={inspectorNotes}
                          onChange={(e) => setInspectorNotes(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Nhập ghi chú về tình trạng thiết bị..."
                        />
                      </div>

                      <button
                        onClick={handleCompleteInspection}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Hoàn thành kiểm tra
                      </button>
                    </>
                  )}

                  {currentInspection.status === InspectionStatus.COMPLETED && (
                    <>
                      <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Kết quả kiểm tra</h3>
                        <div className="space-y-3">
                          {currentInspection.items && currentInspection.items.map((item) => (
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
                                  {item.conditionStatus === 'GOOD' ? 'Tốt' :
                                   item.conditionStatus === 'DAMAGED' ? 'Hư hỏng' :
                                   item.conditionStatus === 'MISSING' ? 'Thiếu' :
                                   item.conditionStatus || 'Chưa kiểm tra'}
                                </span>
                              </div>
                              {item.notes && (
                                <p className="text-sm text-gray-700 mt-2">{item.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      {currentInspection.inspectorNotes && (
                        <div className="border-t border-gray-200 pt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú kiểm tra</label>
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">{currentInspection.inspectorNotes}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            
            <div className="px-6 pb-6 flex-shrink-0 border-t border-gray-200 pt-4">
              <button
                onClick={() => {
                  setInspectionModalOpen(false);
                  setCurrentInspection(null);
                  setInspectorName('');
                  setInspectorNotes('');
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Đóng
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
  onUpdate, 
  disabled 
}: { 
  item: AssetInspectionItem; 
  onUpdate: (conditionStatus: string, notes: string) => void;
  disabled: boolean;
}) {
  const [conditionStatus, setConditionStatus] = useState(item.conditionStatus || '');
  const [notes, setNotes] = useState(item.notes || '');

  const handleSave = () => {
    if (conditionStatus) {
      onUpdate(conditionStatus, notes);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-medium text-gray-900">{item.assetName || item.assetCode}</h4>
          <p className="text-sm text-gray-500">{item.assetType}</p>
        </div>
        {item.checked && (
          <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">
            Đã kiểm tra
          </span>
        )}
      </div>
      
      {!disabled && (
        <div className="space-y-3 mt-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tình trạng</label>
            <select
              value={conditionStatus}
              onChange={(e) => setConditionStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Chọn tình trạng</option>
              <option value="GOOD">Tốt</option>
              <option value="DAMAGED">Hư hỏng</option>
              <option value="MISSING">Thiếu</option>
              <option value="REPAIRED">Đã sửa</option>
              <option value="REPLACED">Đã thay thế</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ghi chú về tình trạng thiết bị..."
            />
          </div>
          
          <button
            onClick={handleSave}
            disabled={!conditionStatus}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            Lưu
          </button>
        </div>
      )}
      
      {disabled && item.conditionStatus && (
        <div className="mt-2">
          <span className={`px-2 py-1 text-xs font-medium rounded ${
            item.conditionStatus === 'GOOD' ? 'bg-green-100 text-green-700' :
            item.conditionStatus === 'DAMAGED' ? 'bg-red-100 text-red-700' :
            item.conditionStatus === 'MISSING' ? 'bg-gray-100 text-gray-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {item.conditionStatus === 'GOOD' ? 'Tốt' :
             item.conditionStatus === 'DAMAGED' ? 'Hư hỏng' :
             item.conditionStatus === 'MISSING' ? 'Thiếu' :
             item.conditionStatus}
          </span>
          {item.notes && (
            <p className="text-sm text-gray-700 mt-2">{item.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}
