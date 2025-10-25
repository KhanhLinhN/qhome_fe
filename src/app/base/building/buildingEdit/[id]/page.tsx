'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Arrow from '@/src/assets/Arrow.svg';
import DetailField from '@/src/components/base-service/DetailField';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Select from '@/src/components/customer-interaction/Select';
import { useBuildingDetailPage } from '@/src/hooks/useBuildingDetailPage';
import { Building } from '@/src/types/building';
import { useAuth } from '@/src/contexts/AuthContext';
import { getTenant } from '@/src/services/base/tenantService';

export default function BuildingEdit() {
    const { user, hasRole } = useAuth();
    const t = useTranslations('Building');
    const tProject = useTranslations('Project');
    const router = useRouter();
    const params = useParams();
    const buildingId = params.id as string;

    const { buildingData, loading, error, isSubmitting, editBuilding } =
        useBuildingDetailPage(buildingId);

    const [formData, setFormData] = useState<Partial<Building> & { floorsMaxStr: string; status: string }>({
        address: '',
        floorsMax: 0,
        totalApartmentsAll: 0,
        totalApartmentsActive: 0,
        floorsMaxStr: '0',
        status: 'INACTIVE',
    });

    const [tenantName, setTenantName] = useState<string>('');
    const [loadingTenant, setLoadingTenant] = useState(false);

    useEffect(() => {
        if (buildingData) {
            setFormData({
                address: buildingData.address ?? '',
                floorsMax: buildingData.floorsMax ?? 0,
                totalApartmentsAll: buildingData.totalApartmentsAll ?? 0,
                totalApartmentsActive: buildingData.totalApartmentsActive ?? 0,
                floorsMaxStr: buildingData.floorsMax?.toString() ?? '0',
                status: buildingData.status ?? 'INACTIVE',
            });
        }
    }, [buildingData]);

    useEffect(() => {
        const loadTenantName = async () => {
            if (!buildingData?.tenantId) return;
            
            try {
                setLoadingTenant(true);
                const tenant = await getTenant(buildingData.tenantId);
                setTenantName(tenant.name);
            } catch (err: any) {
                console.error('Failed to load tenant:', err);
                setTenantName('N/A');
            } finally {
                setLoadingTenant(false);
            }
        };

        loadTenantName();
    }, [buildingData?.tenantId]);

    const handleBack = () => {
        router.back();
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        if (name === 'floorsMax') {
            setFormData(prev => ({
                ...prev,
                floorsMaxStr: value,
                floorsMax: parseInt(value) || 0,
            }));
        } else if (name === 'totalApartmentsAll') {
            setFormData(prev => ({
                ...prev,
                totalApartmentsAll: parseInt(value) || 0,
            }));
        } else {
            setFormData((prevData) => ({
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
            const { floorsMaxStr, ...buildingUpdateData } = formData;
            console.log('Đang gửi dữ liệu:', buildingUpdateData);
            await editBuilding(buildingId, buildingUpdateData);
            router.push(`/base/building/buildingDetail/${buildingId}`);
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

    if (!buildingData) {
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
                    {t('returnBuildingDetail')}
                </span>
            </div>

            <form
                className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200"
                onSubmit={handleSubmit}
            >
                <div className="flex justify-between items-start border-b pb-4 mb-6">
                    <div className="flex items-center">
                        <h1 className={`text-2xl font-semibold text-[#02542D] mr-3`}>
                            {t('editBuilding')}
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
                        label={t('buildingCode')}
                        value={buildingData?.code || ""}
                        readonly={true}
                        placeholder={t('buildingCode')}
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
                        label={t('buildingName')}
                        value={buildingData?.name || ""}
                        readonly={true}
                        placeholder={t('buildingName')}
                    />
                    
                    <DetailField
                        label={tProject('projectName')}
                        value={loadingTenant ? 'Loading...' : tenantName || buildingData?.tenanName || ""}
                        readonly={true}
                        placeholder={tProject('projectName')}
                    />

                    <DetailField
                        label={t('address')}
                        value={formData?.address || ""}
                        readonly={false}
                        placeholder={t('address')}
                        name="address"
                        onChange={handleChange}
                    />

                    <DetailField
                        label={t('floors')}
                        value={formData.floorsMaxStr || "0"}
                        readonly={false}
                        placeholder={t('floors')}
                        name="floorsMax"
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
                        className={`px-6 py-2 rounded-lg bg-[#02542D] text-white hover:bg-opacity-80 transition ${
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

