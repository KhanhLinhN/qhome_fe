'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Arrow from '@/src/assets/Arrow.svg';
import DetailField from '@/src/components/base-service/DetailField';
import Select from '@/src/components/customer-interaction/Select';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Project } from '@/src/types/project'; 
import { useProjectAdd } from '@/src/hooks/useProjectAdd';

export default function ProjectAdd() {
    const t = useTranslations('Project');
    const router = useRouter();
    const [isSubmit, setIsSubmit] = useState(false);

    const { addProject, loading, error, isSubmitting } = useProjectAdd();

    const [formData, setFormData] = useState<Project>({
        code: '',
        name: '',
        address: '',
        contact: '',
        email: '',
        description: '',
        status: 'INACTIVE', 
    });

    const handleBack = () => {
        router.back();
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmit(true);
        try {

            console.log('Dữ liệu gửi đi:', formData);
            addProject(formData)
            router.push(`/base/project/projectList`);
        } catch (error) {
            console.error('Lỗi khi tạo dự án:', error);
            alert('Có lỗi xảy ra!');
        } finally {
            setIsSubmit(false);
        }
    };

    const generateCodeFromName = (name: string): string => {
    if (!name) return '';
    return name
        .split(' ') 
        .filter(word => word.length > 0)
        .map(word => word[0]) 
        .join('') 
        .toUpperCase(); 
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        if (name === 'name') {
            const newCode = generateCodeFromName(value);
            setFormData(prevData => ({
                ...prevData,
                name: value,
                code: newCode,
            }));
        } else {
            setFormData((prev) => ({
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
                <span
                    className={`text-[#02542D] font-bold text-2xl hover:text-opacity-80 transition duration-150 `}
                >
                    {t('returnProjectList')}
                </span>
            </div>

            <form
                className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200"
                onSubmit={handleSubmit}
            >
                <div className="flex justify-between items-start border-b pb-4 mb-6">
                    <div className="flex items-center">
                        <h1 className={`text-2xl font-semibold text-[#02542D] mr-3`}>
                            {t('addProject')} 
                        </h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">

                    <DetailField
                        label={t('projectCode')}
                        value={formData.code ?? ""}
                        onChange={handleChange}
                        name="name"
                        placeholder={t('projectCode')}
                        readonly={true}
                    />

                    <DetailField
                        label={t('projectName')}
                        value={formData.name ?? ""}
                        onChange={handleChange}
                        name="name"
                        placeholder={t('projectName')}
                        readonly={false}
                    />
                    <DetailField
                        label={t('address')}
                        value={formData.address ?? ""}
                        onChange={handleChange}
                        name="address"
                        placeholder={t('address')}
                        readonly={false}
                    />
                    <DetailField
                        label={t('hotline')}
                        value={formData.contact ?? ""}
                        onChange={handleChange}
                        name="contact"
                        placeholder={t('hotline')}
                        readonly={false}
                    />
                    <DetailField
                        label={t('email')}
                        value={formData.email ?? ""}
                        onChange={handleChange}
                        name="email"
                        placeholder={t('email')}
                        readonly={false}
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

                    <div className="col-span-full mt-4">
                        <DetailField
                            label={t('descroption')}
                            value={formData.description ?? ""}
                            onChange={handleChange}
                            name="description"
                            isFullWidth={true}
                            type="textarea"
                            placeholder={t('descroption')}
                            readonly={false}
                        />
                    </div>

                    <div className="col-span-full flex justify-center space-x-3 mt-8">
                        <button
                            type="button"
                            onClick={handleBack}
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
}