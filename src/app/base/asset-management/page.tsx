'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useNotifications } from '@/src/hooks/useNotifications';
import {
  Asset,
  AssetType,
  CreateAssetRequest,
  UpdateAssetRequest,
} from '@/src/types/asset';
import {
  getAllAssets,
  getAssetsByBuilding,
  getAssetsByUnit,
  getAssetsByType,
  createAsset,
  updateAsset,
  deleteAsset,
  deactivateAsset,
} from '@/src/services/base/assetService';
import { getBuildings } from '@/src/services/base/buildingService';
import { getUnitsByBuilding, type Unit } from '@/src/services/base/unitService';
import PopupComfirm from '@/src/components/common/PopupComfirm';

interface AssetFormState {
  id?: string;
  unitId: string;
  assetType: AssetType;
  assetCode: string;
  name: string;
  brand: string;
  model: string;
  serialNumber: string;
  description: string;
  active: boolean;
  installedAt: string;
  removedAt: string;
  warrantyUntil: string;
  purchasePrice: number | null;
  purchaseDate: string;
}

const EMPTY_FORM: AssetFormState = {
  unitId: '',
  assetType: AssetType.AIR_CONDITIONER,
  assetCode: '',
  name: '',
  brand: '',
  model: '',
  serialNumber: '',
  description: '',
  active: true,
  installedAt: '',
  removedAt: '',
  warrantyUntil: '',
  purchasePrice: null,
  purchaseDate: '',
};

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  [AssetType.AIR_CONDITIONER]: 'Điều hòa',
  [AssetType.KITCHEN]: 'Bếp',
  [AssetType.REFRIGERATOR]: 'Tủ lạnh',
  [AssetType.WASHING_MACHINE]: 'Máy giặt',
  [AssetType.WATER_HEATER]: 'Máy nước nóng',
  [AssetType.FAN]: 'Quạt',
  [AssetType.TELEVISION]: 'Tivi',
  [AssetType.FURNITURE]: 'Nội thất',
  [AssetType.OTHER]: 'Khác',
};

