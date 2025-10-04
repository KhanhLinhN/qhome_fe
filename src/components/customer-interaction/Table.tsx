import React, { useState } from 'react';
import PriorityHighIcon from '@/src/assets/PriorityHigh.svg';
import PriorityMediumIcon from '@/src/assets/PriorityMedium.svg';
import PriorityLowIcon from '@/src/assets/PriorityLow.svg';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

interface TableItemProps {
    id: number;
    requestNumber: string;
    requestTitle: string;
    residentName: string;
    assignee: string;
    createdDate: string;
    priority: "High" | "Medium" | "Low";
    status: string;
}

interface TableProps {
    data: TableItemProps[];
    headers?: string[];
}

const Table = ({ data, headers } : TableProps) => {
    const t = useTranslations('customer-interaction.Request');
    const [selectedId, setSelectedId] = useState();

    // const headers = [t('action'), t('requestNumber'), t('requestTitle'), t('residentName'), t('assignee'), t('dateCreated'), t('priority'), t('status')];
    const [isChecked, setIsChecked] = useState(false); 

    // const handleToggle = () => {
    //     setIsChecked(prev => !prev); 
    // };

    return (
        <div className="overflow-x-auto bg-white rounded-xl mt-6">
            <table className="w-full">
                
                <thead>
                    <tr className="border-b-2 border-solid border-[#14AE5C]">
                        {headers?.map((header, index) => (
                            <th
                                key={index}
                                className={`px-4 py-3 text-[14px] font-bold text-[#024023] uppercase tracking-wider ${header === t('requestTitle') || header === t('residentName') || header === t('assignee') ? 'text-left' : 'text-center'} whitespace-nowrap`}
                                style={{ width: header === t('requestNumber') || header === t('priority') || header === t('status') ? '5%' : 'auto' }}
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                
                <tbody>
                    {data.map((request, index) => {
                        const isSelected = request.id === selectedId;
                        
                        const rowClass = isSelected 
                            ? 'bg-green-50 transition duration-150 ease-in-out' 
                            : 'hover:bg-gray-50';

                        const borderClass = index < data.length - 1 
                            ? 'border-b border-solid border-[#CDCDCD]' 
                            : 'border-b-0';
                        
                        return (
                            <tr 
                                key={request.id} 
                                className={`${rowClass} ${borderClass} cursor-pointer`}
                            >
                                {/* <td className="px-4 py-3 whitespace-nowrap">
                                    <Checkbox
                                        checked={isChecked} 
                                        onClick={handleToggle} 
                                    />
                                </td> */}

                                <td className="px-4 py-3 whitespace-nowrap text-[14px] font-semibold text-center text-[#024023]">{request.requestNumber}</td>
                                <td className="px-4 py-3 text-[14px] text-[#024023] font-semibold truncate">{request.requestTitle}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[14px] font-semibold text-[#024023]">{request.residentName}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[14px] font-semibold text-[#024023]">{request.assignee}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[14px] text-center font-semibold text-[#024023]">{request.createdDate}</td>

                                <td className="px-4 py-3 whitespace-nowrap flex justify-center items-center h-full">
                                    <Image
                                        src={request.priority === 'High' ? PriorityHighIcon : (request.priority === 'Medium' ? PriorityMediumIcon : PriorityLowIcon)}
                                        alt="Priority"
                                        width={20}
                                        height={20}
                                    />
                                </td>                                
                                <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">{request.status}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
