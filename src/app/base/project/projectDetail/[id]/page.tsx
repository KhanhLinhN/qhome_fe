'use client'
import React, { useState } from 'react';
import Image from 'next/image';
import Arrow from '@/src/assets/Arrow.svg';
import Delete from '@/src/assets/Delete.svg';
import Edit from '@/src/assets/Edit.svg';
import DetailField from '@/src/components/base-service/DetailField';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useProjectDetailPage } from '@/src/hooks/useProjectDetailPage';
import PopupConfirm from '@/src/components/common/PopupComfirm';
import { useDeleteProject } from '@/src/hooks/useProjectDelete';

export default function ProjectDetail () {


    const t = useTranslations('Project'); 
    const router = useRouter();
    const params = useParams();
    const projectId = params.id;
    console.log(projectId);
    const { projectData, loading, error, isSubmitting } = useProjectDetailPage(projectId);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const { deleteProject, isLoading: isDeleting } = useDeleteProject();    
    
    const handleBack = () => {
        router.back(); 
    }

    const status = projectData?.status ?? '';

    function handleEdit(): void {
        router.push(`/base/project/project-edit/${projectId}`);
    }

    function handleDelete() {
        setIsPopupOpen(true);
    }

    const handleConfirmDelete = async () => {
        if (!projectId) {
            setIsPopupOpen(false);
            return;
        }

        const success = await deleteProject(projectId.toString());

        setIsPopupOpen(false);
        if (success) {
            router.push(`/base/project/projectList`);
        }
    };

    const handleClosePopup = () => {
        setIsPopupOpen(false);
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
            <PopupConfirm
                isOpen={isPopupOpen}
                onClose={handleClosePopup}
                onConfirm={handleConfirmDelete}
                popupTitle={t('deleteProjectT')}
                popupContext={t('deleteProjectC')}
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
                    {t('returnProjectList')}
                </span>
            </div>

            <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200">
                
                <div className="flex justify-between items-start border-b pb-4 mb-6">
                    <div className="flex items-center">
                        <h1 className={`text-2xl font-semibold text-[#02542D] mr-3`}>
                            {t('projectdetail')}
                        </h1>
                        <span 
                            className={`text-sm font-semibold px-3 py-1 rounded-full ${status === 'Inactive' ? 'bg-[#EEEEEE] text-[#02542D]' : 'bg-[#739559] text-white'}`}
                        >
                            {t(status.toString().toLowerCase())}
                        </span>
                    </div>

                    <div className="flex space-x-2">
                        <button 
                            className={`p-2 rounded-lg bg-[#739559] hover:bg-opacity-80 transition duration-150`}
                            onClick={() => {
                                handleEdit(); 
                        }}>
                            <Image 
                                src={Edit} 
                                alt="Edit" 
                                width={24} 
                                height={24}
                                className="w-6 h-6" 
                            />
                        </button>
                        <button 
                            className="p-2 rounded-lg bg-red-500 hover:bg-opacity-80 transition duration-150"
                             onClick={() => {
                                handleDelete(); 
                        }}>
                            <Image 
                                src={Delete} 
                                alt="Delete" 
                                width={24} 
                                height={24}
                                className="w-6 h-6" 
                            />
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    
                    <DetailField 
                        label={t('projectCode')}
                        value={projectData?.code ?? ''} 
                        readonly={true}
                    />
                    <div className="col-span-1 hidden md:block"></div>

                    <DetailField 
                        label={t('projectName')}
                        value={projectData?.name ?? ''} 
                        readonly={true}
                    />
                    <DetailField 
                        label={t('address')}
                        value={projectData?.address ?? ''} 
                        readonly={true}
                    />

                    <DetailField 
                        label={t('createAt')}
                        type='date'
                        value={projectData?.createdAt?.slice(0, 10).replace(/-/g, '/') ?? ''} 
                        readonly={true}
                    />
                    <DetailField 
                        label={t('hotline')}
                        value={projectData?.contact ?? ''} 
                        readonly={true}
                    />

                    <DetailField 
                        label={t('createBy')}
                        value={projectData?.createdBy ?? ''} 
                        readonly={true}
                    />
                    <DetailField 
                        label={t('email')}
                        value={projectData?.email ?? ''} 
                        readonly={true}
                    />

                    <div className="col-span-full mt-4">
                        <DetailField 
                            label={t('descroption')} 
                            value={projectData?.description ?? ''} 
                            isFullWidth={true}
                            type="textarea"
                            readonly={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
