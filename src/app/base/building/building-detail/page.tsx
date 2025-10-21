'use client'
import React from 'react';
import Image from 'next/image';
import Arrow from '@/src/assets/Arrow.svg';
import Delete from '@/src/assets/Delete.svg';
import Edit from '@/src/assets/Edit.svg';
import DetailField from '@/src/components/base-service/DetailField';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function BuildingDetail () {

    // Data mẫu
    const projectData = {
        code: 'VNB02',
        name: 'Viet Nam Building 2',
        address: 'Do Duc Street, Me Tri Ward, Nam Tu Liem, Hanoi',
        createdAt: '02/10/2025',
        hotline: '0813065257',
        createdBy: 'Pham Hung B',
        email: 'VietnamBD2@gmail.com',
        description: 'A building is a permanent, enclosed structure with a roof and walls, such as a house, school, or factory, used for various activities like living, working, or storing goods. Introducing a building involves describing its purpose, key architectural features, and overall function, often focusing on its parts from the ground up, including the foundation, walls, and roof.',
        status: 'Inactive',
    };

    const router = useRouter();
    const t = useTranslations('Building'); 
    
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
                            {t('projectdetail')}
                        </h1>
                        <span 
                            className={`text-sm font-semibold px-3 py-1 rounded-full ${projectData.status === 'Inactive' ? 'bg-[#EEEEEE] text-[#02542D]' : 'bg-[#739559] text-white'}`}
                        >
                            {projectData.status}
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
                        label= t={('buildingCode')}
                        value={projectData.code} 
                        readonly={true}
                    />
                    <div className="col-span-1 hidden md:block"></div>

                    <DetailField 
                        label="Project Name" 
                        value={projectData.name} 
                        readonly={true}
                    />
                    <DetailField 
                        label="Address" 
                        value={projectData.address} 
                        readonly={true}
                    />

                    <DetailField 
                        label="Create at" 
                        value={projectData.createdAt} 
                        readonly={true}
                    />
                    <DetailField 
                        label="Hotline" 
                        value={projectData.hotline} 
                        readonly={true}
                    />

                    <DetailField 
                        label="Create by" 
                        value={projectData.createdBy} 
                        readonly={true}
                    />
                    <DetailField 
                        label="Email" 
                        value={projectData.email} 
                        readonly={true}
                    />

                    <div className="col-span-full mt-4">
                        <DetailField 
                            label="Description" 
                            value={projectData.description} 
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
