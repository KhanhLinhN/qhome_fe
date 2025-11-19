'use client'
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Arrow from '@/src/assets/Arrow.svg';
import Delete from '@/src/assets/Delete.svg';
import Edit from '@/src/assets/Edit.svg';
import EditTable from '@/src/assets/EditTable.svg';
import DetailField from '@/src/components/base-service/DetailField';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useBuildingDetailPage } from '@/src/hooks/useBuildingDetailPage';
import { useAuth } from '@/src/contexts/AuthContext';
import { getUnitsByBuildingId } from '@/src/services/base/buildingService';
import { Unit } from '@/src/types/unit';
import PopupConfirm from '@/src/components/common/PopupComfirm';
import { useDeleteBuilding } from '@/src/hooks/useBuildingDelete';
import FormulaPopup from '@/src/components/common/FormulaPopup';
import { downloadUnitImportTemplate, importUnits, exportUnits, type UnitImportResponse } from '@/src/services/base/unitImportService';

export default function BuildingDetail () {

    const { user, hasRole } = useAuth();
    const t = useTranslations('Building'); 
    const tUnits = useTranslations('Unit');
    const router = useRouter();
    const params = useParams();
    const buildingId = params.id;
    const { buildingData, loading, error, isSubmitting } = useBuildingDetailPage(buildingId);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [units, setUnits] = useState<Unit[]>([]);
    const [loadingUnits, setLoadingUnits] = useState(false);
    const [unitsError, setUnitsError] = useState<string | null>(null);
    const { deleteBuildingById, isLoading: isDeleting } = useDeleteBuilding();    
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<UnitImportResponse | null>(null);
    const [importError, setImportError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    
    const handleBack = () => {
        router.push(`/base/building/buildingList`);
    }

    const handleDelete = () => {
        setIsPopupOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!buildingId || typeof buildingId !== 'string') {
            setIsPopupOpen(false);
            return;
        }

        const success = await deleteBuildingById(buildingId);

        setIsPopupOpen(false);
        if (success) {
            router.push(`/base/building/buildingList`);
        }
    };

    const handleClosePopup = () => {
        setIsPopupOpen(false);
    };

    const onDownloadUnitTemplate = async () => {
        try {
            const blob = await downloadUnitImportTemplate();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "unit_import_template.xlsx";
            a.click();
            URL.revokeObjectURL(url);
        } catch (e: any) {
            setImportError(e?.response?.data?.message || "Tải template thất bại");
        }
    };

    const onExportUnits = async () => {
        if (!buildingId || typeof buildingId !== 'string') return;
        try {
            const blob = await exportUnits(buildingId);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `units_export_${buildingData?.code || buildingId}_${new Date().toISOString().split('T')[0]}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e: any) {
            setImportError(e?.response?.data?.message || "Xuất Excel thất bại");
        }
    };

    const onPickUnitFile = () => {
        setImportError(null);
        setImportResult(null);
        fileInputRef.current?.click();
    };

    const onUnitFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setImporting(true);
        setImportError(null);
        setImportResult(null);
        try {
            const res = await importUnits(f);
            setImportResult(res);
        } catch (e: any) {
            setImportError(e?.response?.data?.message || "Import thất bại");
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className={`min-h-screen p-4 sm:p-8 font-sans`}>
            <PopupConfirm
                isOpen={isPopupOpen}
                onClose={handleClosePopup}
                onConfirm={handleConfirmDelete}
                popupTitle={t('deleteBuilding')}
                popupContext={t('deleteBuildingConfirm')}
                isDanger={true}
            />
            <div className="max-w-4xl mx-auto mb-6 flex items-center cursor-pointer" onClick={handleBack}>
                <Image 
                    src={Arrow} 
                    alt="Back" 
                    width={20} 
                    height={20}
                    className="w-5 h-5 mr-2" 
                />
                <span className={`text-[#02542D] font-bold text-2xl hover:text-opacity-80 transition duration-150 `}>
                    {t('return')}
                </span>
            </div>

            <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200">
                
                <div className="flex justify-between items-start border-b pb-4 mb-6">
                    <div className="flex items-center">
                        <h1 className={`text-2xl font-semibold text-[#02542D] mr-3`}>
                            {t('buildingDetail')}
                        </h1>
                        <span 
                            className={`text-sm font-semibold px-3 py-1 rounded-full ${buildingData?.status === 'Inactive' ? 'bg-[#EEEEEE] text-[#02542D]' : 'bg-[#739559] text-white'}`}
                        >
                            {buildingData?.status === 'Inactive' ? t('inactive') : t('active')}
                        </span>
                    </div>

                    <div className="flex space-x-2">
                        <button 
                            className={`p-2 rounded-lg bg-[#739559] hover:bg-opacity-80 transition duration-150`}
                            onClick={() => router.push(`/base/building/buildingEdit/${buildingId}`)}
                        >
                            <Image 
                                src={Edit} 
                                alt="Edit" 
                                width={24} 
                                height={24}
                                className="w-6 h-6" 
                            />
                        </button>
                        {/* <button 
                            className="p-2 rounded-lg bg-red-500 hover:bg-opacity-80 transition duration-150"
                            onClick={handleDelete}
                        >
                            <Image 
                                src={Delete} 
                                alt="Delete" 
                                width={24} 
                                height={24}
                                className="w-6 h-6" 
                            />
                        </button> */}
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    
                    <DetailField 
                        label={t('buildingCode')}
                        value={buildingData?.code ?? ""} 
                        readonly={true}
                    />
                    {/* <div className="col-span-1 hidden md:block"></div> */}

                    <DetailField 
                        label={t('buildingName')}
                        value={buildingData?.name ?? ""} 
                        readonly={true}
                    />

                    <DetailField 
                        label={t('address')}
                        value={buildingData?.address ?? ""} 
                        readonly={true}
                    />
                    {/* <DetailField 
                        label={t('floors')}
                        value={buildingData?.floorsMax.toString() ?? ""} 
                        readonly={true}
                    /> */}

                    {/* <DetailField 
                        label={t('createAt')}
                        value={buildingData?.createdAt ?? ""} 
                        readonly={true}
                    />
                    
                    <DetailField 
                        label={t('createBy')} 
                        value={buildingData?.createdBy ?? ""} 
                        readonly={true}
                    /> */}
                    
                </div>
            </div>

            {/* Units List Section */}
            <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200 mt-6">
                <div className="border-b pb-4 mb-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-[#02542D]">
                            {tUnits('unitList')}
                        </h2>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onDownloadUnitTemplate}
                                className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 transition text-sm"
                            >
                                Tải template import căn hộ
                            </button>
                            <button
                                onClick={onPickUnitFile}
                                disabled={importing}
                                className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-sm disabled:opacity-50"
                            >
                                {importing ? 'Đang import...' : 'Chọn file Excel'}
                            </button>
                            <button
                                onClick={onExportUnits}
                                className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition text-sm"
                            >
                                Xuất Excel
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx"
                                className="hidden"
                                onChange={onUnitFileChange}
                            />
                            <button
                                onClick={() => router.push(`/base/unit/unitNew?buildingId=${buildingId}`)}
                                className="px-4 py-2 bg-[#14AE5C] text-white text-sm rounded-lg hover:bg-[#0c793f] transition flex items-center gap-2 shadow-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                {tUnits('addUnit')}
                            </button>
                        </div>
                    </div>
                </div>

                {buildingData?.code ? (
                    <div className="text-sm text-gray-600 mb-4">
                        Vui lòng điền cột <b>buildingCode</b> = <span className="font-mono">{buildingData?.code}</span> trong file Excel.
                    </div>
                ) : null}

                {importError && <div className="text-red-600 mb-3">{importError}</div>}
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
                                        <th className="border px-2 py-1 text-left">UnitId</th>
                                        <th className="border px-2 py-1 text-left">Code</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {importResult.rows.map((r, i) => (
                                        <tr key={i}>
                                            <td className="border px-2 py-1">{r.rowNumber}</td>
                                            <td className="border px-2 py-1">{r.success ? '✓' : '✗'}</td>
                                            <td className="border px-2 py-1">{r.message}</td>
                                            <td className="border px-2 py-1">{r.unitId}</td>
                                            <td className="border px-2 py-1">{r.code}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {loadingUnits ? (
                    <div className="text-center py-8 text-gray-500">{t('loading')}</div>
                ) : unitsError ? (
                    <div className="text-center py-8 text-red-500">{unitsError}</div>
                ) : units.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">{tUnits('noUnit')}</div>
                ) : (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">{tUnits('unitCode')}</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-600">{tUnits('floor')}</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-600">{tUnits('areaM2')}</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-600">{tUnits('status')}</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">{tUnits('ownerName')}</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-600">{tUnits('action')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {units.map((unit) => (
                                    <tr key={unit.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <span className="font-medium text-[#739559]">{unit.code}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">{unit.floor}</td>
                                        <td className="px-4 py-3 text-center">{unit.areaM2 || '-'}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                unit.status === 'ACTIVE' || unit.status === 'Active'
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {unit.status ? tUnits(unit.status.toLowerCase() ?? '') : ''}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>
                                                <div className="font-medium text-gray-900">{unit.ownerName ? unit.ownerName : '-'}</div>
                                                {unit.ownerContact && (
                                                    <div className="text-xs text-gray-500">{unit.ownerContact ? unit.ownerContact : '-'}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex justify-center">
                                                <Link href={`/base/unit/unitDetail/${unit.id}`}>
                                                    <button 
                                                        className="hover:bg-opacity-80 transition duration-150"
                                                    >
                                                        <Image 
                                                            src={EditTable} 
                                                            alt="View Detail" 
                                                            width={24} 
                                                            height={24}
                                                        />
                                                    </button>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
