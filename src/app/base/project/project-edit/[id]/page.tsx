'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Arrow from '@/src/assets/Arrow.svg';
import DetailField from '@/src/components/base-service/DetailField';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Select from '@/src/components/customer-interaction/Select';
import { useProjectDetailPage } from '@/src/hooks/useProjectDetailPage';
import { Project } from '@/src/types/project';
import { useAuth } from '@/src/contexts/AuthContext';
import { useNotifications } from '@/src/hooks/useNotifications';

type ProjectFormData = {
    name: string;
    address: string;
    contact: string;
    email: string;
    description: string;
    status: string;
};

export default function ProjectDetail() {
    const { user, hasRole } = useAuth();
    const t = useTranslations('Project');
    const router = useRouter();
    const params = useParams();
    const projectId = params.id as string; 
    const { show } = useNotifications();

    const { projectData, loading, error, isSubmitting, editProject } =
        useProjectDetailPage(projectId);

    const [formData, setFormData] = useState<Project>({
        name: '',
        address: '',
        contact: '',
        email: '',
        description: '',
        status: 'INACTIVE',
    });

    useEffect(() => {
        if (projectData) {
            setFormData({
                name: projectData.name ?? '',
                address: projectData.address ?? '',
                contact: projectData.contact ?? '',
                email: projectData.email ?? '',
                description: projectData.description ?? '',
                status: projectData.status ?? 'INACTIVE',
            });
        }
    }, [projectData]);

    const handleBack = () => {
        router.back();
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
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

        // Validation
        if (!formData.name?.trim()) {
            show('Vui lòng nhập tên dự án', 'error');
            return;
        }
        if (!formData.address?.trim()) {
            show('Vui lòng nhập địa chỉ', 'error');
            return;
        }
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            show('Email không hợp lệ', 'error');
            return;
        }

        try {
            console.log('Đang gửi dữ liệu:', formData);
            editProject(projectId, formData);
            show('Cập nhật dự án thành công!', 'success');
            router.push(`/base/project/projectDetail/${projectId}`);

        } catch (submitError) {
            console.error('Lỗi khi cập nhật:', submitError);
            show('Có lỗi xảy ra khi cập nhật dự án!', 'error');
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">{t('loading')}</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen text-red-500">{t('error')}: {error.message}</div>;
    }

    if (!projectData) {
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
                    {t('returnProjectDetail')}
                </span>
            </div>

            <form
                className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200"
                onSubmit={handleSubmit}
            >
                <div className="flex justify-between items-start border-b pb-4 mb-6">
                    <div className="flex items-center">
                        <h1 className={`text-2xl font-semibold text-[#02542D] mr-3`}>
                            {t('projectdetail')}
                        </h1>
                        <span
                            className={`text-sm font-semibold px-3 py-1 rounded-full ${
                                formData.status === 'INACTIVE'
                                    ? 'bg-[#EEEEEE] text-[#02542D]'
                                    : 'bg-[#739559] text-white'
                            }`}
                        >
                            {t(formData?.status?.toLowerCase() || "asctive")}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    <DetailField
                        label={t('projectCode')}
                        value={projectData?.code || ""} 
                        readonly={true}
                        placeholder={t('projectCode')}
                    />

                    <div className={`flex flex-col mb-4 col-span-1`}>
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
                    </div>

                    <DetailField
                        label={t('projectName')}
                        value={formData?.name || ""}
                        readonly={false}
                        placeholder={t('projectName')}
                        name="name"
                        onChange={handleChange}
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
                        label={t('hotline')}
                        value={formData.contact || ""}
                        readonly={false}
                        placeholder={t('hotline')}
                        name="contact"
                        onChange={handleChange}
                    />
                    <DetailField
                        label={t('email')}
                        value={formData.email || ""}
                        readonly={false}
                        placeholder={t('email')}
                        name="email"
                        onChange={handleChange}
                    />

                    <div className="col-span-full mt-4">
                        <DetailField
                            label={t('descroption')}
                            value={formData.description || ""}
                            isFullWidth={true}
                            type="textarea"
                            readonly={false}
                            placeholder={t('descroption')}
                            name="description"
                            onChange={handleChange}
                        />
                    </div>
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
