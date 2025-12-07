'use client';

import { useEffect, useMemo, useState } from 'react';
import { useNotifications } from '@/src/hooks/useNotifications';
import {
  AssetInspection,
  AssetInspectionItem,
  InspectionStatus,
  getAllInspections,
  getInspectionByContractId,
  createInspection,
  type CreateAssetInspectionRequest,
} from '@/src/services/base/assetInspectionService';
import { getBuildings, type Building } from '@/src/services/base/buildingService';
import { getUnitsByBuilding, type Unit } from '@/src/services/base/unitService';
import { fetchStaffAccounts, type UserAccountInfo } from '@/src/services/iam/userService';
import { getAllRentalContracts, type ContractSummary } from '@/src/services/base/contractService';

export default function AssetInspectionManagementPage() {
  const { show } = useNotifications();

  const [inspections, setInspections] = useState<AssetInspection[]>([]);
  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [unitsMap, setUnitsMap] = useState<Map<string, Unit>>(new Map());
  const [buildingsMap, setBuildingsMap] = useState<Map<string, Building>>(new Map());
  const [technicians, setTechnicians] = useState<UserAccountInfo[]>([]);
  
  const [statusFilter, setStatusFilter] = useState<InspectionStatus | 'all'>('all');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [selectedInspection, setSelectedInspection] = useState<AssetInspection | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractSummary | null>(null);
  const [expiredContracts, setExpiredContracts] = useState<ContractSummary[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const buildingsData: any = await getBuildings();
      const buildingsList = Array.isArray(buildingsData) ? buildingsData : (buildingsData?.content || buildingsData?.data || []);
      setBuildings(buildingsList);
      
      const buildingsMapData = new Map<string, Building>();
      buildingsList.forEach((building: Building) => {
        buildingsMapData.set(building.id, building);
      });
      setBuildingsMap(buildingsMapData);

      const unitsMapData = new Map<string, Unit>();
      for (const building of buildingsList) {
        try {
          const buildingUnits = await getUnitsByBuilding(building.id);
          buildingUnits.forEach(unit => {
            unitsMapData.set(unit.id, unit);
          });
        } catch (err) {
          console.warn(`Failed to load units for building ${building.id}:`, err);
        }
      }
      setUnitsMap(unitsMapData);

      const staffAccounts = await fetchStaffAccounts();
      setTechnicians(staffAccounts);

      await loadInspections();
    } catch (error: any) {
      console.error('Failed to load data:', error);
      show(error?.response?.data?.message || error?.message || 'Không thể tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadInspections = async () => {
    try {
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (selectedTechnicianId) {
        params.inspectorId = selectedTechnicianId;
      }
      
      const data = await getAllInspections(params);
      setInspections(data);
    } catch (error: any) {
      console.error('Failed to load inspections:', error);
      show(error?.response?.data?.message || error?.message || 'Không thể tải danh sách kiểm tra', 'error');
    }
  };

  useEffect(() => {
    loadInspections();
  }, [statusFilter, selectedTechnicianId]);

  const filteredInspections = useMemo(() => {
    let filtered = inspections;

    if (selectedBuildingId) {
      filtered = filtered.filter(inspection => {
        const unit = unitsMap.get(inspection.unitId);
        return unit?.buildingId === selectedBuildingId;
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(inspection => {
        const unit = unitsMap.get(inspection.unitId);
        const building = unit ? buildingsMap.get(unit.buildingId) : null;
        return (
          inspection.unitCode?.toLowerCase().includes(term) ||
          unit?.code?.toLowerCase().includes(term) ||
          building?.name?.toLowerCase().includes(term) ||
          inspection.inspectorName?.toLowerCase().includes(term) ||
          inspection.contractId.toLowerCase().includes(term)
        );
      });
    }

    return filtered;
  }, [inspections, selectedBuildingId, searchTerm, unitsMap, buildingsMap]);

  const handleOpenDetail = async (inspection: AssetInspection) => {
    setSelectedInspection(inspection);
    setDetailModalOpen(true);
    
    try {
      const fullInspection = await getInspectionByContractId(inspection.contractId);
      if (fullInspection) {
        setSelectedInspection(fullInspection);
      }
    } catch (error: any) {
      console.error('Failed to load inspection details:', error);
    }
  };

  const handleOpenCreate = async () => {
    try {
      const contracts = await getAllRentalContracts();
      const expired = contracts.filter(c => c.status === 'EXPIRED');
      setExpiredContracts(expired);
      setCreateModalOpen(true);
    } catch (error: any) {
      console.error('Failed to load expired contracts:', error);
      show(error?.response?.data?.message || error?.message || 'Không thể tải hợp đồng hết hạn', 'error');
    }
  };

  const handleCreateInspection = async (contract: ContractSummary, technicianId: string, technicianName: string) => {
    if (!technicianId || !technicianName) {
      show('Vui lòng chọn kỹ thuật viên', 'error');
      return;
    }

    if (!contract.unitId) {
      show('Hợp đồng không có thông tin căn hộ', 'error');
      return;
    }

    setCreateLoading(true);
    try {
      const request: CreateAssetInspectionRequest = {
        contractId: contract.id,
        unitId: contract.unitId,
        inspectionDate: null,
        inspectorId: technicianId,
        inspectorName: technicianName,
      };

      await createInspection(request);
      show('Đã tạo kiểm tra thiết bị thành công', 'success');
      setCreateModalOpen(false);
      setSelectedContract(null);
      await loadInspections();
    } catch (error: any) {
      console.error('Failed to create inspection:', error);
      show(error?.response?.data?.message || error?.message || 'Không thể tạo kiểm tra', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '-';
    const formatted = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formatted} VND`;
  };

  const getBuildingName = (unitId: string) => {
    const unit = unitsMap.get(unitId);
    if (!unit?.buildingId) return '-';
    const building = buildingsMap.get(unit.buildingId);
    return building?.name || '-';
  };

  const getUnitCode = (unitId: string) => {
    const unit = unitsMap.get(unitId);
    return unit?.code || '-';
  };

  const getStatusColor = (status: InspectionStatus) => {
    switch (status) {
      case InspectionStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case InspectionStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case InspectionStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case InspectionStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: InspectionStatus) => {
    switch (status) {
      case InspectionStatus.PENDING:
        return 'Chờ xử lý';
      case InspectionStatus.IN_PROGRESS:
        return 'Đang thực hiện';
      case InspectionStatus.COMPLETED:
        return 'Hoàn thành';
      case InspectionStatus.CANCELLED:
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const stats = useMemo(() => {
    return {
      total: inspections.length,
      pending: inspections.filter(i => i.status === InspectionStatus.PENDING).length,
      inProgress: inspections.filter(i => i.status === InspectionStatus.IN_PROGRESS).length,
      completed: inspections.filter(i => i.status === InspectionStatus.COMPLETED).length,
      cancelled: inspections.filter(i => i.status === InspectionStatus.CANCELLED).length,
      totalDamageCost: inspections.reduce((sum, i) => sum + (i.totalDamageCost || 0), 0),
    };
  }, [inspections]);

  if (loading && inspections.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý kiểm tra thiết bị</h1>
            <p className="text-gray-600 mt-1">Quản lý tất cả các kiểm tra thiết bị trong hệ thống</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Tạo kiểm tra mới
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Tổng số</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Chờ xử lý</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Đang thực hiện</div>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Hoàn thành</div>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Tổng thiệt hại</div>
            <div className="text-lg font-bold text-red-600">{formatCurrency(stats.totalDamageCost)}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as InspectionStatus | 'all')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">Tất cả</option>
                <option value={InspectionStatus.PENDING}>Chờ xử lý</option>
                <option value={InspectionStatus.IN_PROGRESS}>Đang thực hiện</option>
                <option value={InspectionStatus.COMPLETED}>Hoàn thành</option>
                <option value={InspectionStatus.CANCELLED}>Đã hủy</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tòa nhà</label>
              <select
                value={selectedBuildingId}
                onChange={(e) => setSelectedBuildingId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">Tất cả tòa nhà</option>
                {buildings.map(building => (
                  <option key={building.id} value={building.id}>
                    {building.name} ({building.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kỹ thuật viên</label>
              <select
                value={selectedTechnicianId}
                onChange={(e) => setSelectedTechnicianId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">Tất cả</option>
                {technicians.map(tech => (
                  <option key={tech.userId} value={tech.userId}>
                    {tech.username}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Mã căn hộ, tên technician..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredInspections.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Không có kiểm tra nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Căn hộ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tòa nhà
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày kiểm tra
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kỹ thuật viên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tổng tiền thiệt hại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInspections.map((inspection) => (
                    <tr key={inspection.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {getUnitCode(inspection.unitId)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getBuildingName(inspection.unitId)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(inspection.inspectionDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {inspection.inspectorName || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            inspection.status
                          )}`}
                        >
                          {getStatusLabel(inspection.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-red-600">
                          {formatCurrency(inspection.totalDamageCost)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleOpenDetail(inspection)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {detailModalOpen && selectedInspection && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDetailModalOpen(false);
              setSelectedInspection(null);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="p-6 flex-shrink-0 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Chi tiết kiểm tra thiết bị - {getUnitCode(selectedInspection.unitId)}
              </h2>
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  setSelectedInspection(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-6 flex-1 min-h-0 overflow-y-auto">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Căn hộ</label>
                    <p className="mt-1 text-sm text-gray-900">{getUnitCode(selectedInspection.unitId)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tòa nhà</label>
                    <p className="mt-1 text-sm text-gray-900">{getBuildingName(selectedInspection.unitId)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ngày kiểm tra</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedInspection.inspectionDate)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                    <p className="mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          selectedInspection.status
                        )}`}
                      >
                        {getStatusLabel(selectedInspection.status)}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Kỹ thuật viên</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedInspection.inspectorName || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tổng tiền thiệt hại</label>
                    <p className="mt-1 text-lg font-bold text-red-600">
                      {formatCurrency(selectedInspection.totalDamageCost)}
                    </p>
                  </div>
                </div>

                {selectedInspection.items && selectedInspection.items.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Danh sách thiết bị</h3>
                    <div className="space-y-4">
                      {selectedInspection.items.map((item) => (
                        <div
                          key={item.id}
                          className={`border rounded-lg p-4 ${
                            item.checked ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">{item.assetName || 'Thiết bị'}</h4>
                              <p className="text-sm text-gray-600">
                                {item.assetCode} - {item.assetType}
                              </p>
                            </div>
                            {item.checked && (
                              <span className="text-xs text-green-600 font-medium">✓ Đã kiểm tra</span>
                            )}
                          </div>
                          {item.checked && (
                            <div className="mt-4 space-y-2">
                              {item.conditionStatus && (
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Tình trạng: </span>
                                  <span
                                    className={`text-sm px-2 py-1 rounded ${
                                      item.conditionStatus === 'GOOD' ? 'bg-green-100 text-green-700' :
                                      item.conditionStatus === 'DAMAGED' ? 'bg-red-100 text-red-700' :
                                      item.conditionStatus === 'MISSING' ? 'bg-gray-100 text-gray-700' :
                                      'bg-yellow-100 text-yellow-700'
                                    }`}
                                  >
                                    {item.conditionStatus === 'GOOD' ? 'Tốt' :
                                     item.conditionStatus === 'DAMAGED' ? 'Hư hỏng' :
                                     item.conditionStatus === 'MISSING' ? 'Thiếu' :
                                     item.conditionStatus}
                                  </span>
                                </div>
                              )}
                              {item.damageCost !== undefined && item.damageCost > 0 && (
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Giá thiệt hại: </span>
                                  <span className="text-sm font-bold text-red-600">
                                    {formatCurrency(item.damageCost)}
                                  </span>
                                </div>
                              )}
                              {item.notes && (
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Ghi chú: </span>
                                  <span className="text-sm text-gray-900">{item.notes}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedInspection.inspectorNotes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú kỹ thuật viên</label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedInspection.inspectorNotes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {createModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setCreateModalOpen(false);
              setSelectedContract(null);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="p-6 flex-shrink-0 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Tạo kiểm tra thiết bị mới</h2>
              <button
                onClick={() => {
                  setCreateModalOpen(false);
                  setSelectedContract(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-6 flex-1 min-h-0 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn hợp đồng hết hạn
                  </label>
                  <select
                    value={selectedContract?.id || ''}
                    onChange={(e) => {
                      const contract = expiredContracts.find(c => c.id === e.target.value);
                      setSelectedContract(contract || null);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">Chọn hợp đồng...</option>
                    {expiredContracts.map(contract => {
                      const unit = unitsMap.get(contract.unitId);
                      const building = unit ? buildingsMap.get(unit.buildingId) : null;
                      return (
                        <option key={contract.id} value={contract.id}>
                          {building?.name} - {unit?.code} - Hợp đồng {contract.id.slice(0, 8)}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {selectedContract && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chọn kỹ thuật viên
                      </label>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        onChange={(e) => {
                          const tech = technicians.find(t => t.userId === e.target.value);
                          if (tech && selectedContract) {
                            handleCreateInspection(selectedContract, tech.userId, tech.username);
                          }
                        }}
                      >
                        <option value="">Chọn kỹ thuật viên...</option>
                        {technicians.map(tech => (
                          <option key={tech.userId} value={tech.userId}>
                            {tech.username}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

