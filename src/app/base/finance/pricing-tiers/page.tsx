'use client';

import React, { useEffect, useState } from 'react';
import { useNotifications } from '@/src/hooks/useNotifications';
import {
  PricingTierDto,
  getPricingTiersByService,
  createPricingTier,
  updatePricingTier,
  deletePricingTier,
  CreatePricingTierRequest,
  UpdatePricingTierRequest,
} from '@/src/services/finance/pricingTierService';

const SERVICE_OPTIONS = [
  { value: 'ELECTRIC', label: 'Điện', icon: '⚡' },
  { value: 'WATER', label: 'Nước', icon: '💧' },
];

interface TierFormState {
  id?: string;
  tierOrder: number;
  minQuantity: number | null;
  maxQuantity: number | null;
  unitPrice: number | null;
  effectiveFrom: string;
  effectiveUntil: string | null;
  active: boolean;
  description: string;
}

type FormErrors = {
  minQuantity?: string;
  maxQuantity?: string;
  unitPrice?: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
  tierOrder?: string;
  overlap?: string;
  general?: string;
};

const EMPTY_FORM: TierFormState = {
  tierOrder: 1,
  minQuantity: null,
  maxQuantity: null,
  unitPrice: null,
  effectiveFrom: new Date().toISOString().split('T')[0],
  effectiveUntil: null,
  active: true,
  description: '',
};

