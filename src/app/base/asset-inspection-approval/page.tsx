'use client';

import { useEffect, useState } from 'react';
import { useNotifications } from '@/src/hooks/useNotifications';
import {
  AssetInspection,
  AssetInspectionItem,
  InspectionStatus,
  getInspectionsPendingApproval,
  approveInspection,
  rejectInspection,
  getInspectionByContractId,
} from '@/src/services/base/assetInspectionService';
import { getBuildings, type Building } from '@/src/services/base/buildingService';
import { getUnitsByBuilding, type Unit } from '@/src/services/base/unitService';

export default function AssetInspectionApprovalPage() {
  const { show } = useNotifications();

  const [inspections, setInspections] = useState<AssetInspection[]>([]);
  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [unitsMap, setUnitsMap] = useState<Map<string, Unit>>(new Map());
  const [buildingsMap, setBuildingsMap] = useState<Map<string, Building>>(new Map());
  
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');

  const [selectedInspection, setSelectedInspection] = useState<AssetInspection | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);

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
      const data = await getInspectionsPendingApproval();
      setInspections(data);
    } catch (error: any) {
      console.error('Failed to load inspections:', error);
      show(error?.response?.data?.message || error?.message || 'Không thể tải danh sách kiểm tra cần phê duyệt', 'error');
    }
  };

  const filteredInspections = inspections.filter(inspection => {
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
    setRejectionNotes('');
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

  const handleApprove = async (inspectionId: string) => {
    setApproving(inspectionId);
    try {
      await approveInspection(inspectionId);
      await loadInspections();
      show('Đã phê duyệt và xuất hóa đơn thành công', 'success');
      if (selectedInspection?.id === inspectionId) {
        setDetailModalOpen(false);
        setSelectedInspection(null);
      }
    } catch (error: any) {
      console.error('Failed to approve inspection:', error);
      show(error?.response?.data?.message || error?.message || 'Không thể phê duyệt', 'error');
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (inspectionId: string) => {
    if (!rejectionNotes.trim()) {
      show('Vui lòng nhập lý do từ chối', 'error');
      return;
    }
    
    setRejecting(inspectionId);
    try {
      await rejectInspection(inspectionId, rejectionNotes);
      await loadInspections();
      show('Đã từ chối kiểm tra', 'success');
      setDetailModalOpen(false);
      setSelectedInspection(null);
      setRejectionNotes('');
    } catch (error: any) {
      console.error('Failed to reject inspection:', error);
      show(error?.response?.data?.message || error?.message || 'Không thể từ chối', 'error');
    } finally {
      setRejecting(null);
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
          <h1 className="text-2xl font-bold text-gray-900">Phê duyệt kiểm tra thiết bị</h1>
          <p className="text-gray-600 mt-1">Xem và phê duyệt các kiểm tra thiết bị đã hoàn thành cần xuất hóa đơn</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <p>Không có kiểm tra nào cần phê duyệt</p>
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
                      Người kiểm tra
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

      {/* Detail Modal */}
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
                    <label className="block text-sm font-medium text-gray-700">Người kiểm tra</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedInspection.inspectorName || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ngày hoàn thành</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedInspection.completedAt)}</p>
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
                          className="border rounded-lg p-4 bg-white border-gray-200"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900">{item.assetName || 'Thiết bị'}</h4>
                              <p className="text-sm text-gray-600">
                                {item.assetCode} - {item.assetType}
                              </p>
                            </div>
                            <div className="text-right">
                              {item.conditionStatus && (
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
                              )}
                              {item.damageCost && item.damageCost > 0 && (
                                <div className="text-sm font-semibold text-red-600 mt-1">
                                  {formatCurrency(item.damageCost)}
                                </div>
                              )}
                            </div>
                          </div>
                          {item.notes && (
                            <div className="mt-2">
                              <span className="text-sm font-medium text-gray-700">Ghi chú: </span>
                              <span className="text-sm text-gray-900">{item.notes}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Không có thiết bị nào</p>
                  )}
                </div>

                {/* Total Damage Cost */}
                <div className={`border rounded-lg p-4 ${
                  selectedInspection.totalDamageCost && selectedInspection.totalDamageCost > 0
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Tổng tiền thiệt hại:</span>
                    <span className={`text-2xl font-bold ${
                      selectedInspection.totalDamageCost && selectedInspection.totalDamageCost > 0
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}>
                      {formatCurrency(selectedInspection.totalDamageCost || 0)}
                    </span>
                  </div>
                </div>

                {/* Inspector Notes */}
                {selectedInspection.inspectorNotes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú kiểm tra</label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                      {selectedInspection.inspectorNotes}
                    </p>
                  </div>
                )}

                {/* Rejection Notes Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lý do từ chối (nếu từ chối)
                  </label>
                  <textarea
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="Nhập lý do từ chối (nếu cần)..."
                  />
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex-shrink-0 border-t border-gray-200 pt-4 flex justify-between">
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  setSelectedInspection(null);
                  setRejectionNotes('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Đóng
              </button>
              <div className="space-x-2">
                <button
                  onClick={() => handleReject(selectedInspection.id)}
                  disabled={rejecting === selectedInspection.id || !rejectionNotes.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {rejecting === selectedInspection.id ? 'Đang từ chối...' : 'Từ chối'}
                </button>
                <button
                  onClick={() => handleApprove(selectedInspection.id)}
                  disabled={approving === selectedInspection.id}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {approving === selectedInspection.id ? 'Đang phê duyệt...' : 'Phê duyệt và xuất hóa đơn'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

