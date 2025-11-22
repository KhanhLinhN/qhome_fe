'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BillingCycleDto,
  BuildingInvoiceSummaryDto,
  MissingReadingCycleDto,
  loadBillingPeriod,
  loadBillingCycleBuildingSummary,
  loadMissingReadingCycles,
  syncMissingBillingCycles,
} from '@/src/services/finance/billingCycleService';
import { getAllServices, ServiceDto, getReadingCycleById, ReadingCycleDto } from '@/src/services/base/waterService';
import { useNotifications } from '@/src/hooks/useNotifications';

const STATUS_BADGES: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-700',
};

export default function BillingCyclesPage() {
  const { show } = useNotifications();
  const [year, setYear] = useState(new Date().getFullYear());
  const [cycles, setCycles] = useState<BillingCycleDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);
  const [syncingMissing, setSyncingMissing] = useState(false);
  const [syncMissingResult, setSyncMissingResult] = useState<string | null>(null);
  const [missingReadingCycles, setMissingReadingCycles] = useState<MissingReadingCycleDto[]>([]);
  const [loadingMissingCycles, setLoadingMissingCycles] = useState(false);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState('ALL');
  const [detailCycle, setDetailCycle] = useState<BillingCycleDto | null>(null);
  const [buildingSummaries, setBuildingSummaries] = useState<BuildingInvoiceSummaryDto[]>([]);
  const [loadingBuildingSummaries, setLoadingBuildingSummaries] = useState(false);
  const [readingCycleName, setReadingCycleName] = useState<string | null>(null);
  const [readingCycleServiceCode, setReadingCycleServiceCode] = useState<string | null>(null);

  useEffect(() => {
    loadCycles();
    loadMissingCycles();
  }, [year]);

  useEffect(() => {
    loadServices();
  }, []);

  // Tính toán thống kê từ buildingSummaries
  const cycleStats = useMemo(() => {
    if (!buildingSummaries.length) {
      return {
        totalInvoices: 0,
        totalAmount: 0,
        paidInvoices: 0,
        paidAmount: 0,
        publishedInvoices: 0,
        publishedAmount: 0,
        voidInvoices: 0,
        voidAmount: 0,
      };
    }

    let totalInvoices = 0;
    let totalAmount = 0;
    let paidInvoices = 0;
    let paidAmount = 0;
    let publishedInvoices = 0;
    let publishedAmount = 0;
    let voidInvoices = 0;
    let voidAmount = 0;

    buildingSummaries.forEach((summary) => {
      const count = summary.invoiceCount || 0;
      const amount = summary.totalAmount || 0;
      
      totalInvoices += count;
      totalAmount += amount;

      if (summary.status === 'PAID') {
        paidInvoices += count;
        paidAmount += amount;
      } else if (summary.status === 'PUBLISHED') {
        publishedInvoices += count;
        publishedAmount += amount;
      } else if (summary.status === 'VOID') {
        voidInvoices += count;
        voidAmount += amount;
      }
    });

    return {
      totalInvoices,
      totalAmount,
      paidInvoices,
      paidAmount,
      publishedInvoices,
      publishedAmount,
      voidInvoices,
      voidAmount,
    };
  }, [buildingSummaries]);

  useEffect(() => {
    if (!detailCycle) {
      setBuildingSummaries([]);
      setReadingCycleName(null);
      setReadingCycleServiceCode(null);
      return;
    }

    const fetchReadingCycle = async () => {
      if (detailCycle.externalCycleId) {
        try {
          const readingCycle = await getReadingCycleById(detailCycle.externalCycleId);
          setReadingCycleName(readingCycle.name || detailCycle.externalCycleId || null);
          setReadingCycleServiceCode(readingCycle.serviceCode || null);
        } catch (error) {
          console.error('Failed to load reading cycle:', error);
          setReadingCycleName(detailCycle.externalCycleId);
          setReadingCycleServiceCode(null);
        }
      } else {
        setReadingCycleName(null);
        setReadingCycleServiceCode(null);
      }
    };

    const fetchSummaries = async () => {
      setLoadingBuildingSummaries(true);
      try {
        const data = await loadBillingCycleBuildingSummary(detailCycle.id);
        setBuildingSummaries(data);
      } finally {
        setLoadingBuildingSummaries(false);
      }
    };

    fetchReadingCycle();
    fetchSummaries();
  }, [detailCycle]);

  const loadCycles = async () => {
    try {
      setLoading(true);
      const data = await loadBillingPeriod(year);
      setCycles(data);
      setExpandedCycle(data.length ? data[0].id : null);
    } catch (error: any) {
      console.error('Failed to load billing cycles:', error);
      show(error?.response?.data?.message || error?.message || 'Không thể tải billing cycles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMissingCycles = async () => {
    try {
      setLoadingMissingCycles(true);
      const data = await loadMissingReadingCycles();
      setMissingReadingCycles(data);
    } catch (error: any) {
      console.error('Failed to load missing billing cycles', error);
      show(error?.response?.data?.message || error?.message || 'Không thể tải chu kỳ đọc thiếu', 'error');
    } finally {
      setLoadingMissingCycles(false);
    }
  };

  const loadServices = async () => {
    try {
      const allServices = await getAllServices();
      setServices(allServices);
    } catch (error) {
      console.error('Failed to load services for filter', error);
    }
  };

  const monthOptions = useMemo(() => {
    const monthSet = new Set<string>();
    [...cycles, ...missingReadingCycles].forEach((cycle) => {
      if (cycle.periodFrom) {
        monthSet.add(cycle.periodFrom.slice(0, 7));
      }
    });

    return Array.from(monthSet)
      .sort((a, b) => b.localeCompare(a))
      .map((value) => {
        const [yearPart, monthPart] = value.split('-');
        return {
          value,
          label: `${monthPart}/${yearPart}`,
        };
      });
  }, [cycles, missingReadingCycles]);

  const matchesFilters = (
    periodFrom: string | undefined,
    serviceCode?: string | null,
    cycleName?: string
  ) => {
    const normalizedMonth = periodFrom ? periodFrom.slice(0, 7) : null;

    if (serviceFilter !== 'ALL') {
      const normalizedFilter = serviceFilter.toLowerCase();
      const matchesCode = serviceCode?.toLowerCase() === normalizedFilter;
      const matchesName = cycleName?.toLowerCase().includes(normalizedFilter);
      if (!matchesCode && !matchesName) {
        return false;
      }
    }

    if (monthFilter !== 'ALL' && normalizedMonth !== monthFilter) {
      return false;
    }

    return true;
  };

  const filteredCycles = useMemo(
    () => cycles.filter((cycle) => matchesFilters(cycle.periodFrom, cycle.serviceCode, cycle.name)),
    [cycles, serviceFilter, monthFilter]
  );

  const filteredMissingCycles = useMemo(
    () => missingReadingCycles.filter((cycle) => matchesFilters(cycle.periodFrom, cycle.serviceCode, cycle.name)),
    [missingReadingCycles, serviceFilter, monthFilter]
  );

  return (
    <div className="px-[41px] py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Quản lý tài chính</p>
          <h1 className="text-3xl font-semibold text-[#02542D]">Billing Cycles</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="border border-gray-200 rounded-md px-3 py-2 flex items-center gap-2">
            <span className="text-xs text-gray-500">Năm</span>
            <input
              type="number"
              min={2000}
              max={2100}
              value={year}
              onChange={(event) =>
                setYear(Number(event.target.value) || new Date().getFullYear())
              }
              className="w-16 text-sm font-semibold text-[#02542D] bg-transparent outline-none"
            />
          </div>
          <button
            onClick={() => loadCycles()}
            className="px-4 py-2 bg-[#14AE5C] text-white rounded-md hover:bg-[#0c793f] transition-colors text-sm leading-none whitespace-nowrap"
          >
            Làm mới
          </button>
          <button
            onClick={async () => {
              setSyncingMissing(true);
            try {
              const created = await syncMissingBillingCycles();
              const msg =
                created.length > 0
                  ? `Đã tạo thêm ${created.length} billing cycle`
                  : 'Không có chu kỳ nào cần tạo';
              setSyncMissingResult(msg);
              show('Đồng bộ chu kỳ đọc thành công', 'success');
              await loadCycles();
              await loadMissingCycles();
            } catch (error: any) {
              console.error('Sync missing billing cycles failed', error);
              show(
                error?.response?.data?.message || error?.message || 'Đồng bộ chu kỳ thất bại',
                'error'
              );
            } finally {
              setSyncingMissing(false);
            }
            }}
            disabled={syncingMissing}
            className="px-4 py-2 bg-[#02542D] text-white rounded-md hover:bg-[#014a26] transition-colors disabled:opacity-60 text-sm leading-none whitespace-nowrap"
          >
            {syncingMissing ? 'Đang tạo...' : 'Tạo billing thiếu'}
          </button>
          <Link
            href="/base/billingCycles/manage"
            className="px-4 py-2 border border-[#02542D] text-[#02542D] rounded-md text-sm font-semibold hover:bg-[#f2fff6]"
          >
            Quản lý chi tiết
          </Link>
        </div>
      </div>
      <div className="mb-6 grid grid-cols-3 gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Dịch vụ</label>
          <select
            value={serviceFilter}
            onChange={(event) => setServiceFilter(event.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#739559]"
          >
            <option value="ALL">Tất cả dịch vụ</option>
            {services.map((service) => (
              <option key={service.code} value={service.code}>
                {service.name} ({service.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Tháng</label>
          <select
            value={monthFilter}
            onChange={(event) => setMonthFilter(event.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#739559]"
          >
            <option value="ALL">Tất cả tháng</option>
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => {
              setServiceFilter('ALL');
              setMonthFilter('ALL');
            }}
            className="text-sm text-[#02542D] font-semibold hover:underline"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="text-sm text-gray-600">
          Có {filteredCycles.length} billing cycles trong năm {year}
        </div>
        {syncMissingResult && (
          <div className="rounded-md bg-[#f0fdf4] border border-[#c6f6d5] text-[#0f5132] px-4 py-2 text-sm">
            {syncMissingResult}
          </div>
        )}
            <div className="rounded-xl border border-dashed border-[#d1e7dd] bg-[#f7fcf6] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-[#0f5132]">Chu kỳ đọc chưa có billing</div>
            <span className="text-xs text-[#0f5132]">
              {filteredMissingCycles.length} chu kỳ
            </span>
          </div>
          {loadingMissingCycles ? (
            <div className="text-sm text-[#0f5132]">Đang lấy dữ liệu...</div>
          ) : filteredMissingCycles.length === 0 ? (
            <div className="text-sm text-[#0f5132]">Tất cả chu kỳ đã có billing</div>
          ) : (
            <ul className="space-y-2 text-sm text-[#0f5132]">
              {filteredMissingCycles.map((cycle) => (
                <li key={cycle.id} className="border border-[#cfe2ff] rounded-lg p-3 bg-white/70">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{cycle.name}</span>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#0f5132] bg-[#d1e7dd]">
                      {cycle.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    {cycle.serviceName || cycle.serviceCode || 'Unknown service'}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {new Date(cycle.periodFrom).toLocaleDateString()} — {new Date(cycle.periodTo).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        {loading ? (
          <div className="py-6 text-center text-gray-500">Đang tải...</div>
        ) : filteredCycles.length === 0 ? (
          <div className="py-6 text-center text-gray-500">Không tìm thấy billing cycle</div>
        ) : (
          <div className="space-y-3">
            {filteredCycles.map((cycle) => {
              const badgeClass = STATUS_BADGES[cycle.status] ?? STATUS_BADGES.OPEN;
              const isExpanded = expandedCycle === cycle.id;
              return (
                <div key={cycle.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedCycle(isExpanded ? null : cycle.id)}
                    className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between text-left"
                  >
                    <div>
                      <div className="text-lg font-semibold text-[#024023]">{cycle.name}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(cycle.periodFrom).toLocaleDateString()} – {new Date(cycle.periodTo).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded text-xs font-medium ${badgeClass}`}>{cycle.status}</span>
                  </button>
                  {isExpanded && (
                    <div className="px-4 py-3 bg-white space-y-1 text-sm text-gray-700">
                      <div>ID billing: {cycle.id}</div>
                      <div>Chu kỳ đọc liên quan: {cycle.externalCycleId ?? '—'}</div>
                      <div className="text-xs text-gray-500">Trạng thái: {cycle.status}</div>
                    </div>
                  )}
                  <div className="px-4 py-3 bg-gray-50 flex justify-end">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        setDetailCycle(cycle);
                      }}
                      className="px-3 py-1 rounded-md bg-white border border-[#d1e7dd] text-[#02542D] text-sm font-semibold hover:bg-[#f0f5f0]"
                    >
                      View details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {detailCycle && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-[#02542D]">Thống kê Billing Cycle</h3>
              <button
                onClick={() => setDetailCycle(null)}
                className="text-gray-500 hover:text-[#02542D] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" height="20" width="20">
                  <path fill="currentColor" d="M8 9.414l3.536 3.536a1 1 0 0 0 1.414-1.414L9.414 8l3.536-3.536a1 1 0 0 0-1.414-1.414L8 6.586 4.464 3.05a1 1 0 0 0-1.414 1.414L6.586 8l-3.536 3.536a1 1 0 0 0 1.414 1.414L8 9.414z"/>
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Thông tin cycle */}
              <div className="border-b border-gray-200 pb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Tên:</span>
                    <div className="font-semibold text-[#02542D]">{detailCycle.name}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Trạng thái:</span>
                    <div className="font-semibold">
                      <span className={`px-2 py-1 rounded text-xs ${STATUS_BADGES[detailCycle.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {detailCycle.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Dịch vụ:</span>
                    <div className="font-semibold text-[#02542D]">
                      {detailCycle.serviceName || detailCycle.serviceCode || '–'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Chu kỳ:</span>
                    <div className="font-semibold text-[#02542D]">
                      {new Date(detailCycle.periodFrom).toLocaleDateString()} – {new Date(detailCycle.periodTo).toLocaleDateString()}
                    </div>
                  </div>
                  {readingCycleName && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Chu kỳ đọc:</span>
                      <div className="font-semibold text-[#02542D]">
                        {readingCycleName}{readingCycleServiceCode ? ` - ${readingCycleServiceCode}` : ''}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Thống kê tổng quan */}
              <div>
                <h4 className="text-base font-semibold text-[#02542D] mb-4">Thống kê tổng quan</h4>
                {loadingBuildingSummaries ? (
                  <div className="text-sm text-gray-500">Đang tải thống kê...</div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-xs text-blue-600 mb-1">Tổng số hóa đơn</div>
                      <div className="text-2xl font-bold text-blue-700">{cycleStats.totalInvoices}</div>
                      <div className="text-xs text-blue-600 mt-1">
                        {cycleStats.totalAmount.toLocaleString('vi-VN')} VNĐ
                      </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-xs text-green-600 mb-1">Đã thanh toán (PAID)</div>
                      <div className="text-2xl font-bold text-green-700">{cycleStats.paidInvoices}</div>
                      <div className="text-xs text-green-600 mt-1">
                        {cycleStats.paidAmount.toLocaleString('vi-VN')} VNĐ
                      </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="text-xs text-yellow-600 mb-1">Chưa thanh toán (PUBLISHED)</div>
                      <div className="text-2xl font-bold text-yellow-700">{cycleStats.publishedInvoices}</div>
                      <div className="text-xs text-yellow-600 mt-1">
                        {cycleStats.publishedAmount.toLocaleString('vi-VN')} VNĐ
                      </div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="text-xs text-red-600 mb-1">Đã hủy (VOID)</div>
                      <div className="text-2xl font-bold text-red-700">{cycleStats.voidInvoices}</div>
                      <div className="text-xs text-red-600 mt-1">
                        {cycleStats.voidAmount.toLocaleString('vi-VN')} VNĐ
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary theo tòa */}
              <div>
                <h4 className="text-base font-semibold text-[#02542D] mb-4">Tổng hợp theo tòa nhà</h4>
                {loadingBuildingSummaries ? (
                  <div className="text-sm text-gray-500">Đang tải dữ liệu...</div>
                ) : buildingSummaries.length === 0 ? (
                  <div className="text-sm text-gray-500">Không có dữ liệu</div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                    {buildingSummaries.map((summary) => (
                      <div
                        key={`${summary.buildingId}-${summary.status}`}
                        className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                      >
                        <div className="font-semibold text-sm text-[#02542D]">
                          {summary.buildingName || summary.buildingCode || summary.buildingId?.slice(0, 8) || 'Tòa chưa rõ'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          <span className={`px-2 py-0.5 rounded ${
                            summary.status === 'PAID' ? 'bg-green-100 text-green-700' :
                            summary.status === 'PUBLISHED' ? 'bg-yellow-100 text-yellow-700' :
                            summary.status === 'VOID' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {summary.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-2">
                          {summary.invoiceCount} hóa đơn · {summary.totalAmount?.toLocaleString('vi-VN') ?? 0} VNĐ
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

