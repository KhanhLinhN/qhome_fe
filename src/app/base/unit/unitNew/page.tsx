'use client'
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Arrow from '@/src/assets/Arrow.svg';
import DetailField from '@/src/components/base-service/DetailField';
import Select from '@/src/components/customer-interaction/Select';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/src/contexts/AuthContext';
import { Unit } from '@/src/types/unit';
import { useUnitAdd } from '@/src/hooks/useUnitAdd';
import { getBuilding } from '@/src/services/base/buildingService';

export default function UnitAdd () {

    const { user, hasRole } = useAuth();
    const t = useTranslations('Unit');
    const tProject = useTranslations('Project');
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isSubmit, setIsSubmit] = useState(false);
    
    // Get buildingId from URL params
    const buildingId = searchParams.get('buildingId') || '';
    const tenantId = user?.tenantId || '';
    const [buildingCode, setBuildingCode] = useState<string>('');

    const { addUnit, loading, error, isSubmitting } = useUnitAdd();

    const [formData, setFormData] = useState<Partial<Unit> & { 
        floorStr: string; 
        areaStr: string; 
        bedroomsStr: string;
        status: string 
    }>({
        code: '',
        name: '',
        floor: 0,
        area: 0,
        bedrooms: 0,
        floorStr: '0',
        areaStr: '0',
        bedroomsStr: '0',
        status: 'INACTIVE',
        ownerName: '',
        ownerContact: '',
    });

    // Fetch building code
    useEffect(() => {
        const fetchBuildingCode = async () => {
            if (!buildingId) return;
            try {
                const building = await getBuilding(buildingId);
                setBuildingCode(building.code);
            } catch (err) {
                console.error('Failed to fetch building:', err);
            }
        };
        fetchBuildingCode();
    }, [buildingId]);
    
    const handleBack = () => {
        router.back(); 
    }

    const handleCancel = () => {
        router.back(); 
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!buildingId || !tenantId) {
            alert('Missing buildingId or tenantId');
            return;
        }

        setIsSubmit(true);
        try {
            const { floorStr, areaStr, bedroomsStr, ...unitData } = formData;
            const completeData = {
                ...unitData,
                buildingId,
                tenantId
            };
            console.log('Dữ liệu gửi đi:', completeData);
            await addUnit(completeData);
            router.push(`/base/building/buildingDetail/${buildingId}`);
        } catch (error) {
            console.error('Lỗi khi tạo unit:', error);
            alert('Có lỗi xảy ra!');
        } finally {
            setIsSubmit(false);
        }
    };

    // Generate unit code from building code + floor + bedrooms
    const generateUnitCode = (floor: number, bedrooms: number): string => {
        if (!buildingCode) return '';
        return `${buildingCode}${floor}${bedrooms}`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'floor') {
            const floorNum = parseInt(value) || 0;
            const newCode = generateUnitCode(floorNum, formData.bedrooms || 0);
            setFormData(prev => ({
                ...prev,
                floorStr: value,
                floor: floorNum,
                code: newCode,
            }));
        } else if (name === 'bedrooms') {
            const bedroomsNum = parseInt(value) || 0;
            const newCode = generateUnitCode(formData.floor || 0, bedroomsNum);
            setFormData(prev => ({
                ...prev,
                bedroomsStr: value,
                bedrooms: bedroomsNum,
                code: newCode,
            }));
        } else if (name === 'area') {
            setFormData(prev => ({
                ...prev,
                areaStr: value,
                area: parseFloat(value) || 0,
            }));
        } else {
            setFormData(prev => ({
                ...prev,
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

    return (
        <div className={`min-h-screen bg-[#F5F7FA] p-4 sm:p-8 font-sans`}>
            <div
                className="max-w-4xl mx-auto mb-6 flex items-center cursor-pointer"
                onClick={handleBack}
            >
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
                            Thêm Căn hộ
                        </h1>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    
                    <DetailField 
                        label="Mã căn hộ"
                        value={formData.code || ""}
                        name="code"
                        placeholder="Mã căn hộ"
                        readonly={true}
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
                        value={formData.name ?? ""}
                        onChange={handleChange}
                        name="name"
                        placeholder="Tên căn hộ"
                        readonly={false}
                    />

                    <DetailField 
                        label="Tầng"
                        value={formData.floorStr ?? "0"}
                        onChange={handleChange}
                        name="floor"
                        placeholder="Tầng"
                        readonly={false}
                    />

                    <DetailField 
                        label="Số phòng ngủ"
                        value={formData.bedroomsStr ?? "0"}
                        onChange={handleChange}
                        name="bedrooms"
                        placeholder="Số phòng ngủ"
                        readonly={false}
                    />

                    <DetailField 
                        label="Diện tích (m²)"
                        value={formData.areaStr ?? "0"}
                        onChange={handleChange}
                        name="area"
                        placeholder="Diện tích"
                        readonly={false}
                    />

                    <DetailField 
                        label="Chủ sở hữu"
                        value={formData.ownerName ?? ""}
                        onChange={handleChange}
                        name="ownerName"
                        placeholder="Chủ sở hữu"
                        readonly={false}
                    />

                    <div className="col-span-full flex justify-center space-x-3 mt-8">
                        <button 
                            type="button"
                            onClick={handleCancel}
                            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                            disabled={isSubmitting}
                        >
                            {t('cancel')}
                        </button>
                        <button 
                            type="submit"
                            className="px-6 py-2 bg-[#14AE5C] text-white font-semibold rounded-lg hover:bg-[#0c793f] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? t('saving') : t('save')}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

