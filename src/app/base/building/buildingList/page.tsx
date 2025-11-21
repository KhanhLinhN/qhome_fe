'use client'
import {useTranslations} from 'next-intl';
import FilterForm from "../../../../components/base-service/FilterForm";
import Table from "../../../../components/base-service/Table";
import { useMemo, useState, useRef } from 'react';
import { useProjectPage } from '@/src/hooks/useProjectPage';
import Pagination from '@/src/components/customer-interaction/Pagination';
import { create } from 'domain';
import { useProjectAdd } from '@/src/hooks/useProjectAdd';
import { useRouter } from 'next/navigation';
import { useBuildingPage } from '@/src/hooks/useBuildingPage';
import { useAuth } from '@/src/contexts/AuthContext';
import PopupConfirm from '@/src/components/common/PopupComfirm';
import { updateBuilding } from '@/src/services/base/buildingService';
import { downloadBuildingImportTemplate, importBuildings, exportBuildings, type BuildingImportResponse } from '@/src/services/base/buildingImportService';
import { getErrorMessage } from '@/src/types/error';


export default function Home() {
  const { user, hasRole } = useAuth();
  const t = useTranslations('Building');
  const headers = [t('buildingCode'), t('buildingName'), t('status'), t('createAt'), t('createBy'), t('action')];

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<BuildingImportResponse | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    data,
    loading,
    error,
    filters,        
    allProjects, 
    pageNo,        
    totalPages,        
    handleFilterChange,
    handleClear,
    handlePageChange
  } = useBuildingPage()

  // Order by createdAt desc (newest first)
  const ordered = (data?.content || []).slice().sort((a: { createdAt?: string }, b: { createdAt?: string }) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });

  const tableData = ordered.map((item: { id: string; code: string; name: string; floorsMax: number; status: string; createdBy?: string; createdAt?: string }) => ({
    buildingId: item.id,      
    buildingCode: item.code,  
    buildingName: item.name,  
    floors: item.floorsMax,  
    status: item.status,
    createBy: item.createdBy,
    createdAt: item.createdAt?.slice(0, 10).replace(/-/g, '/')
  })) || [];

  const router = useRouter();
  const handleAdd = () => {
    router.push(`/base/building/buildingNew`);
  };

  const handleDelete = () => {
    router.push(`/base/building/buildingList`);
  };

  // Change building status with confirmation
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [selectedBuildingStatus, setSelectedBuildingStatus] = useState<string | null>(null);

  const onBuildingStatusChange = (buildingId: string) => {
    const row = tableData.find(r => r.buildingId === buildingId);
    setSelectedBuildingId(buildingId);
    setSelectedBuildingStatus(row?.status ?? null);
    setConfirmOpen(true);
  };

  const handleConfirmChange = async () => {
    if (!selectedBuildingId || !selectedBuildingStatus) {
      setConfirmOpen(false);
      return;
    }
    const newStatus = selectedBuildingStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateBuilding(selectedBuildingId, { status: newStatus });
      setConfirmOpen(false);
      setSelectedBuildingId(null);
      setSelectedBuildingStatus(null);
      window.location.reload();
    } catch (e) {
      // optionally show error
      setConfirmOpen(false);
    }
  };

  const handleCloseConfirm = () => {
    setConfirmOpen(false);
    setSelectedBuildingId(null);
    setSelectedBuildingStatus(null);
  };
 
   
  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadBuildingImportTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'building_import_template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setImportError(getErrorMessage(e, 'Tải template thất bại'));
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportBuildings(false);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `buildings_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setImportError(getErrorMessage(e, 'Xuất Excel thất bại'));
    }
  };

  const handleExportWithUnits = async () => {
    try {
      const blob = await exportBuildings(true);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `buildings_with_units_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setImportError(getErrorMessage(e, 'Xuất Excel thất bại'));
    }
  };

  const handlePickFile = () => {
    setImportError(null);
    setImportResult(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImporting(true);
    setImportError(null);
    setImportResult(null);
    try {
      const res = await importBuildings(f);
      setImportResult(res);
    } catch (e: unknown) {
      setImportError(getErrorMessage(e, 'Import thất bại'));
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  
  // Handle loading and error states
  if (loading) {
    return (
        <div className="px-[41px] py-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-2 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('loading')}</p>
          </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="px-[41px] py-12 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">
              {t('error')}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-2 text-white rounded-md hover:bg-primary-3"
            >
              {t('retry')}
            </button>
          </div>
        </div>
    );
  }

  return (
    <div className="lg:col-span-1 space-y-6 ">
      <div className="max-w-screen overflow-x-hidden ">
          <h1 className="text-2xl font-semibold text-[#02542D] mb-4">{t('requestlist')}</h1>
          <div className="bg-white p-6 rounded-xl w-full min-h-[200px]">
              <FilterForm
                filters={filters}
                page='building'
                onFilterChange={handleFilterChange}
                onAdd={handleAdd}
                onClear={handleClear}
                onDelete={handleDelete}
                projectList={allProjects}
              ></FilterForm>

              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={handleDownloadTemplate}
                  className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 transition"
                >
                  Tải template import tòa nhà
                </button>
                <button
                  onClick={handlePickFile}
                  disabled={importing}
                  className="px-3 py-2 rounded bg-indigo-600 text-white disabled:opacity-50"
                >
                  {importing ? 'Đang import...' : 'Chọn file Excel để import'}
                </button>
                <button
                  onClick={handleExport}
                  className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition"
                >
                  Xuất Excel (Tòa nhà)
                </button>
                <button
                  onClick={handleExportWithUnits}
                  className="px-3 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 transition"
                >
                  Xuất Excel (Tòa + Căn hộ)
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              {importError && (
                <div className="text-red-600 mb-3">{importError}</div>
              )}
              {importResult && (
                <div className="mb-4">
                  <div className="mb-2">
                    Tổng dòng: {importResult.totalRows} | Thành công: {importResult.successCount} | Lỗi: {importResult.errorCount}
                  </div>
                  <div className="max-h-64 overflow-auto border rounded">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border px-2 py-1 text-left">Row</th>
                          <th className="border px-2 py-1 text-left">Success</th>
                          <th className="border px-2 py-1 text-left">Message</th>
                          <th className="border px-2 py-1 text-left">BuildingId</th>
                          <th className="border px-2 py-1 text-left">Code</th>
                          <th className="border px-2 py-1 text-left">Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.rows.map((r, i) => (
                          <tr key={i}>
                            <td className="border px-2 py-1">{r.rowNumber}</td>
                            <td className="border px-2 py-1">{r.success ? '✓' : '✗'}</td>
                            <td className="border px-2 py-1">{r.message}</td>
                            <td className="border px-2 py-1">{r.buildingId}</td>
                            <td className="border px-2 py-1">{r.code}</td>
                            <td className="border px-2 py-1">{r.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <Table 
                  data={tableData} 
                  headers={headers}
                  type='building'
                  onBuildingStatusChange={onBuildingStatusChange}
              ></Table>
              <Pagination
                  currentPage={pageNo + 1} 
                  totalPages={totalPages}
                  onPageChange={(page) => handlePageChange(page - 1)} 
              />
          </div>
      </div>
      <PopupConfirm
        isOpen={confirmOpen}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmChange}
        popupTitle={t('confirmChangeStatusTitle') || 'Xác nhận thay đổi trạng thái'}
        popupContext={selectedBuildingStatus === 'ACTIVE' ? (t('confirmDeactivateBuilding') || 'Bạn có chắc muốn vô hiệu hoá tòa nhà này?') : (t('confirmActivateBuilding') || 'Bạn có chắc muốn kích hoạt tòa nhà này?')}
        isDanger={false}
      />
    </div>
  )

};
