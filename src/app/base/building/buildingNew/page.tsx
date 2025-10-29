'use client'
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Arrow from '@/src/assets/Arrow.svg';
import DetailField from '@/src/components/base-service/DetailField';
import Select from '@/src/components/customer-interaction/Select';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/src/contexts/AuthContext';
import { Building } from '@/src/types/building';
import { useBuildingAdd } from '@/src/hooks/useBuildingAdd';
import { getAllTenants } from '@/src/services/base/tenantService';
import { Project } from '@/src/types/project';
import { useNotifications } from '@/src/hooks/useNotifications';
import { checkBuildingCodeExists } from '@/src/services/base/buildingService';

export default function BuildingAdd () {

    const { user, hasRole } = useAuth();
    const t = useTranslations('Building');
    const tProject = useTranslations('Project');
    const router = useRouter();
    const [isSubmit, setIsSubmit] = useState(false);
    const [tenantId, setTenantId] = useState<string>('');
    const [projects, setProjects] = useState<Project[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const { show } = useNotifications();
    const [codeError, setCodeError] = useState<string>('');
    const [errors, setErrors] = useState<{
        name?: string;
        address?: string;
        floors?: string;
    }>({});
    
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const projectList = await getAllTenants();
                setProjects(projectList as unknown as Project[]);
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setLoadingProjects(false);
            }
        };
        fetchProjects();
    }, []);

    useEffect(() => {
        if (user?.tenantId && projects.length > 0) {
            setTenantId(user.tenantId);
            setFormData(prev => ({
                ...prev,
                tenantId: user.tenantId
            }));
        }
    }, [user, projects]);

    const { addBuilding, loading, error, isSubmitting } = useBuildingAdd();

    const [formData, setFormData] = useState<Partial<Building> & { floorsMaxStr: string; totalApartmentsAllStr: string; status: string }>({
        code: '',
        name: '',
        tenantId: '',
        address: '',
        floorsMax: 0,
        totalApartmentsAll: 0,
        totalApartmentsActive: 0,
        floorsMaxStr: '0',
        totalApartmentsAllStr: '0',
        status: 'ACTIVE',
    });

    // Check code khi code hoặc tenantId thay đổi
    useEffect(() => {
        const checkCode = async () => {
            if (!formData.code || !tenantId) {
                setCodeError('');
                return;
            }
            
            const exists = await checkBuildingCodeExists(formData.code, tenantId);
            if (exists) {
                setCodeError(t('codeError'));
            } else {
                setCodeError('');
            }
        };

        const timeoutId = setTimeout(checkCode, 500); // Debounce 500ms
        return () => clearTimeout(timeoutId);
    }, [formData.code, tenantId]);
    
    const handleBack = () => {
        router.back(); 
    }

    const handleCancel = () => {
        router.back(); 
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isSubmitting) return;

        // Validate all fields at once
        const isValid = validateAllFields();
        
        if (!isValid) {
            show(t('error'), 'error');
            return;
        }
        
        if (!tenantId) {
            show(t('projectError'), 'error');
            return;
        }
        
        if (codeError) {
            show(codeError, 'error');
            return;
        }

        setIsSubmit(true);
        try {
            const { floorsMaxStr, totalApartmentsAllStr, ...buildingData } = formData;
            console.log('Dữ liệu gửi đi:', buildingData);
            await addBuilding(buildingData, tenantId);
            show(t('success'), 'success');
            router.push(`/base/building/buildingList`);
        } catch (error) {
            console.error('Lỗi khi tạo building:', error);
            show(t('errorBuilding'), 'error');
        } finally {
            setIsSubmit(false);
        }
    };

    const generateCodeFromName = (name: string): string => {
        if (!name) return '';
        return name
            .split(' ')
            .filter(word => word.length > 0)
            .map(word => {
                if (/^[a-zA-Z]/.test(word)) {
                    return word[0];
                }
                return word;
            })
            .join('')
            .toUpperCase();
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
            case 'address':
                if (!value || String(value).trim() === '') {
                    newErrors.address = t('addressError');
                } else {
                    delete newErrors.address;
                }
                break;
            case 'floorsMax':
                const floors = typeof value === 'number' ? value : parseInt(String(value));
                if (!floors || floors <= 0) {
                    newErrors.floors = t('floorsError');
                } else {
                    delete newErrors.floors;
                }
                break;
        }
        setErrors(newErrors);
    };

    const validateAllFields = () => {
        const newErrors: {
            name?: string;
            address?: string;
            floors?: string;
        } = {};
        
        // Validate name
        if (!formData.name || formData.name.trim() === '') {
            newErrors.name = t('nameError');
        }
        
        // Validate address
        if (!formData.address || formData.address.trim() === '') {
            newErrors.address = t('addressError');
        }
        
        // Validate floors
        if (!formData.floorsMax || formData.floorsMax <= 0) {
            newErrors.floors = t('floorsError');
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'name') {
            const newCode = generateCodeFromName(value);
            setFormData(prevData => ({
                ...prevData,
                name: value,
                code: newCode,
            }));
            validateField('name', value);
        // } else if (name === 'floorsMax') {
        //     const floorsValue = parseInt(value) || 0;
        //     setFormData(prev => ({
        //         ...prev,
        //         floorsMaxStr: value,
        //         floorsMax: floorsValue,
        //     }));
        //     validateField('floorsMax', floorsValue);
        } else if (name === 'totalApartmentsAll') {
            setFormData(prev => ({
                ...prev,
                totalApartmentsAllStr: value,
                totalApartmentsAll: parseInt(value) || 0,
            }));
        } else if (name === 'address') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
            }));
            validateField('address', value);
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

    const handleProjectChange = (item: { name: string; value: string }) => {
        setTenantId(item.value);
        setFormData((prevData) => ({
            ...prevData,
            tenantId: item.value,
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
                            {t('addBuilding')}
                        </h1>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    
                    {/* <DetailField 
                        label={t('buildingCode')}
                        value={formData.code ?? ""}
                        name="code"
                        placeholder={t('buildingCode')}
                        readonly={true}
                        error={codeError}
                    /> */}

                    <DetailField 
                        label={t('buildingName')}
                        value={formData.name ?? ""}
                        onChange={handleChange}
                        name="name"
                        placeholder={t('buildingName')}
                        readonly={false}
                        error={errors.name}
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
                        label={t('address')}
                        value={formData.address ?? ""}
                        onChange={handleChange}
                        name="address"
                        placeholder={t('address')}
                        readonly={false}
                        error={errors.address}
                    />

                    <div className={`flex flex-col mb-4 col-span-1`}>
                        <label className="text-md font-bold text-[#02542D] mb-1">
                            {tProject('projectName')}
                        </label>
                        <Select
                            options={projects.filter(p => p.name && p.id).map(p => ({ name: p.name!, value: p.id! }))}
                            value={tenantId}
                            onSelect={handleProjectChange}
                            renderItem={(item) => item.name}
                            getValue={(item) => item.value}
                            placeholder={loadingProjects ? 'Loading...' : tProject('projectName')}
                            disable={!!user?.tenantId || loadingProjects}
                        />
                    </div>

                    

                    {/* <DetailField 
                        label={t('floors')}
                        value={formData.floorsMaxStr ?? "0"}
                        onChange={handleChange}
                        name="floorsMax"
                        placeholder={t('floors')}
                        readonly={false}
                        error={errors.floors}
                    /> */}

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
                            className="px-6 py-2 bg-[#02542D] text-white rounded-lg hover:bg-opacity-80 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
