'use client'
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { fetchCurrentHouseholdByUnit, fetchHouseholdMembersByHousehold, type HouseholdDto, type HouseholdMemberDto } from '@/src/services/base/householdService';
import { fetchResidentById } from '@/src/services/base/residentService';
import {
  ServiceDto,
  createMeter,
  getAllServices,
  downloadMeterImportTemplate,
  importMeters,
  exportMeters,
  type MeterImportResponse,
} from '@/src/services/base/waterService';
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
    const [householdsMap, setHouseholdsMap] = useState<Record<string, HouseholdDto | null>>({});
    const [primaryResidentNamesMap, setPrimaryResidentNamesMap] = useState<Record<string, string | null>>({});
    const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
    const { deleteBuildingById, isLoading: isDeleting } = useDeleteBuilding();    
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<UnitImportResponse | null>(null);
    const [importError, setImportError] = useState<string | null>(null);
    const [services, setServices] = useState<ServiceDto[]>([]);
    const [meterFormVisible, setMeterFormVisible] = useState(false);
    const [meterForm, setMeterForm] = useState({
        unitId: '',
        serviceId: '',
        installedAt: '',
    });
    const [meterStatus, setMeterStatus] = useState<string | null>(null);
    const [creatingMeter, setCreatingMeter] = useState(false);
    const [meterImporting, setMeterImporting] = useState(false);
    const [meterImportResult, setMeterImportResult] = useState<MeterImportResponse | null>(null);
    const [meterImportError, setMeterImportError] = useState<string | null>(null);
    const meterFileInputRef = useRef<HTMLInputElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const meterDateInputRef = useRef<HTMLInputElement | null>(null);
    
    useEffect(() => {
        console.log('buildingData', buildingData);
        const loadUnits = async () => {
            if (!buildingId || typeof buildingId !== 'string') return;
            
            try {
                setLoadingUnits(true);
                setUnitsError(null);
                const data = await getUnitsByBuildingId(buildingId);
                const activeUnits = data.filter(unit => unit.status?.toUpperCase() !== 'INACTIVE');
                setUnits(activeUnits);
                
                // Load current household for each unit
                const householdsData: Record<string, HouseholdDto | null> = {};
                const residentNamesData: Record<string, string | null> = {};
                
                await Promise.all(
                    activeUnits.map(async (unit) => {
                        try {
                            const household = await fetchCurrentHouseholdByUnit(unit.id);
                            householdsData[unit.id] = household;
                            
                            // Get primary resident name from resident table only
                            let primaryName: string | null = null;
                            console.log('household', household);
                            if (household?.primaryResidentId) {
                                try {
                                    const resident = await fetchResidentById(household.primaryResidentId);
                                    console.log('resident', resident);
                                    if (resident?.fullName) {
                                        primaryName = resident.fullName;
                                    }
                                } catch (residentErr) {
                                    console.error(`Failed to load resident ${household.primaryResidentId} for unit ${unit.id}:`, residentErr);
                                }
                            }
                            
                            residentNamesData[unit.id] = primaryName;
                        } catch (err) {
                            // If no current household found (404), set to null
                            if (err && typeof err === 'object' && 'response' in err && (err as any).response?.status === 404) {
                                householdsData[unit.id] = null;
                                residentNamesData[unit.id] = null;
                            } else {
                                console.error(`Failed to load household for unit ${unit.id}:`, err);
                                householdsData[unit.id] = null;
                                residentNamesData[unit.id] = null;
                            }
                        }
                    })
                );
                setHouseholdsMap(householdsData);
                setPrimaryResidentNamesMap(residentNamesData);
            } catch (err: any) {
                console.error('Failed to load units:', err);
                setUnitsError(err?.message || t('messages.failedToLoadUnits'));
            } finally {
                setLoadingUnits(false);
            }
        };

        const loadServices = async () => {
            try {
                const data = await getAllServices();
                setServices(data.filter(service => service.active));
            } catch (err) {
                console.error('Failed to load services:', err);
            }
        };

        loadUnits();
        loadServices();
    }, [buildingId]);

    const floorOptions = useMemo(() => {
        const uniqueFloors = Array.from(new Set(units.map(unit => unit.floor?.toString()).filter(Boolean)));
        return uniqueFloors.sort((a, b) => {
            const na = Number(a);
            const nb = Number(b);
            if (Number.isNaN(na) || Number.isNaN(nb)) {
                return a.localeCompare(b);
            }
            return na - nb;
        });
    }, [units]);

    const maxFloorFromUnits = useMemo(() => {
        const floors = units.map(unit => unit.floor).filter(floor => floor != null && !Number.isNaN(floor)) as number[];
        return floors.length > 0 ? Math.max(...floors) : null;
    }, [units]);

    const displayFloorsMax = useMemo(() => {
        // Use buildingData.floorsMax if available, otherwise calculate from units
        if (buildingData?.floorsMax != null && buildingData.floorsMax !== undefined) {
            return buildingData.floorsMax.toString();
        }
        if (maxFloorFromUnits != null) {
            return maxFloorFromUnits.toString();
        }
        return "";
    }, [buildingData?.floorsMax, maxFloorFromUnits]);

    const filteredUnits = selectedFloor
        ? units.filter(unit => unit.floor?.toString() === selectedFloor)
        : units;

    // Helper function to get primary resident name from current household
    const getPrimaryResidentName = (unitId: string): string | null => {
        return primaryResidentNamesMap[unitId] || null;
    };

    useEffect(() => {
        if (selectedFloor && !floorOptions.includes(selectedFloor)) {
            setSelectedFloor(null);
        }
    }, [floorOptions, selectedFloor]);
    
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
            setImportError(e?.response?.data?.message || t('messages.failedToDownloadTemplate'));
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
            setImportError(e?.response?.data?.message || t('messages.failedToExportExcel'));
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
            setImportError(e?.response?.data?.message || t('messages.importFailed'));
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const onDownloadMeterTemplate = async () => {
        try {
            const blob = await downloadMeterImportTemplate();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `meter_import_template.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e: any) {
            setMeterImportError(e?.response?.data?.message || t('messages.failedToDownloadMeterTemplate'));
        }
    };

    const onPickMeterFile = () => {
        setMeterImportError(null);
        setMeterImportResult(null);
        meterFileInputRef.current?.click();
    };

    const onMeterFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setMeterImporting(true);
        setMeterImportError(null);
        setMeterImportResult(null);
        try {
            const result = await importMeters(file);
            setMeterImportResult(result);
        } catch (err: any) {
            setMeterImportError(err?.response?.data?.message || t('messages.meterImportFailed'));
        } finally {
            setMeterImporting(false);
            if (meterFileInputRef.current) meterFileInputRef.current.value = '';
        }
    };

    const openMeterDatePicker = () => {
        const input = meterDateInputRef.current;
        if (!input) return;
        input.showPicker?.();
        input.focus();
    };

    const onExportMeters = async () => {
        if (!buildingId || typeof buildingId !== 'string') return;
        try {
            const blob = await exportMeters(buildingId);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `meters_export_${buildingData?.code || buildingId}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            setMeterImportError(err?.response?.data?.message || t('messages.failedToExportMeterExcel'));
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
                    <DetailField 
                        label="Số tầng"
                        value={displayFloorsMax} 
                        readonly={true}
                    />

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
                                {t('downloadUnitTemplate')}
                            </button>
                            <button
                                onClick={onPickUnitFile}
                                disabled={importing}
                                className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-sm disabled:opacity-50"
                            >
                                {importing ? t('importing') : t('selectExcelFile')}
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
                            <button
                                onClick={() => {
                                    setMeterStatus(null);
                                    setMeterFormVisible(prev => !prev);
                                }}
                                className="px-4 py-2 bg-[#1f8b4e] text-white rounded-lg hover:bg-[#166333] transition text-sm flex items-center gap-2 shadow-sm"
                            >
                                <span className="text-sm font-semibold">{t('addMeter')}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {meterFormVisible && (
                    <div className="border-b pb-4 mb-6 relative z-10">
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                setMeterStatus(null);
                                if (!meterForm.unitId || !meterForm.serviceId) {
                                    setMeterStatus(t('messages.pleaseSelectUnitAndService'));
                                    return;
                                }
                                setCreatingMeter(true);
                                try {
                                    await createMeter({
                                        unitId: meterForm.unitId,
                                        serviceId: meterForm.serviceId,
                                        installedAt: meterForm.installedAt || undefined,
                                    });
                                    setMeterStatus(t('messages.meterAddedSuccess'));
                                    setMeterForm({
                                        unitId: meterForm.unitId,
                                        serviceId: meterForm.serviceId,
                                        installedAt: '',
                                    });
                                } catch (err: any) {
                                    console.error('Failed to create meter:', err);
                                    setMeterStatus(err?.response?.data?.message || t('messages.failedToCreateMeter'));
                                } finally {
                                    setCreatingMeter(false);
                                }
                            }}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                <label className="text-sm text-gray-600">
                                    {t('unit')}
                                    <select
                                        value={meterForm.unitId}
                                        onChange={(e) => setMeterForm(prev => ({ ...prev, unitId: e.target.value }))}
                                        disabled={loadingUnits || units.length === 0}
                                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#739559] focus:border-[#739559] relative z-20"
                                    >
                                        <option value="">
                                            {loadingUnits ? t('loading') : units.length === 0 ? tUnits('noUnit') : t('selectUnit')}
                                        </option>
                                        {units.map(unit => (
                                            <option key={unit.id} value={unit.id}>
                                                {unit.code}{unit.floor != null ? ` (Tầng ${unit.floor})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {loadingUnits && (
                                        <div className="text-xs text-gray-500 mt-1">Đang tải danh sách căn hộ...</div>
                                    )}
                                    {!loadingUnits && units.length === 0 && (
                                        <div className="text-xs text-orange-600 mt-1">Không có căn hộ nào trong tòa nhà này</div>
                                    )}
                                </label>
                                <label className="text-sm text-gray-600">
                                    {t('service')}
                                    <select
                                        value={meterForm.serviceId}
                                        onChange={(e) => setMeterForm(prev => ({ ...prev, serviceId: e.target.value }))}
                                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    >
                                        <option value="">{t('selectService')}</option>
                                        {services.map(service => (
                                            <option key={service.id} value={service.id}>
                                                {service.name} ({service.code})
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <div className="text-sm text-gray-600">
                                    <span className="block mb-1">{t('installedDate')}</span>
                                    <div className="relative">
                                        <input
                                            ref={meterDateInputRef}
                                            type="date"
                                            value={meterForm.installedAt}
                                            onChange={(e) => setMeterForm(prev => ({ ...prev, installedAt: e.target.value }))}
                                            className="absolute inset-0 opacity-0 pointer-events-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={openMeterDatePicker}
                                            className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-left bg-white"
                                        >
                                            {meterForm.installedAt || 'mm/dd/yyyy'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                                <div className="flex flex-wrap gap-3 mb-3">
                                    <button
                                        type="button"
                                        onClick={onDownloadMeterTemplate}
                                        className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 transition text-sm"
                                    >
                                        {t('downloadMeterTemplate')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onPickMeterFile}
                                        disabled={meterImporting}
                                        className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-sm disabled:opacity-50"
                                    >
                                        {meterImporting ? t('importing') : t('selectMeterExcelFile')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onExportMeters}
                                        className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition text-sm"
                                    >
                                        {t('exportMeterExcel')}
                                    </button>
                                    <input
                                        ref={meterFileInputRef}
                                        type="file"
                                        accept=".xlsx"
                                        className="hidden"
                                        onChange={onMeterFileChange}
                                    />
                                </div>
                                {meterImportResult && (
                                    <div className="bg-green-50 border border-green-100 text-sm text-green-800 rounded-lg p-3 mb-3">
                                        <div>
                                            {t('processedRows', { totalRows: meterImportResult.totalRows })} 
                                            <strong className="ml-1">{meterImportResult.successCount} {t('success')}</strong>, 
                                            <strong className="ml-1">{meterImportResult.errorCount} {t('errors')}</strong>
                                        </div>
                                        {meterImportResult.rows.length > 0 && (
                                            <div className="mt-2 text-xs text-gray-700">
                                                {meterImportResult.rows
                                                    .filter(r => !r.success)
                                                    .map(r => (
                                                        <div key={r.rowNumber}>
                                                            {t('rowNumber', { rowNumber: r.rowNumber })}: {r.message}
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {meterImportError && (
                                    <div className="text-sm text-red-600 mb-3">{meterImportError}</div>
                                )}
                            {meterStatus && (
                                <div className="text-sm text-green-600 mb-3">{meterStatus}</div>
                            )}
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={creatingMeter}
                                    className="px-4 py-2 bg-[#02542D] text-white rounded-lg text-sm hover:bg-[#024428] transition"
                                >
                                    {creatingMeter ? t('creating') : t('saveMeter')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMeterFormVisible(false)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition"
                                >
                                    {t('cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {buildingData?.code && (
                    <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-900 rounded-lg p-4 text-sm space-y-1">
                        <div className="font-semibold text-base text-yellow-900">{t('meterImportGuide')}</div>
                        <div>
                            {t.rich('meterImportGuideDesc1', { 
                                buildingCode: buildingData?.code,
                                bold: (chunks) => <b>{chunks}</b>,
                                mono: (chunks) => <span className="font-mono">{chunks}</span>
                            })}
                        </div>
                        <div>
                            {t.rich('meterImportGuideDesc2', {
                                bold: (chunks) => <b>{chunks}</b>
                            })}
                        </div>
                        <div>
                            {t.rich('meterImportGuideDesc3', {
                                bold: (chunks) => <b>{chunks}</b>
                            })}
                        </div>
                    </div>
                )}

                {importError && <div className="text-red-600 mb-3">{importError}</div>}
                {importResult && (
                    <div className="mb-4">
                        <div className="mb-2">
                            {t('totalRows', { totalRows: importResult.totalRows, successCount: importResult.successCount, errorCount: importResult.errorCount })}
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
                        {floorOptions.length > 0 && (
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-4 py-3 border-b border-gray-200">
                                <div className="text-sm text-gray-600">
                                    Hiện {filteredUnits.length} trên tổng {units.length} căn hộ
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <label htmlFor="floorFilter" className="font-medium text-gray-700">
                                        Chọn tầng
                                    </label>
                                    <select
                                        id="floorFilter"
                                        value={selectedFloor ?? ''}
                                        onChange={(e) => setSelectedFloor(e.target.value || null)}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                                    >
                                        <option value="">Tất cả tầng</option>
                                        {floorOptions.map(floor => (
                                            <option key={floor} value={floor}>
                                                {floor}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
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
                                {filteredUnits.map((unit) => (
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
                                                <div className="font-medium text-gray-900">
                                                    {getPrimaryResidentName(unit.id) || '-'}
                                                </div>
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
