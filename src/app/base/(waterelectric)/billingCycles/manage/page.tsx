'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useNotifications } from '@/src/hooks/useNotifications';
import {
  BillingCycleDto,
  BuildingInvoiceSummaryDto,
  InvoiceDto,
  loadBillingCycleBuildingSummary,
  loadBillingPeriod,
  loadBuildingInvoices,
} from '@/src/services/finance/billingCycleService';
import { getAllServices, ServiceDto } from '@/src/services/base/waterService';
import { getBuildings, Building } from '@/src/services/base/buildingService';

const STATUS_BADGES: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-700',
};

export default function BillingCycleManagePage() {
  const { show } = useNotifications();
  const [year, setYear] = useState(new Date().getFullYear());
  const [cycles, setCycles] = useState<BillingCycleDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState('ALL');
  const [selectedCycle, setSelectedCycle] = useState<BillingCycleDto | null>(null);
  const [buildingSummaries, setBuildingSummaries] = useState<BuildingInvoiceSummaryDto[]>([]);
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [buildingInvoices, setBuildingInvoices] = useState<InvoiceDto[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [allBuildings, setAllBuildings] = useState<Building[]>([]);
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState<string | null>(null);

  useEffect(() => {
    loadCycles();
    loadServices();
    loadBuildings();
  }, [year]);

  const loadCycles = async () => {
    try {
      setLoading(true);
      const data = await loadBillingPeriod(year);
      setCycles(data);
    } catch (error: any) {
      console.error('Loading billing cycles failed', error);
      show('Không thể tải billing cycles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const data = await getAllServices();
      setServices(data);
    } catch (error) {
      console.error('Failed to load services', error);
    }
  };

  const loadBuildings = async () => {
    try {
      const data = await getBuildings();
      setAllBuildings(data);
    } catch (error) {
      console.error('Failed to load buildings', error);
    }
  };

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

  const monthOptions = useMemo(() => {
    if (!cycles.length) {
      return [];
    }
    
    const monthSet = new Set<string>();
    cycles.forEach(cycle => {
      const start = new Date(cycle.periodFrom);
      const end = new Date(cycle.periodTo);
      
      const startYear = start.getFullYear();
      const startMonth = start.getMonth();
      const endYear = end.getFullYear();
      const endMonth = end.getMonth();
      
      let currentYear = startYear;
      let currentMonth = startMonth;
      
      while (
        currentYear < endYear ||
        (currentYear === endYear && currentMonth <= endMonth)
      ) {
        const yearStr = currentYear;
        const monthStr = String(currentMonth + 1).padStart(2, '0');
        monthSet.add(`${yearStr}-${monthStr}`);
        
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
      }
    });
    
    const sortedMonths = Array.from(monthSet).sort();
    return sortedMonths.map(month => {
      const [year, monthNum] = month.split('-');
      return {
        value: month,
        label: `${monthNum}/${year}`
      };
    });
  }, [cycles]);

  // Tự động chọn cycle đầu tiên khi filter thay đổi
  useEffect(() => {
    if (filteredCycles.length > 0) {
      const cycleToSelect = filteredCycles.find(c => c.id === selectedCycle?.id) || filteredCycles[0];
      if (cycleToSelect.id !== selectedCycle?.id) {
        setSelectedCycle(cycleToSelect);
      }
    } else {
      setSelectedCycle(null);
    }
  }, [filteredCycles, selectedCycle?.id]);

  // Load building summaries khi cycle được chọn
  useEffect(() => {
    if (!selectedCycle) {
      setBuildingSummaries([]);
      setSelectedBuildingId(null);
      setBuildingInvoices([]);
      return;
    }

    const fetchSummaries = async () => {
      setLoadingSummaries(true);
      try {
        const data = await loadBillingCycleBuildingSummary(selectedCycle.id);
        setBuildingSummaries(data);
        if (data.length > 0) {
          setSelectedBuildingId(data[0].buildingId);
        }
      } catch (error) {
        console.error('Failed to load building summaries', error);
        show('Không thể tải dữ liệu tòa nhà', 'error');
      } finally {
        setLoadingSummaries(false);
      }
    };

    fetchSummaries();
  }, [selectedCycle, show]);

  // Load invoices khi building được chọn
  useEffect(() => {
    if (!selectedCycle || !selectedBuildingId) {
      setBuildingInvoices([]);
      return;
    }

    const fetchInvoices = async () => {
      setLoadingInvoices(true);
      try {
        const invoices = await loadBuildingInvoices(selectedCycle.id, selectedBuildingId);
        setBuildingInvoices(invoices);
      } catch (error) {
        console.error('Failed to load invoices', error);
        show('Không thể tải hóa đơn', 'error');
      } finally {
        setLoadingInvoices(false);
      }
    };

    fetchInvoices();
  }, [selectedCycle, selectedBuildingId, show]);

  // Filter building summaries theo selectedBuildingFilter
  const filteredBuildingSummaries = useMemo(() => {
    if (!selectedBuildingFilter) {
      return buildingSummaries;
    }
    return buildingSummaries.filter(summary => summary.buildingId === selectedBuildingFilter);
  }, [buildingSummaries, selectedBuildingFilter]);

  const totalStats = useMemo(() => {
    const count = filteredBuildingSummaries.length;
    const totalAmount = filteredBuildingSummaries
      .map((summary) => summary.totalAmount ?? 0)
      .reduce((sum, value) => sum + (value ?? 0), 0);
    return { count, totalAmount };
  }, [filteredBuildingSummaries]);

  return (
    <div className="px-[41px] py-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Quản lý tài chính</p>
          <h1 className="text-3xl font-semibold text-[#02542D]">Quản lý chi tiết billing</h1>
        </div>
        <Link
          href="/base/billingCycles"
          className="px-4 py-2 border border-[#02542D] text-[#02542D] rounded-md hover:bg-[#f2fff6]"
        >
          Quay lại tổng quan
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="border border-gray-300 rounded-md px-3 py-2 flex items-center gap-2">
          <span className="text-xs text-gray-500">Năm</span>
          <input
            type="number"
            min={2000}
            max={2100}
            value={year}
            onChange={(event) => setYear(Number(event.target.value) || new Date().getFullYear())}
            className="w-20 text-sm font-semibold text-[#02542D] bg-transparent outline-none"
          />
        </div>
        <button
          onClick={() => loadCycles()}
          className="px-4 py-2 bg-[#14AE5C] text-white rounded-md hover:bg-[#0c793f] transition-colors text-sm"
        >
          Làm mới
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
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
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Tòa nhà</label>
          <select
            value={selectedBuildingFilter ?? ''}
            onChange={(event) => setSelectedBuildingFilter(event.target.value || null)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#739559]"
          >
            <option value="">Tất cả tòa nhà</option>
            {allBuildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.code} - {building.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedCycle && (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">Chu kỳ hiện tại:</span>{' '}
            {selectedCycle.name} ({new Date(selectedCycle.periodFrom).toLocaleDateString()} - {new Date(selectedCycle.periodTo).toLocaleDateString()})
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <div className="text-sm text-gray-600">
          {totalStats.count} toà nhà | Tổng hóa đơn: {totalStats.totalAmount.toLocaleString('vi-VN')} VNĐ
        </div>
        {loadingSummaries ? (
          <div className="text-sm text-gray-500">Đang tổng hợp dữ liệu theo tòa...</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              {filteredBuildingSummaries.map((summary) => (
                <div
                  key={`${summary.buildingId}-${summary.status}`}
                  className={`border rounded-xl p-4 cursor-pointer transition ${
                    selectedBuildingId === summary.buildingId
                      ? 'border-[#02542D] bg-[#e6f7eb]'
                      : 'border-gray-200 bg-white hover:border-[#739559]'
                  }`}
                  onClick={() => setSelectedBuildingId(summary.buildingId)}
                >
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Tòa</div>
                  <div className="text-lg font-semibold text-[#02542D]">
                    {summary.buildingCode || summary.buildingName || summary.buildingId?.slice(0, 8)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Trạng thái: {summary.status}</div>
                  <div className="text-sm text-gray-600 mt-2">
                    {summary.invoiceCount} hóa đơn · {summary.totalAmount?.toLocaleString('vi-VN') ?? 0} VNĐ
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#02542D]">Danh sách hóa đơn</h2>
          <span className="text-sm text-gray-500">
            {(() => {
              if (!selectedBuildingId) return 'Chưa chọn tòa';
              const buildingSummary = buildingSummaries.find(s => s.buildingId === selectedBuildingId);
              const building = allBuildings.find(b => b.id === selectedBuildingId);
              const buildingName = buildingSummary?.buildingCode || buildingSummary?.buildingName || building?.code || building?.name;
              return buildingName ? `Tòa ${buildingName}` : `Tòa ${selectedBuildingId.slice(0, 8)}`;
            })()}
          </span>
        </div>
        {loadingInvoices ? (
          <div className="text-sm text-gray-500">Đang tải hóa đơn...</div>
        ) : buildingInvoices.length === 0 ? (
          <div className="text-sm text-gray-500">Chưa có hóa đơn cho tòa được chọn</div>
        ) : (
          <div className="space-y-3">
            {buildingInvoices.map((invoice) => (
              <div key={invoice.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[#02542D]">{invoice.code}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(invoice.issuedAt).toLocaleDateString()} · Status:{' '}
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        STATUS_BADGES[invoice.status] ?? 'bg-gray-100 text-gray-700'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-[#02542D]">
                    {invoice.totalAmount?.toLocaleString('vi-VN')} VNĐ
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '–'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
