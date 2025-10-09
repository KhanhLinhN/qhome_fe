import React from 'react';
import RequestInfoItem from './RequestInfoItem';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

interface RequestInfoAndContextProps {
    value: request;
    contextTitle: string;
    contextContextTitle: string;
    contextImageTitle: string;
    isTicket?: boolean;
}

const RequestInfoAndContext = ({ value, contextTitle, contextContextTitle, contextImageTitle, isTicket } : RequestInfoAndContextProps) => {
    const t = useTranslations('customer-interaction.Request');
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                {!isTicket && (
                    <div className='border-b-3 border-[#CDCDCD] pb-4 mb-4'>
                        <RequestInfoItem
                            title={t('requestNumber')}
                            value={value.id.toString()}
                            isHighlighted={true}
                        />
                        <RequestInfoItem
                            title={t('projectCode')}
                            value={value.projectCode.toString()}
                            isHighlighted={false}
                        />
                        <RequestInfoItem
                            title={t('residentName')}
                            value={value.residentName}
                            isHighlighted={false}
                        />
                        <RequestInfoItem
                            title={t('dateCreated')}
                            value={value.createdDate}
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
                <p className="text-[#016637] mb-4 leading-relaxed">{value.context}</p>

                <h3 className="text-lg font-semibold mb-2">{contextImageTitle}</h3>
                <div className="w-48 h-32 bg-gray-200 border border-gray-300 rounded-md">
                    <Image src={value.imagePath} alt="Request Image" className="w-full h-full object-cover rounded-md" />
                </div>
            </div>
        </div>
    );
};

export default RequestInfoAndContext;
