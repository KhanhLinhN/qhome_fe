'use client';

import { useEffect, useState, useRef } from 'react';
import { useNotifications } from '@/src/hooks/useNotifications';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  AssetInspection,
  AssetInspectionItem,
  InspectionStatus,
  getMyAssignments,
  getInspectionByContractId,
  updateInspectionItem,
  startInspection,
  completeInspection,
  recalculateDamageCost,
  type UpdateAssetInspectionItemRequest,
} from '@/src/services/base/assetInspectionService';
import { getBuildings, type Building } from '@/src/services/base/buildingService';
import { getUnitsByBuilding, type Unit } from '@/src/services/base/unitService';

export default function AssetInspectionAssignmentsPage() {
  const { show } = useNotifications();
  const { user } = useAuth();

  const [inspections, setInspections] = useState<AssetInspection[]>([]);
  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [unitsMap, setUnitsMap] = useState<Map<string, Unit>>(new Map());
  const [buildingsMap, setBuildingsMap] = useState<Map<string, Building>>(new Map());

  const [statusFilter, setStatusFilter] = useState<InspectionStatus | 'all'>('all');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');

  const [selectedInspection, setSelectedInspection] = useState<AssetInspection | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [inspectorNotes, setInspectorNotes] = useState('');
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);

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
      const data = await getMyAssignments();
      setInspections(data);
    } catch (error: any) {
      console.error('Failed to load inspections:', error);
      show(error?.response?.data?.message || error?.message || 'Không thể tải danh sách công việc', 'error');
    }
  };

  const filteredInspections = inspections.filter(inspection => {
    if (statusFilter !== 'all' && inspection.status !== statusFilter) {
      return false;
    }
    if (selectedBuildingId) {
      const unit = unitsMap.get(inspection.unitId);
      if (unit?.buildingId !== selectedBuildingId) {
        return false;
      }
    }
    return true;
  });

  const handleOpenDetail = async (inspection: AssetInspection) => {
    setSelectedInspection(inspection);
    setInspectorNotes(inspection.inspectorNotes || '');
    setDetailModalOpen(true);
    
    // Reload full inspection details
    try {
      const fullInspection = await getInspectionByContractId(inspection.contractId);
      if (fullInspection) {
        setSelectedInspection(fullInspection);
      }
    } catch (error: any) {
      console.error('Failed to load inspection details:', error);
    }
  };

  const handleStartInspection = async () => {
    if (!selectedInspection) return;
    try {
      const updated = await startInspection(selectedInspection.id);
      setSelectedInspection(updated);
      await loadInspections();
      show('Đã bắt đầu kiểm tra', 'success');
    } catch (error: any) {
      console.error('Failed to start inspection:', error);
      show(error?.response?.data?.message || error?.message || 'Không thể bắt đầu kiểm tra', 'error');
    }
  };

  const handleUpdateItem = async (item: AssetInspectionItem, conditionStatus: string, notes: string, damageCost?: number) => {
    if (!selectedInspection || !detailModalOpen) return;
    
    const currentInspectionId = selectedInspection.id;
    setUpdatingItem(item.id);
    
    try {
      const request: UpdateAssetInspectionItemRequest = {
        conditionStatus: conditionStatus || item.conditionStatus || undefined,
        notes: notes || undefined,
        checked: conditionStatus ? true : (item.checked !== undefined ? item.checked : true),
        damageCost: damageCost !== undefined && damageCost !== null ? damageCost : undefined,
      };
      
      await updateInspectionItem(item.id, request);
      
      if (detailModalOpen && selectedInspection?.id === currentInspectionId) {
        const updatedItems = selectedInspection.items?.map(i => {
          if (i.id === item.id) {
            return {
              ...i,
              conditionStatus: conditionStatus || i.conditionStatus,
              notes: notes || i.notes,
              damageCost: damageCost !== undefined && damageCost !== null ? damageCost : i.damageCost,
              checked: conditionStatus ? true : (i.checked !== undefined ? i.checked : true),
            };
          }
          return i;
        }) || [];
        
        const newTotal = updatedItems.reduce((sum, i) => sum + (i.damageCost || 0), 0);
        
        setSelectedInspection(prev => {
          if (!prev || prev.id !== currentInspectionId || !detailModalOpen) return prev;
          return {
            ...prev,
            items: updatedItems,
            totalDamageCost: newTotal,
          };
        });
      }
      
      show('Đã cập nhật thiết bị', 'success');
    } catch (error: any) {
      console.error('Failed to update item:', error);
      show(error?.response?.data?.message || error?.message || 'Không thể cập nhật', 'error');
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleCompleteInspection = async () => {
    if (!selectedInspection) return;
    try {
      const calculatedTotal = selectedInspection.items?.reduce((sum, item) => {
        return sum + (item.damageCost || 0);
      }, 0) || 0;
      
      const updated = await completeInspection(selectedInspection.id, inspectorNotes);
      setSelectedInspection(updated);
      await loadInspections();
      
      if (calculatedTotal > 0) {
        show(`Đã hoàn thành kiểm tra. Tổng tiền thiệt hại: ${formatCurrency(calculatedTotal)}. Đang chờ admin phê duyệt để xuất hóa đơn.`, 'success');
      } else {
        show('Đã hoàn thành kiểm tra', 'success');
      }
      setDetailModalOpen(false);
    } catch (error: any) {
      console.error('Failed to complete inspection:', error);
      show(error?.response?.data?.message || error?.message || 'Không thể hoàn thành kiểm tra', 'error');
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('vi-VN');
  };

  const getStatusLabel = (status: InspectionStatus) => {
    const labels: Record<InspectionStatus, string> = {
      [InspectionStatus.PENDING]: 'Chờ xử lý',
      [InspectionStatus.IN_PROGRESS]: 'Đang thực hiện',
      [InspectionStatus.COMPLETED]: 'Hoàn thành',
      [InspectionStatus.CANCELLED]: 'Đã hủy',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: InspectionStatus) => {
    const colors: Record<InspectionStatus, string> = {
      [InspectionStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [InspectionStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
      [InspectionStatus.COMPLETED]: 'bg-green-100 text-green-800',
      [InspectionStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '-';
    const formatted = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formatted} VND`;
  };

  const formatNumber = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === '') return '';
    const num = typeof value === 'string' ? parseFloat(value.replace(/\./g, '')) : value;
    if (isNaN(num)) return '';
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parseNumber = (value: string): number => {
    if (!value) return 0;
    const cleaned = value.replace(/\./g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Danh sách công việc kiểm tra thiết bị</h1>
          <p className="text-gray-600 mt-1">Xem và quản lý các công việc kiểm tra thiết bị được gán cho bạn</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredInspections.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Không có công việc nào được gán cho bạn</p>
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
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số thiết bị
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
                  {filteredInspections.map((inspection) => {
                    const checkedCount = inspection.items?.filter(item => item.checked).length || 0;
                    const totalCount = inspection.items?.length || 0;
                    return (
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
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              inspection.status
                            )}`}
                          >
                            {getStatusLabel(inspection.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {checkedCount}/{totalCount} thiết bị
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-red-600">
                            {inspection.totalDamageCost && inspection.totalDamageCost > 0
                              ? formatCurrency(inspection.totalDamageCost)
                              : '-'}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {detailModalOpen && selectedInspection && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={async (e) => {
            if (e.target === e.currentTarget) {
              setDetailModalOpen(false);
              setSelectedInspection(null);
              // Reload inspections list after closing modal
              await loadInspections();
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 flex-shrink-0 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Chi tiết kiểm tra thiết bị - {getUnitCode(selectedInspection.unitId)}
              </h2>
              <button
                onClick={async () => {
                  setDetailModalOpen(false);
                  setSelectedInspection(null);
                  // Reload inspections list after closing modal
                  await loadInspections();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-6 flex-1 min-h-0 overflow-y-auto">
              <div className="space-y-6">
                {/* Inspection Info */}
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
                </div>

                {/* Inspection Items */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Danh sách thiết bị</h3>
                  {selectedInspection.items && selectedInspection.items.length > 0 ? (
                    <div className="space-y-4">
                      {selectedInspection.items.map((item) => (
                        <div
                          key={item.id}
                          className={`border rounded-lg p-4 ${
                            item.checked ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
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

                          {selectedInspection.status === InspectionStatus.IN_PROGRESS && !item.checked && (
                            <div className="mt-4 space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Tình trạng
                                </label>
                                <select
                                  id={`condition-${item.id}`}
                                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                  defaultValue={item.conditionStatus || ''}
                                  onChange={(e) => {
                                    const conditionStatus = e.target.value;
                                    const purchasePrice = item.purchasePrice || 0;
                                    const damageCostInput = document.getElementById(
                                      `damageCost-${item.id}`
                                    ) as HTMLInputElement;
                                    
                                    if (damageCostInput) {
                                      let calculatedPrice = 0;
                                      if (conditionStatus === 'GOOD') {
                                        calculatedPrice = 0;
                                      } else if (conditionStatus === 'DAMAGED') {
                                        calculatedPrice = purchasePrice * 0.5;
                                      } else if (conditionStatus === 'MISSING') {
                                        calculatedPrice = purchasePrice;
                                      }
                                      
                                      damageCostInput.value = calculatedPrice > 0 ? formatNumber(calculatedPrice) : '';
                                      
                                      // Highlight the input to show it's auto-filled
                                      damageCostInput.classList.add('bg-blue-50');
                                      setTimeout(() => {
                                        damageCostInput.classList.remove('bg-blue-50');
                                      }, 1000);
                                    }
                                  }}
                                >
                                  <option value="">Chọn tình trạng</option>
                                  <option value="GOOD">Tốt (0 VND)</option>
                                  <option value="DAMAGED">Hỏng (50% giá mua)</option>
                                  <option value="MISSING">Thiếu (100% giá mua)</option>
                                  <option value="NEEDS_REPAIR">Cần sửa chữa</option>
                                </select>
                                {item.purchasePrice && item.purchasePrice > 0 && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    * Giá mua: {formatCurrency(item.purchasePrice)} - Giá thiệt hại sẽ tự động tính dựa trên tình trạng
                                  </p>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Giá thiệt hại (VND)
                                </label>
                                <input
                                  type="text"
                                  id={`damageCost-${item.id}`}
                                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm transition-colors"
                                  defaultValue={item.damageCost ? formatNumber(item.damageCost) : ''}
                                  placeholder="Giá sẽ tự động tính khi chọn tình trạng, hoặc nhập thủ công"
                                  onInput={(e) => {
                                    const input = e.target as HTMLInputElement;
                                    const cursorPos = input.selectionStart || 0;
                                    const oldValue = input.value;
                                    const value = oldValue.replace(/[^\d]/g, '');
                                    const formatted = formatNumber(value);
                                    const oldLength = oldValue.length;
                                    input.value = formatted;
                                    // Restore cursor position after formatting
                                    const newLength = formatted.length;
                                    const lengthDiff = newLength - oldLength;
                                    const newCursorPos = Math.max(0, Math.min(formatted.length, cursorPos + lengthDiff));
                                    setTimeout(() => {
                                      input.setSelectionRange(newCursorPos, newCursorPos);
                                    }, 0);
                                  }}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  * Giá sẽ tự động điền khi chọn tình trạng, bạn có thể chỉnh sửa nếu cần
                                </p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                                <textarea
                                  id={`notes-${item.id}`}
                                  rows={2}
                                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                  defaultValue={item.notes || ''}
                                  placeholder="Nhập ghi chú (nếu có)"
                                />
                              </div>
                              <button
                                onClick={() => {
                                  const conditionSelect = document.getElementById(
                                    `condition-${item.id}`
                                  ) as HTMLSelectElement;
                                  const notesTextarea = document.getElementById(
                                    `notes-${item.id}`
                                  ) as HTMLTextAreaElement;
                                  const damageCostInput = document.getElementById(
                                    `damageCost-${item.id}`
                                  ) as HTMLInputElement;
                                  if (conditionSelect && notesTextarea) {
                                    const damageCost = damageCostInput && damageCostInput.value 
                                      ? parseNumber(damageCostInput.value) 
                                      : undefined;
                                    handleUpdateItem(
                                      item,
                                      conditionSelect.value,
                                      notesTextarea.value,
                                      damageCost
                                    );
                                  }
                                }}
                                disabled={updatingItem === item.id}
                                className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                              >
                                {updatingItem === item.id ? 'Đang lưu...' : 'Đánh dấu đã kiểm tra'}
                              </button>
                            </div>
                          )}

                          {item.checked && (
                            <div className="mt-4 space-y-3">
                              <div className="flex justify-between items-center">
                                {item.conditionStatus && (
                                  <div>
                                    <span className="text-sm font-medium text-gray-700">Tình trạng: </span>
                                    <span className={`text-sm px-2 py-1 rounded ${
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
                                  </div>
                                )}
                                <div className="text-right">
                                  <div className="text-sm font-medium text-gray-700 mb-1">Giá thiệt hại:</div>
                                  <div className="text-lg font-bold text-red-600">
                                    {item.damageCost && item.damageCost > 0 
                                      ? formatCurrency(item.damageCost)
                                      : formatCurrency(0)}
                                  </div>
                                </div>
                              </div>
                              {selectedInspection.status === InspectionStatus.IN_PROGRESS && (
                                <div className="border-t border-gray-200 pt-3">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Chỉnh sửa giá thiệt hại (VND)
                                  </label>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      id={`edit-damageCost-${item.id}`}
                                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                                      defaultValue={item.damageCost ? formatNumber(item.damageCost) : '0'}
                                      placeholder="Nhập giá thiệt hại"
                                      onInput={(e) => {
                                        const input = e.target as HTMLInputElement;
                                        const cursorPos = input.selectionStart || 0;
                                        const value = input.value.replace(/[^\d]/g, '');
                                        const formatted = formatNumber(value);
                                        input.value = formatted;
                                        // Restore cursor position after formatting
                                        const newCursorPos = formatted.length - (input.value.length - cursorPos);
                                        input.setSelectionRange(newCursorPos, newCursorPos);
                                      }}
                                    />
                                    <button
                                      onClick={() => {
                                        const damageCostInput = document.getElementById(
                                          `edit-damageCost-${item.id}`
                                        ) as HTMLInputElement;
                                        if (damageCostInput) {
                                          const newDamageCost = parseNumber(damageCostInput.value) || 0;
                                          handleUpdateItem(
                                            item,
                                            item.conditionStatus || '',
                                            item.notes || '',
                                            newDamageCost
                                          );
                                        }
                                      }}
                                      disabled={updatingItem === item.id}
                                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                                    >
                                      Cập nhật
                                    </button>
                                  </div>
                                </div>
                              )}
                              {item.notes && (
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Ghi chú: </span>
                                  <span className="text-sm text-gray-900">{item.notes}</span>
                                </div>
                              )}
                              {item.checkedAt && (
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Kiểm tra lúc: </span>
                                  <span className="text-sm text-gray-900">{formatDate(item.checkedAt)}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Không có thiết bị nào</p>
                  )}
                </div>

                {/* Total Damage Cost - Always visible, calculated in real-time */}
                {(() => {
                  // Always calculate total from items for real-time updates
                  const calculatedTotal = selectedInspection.items?.reduce((sum, item) => {
                    return sum + (item.damageCost || 0);
                  }, 0) || 0;
                  
                  return (
                    <div className={`border rounded-lg p-4 ${
                      calculatedTotal > 0
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Tổng tiền thiệt hại:</span>
                        <span className={`text-2xl font-bold ${
                          calculatedTotal > 0
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }`}>
                          {formatCurrency(calculatedTotal)}
                        </span>
                      </div>
                      {calculatedTotal === 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          * Tổng tiền sẽ được cập nhật khi bạn kiểm tra các thiết bị
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Inspector Notes */}
                {selectedInspection.status === InspectionStatus.IN_PROGRESS && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ghi chú tổng quan (tùy chọn)
                    </label>
                    <textarea
                      value={inspectorNotes}
                      onChange={(e) => setInspectorNotes(e.target.value)}
                      rows={4}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="Nhập ghi chú tổng quan về quá trình kiểm tra..."
                    />
                  </div>
                )}

                {selectedInspection.inspectorNotes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú đã lưu</label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                      {selectedInspection.inspectorNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 pb-6 flex-shrink-0 border-t border-gray-200 pt-4 flex justify-between">
              <button
                onClick={async () => {
                  setDetailModalOpen(false);
                  setSelectedInspection(null);
                  // Reload inspections list after closing modal
                  await loadInspections();
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Đóng
              </button>
              <div className="space-x-2">
                {selectedInspection.status === InspectionStatus.PENDING && (
                  <button
                    onClick={handleStartInspection}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Bắt đầu kiểm tra
                  </button>
                )}
                {selectedInspection.status === InspectionStatus.IN_PROGRESS && (
                  <button
                    onClick={handleCompleteInspection}
                    disabled={
                      !selectedInspection.items ||
                      selectedInspection.items.some(item => !item.checked)
                    }
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Hoàn thành kiểm tra
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

