"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import Topbar from '@/src/components/layout/Topbar';
import Sidebar from '@/src/components/layout/Sidebar';
import axios from '@/src/lib/axios';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8081';

interface BuildingDeletionRequest {
  id: string;
  buildingId: string;
  buildingName: string;
  buildingCode: string;
  tenantId: string;
  requestedBy: string;
  requestedAt: string;
  status: string;
  totalUnits: number;
  inactiveUnits: number;
  unitsReady: boolean;
}

interface BuildingTargetsStatus {
  totalUnits: number;
  inactiveUnits: number;
  unitsReady: boolean;
}

export default function TenantOwnerBuildingsPage() {
  const { user } = useAuth();
  const [deletingBuildings, setDeletingBuildings] = useState<BuildingDeletionRequest[]>([]);
  const [buildingStatuses, setBuildingStatuses] = useState<Record<string, BuildingTargetsStatus>>({});
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  useEffect(() => {
    if (user?.tenantId) {
      loadDeletingBuildings();
    }
  }, [user]);

  const loadDeletingBuildings = async () => {
    if (!user?.tenantId) return;

    try {
      setLoading(true);
      const response = await axios.get<BuildingDeletionRequest[]>(
        `${BASE_URL}/api/buildings/my-deleting-buildings?tenantId=${user.tenantId}`,
        { withCredentials: true }
      );
      setDeletingBuildings(response.data);

      // Load status for each building
      const statuses: Record<string, BuildingTargetsStatus> = {};
      await Promise.all(
        response.data.map(async (building) => {
          try {
            const statusResponse = await axios.get<BuildingTargetsStatus>(
              `${BASE_URL}/api/buildings/${building.buildingId}/targets-status`,
              { withCredentials: true }
            );
            statuses[building.buildingId] = statusResponse.data;
          } catch (error) {
            console.error(`Failed to load status for building ${building.buildingId}:`, error);
          }
        })
      );
      setBuildingStatuses(statuses);
    } catch (error) {
      console.error('Failed to load deleting buildings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteDeletion = async (requestId: string, buildingName: string) => {
    if (!confirm(`Bạn có chắc muốn hoàn tất xóa building "${buildingName}"?\n\nBuilding sẽ chuyển sang trạng thái ARCHIVED.`)) {
      return;
    }

    try {
      setCompleting(requestId);
      await axios.post(
        `${BASE_URL}/api/buildings/${requestId}/complete`,
        {},
        { withCredentials: true }
      );
      alert(`✅ Đã hoàn tất xóa building "${buildingName}"!`);
      loadDeletingBuildings(); // Reload
    } catch (error: any) {
      console.error('Failed to complete deletion:', error);
      alert(`❌ Hoàn tất xóa thất bại: ${error?.response?.data?.message || error.message}`);
    } finally {
      setCompleting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0]">
        <Topbar />
        <div className="flex">
          <Sidebar variant="tenant-owner" />
          <main className="flex-1 ml-64 p-6">
            <div className="text-center py-12 text-slate-500">⏳ Đang tải...</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <Topbar />
      <div className="flex">
        <Sidebar variant="tenant-owner" />
        <main className="flex-1 ml-64 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-800 mb-2">
                🏢 Buildings Đang Xóa
              </h1>
              <p className="text-sm text-slate-600">
                Quản lý các building đang trong quá trình xóa. Khi đã xóa hết units, bạn có thể hoàn tất việc xóa building.
              </p>
            </div>

            {/* Buildings List */}
            {deletingBuildings.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center">
                <div className="text-6xl mb-4">✅</div>
                <div className="text-lg font-medium text-slate-800 mb-2">
                  Không có building nào đang xóa
                </div>
                <p className="text-sm text-slate-600">
                  Tất cả buildings của bạn đang hoạt động bình thường
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {deletingBuildings.map((building) => {
                  const status = buildingStatuses[building.buildingId];
                  const unitsRemaining = status?.totalUnits || 0;
                  const unitsDeleted = status?.inactiveUnits || 0;
                  const canComplete = status?.unitsReady || false;
                  const progress = unitsRemaining > 0 
                    ? Math.round((unitsDeleted / unitsRemaining) * 100) 
                    : 100;

                  return (
                    <div key={building.id} className="bg-white rounded-xl p-6 hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-800">
                              {building.buildingName}
                            </h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                              🔄 ĐANG XÓA
                            </span>
                          </div>
                          <div className="text-sm text-slate-600 space-y-1">
                            <div>
                              <span className="font-medium">Mã building:</span> {building.buildingCode}
                            </div>
                            <div>
                              <span className="font-medium">Yêu cầu bởi:</span> {building.requestedBy}
                            </div>
                            <div>
                              <span className="font-medium">Ngày yêu cầu:</span>{' '}
                              {new Date(building.requestedAt).toLocaleDateString('vi-VN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Progress Section */}
                      {status && (
                        <div className="border-t border-slate-200 pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">
                              Tiến trình xóa Units:
                            </span>
                            <span className="text-sm font-bold text-slate-800">
                              {unitsDeleted} / {unitsRemaining} units
                            </span>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="w-full bg-slate-200 rounded-full h-2.5 mb-3">
                            <div 
                              className={`h-2.5 rounded-full transition-all duration-300 ${
                                canComplete ? 'bg-green-600' : 'bg-amber-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>

                          {canComplete ? (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-green-700">
                                <span className="text-2xl">✅</span>
                                <span className="text-sm font-medium">
                                  Đã xóa hết units! Có thể hoàn tất xóa building.
                                </span>
                              </div>
                              <button
                                onClick={() => handleCompleteDeletion(building.id, building.buildingName)}
                                disabled={completing === building.id}
                                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {completing === building.id ? '⏳ Đang xử lý...' : '✅ Hoàn tất xóa'}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-amber-700">
                              <span className="text-xl">⏳</span>
                              <span className="text-sm">
                                Còn {unitsRemaining - unitsDeleted} units cần xóa...
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

