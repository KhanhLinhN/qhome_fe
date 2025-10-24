'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Arrow from '@/src/assets/Arrow.svg';
import DetailField from '@/src/components/base-service/DetailField';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Select from '@/src/components/customer-interaction/Select';
import { useUnitDetailPage } from '@/src/hooks/useUnitDetailPage';
import { Unit } from '@/src/types/unit';
import { useAuth } from '@/src/contexts/AuthContext';
import { getBuilding } from '@/src/services/base/buildingService';

export default function UnitEdit() {
    const { user, hasRole } = useAuth();
    const t = useTranslations('Building');
    const tProject = useTranslations('Project');
    const router = useRouter();
    const params = useParams();
    const unitId = params.id as string;

    const { unitData, loading, error, isSubmitting, editUnit } = useUnitDetailPage(unitId);

    const [formData, setFormData] = useState<Partial<Unit> & { 
        floorStr: string; 
        areaStr: string; 
        bedroomsStr: string;
        status: string 
    }>({
        name: '',
        floor: 0,
        area: 0,
        bedrooms: 0,
        ownerName: '',
        ownerContact: '',
        floorStr: '0',
        areaStr: '0',
        bedroomsStr: '0',
        status: 'INACTIVE',
    });

    const [buildingName, setBuildingName] = useState<string>('');
    const [buildingCode, setBuildingCode] = useState<string>('');
    const [loadingBuilding, setLoadingBuilding] = useState(false);

    useEffect(() => {
        if (unitData) {
            setFormData({
                name: unitData.name ?? '',
                floor: unitData.floor ?? 0,
                area: unitData.area ?? 0,
                bedrooms: unitData.bedrooms ?? 0,
                ownerName: unitData.ownerName ?? '',
                ownerContact: unitData.ownerContact ?? '',
                floorStr: unitData.floor?.toString() ?? '0',
                areaStr: unitData.area?.toString() ?? '0',
                bedroomsStr: unitData.bedrooms?.toString() ?? '0',
                status: unitData.status ?? 'INACTIVE',
            });
        }
    }, [unitData]);

    useEffect(() => {
        const loadBuildingInfo = async () => {
            if (!unitData?.buildingId) return;
            
            try {
                setLoadingBuilding(true);
                const building = await getBuilding(unitData.buildingId);
                setBuildingName(building.name);
                setBuildingCode(building.code);
            } catch (err: any) {
                console.error('Failed to load building:', err);
                setBuildingName('N/A');
            } finally {
                setLoadingBuilding(false);
            }
        };

        loadBuildingInfo();
    }, [unitData?.buildingId]);

    const handleBack = () => {
        router.back();
    };

    // Generate unit code from building code + floor + bedrooms
    const generateUnitCode = (floor: number, bedrooms: number): string => {
        if (!buildingCode) return unitData?.code || '';
        return `${buildingCode}${floor}${bedrooms}`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'floor') {
            const floorNum = parseInt(value) || 0;
            setFormData(prev => ({
                ...prev,
                floorStr: value,
                floor: floorNum,
            }));
        } else if (name === 'bedrooms') {
            const bedroomsNum = parseInt(value) || 0;
            setFormData(prev => ({
                ...prev,
                bedroomsStr: value,
                bedrooms: bedroomsNum,
            }));
        } else if (name === 'area') {
            setFormData(prev => ({
                ...prev,
                areaStr: value,
                area: parseFloat(value) || 0,
            }));
        } else {
            setFormData(prevData => ({
                ...prevData,
                [name]: value,
            }));
        }
    };

    const handleStatusChange = (item: { name: string; value: string }) => {
        setFormData((prevData) => ({
            ...prevData,
            status: item.value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isSubmitting) return;

        try {
            const { floorStr, areaStr, bedroomsStr, ...unitUpdateData } = formData;
            // Generate new code based on floor and bedrooms
            const newCode = generateUnitCode(formData.floor || 0, formData.bedrooms || 0);
            const dataToSubmit = {
                ...unitUpdateData,
                code: newCode,
            };
            console.log('Đang gửi dữ liệu:', dataToSubmit);
            await editUnit(unitId, dataToSubmit);
            router.push(`/base/unit/unitDetail/${unitId}`);
        } catch (submitError) {
            console.error('Lỗi khi cập nhật:', submitError);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">{t('loading')}</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen text-red-500">{t('error')}: {error.message}</div>;
    }

    if (!unitData) {
        return <div className="flex justify-center text-xl font-bold items-center h-screen">{t('noData')}</div>;
    }

    return (
        <div className={`min-h-screen bg-[#F5F7FA] p-4 sm:p-8 font-sans`}>
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

            <form
                className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200"
                onSubmit={handleSubmit}
            >
                <div className="flex justify-between items-start border-b pb-4 mb-6">
                    <div className="flex items-center">
                        <h1 className={`text-2xl font-semibold text-[#02542D] mr-3`}>
                            Chỉnh sửa Căn hộ
                        </h1>
                        <span
                            className={`text-sm font-semibold px-3 py-1 rounded-full ${
                                formData.status === 'INACTIVE'
                                    ? 'bg-[#EEEEEE] text-[#02542D]'
                                    : 'bg-[#739559] text-white'
                            }`}
                        >
                            {formData.status === 'INACTIVE' ? t('inactive') : t('active')}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    <DetailField
                        label="Mã căn hộ"
                        value={generateUnitCode(formData.floor || 0, formData.bedrooms || 0) || unitData?.code || ""}
                        readonly={true}
                        placeholder="Mã căn hộ"
                    />

                    <div className={`flex flex-col mb-4 col-span-1`}>
                        <label className="text-md font-bold text-[#02542D] mb-1">
                            {tProject('status')}
                        </label>
                        <Select
                            options={[
                                { name: tProject('inactive'), value: 'INACTIVE' },
                                { name: tProject('active'), value: 'ACTIVE' },
                            ]}
                            value={formData.status}
                            onSelect={handleStatusChange}
                            renderItem={(item) => item.name}
                            getValue={(item) => item.value}
                            placeholder={tProject('status')}
                        />
                    </div>

                    <DetailField
                        label="Tên căn hộ"
                        value={formData?.name || ""}
                        readonly={false}
                        placeholder="Tên căn hộ"
                        name="name"
                        onChange={handleChange}
                    />
                    
                    <DetailField
                        label="Tòa nhà"
                        value={loadingBuilding ? 'Loading...' : buildingName || ""}
                        readonly={true}
                        placeholder="Tòa nhà"
                    />

                    <DetailField
                        label="Tầng"
                        value={formData.floorStr || "0"}
                        readonly={false}
                        placeholder="Tầng"
                        name="floor"
                        onChange={handleChange}
                    />

                    <DetailField
                        label="Số phòng ngủ"
                        value={formData.bedroomsStr || "0"}
                        readonly={false}
                        placeholder="Số phòng ngủ"
                        name="bedrooms"
                        onChange={handleChange}
                    />

                    <DetailField
                        label="Diện tích (m²)"
                        value={formData.areaStr || "0"}
                        readonly={false}
                        placeholder="Diện tích"
                        name="area"
                        onChange={handleChange}
                    />

                    <DetailField
                        label="Chủ sở hữu"
                        value={formData?.ownerName || ""}
                        readonly={false}
                        placeholder="Chủ sở hữu"
                        name="ownerName"
                        onChange={handleChange}
                    />

                    <DetailField
                        label="Liên hệ"
                        value={formData?.ownerContact || ""}
                        readonly={false}
                        placeholder="Liên hệ"
                        name="ownerContact"
                        onChange={handleChange}
                    />
                </div>

                <div className="flex justify-center mt-8 space-x-4">
                    <button
                        type="button"
                        className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
                        onClick={handleBack}
                        disabled={isSubmitting}
                    >
                        {t('cancel')}
                    </button>
                    <button
                        type="submit"
                        className={`px-6 py-2 rounded-lg bg-[#14AE5C] text-white font-semibold hover:bg-[#0c793f] transition shadow-sm ${
                            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? t('saving') : t('save')}
                    </button>
                </div>
            </form>
        </div>
    );
}

