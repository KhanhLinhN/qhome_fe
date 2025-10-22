'use client'
import React, { useState } from 'react';
import Image from 'next/image';
import Arrow from '@/src/assets/Arrow.svg';
import Delete from '@/src/assets/Delete.svg';
import Edit from '@/src/assets/Edit.svg';
import DetailField from '@/src/components/base-service/DetailField';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useBuildingDetailPage } from '@/src/hooks/useBuildingDetailPage';

export default function BuildingDetail () {

    const t = useTranslations('Building'); 
    const router = useRouter();
    const params = useParams();
    const buildingId = params.id;
    const { buildingData, loading, error, isSubmitting } = useBuildingDetailPage(buildingId);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    // const { deleteProject, isLoading: isDeleting } = useDeleteProject();    
    
    
    const handleBack = () => {
        router.back(); 
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

            <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200">
                
                <div className="flex justify-between items-start border-b pb-4 mb-6">
                    <div className="flex items-center">
                        <h1 className={`text-2xl font-semibold text-[#02542D] mr-3`}>
                            {t('buildingDetail')}
                        </h1>
                        <span 
                            className={`text-sm font-semibold px-3 py-1 rounded-full ${buildingData?.status === 'Inactive' ? 'bg-[#EEEEEE] text-[#02542D]' : 'bg-[#739559] text-white'}`}
                        >
                            {buildingData?.status}
                        </span>
                    </div>

                    <div className="flex space-x-2">
                        <button 
                            className={`p-2 rounded-lg bg-[#739559] hover:bg-opacity-80 transition duration-150`}
                            onClick={() => console.log('Chỉnh sửa dự án')}
                        >
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
                            onClick={() => console.log('Đóng/Xóa dự án')}
                        >
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
                        label={t('buildingCode')}
                        value={buildingData?.code ?? ""} 
                        readonly={true}
                    />
                    <div className="col-span-1 hidden md:block"></div>

                    <DetailField 
                        label={t('buildingName')}
                        value={buildingData?.name ?? ""} 
                        readonly={true}
                    />

                    <DetailField 
                        label={t('projectName')} 
                        value={buildingData?.tenanName ?? ""} 
                        readonly={true}
                    />

                    <DetailField 
                        label={t('createAt')}
                        value={buildingData?.createdAt ?? ""} 
                        readonly={true}
                    />
                    <DetailField 
                        label={t('floors')}
                        value={buildingData?.floorsMax ?? ""} 
                        readonly={true}
                    />

                    <DetailField 
                        label={t('createBy')} 
                        value={buildingData?.createdBy ?? ""} 
                        readonly={true}
                    />
                    
                </div>
            </div>
        </div>
    );
};
