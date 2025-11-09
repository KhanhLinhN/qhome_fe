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
import { checkUnitCodeExists } from '@/src/services/base/unitService';
import { useNotifications } from '@/src/hooks/useNotifications';

export default function UnitAdd () {

    const { user, hasRole } = useAuth();
    const t = useTranslations('Unit');
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isSubmit, setIsSubmit] = useState(false);
    const { show } = useNotifications();

    // Get buildingId from URL params
    const buildingId = searchParams.get('buildingId') || '';
    const [buildingCode, setBuildingCode] = useState<string>('');
    const [codeError, setCodeError] = useState<string>('');
    const [errors, setErrors] = useState<{
        name?: string;
        floor?: string;
        bedrooms?: string;
        area?: string;
    }>({});

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
        areaM2: 0,
        bedrooms: 0,
        floorStr: '0',
        areaStr: '0',
        bedroomsStr: '0',
        status: 'ACTIVE',
        ownerName: '',
        ownerContact: '',
    });

    // Fetch building code
    useEffect(() => {
        const fetchBuildingCode = async () => {
            if (!buildingId) return;
            try {
                const building = await getBuilding(buildingId);
                console.log("building", building);
                setBuildingCode(building.code);
            } catch (err) {
                console.error('Failed to fetch building:', err);
            }
        };
        fetchBuildingCode();
    }, [buildingId]);

    // Check code khi code hoặc buildingId thay đổi
    useEffect(() => {
        const checkCode = async () => {
            if (!formData.code || !buildingId) {
                setCodeError('');
                return;
            }
            
            const exists = await checkUnitCodeExists(formData.code, buildingId);
            if (exists) {
                setCodeError(t('codeError'));
            } else {
                setCodeError('');
            }
        };

        const timeoutId = setTimeout(checkCode, 500); // Debounce 500ms
        return () => clearTimeout(timeoutId);
    }, [formData.code, buildingId]);
    
    const handleBack = () => {
        router.back(); 
    }

    const handleCancel = () => {
        router.back(); 
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const building = await getBuilding(buildingId);
        if (isSubmitting) return;

        // Validate all fields at once
        const isValid = validateAllFields();

        if (!buildingId) {
            show(t('missingBuildingId'), 'error');
            return;
        }

        if (codeError) {
            show(codeError, 'error');
            return;
        }

        if (!isValid) {
            show(t('error'), 'error');
            return;
        }

        setIsSubmit(true);
        try {
            const { floorStr, areaStr, bedroomsStr, ...unitData } = formData;
            const completeData = {
                ...unitData,
                buildingId,
            };
            console.log('Dữ liệu gửi đi:', completeData);
            await addUnit(completeData);
            router.push(`/base/building/buildingDetail/${buildingId}`);
        } catch (error) {
            console.error('Lỗi khi tạo unit:', error);
            show(t('errorUnit'), 'error');
        } finally {
            setIsSubmit(false);
        }
    };

    // Generate unit code from building code + floor + bedrooms
    const generateUnitCode = (floor: number, bedrooms: number): string => {
        if (!buildingCode) return '';
        return `${buildingCode}${floor}${bedrooms}`;
    };

    const validateField = (fieldName: string, value: string | number) => {
        const newErrors = { ...errors };
        
        switch (fieldName) {
            case 'name':
                if (!value || String(value).trim() === '') {
                    newErrors.name = t('nameError');
                } else {
                    delete newErrors.name;
                }
                break;
            case 'floor':
                const floor = typeof value === 'number' ? value : parseInt(String(value));
                if (!floor || floor < 0) {
                    newErrors.floor = t('floorError');
                } else {
                    delete newErrors.floor;
                }
                break;
            case 'bedrooms':
                const bedrooms = typeof value === 'number' ? value : parseInt(String(value));
                if (bedrooms <= 0) {
                    newErrors.bedrooms = t('bedroomsError');
                } else {
                    delete newErrors.bedrooms;
                }
                break;
            case 'area':
                const area = typeof value === 'number' ? value : parseFloat(String(value));
                if (area <= 0) {
                    newErrors.area = t('areaError');
                } else {
                    delete newErrors.area;
                }
                break;
        }
        
        setErrors(newErrors);
    };

    const validateAllFields = () => {
        const newErrors: {
            name?: string;
            floor?: string;
            bedrooms?: string;
            area?: string;
        } = {};
        
        // Validate name
        if (!formData.name || formData.name.trim() === '') {
            newErrors.name = t('nameError');
        }
        
        // Validate floor
        if (formData.floor === undefined || formData.floor < 0) {
            newErrors.floor = t('floorError');
        }
        
        // Validate bedrooms
        if (formData.bedrooms === undefined || formData.bedrooms <= 0) {
            newErrors.bedrooms = t('bedroomsError');
        }
        
        // Validate area
        if (!formData.areaM2 || formData.areaM2 <= 0) {
            newErrors.area = t('areaError');
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
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
            validateField('floor', floorNum);
        } else if (name === 'bedrooms') {
            const bedroomsNum = parseInt(value) || 0;
            const newCode = generateUnitCode(formData.floor || 0, bedroomsNum);
            setFormData(prev => ({
                ...prev,
                bedroomsStr: value,
                bedrooms: bedroomsNum,
                code: newCode,
            }));
            validateField('bedrooms', bedroomsNum);
        } else if (name === 'area') {
            const areaNum = parseFloat(value) || 0;
            setFormData(prev => ({
                ...prev,
                areaStr: value,
                areaM2: areaNum,
            }));
            validateField('area', areaNum);
        } else if (name === 'name') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
            }));
            validateField('name', value);
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
        <div className={`min-h-screen  p-4 sm:p-8 font-sans`}>
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
                    
                    {/* <DetailField 
                        label="Mã căn hộ"
                        value={formData.code || ""}
                        name="code"
                        placeholder="Mã căn hộ"
                        readonly={true}
                        error={codeError}
                    /> */}

                    {/* <div className={`flex flex-col mb-4 col-span-1`}>
                        <label className="text-md font-bold text-[#02542D] mb-1">
                            {t('status')}
                        </label>
                        <Select
                            options={[
                                { name: t('inactive'), value: 'INACTIVE' },
                                { name: t('active'), value: 'ACTIVE' },
                            ]}
                            value={formData.status}
                            onSelect={handleStatusChange}
                            renderItem={(item) => item.name}
                            getValue={(item) => item.value}
                            placeholder={t('status')}
                        />
                    </div> */}

                    <DetailField 
                        label={t('unitName')}
                        value={formData.name ?? ""}
                        onChange={handleChange}
                        name="name"
                        placeholder={t('unitName')}
                        readonly={false}
                        error={errors.name}
                    />

                    <DetailField 
                        label={t('floor')}
                        value={formData.floorStr ?? "0"}
                        onChange={handleChange}
                        name="floor"
                        placeholder={t('floor')}
                        readonly={false}
                        error={errors.floor}
                        inputType="number"
                    />

                    <DetailField 
                        label={t('bedrooms')}
                        value={formData.bedroomsStr ?? "0"}
                        onChange={handleChange}
                        name="bedrooms"
                        placeholder={t('bedrooms')}
                        readonly={false}
                        error={errors.bedrooms}
                        inputType="number"
                    />

                    <DetailField 
                        label={t('areaM2')}
                        value={formData.areaStr ?? "0"}
                        onChange={handleChange}
                        name="area"
                        placeholder={t('areaM2')}
                        readonly={false}
                        error={errors.area}
                        inputType="number"
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