export default function PricingTiersManagementPage() {
  const { show } = useNotifications();
  const [selectedService, setSelectedService] = useState<'ELECTRIC' | 'WATER'>('ELECTRIC');
  const [tiers, setTiers] = useState<PricingTierDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingTier, setEditingTier] = useState<TierFormState | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadTiers();
  }, [selectedService]);

  const loadTiers = async () => {
    setLoading(true);
    try {
      const data = await getPricingTiersByService(selectedService);
      setTiers(data);
    } catch (error: any) {
      console.error('Failed to load pricing tiers:', error);
      show(
        error?.response?.data?.message || error?.message || 'Không thể tải danh sách bậc giá',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const sortedTiers = tiers.sort((a, b) => {
    const orderDiff = (a.tierOrder ?? 0) - (b.tierOrder ?? 0);
    if (orderDiff !== 0) return orderDiff;
    return (Number(a.minQuantity ?? 0) || 0) - (Number(b.minQuantity ?? 0) || 0);
  });

  const isTierCurrentlyActive = (tier: PricingTierDto) => {
    if (!tier.effectiveFrom) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const from = new Date(tier.effectiveFrom);
    if (Number.isNaN(from.getTime())) return false;
    from.setHours(0, 0, 0, 0);
    if (from > today) return false;
    const until = tier.effectiveUntil ? new Date(tier.effectiveUntil) : null;
    if (until) {
      if (Number.isNaN(until.getTime())) return false;
      until.setHours(0, 0, 0, 0);
      if (until < today) return false;
    }
    return tier.active !== false;
  };

  // Kiểm tra xem có bậc cuối cùng (maxQuantity = null) không
  const checkHasFinalTier = (): boolean => {
    const activeTiers = sortedTiers.filter(tier => isTierCurrentlyActive(tier));
    return activeTiers.some(tier => tier.maxQuantity === null || tier.maxQuantity === undefined);
  };

  // Kiểm tra gaps trong các bậc giá (chỉ kiểm tra các tiers đang active)
  const checkGaps = (): Array<{ from: number; to: number }> => {
    const gaps: Array<{ from: number; to: number }> = [];
    
    // Lọc các tiers đang active
    const activeTiers = sortedTiers.filter(tier => isTierCurrentlyActive(tier));
    if (activeTiers.length < 2) return gaps;

    // Sắp xếp theo minQuantity
    const sortedByMin = [...activeTiers].sort((a, b) => {
      const minA = Number(a.minQuantity ?? 0);
      const minB = Number(b.minQuantity ?? 0);
      return minA - minB;
    });

    for (let i = 0; i < sortedByMin.length - 1; i++) {
      const currentTier = sortedByMin[i];
      const nextTier = sortedByMin[i + 1];

      const currentMax = currentTier.maxQuantity !== null && currentTier.maxQuantity !== undefined
        ? Number(currentTier.maxQuantity)
        : null;
      const nextMin = Number(nextTier.minQuantity ?? 0);

      // Nếu current tier có max và max + 1 < nextMin thì có gap thực sự
      // (cho phép liền kề: 50-51 là OK, nhưng 50-60 là gap)
      if (currentMax !== null && currentMax + 1 < nextMin) {
        gaps.push({ from: currentMax, to: nextMin });
      }
    }

    // Kiểm tra xem tier đầu tiên có bắt đầu từ 0 không
    if (sortedByMin.length > 0) {
      const firstTier = sortedByMin[0];
      const firstMin = Number(firstTier.minQuantity ?? 0);
      if (firstMin > 0) {
        gaps.push({ from: 0, to: firstMin });
      }
    }

    // Kiểm tra xem có bậc cuối cùng không (maxQuantity = null)
    const hasFinalTier = sortedByMin.some(tier => tier.maxQuantity === null || tier.maxQuantity === undefined);
    if (!hasFinalTier && sortedByMin.length > 0) {
      // Tìm maxQuantity lớn nhất
      const maxQuantities = sortedByMin
        .map(tier => tier.maxQuantity)
        .filter(max => max !== null && max !== undefined)
        .map(max => Number(max));
      
      if (maxQuantities.length > 0) {
        const maxMax = Math.max(...maxQuantities);
        gaps.push({ from: maxMax, to: Infinity }); // Đánh dấu cần bậc cuối cùng
      }
    }

    return gaps;
  };

  // Kiểm tra trùng khoảng giá (overlap)
  const checkOverlaps = (): Array<{ tier1: string; tier2: string; overlap: { from: number; to: number | null } }> => {
    const overlaps: Array<{ tier1: string; tier2: string; overlap: { from: number; to: number | null } }> = [];
    
    // Lọc các tiers đang active
    const activeTiers = sortedTiers.filter(tier => isTierCurrentlyActive(tier));
    if (activeTiers.length < 2) return overlaps;

    // So sánh từng cặp tiers
    for (let i = 0; i < activeTiers.length; i++) {
      for (let j = i + 1; j < activeTiers.length; j++) {
        const tier1 = activeTiers[i];
        const tier2 = activeTiers[j];

        const min1 = Number(tier1.minQuantity ?? 0);
        const max1 = tier1.maxQuantity !== null && tier1.maxQuantity !== undefined
          ? Number(tier1.maxQuantity)
          : null;
        const min2 = Number(tier2.minQuantity ?? 0);
        const max2 = tier2.maxQuantity !== null && tier2.maxQuantity !== undefined
          ? Number(tier2.maxQuantity)
          : null;

        // Kiểm tra overlap: 2 khoảng overlap nếu min của cái này <= max của cái kia và ngược lại
        let overlapFrom: number | null = null;
        let overlapTo: number | null = null;

        if (max1 === null && max2 === null) {
          // Cả 2 đều không giới hạn - overlap từ max(min1, min2) trở đi
          overlapFrom = Math.max(min1, min2);
          overlapTo = null;
        } else if (max1 === null) {
          // Tier1 không giới hạn, tier2 có giới hạn
          if (min1 <= max2!) {
            overlapFrom = Math.max(min1, min2);
            overlapTo = max2;
          }
        } else if (max2 === null) {
          // Tier2 không giới hạn, tier1 có giới hạn
          if (min2 <= max1) {
            overlapFrom = Math.max(min1, min2);
            overlapTo = max1;
          }
        } else {
          // Cả 2 đều có giới hạn
          if (min1 <= max2 && min2 <= max1) {
            overlapFrom = Math.max(min1, min2);
            overlapTo = Math.min(max1, max2);
          }
        }

        // Chỉ báo overlap nếu có khoảng trùng thực sự
        if (overlapFrom !== null) {
          // Kiểm tra xem có overlap thực sự không (không chỉ là ranh giới)
          const hasRealOverlap = overlapTo === null || (overlapTo !== null && overlapFrom < overlapTo);
          if (hasRealOverlap) {
            overlaps.push({
              tier1: `Bậc ${tier1.tierOrder}`,
              tier2: `Bậc ${tier2.tierOrder}`,
              overlap: { from: overlapFrom, to: overlapTo },
            });
          }
        }
      }
    }

    return overlaps;
  };

  const gaps = checkGaps();
  const overlaps = checkOverlaps();
  const hasFinalTier = checkHasFinalTier();

  const startCreate = () => {
    const maxOrder = tiers.length > 0 ? Math.max(...tiers.map((t) => t.tierOrder ?? 0)) : 0;
    setEditingTier({
      ...EMPTY_FORM,
      tierOrder: maxOrder + 1,
    });
    setIsCreateMode(true);
    setShowForm(true);
    setFormErrors({});
  };

  const startEdit = (tier: PricingTierDto) => {
    setEditingTier({
      id: tier.id,
      tierOrder: tier.tierOrder ?? 1,
      minQuantity: tier.minQuantity ?? null,
      maxQuantity: tier.maxQuantity ?? null,
      unitPrice: tier.unitPrice ?? null,
      effectiveFrom: tier.effectiveFrom
        ? new Date(tier.effectiveFrom).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      effectiveUntil: tier.effectiveUntil
        ? new Date(tier.effectiveUntil).toISOString().split('T')[0]
        : null,
      active: tier.active !== false,
      description: tier.description || '',
    });
    setIsCreateMode(false);
    setShowForm(true);
    setFormErrors({});
  };

  const handleDelete = async (tier: PricingTierDto) => {
    if (!confirm(`Bạn có chắc muốn xóa bậc giá ${tier.tierOrder}?`)) return;
    try {
      await deletePricingTier(tier.id);
      show('Xóa bậc giá thành công', 'success');
      await loadTiers();
    } catch (error: any) {
      console.error('Failed to delete pricing tier:', error);
      show(
        error?.response?.data?.message || error?.message || 'Không thể xóa bậc giá',
        'error'
      );
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!editingTier) return false;

    if (editingTier.tierOrder < 1) {
      errors.tierOrder = 'Thứ tự bậc phải >= 1';
    }

    if (editingTier.minQuantity !== null && editingTier.minQuantity < 0) {
      errors.minQuantity = 'Số lượng tối thiểu phải >= 0';
    }

    if (
      editingTier.maxQuantity !== null &&
      editingTier.minQuantity !== null &&
      editingTier.maxQuantity <= editingTier.minQuantity
    ) {
      errors.maxQuantity = 'Số lượng tối đa phải > số lượng tối thiểu';
    }

    if (editingTier.unitPrice === null || editingTier.unitPrice <= 0) {
      errors.unitPrice = 'Đơn giá phải > 0';
    }

    if (!editingTier.effectiveFrom) {
      errors.effectiveFrom = 'Ngày hiệu lực là bắt buộc';
    }

    if (
      editingTier.effectiveUntil &&
      editingTier.effectiveFrom &&
      new Date(editingTier.effectiveUntil) < new Date(editingTier.effectiveFrom)
    ) {
      errors.effectiveUntil = 'Ngày kết thúc phải >= ngày bắt đầu';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!editingTier || !validateForm()) {
      return;
    }

    // Kiểm tra xem sau khi save có bậc cuối cùng không
    const willHaveFinalTier = editingTier.maxQuantity === null || editingTier.maxQuantity === undefined;
    const otherActiveTiers = sortedTiers.filter(tier => 
      isTierCurrentlyActive(tier) && 
      (isCreateMode || tier.id !== editingTier.id)
    );
    const otherHasFinalTier = otherActiveTiers.some(tier => tier.maxQuantity === null || tier.maxQuantity === undefined);
    
    // Nếu đang edit một tier có maxQuantity và không có tier nào khác có maxQuantity = null
    if (!willHaveFinalTier && !otherHasFinalTier && editingTier.active) {
      const confirmMessage = 'Cảnh báo: Sau khi lưu, hệ thống sẽ không có bậc giá cuối cùng (maxQuantity = null).\n\n' +
        'Bạn có muốn tiếp tục? Hệ thống yêu cầu phải có ít nhất một bậc cuối cùng để bao phủ tất cả các trường hợp.';
      
      if (!confirm(confirmMessage)) {
        return;
      }
    }

    setSaving(true);
    try {
      if (isCreateMode) {
        const payload: CreatePricingTierRequest = {
          serviceCode: selectedService,
          tierOrder: editingTier.tierOrder,
          minQuantity: editingTier.minQuantity,
          maxQuantity: editingTier.maxQuantity ?? null,
          unitPrice: editingTier.unitPrice,
          effectiveFrom: editingTier.effectiveFrom,
          effectiveUntil: editingTier.effectiveUntil ?? null,
          active: editingTier.active,
          description: editingTier.description || undefined,
        };
        await createPricingTier(payload);
        show('Tạo bậc giá thành công', 'success');
      } else {
        const payload: UpdatePricingTierRequest = {
          tierOrder: editingTier.tierOrder,
          minQuantity: editingTier.minQuantity,
          maxQuantity: editingTier.maxQuantity ?? null,
          unitPrice: editingTier.unitPrice,
          effectiveFrom: editingTier.effectiveFrom,
          effectiveUntil: editingTier.effectiveUntil ?? null,
          active: editingTier.active,
          description: editingTier.description || undefined,
        };
        await updatePricingTier(editingTier.id!, payload);
        show('Cập nhật bậc giá thành công', 'success');
      }
      setShowForm(false);
      setEditingTier(null);
      await loadTiers();
    } catch (error: any) {
      console.error('Failed to save pricing tier:', error);
      console.error('Error response:', error?.response);
      console.error('Error response data:', error?.response?.data);
      
      let errorMessage = 'Không thể lưu bậc giá';
      
      // Thử nhiều cách để lấy error message
      if (error?.response?.data) {
        const data = error.response.data;
        // Spring Boot có thể trả về message trong các field khác nhau
        if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.details) {
          errorMessage = data.details;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Decode URL encoding nếu có
      try {
        errorMessage = decodeURIComponent(errorMessage);
      } catch (e) {
        // Nếu không decode được thì giữ nguyên
      }
      
      if (errorMessage.includes('trùng') || errorMessage.includes('overlap') || 
          errorMessage.includes('Khoảng giá') || errorMessage.includes('tr?ng')) {
        setFormErrors({
          ...formErrors,
          overlap: errorMessage,
        });
        show(errorMessage, 'error');
      } else {
        show(errorMessage, 'error');
        setFormErrors({
          ...formErrors,
          general: errorMessage,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number | null): string => {
    if (amount === null) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý bậc giá</h1>
        <p className="text-gray-600 mt-2">Cấu hình bậc giá cho điện và nước</p>
      </div>

      {/* Service Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-4">
          {SERVICE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedService(option.value as 'ELECTRIC' | 'WATER')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                selectedService === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-2">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Tổng số bậc giá: <strong>{tiers.length}</strong>
        </div>
        <button
          onClick={startCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Thêm bậc giá mới
        </button>
      </div>

      {/* Overlap Warning */}
      {overlaps.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Cảnh báo: Có khoảng giá bị trùng
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p className="mb-2">
                  Các bậc giá sau có khoảng trùng nhau:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {overlaps.map((overlap, index) => (
                    <li key={index}>
                      <strong>{overlap.tier1}</strong> và <strong>{overlap.tier2}</strong> trùng khoảng{' '}
                      {overlap.overlap.to === null
                        ? `từ ${overlap.overlap.from.toLocaleString('vi-VN')} trở đi`
                        : overlap.overlap.from === overlap.overlap.to
                        ? `tại ${overlap.overlap.from.toLocaleString('vi-VN')}`
                        : `từ ${overlap.overlap.from.toLocaleString('vi-VN')} đến ${overlap.overlap.to.toLocaleString('vi-VN')}`}{' '}
                      {selectedService === 'ELECTRIC' ? 'kWh' : 'm³'}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs">
                  Vui lòng điều chỉnh min/max của các bậc để tránh trùng lặp.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Missing Final Tier Warning */}
      {!hasFinalTier && sortedTiers.filter(tier => isTierCurrentlyActive(tier)).length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                ⚠️ Thiếu bậc giá cuối cùng
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p className="mb-2">
                  Hệ thống yêu cầu phải có ít nhất một bậc giá cuối cùng với <strong>maxQuantity = null</strong> (không giới hạn) 
                  để bao phủ tất cả các trường hợp còn lại.
                </p>
                <p className="text-xs mt-2">
                  Ví dụ: Bậc cuối cùng có thể là "≥ 50 kWh" hoặc "≥ 50 m³" với maxQuantity để trống.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gap Warning */}
      {gaps.length > 0 && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Cảnh báo: Có khoảng giá bị thiếu
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p className="mb-2">
                  Các khoảng sau chưa được phủ bởi bất kỳ bậc giá nào:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {gaps.map((gap, index) => (
                    <li key={index}>
                      {gap.to === Infinity ? (
                        <>
                          Từ <strong>{gap.from.toLocaleString('vi-VN')}</strong> trở lên{' '}
                          {selectedService === 'ELECTRIC' ? 'kWh' : 'm³'} - <strong>Cần bậc cuối cùng (maxQuantity = null)</strong>
                        </>
                      ) : (
                        <>
                          Từ <strong>{gap.from.toLocaleString('vi-VN')}</strong> đến{' '}
                          <strong>{gap.to.toLocaleString('vi-VN')}</strong>{' '}
                          {selectedService === 'ELECTRIC' ? 'kWh' : 'm³'}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs">
                  Vui lòng thêm bậc giá để phủ các khoảng này hoặc điều chỉnh max của bậc trước đó.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && editingTier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {isCreateMode ? 'Thêm bậc giá mới' : 'Chỉnh sửa bậc giá'}
              </h2>

              {/* Error Messages */}
              {formErrors.overlap && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-red-800">{formErrors.overlap}</p>
                    </div>
                  </div>
                </div>
              )}

              {formErrors.general && !formErrors.overlap && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-red-800">{formErrors.general}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thứ tự bậc *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingTier.tierOrder}
                    onChange={(e) =>
                      setEditingTier({
                        ...editingTier,
                        tierOrder: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formErrors.tierOrder && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.tierOrder}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số lượng tối thiểu (kWh/m³)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingTier.minQuantity ?? ''}
                    onChange={(e) => {
                      setEditingTier({
                        ...editingTier,
                        minQuantity: e.target.value ? parseFloat(e.target.value) : null,
                      });
                      if (formErrors.overlap || formErrors.general) {
                        setFormErrors({ ...formErrors, overlap: undefined, general: undefined });
                      }
                    }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                    {formErrors.minQuantity && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.minQuantity}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số lượng tối đa (kWh/m³)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingTier.maxQuantity ?? ''}
                    onChange={(e) => {
                      setEditingTier({
                        ...editingTier,
                        maxQuantity: e.target.value ? parseFloat(e.target.value) : null,
                      });
                      if (formErrors.overlap || formErrors.general) {
                        setFormErrors({ ...formErrors, overlap: undefined, general: undefined });
                      }
                    }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Không giới hạn"
                    />
                    {formErrors.maxQuantity && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.maxQuantity}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Để trống nếu không giới hạn (bậc cuối cùng - bắt buộc phải có ít nhất 1 bậc)
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Đơn giá (VNĐ/kWh hoặc VNĐ/m³) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={editingTier.unitPrice ?? ''}
                    onChange={(e) =>
                      setEditingTier({
                        ...editingTier,
                        unitPrice: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formErrors.unitPrice && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.unitPrice}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative z-50">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày hiệu lực từ *
                    </label>
                    <input
                      type="date"
                      value={editingTier.effectiveFrom}
                      onChange={(e) => {
                        setEditingTier({ ...editingTier, effectiveFrom: e.target.value });
                        if (formErrors.overlap || formErrors.general) {
                          setFormErrors({ ...formErrors, overlap: undefined, general: undefined });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 relative z-50"
                    />
                    {formErrors.effectiveFrom && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.effectiveFrom}</p>
                    )}
                  </div>

                  <div className="relative z-50">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày hiệu lực đến
                    </label>
                    <input
                      type="date"
                      value={editingTier.effectiveUntil ?? ''}
                      onChange={(e) => {
                        setEditingTier({
                          ...editingTier,
                          effectiveUntil: e.target.value || null,
                        });
                        if (formErrors.overlap || formErrors.general) {
                          setFormErrors({ ...formErrors, overlap: undefined, general: undefined });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 relative z-50"
                    />
                    {formErrors.effectiveUntil && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.effectiveUntil}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Để trống nếu không có hạn</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={editingTier.description}
                    onChange={(e) =>
                      setEditingTier({ ...editingTier, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mô tả bậc giá (tùy chọn)"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="active"
                    checked={editingTier.active}
                    onChange={(e) =>
                      setEditingTier({ ...editingTier, active: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                    Kích hoạt bậc giá này
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6 relative z-0">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 relative z-10"
                >
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingTier(null);
                    setFormErrors({});
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 relative z-10"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tiers List */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-gray-500">Đang tải...</div>
        </div>
      ) : sortedTiers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500 mb-4">Chưa có bậc giá nào</p>
          <button
            onClick={startCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Thêm bậc giá đầu tiên
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bậc
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khoảng lượng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đơn giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hiệu lực
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
                {sortedTiers.map((tier) => {
                  const isActive = isTierCurrentlyActive(tier);
                  const minQty = tier.minQuantity ?? 0;
                  const maxQty = tier.maxQuantity;
                  const rangeText = maxQty
                    ? `${minQty.toLocaleString('vi-VN')} - ${maxQty.toLocaleString('vi-VN')}`
                    : `≥ ${minQty.toLocaleString('vi-VN')}`;

                  return (
                    <tr key={tier.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          Bậc {tier.tierOrder}
                        </div>
                        {tier.description && (
                          <div className="text-xs text-gray-500">{tier.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{rangeText}</div>
                        <div className="text-xs text-gray-500">
                          {selectedService === 'ELECTRIC' ? 'kWh' : 'm³'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(tier.unitPrice ?? 0)}
                        </div>
                        <div className="text-xs text-gray-500">
                          /{selectedService === 'ELECTRIC' ? 'kWh' : 'm³'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {tier.effectiveFrom
                            ? new Date(tier.effectiveFrom).toLocaleDateString('vi-VN')
                            : 'N/A'}
                        </div>
                        {tier.effectiveUntil && (
                          <div className="text-xs text-gray-500">
                            đến{' '}
                            {new Date(tier.effectiveUntil).toLocaleDateString('vi-VN')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {isActive ? 'Đang áp dụng' : 'Không áp dụng'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => startEdit(tier)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(tier)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Lưu ý:</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Bậc giá được áp dụng theo thứ tự từ thấp đến cao</li>
          <li>Bậc giá sẽ được tính khi số lượng sử dụng nằm trong khoảng min - max</li>
          <li>Nếu max = null, bậc giá áp dụng cho tất cả số lượng từ min trở lên</li>
          <li>Ngày hiệu lực quyết định bậc giá nào được sử dụng tại thời điểm tính toán</li>
        </ul>
      </div>
    </div>
  );
}

