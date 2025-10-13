import React from 'react';
import RequestInfoItem from './RequestInfoItem';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Request } from '@/src/types/request';
import NoImage from '@/src/assets/NoImage.svg'

interface RequestInfoAndContextProps {
    value: Request;
    contextTitle: string;
    contextContextTitle: string;
    contextImageTitle: string;
    isTicket?: boolean;
}

const RequestInfoAndContext = ({ value, contextTitle, contextContextTitle, contextImageTitle, isTicket } : RequestInfoAndContextProps) => {
    const t = useTranslations('customer-interaction.Request');
    const imageUrl = value.imagePath 
        ? `/${value.imagePath}` 
        : NoImage;
    return (
        <div className="space-y-6 h-full">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full">
                {!isTicket && (
                    <div className='border-b-3 border-[#CDCDCD] pb-4 mb-4'>
                        <RequestInfoItem
                            title={t('requestNumber')}
                            value={value.requestCode}
                            isHighlighted={true}
                        />
                        {/* <RequestInfoItem
                            title={t('projectCode')}
                            value={value.requestCode}
                            isHighlighted={false}
                        /> */}
                        <RequestInfoItem
                            title={t('residentName')}
                            value={value.residentName}
                            isHighlighted={false}
                        />
                        <RequestInfoItem
                            title={t('dateCreated')}
                            value={value.createdAt}
                            isHighlighted={false}
                        />
                        <RequestInfoItem
                            title={t('priority')}
                            value={value.priority}
                            isHighlighted={false}
                        />
                    </div>
                )}
                <h3 className="text-lg font-semibold mb-2">{contextTitle}</h3>
                <p className="text-[#016637] font-medium mb-4">{value.title}</p>

                <h3 className="text-lg font-semibold mb-2">{contextContextTitle}</h3>
                <p className="text-[#016637] mb-4 leading-relaxed">{value.content}</p>

                <h3 className="text-lg font-semibold mb-2">{contextImageTitle}</h3>
                <div className='flex justify-center'>
                    <div className="w-48 h-25 border border-gray-300 rounded-md">
                        <Image 
                            src={ NoImage} 
                            alt="Request Image" 
                            className="w-full h-full object-cover rounded-md bg-gray-200" 
                            width={48}
                            height={20}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestInfoAndContext;
