'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getBuildings, type Building } from '@/src/services/base/buildingService';
import {
  createMissingMeters,
  downloadMeterImportTemplate,
  getAllServices,
  getMeters,
  getUnitsWithoutMeter,
  type MeterDto,
  type ServiceDto,
  type UnitWithoutMeterDto,
} from '@/src/services/base/waterService';

const formatDate = (value?: string) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleDateString('vi-VN');
  } catch {
    return value;
  }
};

export default function MeterManagementPage() {
  const [meters, setMeters] = useState<MeterDto[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buildingFilter, setBuildingFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [missingUnits, setMissingUnits] = useState<UnitWithoutMeterDto[]>([]);
  const [missingLoading, setMissingLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [creatingMissing, setCreatingMissing] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [floorFilter, setFloorFilter] = useState('');
  const [templateDownloading, setTemplateDownloading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadMeta = async () => {
      try {
        const [buildingRes, serviceRes] = await Promise.all([getBuildings(), getAllServices()]);
        if (!active) return;
        setBuildings(buildingRes);
        setServices(serviceRes.filter((service) => service.active && service.requiresMeter));
      } catch (err) {
        console.error('Failed to load metadata:', err);
      }
    };

    loadMeta();
    return () => {
      active = false;
    };
  }, []);

  const loadMeters = useCallback(async () => {
    try {
      setLoading(true);
      const meterRes = await getMeters();
      setMeters(meterRes);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load meters:', err);
      setError(err?.message || 'Không thể tải dữ liệu meter');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMeters();
  }, [loadMeters]);

  const loadMissingUnits = useCallback(async () => {
    if (!serviceFilter) {
      setMissingUnits([]);
      return;
    }
    setMissingLoading(true);
    try {
      const units = await getUnitsWithoutMeter(serviceFilter, buildingFilter || undefined);
      setMissingUnits(units);
    } catch (err) {
      console.error('Failed to load missing units:', err);
      setMissingUnits([]);
    } finally {
      setMissingLoading(false);
    }
  }, [serviceFilter, buildingFilter]);

  useEffect(() => {
    loadMissingUnits();
  }, [loadMissingUnits]);

  const handleCreateMissing = useCallback(async () => {
    if (!serviceFilter) return;
    setCreationError(null);
    setCreatingMissing(true);
    try {
      await createMissingMeters(serviceFilter, buildingFilter || undefined);
      await loadMeters();
      await loadMissingUnits();
      setModalOpen(false);
    } catch (err: any) {
      setCreationError(err?.response?.data?.message || 'Không thể tạo công tơ tự động');
    } finally {
      setCreatingMissing(false);
    }
  }, [buildingFilter, loadMeters, loadMissingUnits, serviceFilter]);

  const buildingMap = useMemo(() => {
    const map = new Map<string, Building>();
    buildings.forEach((building) => map.set(building.id, building));
    return map;
  }, [buildings]);

  const floorOptions = useMemo(() => {
    const uniqueFloors = Array.from(
      new Set(
        meters
          .map((meter) => meter.floor)
          .filter((floor): floor is number => typeof floor === 'number')
      )
    );
    return uniqueFloors.sort((a, b) => a - b);
  }, [meters]);

  const filteredMeters = useMemo(() => {
    return meters.filter((meter) => {
      if (buildingFilter && meter.buildingId !== buildingFilter) {
        return false;
      }
      if (serviceFilter && meter.serviceId !== serviceFilter) {
        return false;
      }
      if (floorFilter) {
        const requestedFloor = Number(floorFilter);
        if (Number.isNaN(requestedFloor)) {
          return true;
        }
        if (meter.floor !== requestedFloor) {
          return false;
        }
      }
      return true;
    });
  }, [meters, buildingFilter, serviceFilter, floorFilter]);

  const selectedBuilding = buildingFilter ? buildingMap.get(buildingFilter) : null;
  const selectedService = serviceFilter ? services.find((service) => service.id === serviceFilter) : null;
  const summary = useMemo(() => {
    const total = filteredMeters.length;
    const active = filteredMeters.filter((meter) => meter.active).length;
    const inactive = total - active;
    const perService = filteredMeters.reduce<Record<string, number>>((acc, meter) => {
      const key = meter.serviceCode || 'Khác';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return { total, active, inactive, perService };
  }, [filteredMeters]);

  const handleDownloadTemplate = async () => {
    try {
      setTemplateDownloading(true);
      const blob = await downloadMeterImportTemplate();
      const url = URL.createObjectURL(blob);
      const element = document.createElement('a');
      element.href = url;
      element.download = 'meter_import_template.xlsx';
      element.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to download template:', err);
    } finally {
      setTemplateDownloading(false);
    }
  };

  return (
    <div className="px-8 py-12 space-y-8">
      <header className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Quản lý công tơ</p>
          <h1 className="text-3xl font-semibold text-[#02542D]">Danh sách meter</h1>
          <p className="text-gray-600 max-w-3xl">
            Xem nhanh tình trạng meter theo tòa nhà và dịch vụ, lọc ra các căn hộ đang có hay chưa có meter, rồi chuyển
            sang phân công đọc/nạp mới khi cần.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/base/building/buildingList"
            className="px-4 py-2 bg-[#02542D] text-white text-sm rounded-lg shadow-sm hover:bg-[#014a26] transition"
          >
            Thêm meter
          </Link>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            disabled={templateDownloading}
            className="px-4 py-2 bg-[#F1F5F9] text-sm text-[#02542D] rounded-lg border border-[#CAD7D3] hover:bg-[#E2EDF2] transition disabled:opacity-60"
          >
            {templateDownloading ? 'Đang tải template...' : 'Tải template import công tơ'}
          </button>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex flex-col text-sm text-gray-600">
            <span className="text-xs uppercase tracking-wide text-gray-500">Lọc tòa nhà</span>
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Tất cả tòa nhà</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.code} – {building.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col text-sm text-gray-600">
            <span className="text-xs uppercase tracking-wide text-gray-500">Lọc dịch vụ</span>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Tất cả dịch vụ</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.code} – {service.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col text-sm text-gray-600">
            <span className="text-xs uppercase tracking-wide text-gray-500">Lọc tầng</span>
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Tất cả tầng</option>
              {floorOptions.map((floor) => (
                <option key={floor} value={floor.toString()}>
                  {floor}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <section className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-gray-500">Tổng meter đang lọc</p>
            <p className="text-2xl font-semibold text-[#02542D]">{summary.total}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-gray-500">Meter đang hoạt động</p>
            <p className="text-2xl font-semibold text-[#14AE5C]">{summary.active}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-gray-500">Meter không hoạt động</p>
            <p className="text-2xl font-semibold text-[#E02424]">{summary.inactive}</p>
          </div>
        </div>
        {Object.keys(summary.perService).length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm text-sm text-gray-600">
            <p className="font-semibold text-gray-700">Phân bố theo dịch vụ</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(summary.perService).map(([serviceCode, count]) => (
                <span key={serviceCode} className="rounded-full border border-[#D1D5DB] px-3 py-1 text-xs font-medium">
                  {serviceCode}: {count}
                </span>
              ))}
            </div>
          </div>
        )}
        {serviceFilter && (
          <div className="rounded-lg border border-dashed border-[#a5d5ba] bg-white/80 px-4 py-3 text-sm text-[#0a642c] shadow-sm space-y-1">
            {missingLoading ? (
              <div>Đang kiểm tra các căn hộ chưa có công tơ...</div>
            ) : missingUnits.length > 0 ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">
                    Hiện còn {missingUnits.length} căn hộ chưa có công tơ dành cho{' '}
                    <span className="font-normal">
                      {selectedService?.code || 'dịch vụ'}
                      {selectedBuilding ? ` tại tòa ${selectedBuilding.code}` : ''}
                    </span>
                    .
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="px-3 py-1 rounded-full border border-[#0d7033] text-xs font-semibold text-[#0d7033] hover:bg-[#ecf8f1]"
                  >
                    Xem chi tiết
                  </button>
                </div>
                <div className="text-xs text-gray-600">
                  Một số vị trí: {missingUnits.slice(0, 4).map((unit) => unit.unitCode).join(', ')}
                  {missingUnits.length > 4 ? ` và ${missingUnits.length - 4} căn khác` : ''}
                </div>
              </>
            ) : (
              <div>
                Đã có meter cho tất cả căn hộ ở{' '}
                <span className="font-semibold">{selectedBuilding ? selectedBuilding.code : 'tòa này'}</span> cho dịch vụ này.
              </div>
            )}
          </div>
        )}
      </section>

      <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Đang tải dữ liệu meter...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 py-3">Tòa nhà</th>
                  <th className="px-4 py-3">Căn hộ</th>
                  <th className="px-4 py-3">Tầng</th>
                  <th className="px-4 py-3">Dịch vụ</th>
                  <th className="px-4 py-3">Mã công tơ</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Ngày lắp</th>
                  <th className="px-4 py-3">Chỉ số cuối</th>
                  <th className="px-4 py-3">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredMeters.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      Không tìm thấy công tơ phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredMeters.map((meter) => {
                    const building = buildingMap.get(meter.buildingId || '');
                    return (
                      <tr key={meter.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-[#02542D]">
                            {building?.code ?? meter.buildingCode ?? '-'}
                          </div>
                          <div className="text-xs text-gray-500">{building?.name ?? 'Tòa nhà chưa xác định'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">{meter.unitCode ?? '—'}</span>
                        </td>
                        <td className="px-4 py-3 text-center">{meter.floor ?? '-'}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{meter.serviceName ?? '-'}</div>
                          <div className="text-xs text-gray-500">{meter.serviceCode ?? '-'}</div>
                        </td>
                        <td className="px-4 py-3">{meter.meterCode}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              meter.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {meter.active ? 'Hoạt động' : 'Ngừng'}
                          </span>
                        </td>
                        <td className="px-4 py-3">{formatDate(meter.installedAt)}</td>
                        <td className="px-4 py-3">{meter.lastReadingDate ? `${meter.lastReading} (${formatDate(meter.lastReadingDate)})` : '-'}</td>
                        <td className="px-4 py-3">
                          <Link
                            href={
                              building?.id
                                ? `/base/building/buildingDetail/${building.id}`
                                : '/base/building/buildingList'
                            }
                            className="text-xs font-semibold text-[#02542D] hover:underline"
                          >
                            Xem tòa
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-[#02542D]">Danh sách tầng thiếu công tơ</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-900">
                Đóng
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="text-sm text-gray-600">
                {missingUnits.length === 0
                  ? 'Không có căn hộ thiếu công tơ.'
                  : `Có ${missingUnits.length} căn hộ chưa có công tơ.`}
              </div>
              <div className="max-h-64 overflow-auto border rounded">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Tòa nhà</th>
                      <th className="px-3 py-2 text-left">Căn hộ</th>
                      <th className="px-3 py-2 text-left">Tầng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {missingUnits.map((unit) => (
                      <tr key={unit.unitId} className="border-b last:border-b-0">
                        <td className="px-3 py-2">
                          {unit.buildingCode} <span className="text-xs text-gray-500">{unit.buildingName}</span>
                        </td>
                        <td className="px-3 py-2">{unit.unitCode}</td>
                        <td className="px-3 py-2">{unit.floor ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {creationError && <div className="text-xs text-red-600">{creationError}</div>}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCreateMissing}
                  disabled={creatingMissing || missingUnits.length === 0}
                  className="px-4 py-2 rounded-lg bg-[#02542D] text-white text-sm font-semibold hover:bg-[#014a26] disabled:opacity-50 flex items-center gap-2"
                >
                  {creatingMissing ? 'Đang tạo...' : 'Tạo công tơ tự động'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