export default function AssetManagementPage() {
  const t = useTranslations('AssetManagement');
  const { show } = useNotifications();
  
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetFormState | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteAsset, setPendingDeleteAsset] = useState<Asset | null>(null);
  
  // Filters
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | ''>('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  
  // Buildings and Units for dropdowns
  const [buildings, setBuildings] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<'list' | 'missing'>('list');

  // Missing assets state
  const [missingAssetsBuildingId, setMissingAssetsBuildingId] = useState<string>('');
  const [missingAssetsType, setMissingAssetsType] = useState<AssetType>(AssetType.AIR_CONDITIONER);
  const [unitsWithoutAsset, setUnitsWithoutAsset] = useState<Array<Unit & { buildingCode?: string }>>([]);
  const [loadingMissingAssets, setLoadingMissingAssets] = useState(false);
  const [selectedUnitsForBulkCreate, setSelectedUnitsForBulkCreate] = useState<Set<string>>(new Set());
  const [showBulkCreateForm, setShowBulkCreateForm] = useState(false);
  const [bulkCreateForm, setBulkCreateForm] = useState({
    assetCodePrefix: '',
    name: '',
    brand: '',
    model: '',
    installedAt: '',
    warrantyUntil: '',
    active: true,
  });
  const [bulkCreating, setBulkCreating] = useState(false);

  useEffect(() => {
    loadAssets();
    loadBuildings();
  }, []);

  useEffect(() => {
    if (selectedBuildingId) {
      loadUnits(selectedBuildingId);
    } else {
      setUnits([]);
      setSelectedUnitId('');
    }
  }, [selectedBuildingId]);

  useEffect(() => {
    loadAssets();
  }, [selectedBuildingId, selectedUnitId, selectedAssetType, showActiveOnly]);

  const loadBuildings = async () => {
    setLoadingBuildings(true);
    try {
      const data = await getBuildings();
      // Handle both array response and paginated response
      const buildingsList = Array.isArray(data) ? data : ((data as any)?.content || (data as any)?.data || []);
      setBuildings(buildingsList.map((b: any) => ({ id: b.id, code: b.code, name: b.name })));
    } catch (error: any) {
      console.error('Failed to load buildings:', error);
      show(error?.response?.data?.message || error?.message || 'Không thể tải danh sách tòa nhà', 'error');
    } finally {
      setLoadingBuildings(false);
    }
  };

  const loadUnits = async (buildingId: string) => {
    setLoadingUnits(true);
    try {
      const data = await getUnitsByBuilding(buildingId);
      setUnits(data);
    } catch (error: any) {
      console.error('Failed to load units:', error);
      show(error?.response?.data?.message || error?.message || 'Không thể tải danh sách căn hộ', 'error');
    } finally {
      setLoadingUnits(false);
    }
  };

  const loadAssets = async () => {
    setLoading(true);
    try {
      let data: Asset[] = [];
      
      if (selectedUnitId) {
        data = await getAssetsByUnit(selectedUnitId);
      } else if (selectedBuildingId) {
        data = await getAssetsByBuilding(selectedBuildingId);
      } else if (selectedAssetType) {
        data = await getAssetsByType(selectedAssetType as AssetType);
      } else {
        data = await getAllAssets();
      }

      if (showActiveOnly) {
        data = data.filter(asset => asset.active);
      }

      setAssets(data);
    } catch (error: any) {
      console.error('Failed to load assets:', error);
      show(error?.response?.data?.message || error?.message || 'Không thể tải danh sách thiết bị', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startCreate = () => {
    setEditingAsset(EMPTY_FORM);
    setIsCreateMode(true);
    setShowForm(true);
  };

  const startEdit = (asset: Asset) => {
    setEditingAsset({
      id: asset.id,
      unitId: asset.unitId,
      assetType: asset.assetType,
      assetCode: asset.assetCode,
      name: asset.name || '',
      brand: asset.brand || '',
      model: asset.model || '',
      serialNumber: asset.serialNumber || '',
      description: asset.description || '',
      active: asset.active,
      installedAt: asset.installedAt ? asset.installedAt.split('T')[0] : '',
      removedAt: asset.removedAt ? asset.removedAt.split('T')[0] : '',
      warrantyUntil: asset.warrantyUntil ? asset.warrantyUntil.split('T')[0] : '',
      purchasePrice: asset.purchasePrice ?? null,
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
    });
    setIsCreateMode(false);
    setShowForm(true);
    
    // Load units for selected building if available
    if (asset.buildingId) {
      setSelectedBuildingId(asset.buildingId);
      loadUnits(asset.buildingId);
    }
  };

  const handleDeleteClick = (asset: Asset) => {
    setPendingDeleteAsset(asset);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!pendingDeleteAsset) return;
    setShowDeleteConfirm(false);
    try {
      await deleteAsset(pendingDeleteAsset.id);
      show('Xóa thiết bị thành công', 'success');
      await loadAssets();
    } catch (error: any) {
      console.error('Failed to delete asset:', error);
      show(error?.response?.data?.message || error?.message || 'Không thể xóa thiết bị', 'error');
    }
  };

  const handleDeactivate = async (asset: Asset) => {
    try {
      await deactivateAsset(asset.id);
      show('Vô hiệu hóa thiết bị thành công', 'success');
      await loadAssets();
    } catch (error: any) {
      console.error('Failed to deactivate asset:', error);
      show(error?.response?.data?.message || error?.message || 'Không thể vô hiệu hóa thiết bị', 'error');
    }
  };

  const validateForm = (): boolean => {
    if (!editingAsset) return false;
    
    if (!editingAsset.unitId) {
      show('Vui lòng chọn căn hộ', 'error');
      return false;
    }
    
    if (!editingAsset.assetCode.trim()) {
      show('Mã thiết bị không được để trống', 'error');
      return false;
    }

    // Validate warranty_until >= installed_at
    if (editingAsset.warrantyUntil && editingAsset.installedAt) {
      const warrantyDate = new Date(editingAsset.warrantyUntil);
      const installedDate = new Date(editingAsset.installedAt);
      if (warrantyDate < installedDate) {
        show('Ngày bảo hành đến phải lớn hơn hoặc bằng ngày lắp đặt', 'error');
        return false;
      }
    }

    // Validate removed_at >= installed_at
    if (editingAsset.removedAt && editingAsset.installedAt) {
      const removedDate = new Date(editingAsset.removedAt);
      const installedDate = new Date(editingAsset.installedAt);
      if (removedDate < installedDate) {
        show('Ngày tháo gỡ phải lớn hơn hoặc bằng ngày lắp đặt', 'error');
        return false;
      }
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!editingAsset || !validateForm()) {
      return;
    }

    setSaving(true);
    try {
      if (isCreateMode) {
        const payload: CreateAssetRequest = {
          unitId: editingAsset.unitId,
          assetType: editingAsset.assetType,
          assetCode: editingAsset.assetCode.trim(),
          name: editingAsset.name.trim() || undefined,
          brand: editingAsset.brand.trim() || undefined,
          model: editingAsset.model.trim() || undefined,
          serialNumber: editingAsset.serialNumber.trim() || undefined,
          description: editingAsset.description.trim() || undefined,
          active: editingAsset.active,
          installedAt: editingAsset.installedAt || undefined,
          removedAt: editingAsset.removedAt || undefined,
          warrantyUntil: editingAsset.warrantyUntil || undefined,
          purchasePrice: editingAsset.purchasePrice ?? undefined,
          purchaseDate: editingAsset.purchaseDate || undefined,
        };
        await createAsset(payload);
        show('Tạo thiết bị thành công', 'success');
      } else {
        const payload: UpdateAssetRequest = {
          assetCode: editingAsset.assetCode.trim(),
          name: editingAsset.name.trim() || undefined,
          brand: editingAsset.brand.trim() || undefined,
          model: editingAsset.model.trim() || undefined,
          serialNumber: editingAsset.serialNumber.trim() || undefined,
          description: editingAsset.description.trim() || undefined,
          active: editingAsset.active,
          installedAt: editingAsset.installedAt || undefined,
          removedAt: editingAsset.removedAt || undefined,
          warrantyUntil: editingAsset.warrantyUntil || undefined,
          purchasePrice: editingAsset.purchasePrice ?? undefined,
          purchaseDate: editingAsset.purchaseDate || undefined,
        };
        await updateAsset(editingAsset.id!, payload);
        show('Cập nhật thiết bị thành công', 'success');
      }
      setShowForm(false);
      setEditingAsset(null);
      await loadAssets();
    } catch (error: any) {
      console.error('Failed to save asset:', error);
      let errorMessage = error?.response?.data?.message || error?.message || 'Không thể lưu thiết bị';
      
      // Improve error message for constraint violations
      if (errorMessage.includes('ck_assets_warranty')) {
        errorMessage = 'Ngày bảo hành đến phải lớn hơn hoặc bằng ngày lắp đặt';
      } else if (errorMessage.includes('ck_assets_period')) {
        errorMessage = 'Ngày tháo gỡ phải lớn hơn hoặc bằng ngày lắp đặt';
      } else if (errorMessage.includes('uq_asset_code')) {
        errorMessage = 'Mã thiết bị đã tồn tại. Vui lòng chọn mã khác.';
      }
      
      show(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string | null | undefined): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  // Load units without asset
  const loadUnitsWithoutAsset = async () => {
    if (!missingAssetsBuildingId || !missingAssetsType) {
      setUnitsWithoutAsset([]);
      return;
    }

    setLoadingMissingAssets(true);
    try {
      // Get all units in building
      const allUnits = await getUnitsByBuilding(missingAssetsBuildingId);
      
      // Get all assets of this type in this building
      const existingAssets = await getAssetsByBuilding(missingAssetsBuildingId);
      const assetsOfType = existingAssets.filter(a => a.assetType === missingAssetsType && a.active);
      
      // Find units that don't have this asset type
      const unitsWithAsset = new Set(assetsOfType.map(a => a.unitId));
      const unitsWithout = allUnits
        .filter(unit => !unitsWithAsset.has(unit.id))
        .map(unit => ({
          ...unit,
          buildingCode: buildings.find(b => b.id === missingAssetsBuildingId)?.code || '',
        }));
      
      setUnitsWithoutAsset(unitsWithout);
      setSelectedUnitsForBulkCreate(new Set());
    } catch (error: any) {
      console.error('Failed to load units without asset:', error);
      show(error?.response?.data?.message || error?.message || 'Không thể tải danh sách căn hộ', 'error');
    } finally {
      setLoadingMissingAssets(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'missing' && missingAssetsBuildingId && missingAssetsType) {
      loadUnitsWithoutAsset();
    }
  }, [activeTab, missingAssetsBuildingId, missingAssetsType]);

  const handleBulkCreateAssets = async () => {
    if (selectedUnitsForBulkCreate.size === 0) {
      show('Vui lòng chọn ít nhất một căn hộ', 'error');
      return;
    }

    if (!bulkCreateForm.assetCodePrefix.trim()) {
      show('Vui lòng nhập tiền tố mã thiết bị', 'error');
      return;
    }

    // Validate warranty_until >= installed_at
    if (bulkCreateForm.warrantyUntil && bulkCreateForm.installedAt) {
      const warrantyDate = new Date(bulkCreateForm.warrantyUntil);
      const installedDate = new Date(bulkCreateForm.installedAt);
      if (warrantyDate < installedDate) {
        show('Ngày bảo hành đến phải lớn hơn hoặc bằng ngày lắp đặt', 'error');
        return;
      }
    }

    setBulkCreating(true);
    const errors: string[] = [];
    let successCount = 0;

    try {
      const unitArray = Array.from(selectedUnitsForBulkCreate);
      
      for (let i = 0; i < unitArray.length; i++) {
        const unitId = unitArray[i];
        const unit = unitsWithoutAsset.find(u => u.id === unitId);
        if (!unit) continue;

        const assetCode = `${bulkCreateForm.assetCodePrefix.trim()}-${unit.code}`;
        
        try {
          const payload: CreateAssetRequest = {
            unitId,
            assetType: missingAssetsType,
            assetCode,
            name: bulkCreateForm.name.trim() || undefined,
            brand: bulkCreateForm.brand.trim() || undefined,
            model: bulkCreateForm.model.trim() || undefined,
            active: bulkCreateForm.active,
            installedAt: bulkCreateForm.installedAt || undefined,
            warrantyUntil: bulkCreateForm.warrantyUntil || undefined,
          };
          
          await createAsset(payload);
          successCount++;
        } catch (error: any) {
          let errorMsg = error?.response?.data?.message || error?.message || 'Lỗi không xác định';
          
          // Improve error message for constraint violations
          if (errorMsg.includes('ck_assets_warranty')) {
            errorMsg = 'Ngày bảo hành đến phải lớn hơn hoặc bằng ngày lắp đặt';
          } else if (errorMsg.includes('ck_assets_period')) {
            errorMsg = 'Ngày tháo gỡ phải lớn hơn hoặc bằng ngày lắp đặt';
          } else if (errorMsg.includes('uq_asset_code')) {
            errorMsg = 'Mã thiết bị đã tồn tại';
          }
          
          errors.push(`${unit.code}: ${errorMsg}`);
        }
      }

      if (successCount > 0) {
        show(`Đã tạo thành công ${successCount} thiết bị${errors.length > 0 ? `. ${errors.length} lỗi.` : ''}`, 'success');
      }

      if (errors.length > 0 && successCount === 0) {
        show(`Không thể tạo thiết bị. Lỗi: ${errors.join('; ')}`, 'error');
      }

      // Reset form and reload
      setShowBulkCreateForm(false);
      setSelectedUnitsForBulkCreate(new Set());
      setBulkCreateForm({
        assetCodePrefix: '',
        name: '',
        brand: '',
        model: '',
        installedAt: '',
        warrantyUntil: '',
        active: true,
      });
      
      await loadUnitsWithoutAsset();
      if (activeTab === 'list') {
        await loadAssets();
      }
    } catch (error: any) {
      console.error('Failed to bulk create assets:', error);
      show(error?.response?.data?.message || error?.message || 'Không thể tạo thiết bị', 'error');
    } finally {
      setBulkCreating(false);
    }
  };

  const toggleUnitSelection = (unitId: string) => {
    setSelectedUnitsForBulkCreate(prev => {
      const newSet = new Set(prev);
      if (newSet.has(unitId)) {
        newSet.delete(unitId);
      } else {
        newSet.add(unitId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUnitsForBulkCreate.size === unitsWithoutAsset.length) {
      setSelectedUnitsForBulkCreate(new Set());
    } else {
      setSelectedUnitsForBulkCreate(new Set(unitsWithoutAsset.map(u => u.id)));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <style jsx global>{`
        /* Đảm bảo datepicker popup hiển thị đúng cách và icon không quá to */
        input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          opacity: 1;
          width: 16px;
          height: 16px;
          margin-left: 4px;
          padding: 0;
          position: absolute;
          right: 8px;
        }
        input[type="date"] {
          position: relative;
          padding-right: 35px !important;
        }
        /* Modal wrapper không clip datepicker */
        .asset-modal-wrapper {
          overflow: visible !important;
        }
        /* Scrollable content */
        .asset-modal-content {
          overflow-y: auto;
        }
        /* Date inputs container */
        .date-input-wrapper {
          position: relative;
          z-index: auto;
        }
        input[type="date"]:focus {
          position: relative;
          z-index: 10002;
        }
      `}</style>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý thiết bị</h1>
        <p className="text-gray-600 mt-2">Quản lý các thiết bị trong căn hộ (điều hòa, bếp, tủ lạnh, ...)</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('list')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'list'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Danh sách thiết bị
          </button>
          <button
            onClick={() => setActiveTab('missing')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'missing'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Căn hộ chưa có thiết bị
          </button>
        </nav>
      </div>

      {activeTab === 'list' ? (
        <>

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
              disabled={loadingBuildings}
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
              disabled={!selectedBuildingId || loadingUnits}
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
              Loại thiết bị
            </label>
            <select
              value={selectedAssetType}
              onChange={(e) => setSelectedAssetType(e.target.value as AssetType | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả loại</option>
              {Object.entries(ASSET_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Chỉ hiển thị thiết bị đang hoạt động</span>
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Tổng số: {assets.length} thiết bị
        </div>
        <button
          onClick={startCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Thêm thiết bị
        </button>
      </div>

      {/* Assets List */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-gray-500">Đang tải...</div>
        </div>
      ) : assets.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500 mb-4">Chưa có thiết bị nào</p>
          <button
            onClick={startCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Thêm thiết bị đầu tiên
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã thiết bị
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên/Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Căn hộ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thương hiệu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày lắp đặt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bảo hành đến
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
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {asset.assetCode}
                      </div>
                      {asset.serialNumber && (
                        <div className="text-xs text-gray-500">
                          SN: {asset.serialNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {asset.name || '-'}
                      </div>
                      {asset.model && (
                        <div className="text-xs text-gray-500">
                          {asset.model}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {ASSET_TYPE_LABELS[asset.assetType]}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {asset.unitCode || '-'}
                      </div>
                      {asset.buildingCode && (
                        <div className="text-xs text-gray-500">
                          {asset.buildingCode}
                          {asset.floor !== undefined && ` - Tầng ${asset.floor}`}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {asset.brand || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(asset.installedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(asset.warrantyUntil)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          asset.active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {asset.active ? 'Đang hoạt động' : 'Đã ngừng'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => startEdit(asset)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Sửa
                      </button>
                      {asset.active && (
                        <button
                          onClick={() => handleDeactivate(asset)}
                          className="text-yellow-600 hover:text-yellow-900 mr-4"
                        >
                          Vô hiệu hóa
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteClick(asset)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && editingAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowForm(false);
            setEditingAsset(null);
          }
        }}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col relative z-[10000]" style={{ overflow: 'visible' }}>
            <div className="p-6 flex-shrink-0 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {isCreateMode ? 'Thêm thiết bị mới' : 'Chỉnh sửa thiết bị'}
              </h2>
            </div>
            
            <div className="px-6 py-6 flex-1 min-h-0" style={{ maxHeight: 'calc(90vh - 180px)', overflowY: 'auto', overflowX: 'visible' }}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tòa nhà <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={isCreateMode ? selectedBuildingId : (editingAsset.unitId ? assets.find(a => a.unitId === editingAsset.unitId)?.buildingId || '' : '')}
                      onChange={(e) => {
                        const buildingId = e.target.value;
                        setSelectedBuildingId(buildingId);
                        if (isCreateMode) {
                          if (buildingId) {
                            loadUnits(buildingId);
                          } else {
                            setUnits([]);
                          }
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!isCreateMode}
                    >
                      <option value="">Chọn tòa nhà</option>
                      {buildings.map((building) => (
                        <option key={building.id} value={building.id}>
                          {building.code} - {building.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Căn hộ <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editingAsset.unitId}
                      onChange={(e) => setEditingAsset({ ...editingAsset, unitId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!selectedBuildingId && isCreateMode}
                    >
                      <option value="">Chọn căn hộ</option>
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.code} - {unit.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loại thiết bị <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editingAsset.assetType}
                      onChange={(e) => setEditingAsset({ ...editingAsset, assetType: e.target.value as AssetType })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.entries(ASSET_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mã thiết bị <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingAsset.assetCode}
                      onChange={(e) => setEditingAsset({ ...editingAsset, assetCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="VD: AC-001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên thiết bị
                    </label>
                    <input
                      type="text"
                      value={editingAsset.name}
                      onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thương hiệu
                    </label>
                    <input
                      type="text"
                      value={editingAsset.brand}
                      onChange={(e) => setEditingAsset({ ...editingAsset, brand: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Model
                    </label>
                    <input
                      type="text"
                      value={editingAsset.model}
                      onChange={(e) => setEditingAsset({ ...editingAsset, model: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số serial
                    </label>
                    <input
                      type="text"
                      value={editingAsset.serialNumber}
                      onChange={(e) => setEditingAsset({ ...editingAsset, serialNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày lắp đặt
                    </label>
                    <input
                      type="date"
                      value={editingAsset.installedAt}
                      onChange={(e) => setEditingAsset({ ...editingAsset, installedAt: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bảo hành đến
                    </label>
                    <input
                      type="date"
                      value={editingAsset.warrantyUntil}
                      onChange={(e) => setEditingAsset({ ...editingAsset, warrantyUntil: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày tháo gỡ
                    </label>
                    <input
                      type="date"
                      value={editingAsset.removedAt}
                      onChange={(e) => setEditingAsset({ ...editingAsset, removedAt: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giá mua (VND)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={editingAsset.purchasePrice ?? ''}
                      onChange={(e) => setEditingAsset({ ...editingAsset, purchasePrice: e.target.value ? parseFloat(e.target.value) : null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày mua
                    </label>
                    <input
                      type="date"
                      value={editingAsset.purchaseDate}
                      onChange={(e) => setEditingAsset({ ...editingAsset, purchaseDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={editingAsset.description}
                    onChange={(e) => setEditingAsset({ ...editingAsset, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="active"
                    checked={editingAsset.active}
                    onChange={(e) => setEditingAsset({ ...editingAsset, active: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                    Đang hoạt động
                  </label>
                </div>
              </div>
            </div>
            
            <div className="px-6 pb-6 flex-shrink-0 border-t border-gray-200 pt-4 bg-white relative z-[10001]">
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 relative z-[10001]"
                >
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingAsset(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 relative z-[10001]"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Popup */}
      <PopupComfirm
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setPendingDeleteAsset(null);
        }}
        onConfirm={handleDelete}
        popupTitle={pendingDeleteAsset ? `Bạn có chắc muốn xóa thiết bị "${pendingDeleteAsset.assetCode}"?` : ''}
        popupContext=""
        isDanger={true}
      />
        </>
      ) : (
        <>
          {/* Missing Assets Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tòa nhà <span className="text-red-500">*</span>
                </label>
                <select
                  value={missingAssetsBuildingId}
                  onChange={(e) => {
                    setMissingAssetsBuildingId(e.target.value);
                    setUnitsWithoutAsset([]);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn tòa nhà</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.code} - {building.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại thiết bị cần kiểm tra <span className="text-red-500">*</span>
                </label>
                <select
                  value={missingAssetsType}
                  onChange={(e) => {
                    setMissingAssetsType(e.target.value as AssetType);
                    setUnitsWithoutAsset([]);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(ASSET_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loadingMissingAssets ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="text-gray-500">Đang tải...</div>
            </div>
          ) : !missingAssetsBuildingId || !missingAssetsType ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-500">Vui lòng chọn tòa nhà và loại thiết bị để xem danh sách căn hộ chưa có thiết bị</p>
            </div>
          ) : unitsWithoutAsset.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-500 mb-4">Tất cả căn hộ trong tòa nhà này đã có thiết bị "{ASSET_TYPE_LABELS[missingAssetsType]}"</p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Tìm thấy {unitsWithoutAsset.length} căn hộ chưa có {ASSET_TYPE_LABELS[missingAssetsType]}
                  {selectedUnitsForBulkCreate.size > 0 && (
                    <span className="ml-2 font-medium text-blue-600">
                      ({selectedUnitsForBulkCreate.size} đã chọn)
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={toggleSelectAll}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    {selectedUnitsForBulkCreate.size === unitsWithoutAsset.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                  {selectedUnitsForBulkCreate.size > 0 && (
                    <button
                      onClick={() => setShowBulkCreateForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Tạo thiết bị cho {selectedUnitsForBulkCreate.size} căn hộ đã chọn
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedUnitsForBulkCreate.size === unitsWithoutAsset.length && unitsWithoutAsset.length > 0}
                            onChange={toggleSelectAll}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mã căn hộ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tên căn hộ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tầng
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tòa nhà
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {unitsWithoutAsset.map((unit) => (
                        <tr key={unit.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedUnitsForBulkCreate.has(unit.id)}
                              onChange={() => toggleUnitSelection(unit.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {unit.code}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {unit.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              Tầng {unit.floor}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {unit.buildingCode || '-'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Bulk Create Form Modal */}
          {showBulkCreateForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-visible relative z-[10000]">
                <div className="p-6 relative overflow-y-auto max-h-[85vh]">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Tạo thiết bị cho {selectedUnitsForBulkCreate.size} căn hộ
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Loại thiết bị: <span className="font-medium">{ASSET_TYPE_LABELS[missingAssetsType]}</span>
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tiền tố mã thiết bị <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={bulkCreateForm.assetCodePrefix}
                        onChange={(e) => setBulkCreateForm({ ...bulkCreateForm, assetCodePrefix: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="VD: AC (sẽ tạo AC-A101, AC-A102, ...)"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Mã thiết bị sẽ được tạo tự động: {bulkCreateForm.assetCodePrefix}-[Mã căn hộ]
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tên thiết bị
                        </label>
                        <input
                          type="text"
                          value={bulkCreateForm.name}
                          onChange={(e) => setBulkCreateForm({ ...bulkCreateForm, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Thương hiệu
                        </label>
                        <input
                          type="text"
                          value={bulkCreateForm.brand}
                          onChange={(e) => setBulkCreateForm({ ...bulkCreateForm, brand: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Model
                      </label>
                      <input
                        type="text"
                        value={bulkCreateForm.model}
                        onChange={(e) => setBulkCreateForm({ ...bulkCreateForm, model: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative z-[10001]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ngày lắp đặt
                        </label>
                        <input
                          type="date"
                          value={bulkCreateForm.installedAt}
                          onChange={(e) => setBulkCreateForm({ ...bulkCreateForm, installedAt: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 relative z-[10001]"
                        />
                      </div>

                      <div className="relative z-[10001]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bảo hành đến
                        </label>
                        <input
                          type="date"
                          value={bulkCreateForm.warrantyUntil}
                          onChange={(e) => setBulkCreateForm({ ...bulkCreateForm, warrantyUntil: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 relative z-[10001]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="bulkActive"
                        checked={bulkCreateForm.active}
                        onChange={(e) => setBulkCreateForm({ ...bulkCreateForm, active: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="bulkActive" className="ml-2 text-sm text-gray-700">
                        Đang hoạt động
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleBulkCreateAssets}
                      disabled={bulkCreating}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {bulkCreating ? `Đang tạo ${selectedUnitsForBulkCreate.size} thiết bị...` : 'Tạo thiết bị'}
                    </button>
                    <button
                      onClick={() => {
                        setShowBulkCreateForm(false);
                        setBulkCreateForm({
                          assetCodePrefix: '',
                          name: '',
                          brand: '',
                          model: '',
                          installedAt: '',
                          warrantyUntil: '',
                          active: true,
                        });
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
