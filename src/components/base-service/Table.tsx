import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import Delete from '@/src/assets/DeleteTable.svg';
import Edit from '@/src/assets/EditTable.svg';

interface TableItemProps {
    id?: number;
    projectCode?: string;
    projectName?: string;
    address?: string;
    contact?: string;
    email?: string,
    status?: string;
    createBy?: string,
    createdAt?: string;
}

interface TableProps {
    data: TableItemProps[];
    headers?: string[];
}

const Table = ({ data, headers }: TableProps) => {
    const t = useTranslations('Project');
    const [selectedId, setSelectedId] = useState<number | undefined>();
    console.log(data);

    return (
        <div className="overflow-x-auto bg-white rounded-xl mt-6">
            <table className="w-full">
                
                <thead>
                    <tr className="border-b-2 border-solid border-[#14AE5C]">
                        {headers?.map((header, index) => (
                            <th
                                key={index}
                                className={`px-4 py-3 text-[14px] font-bold text-[#024023] uppercase tracking-wider text-center whitespace-nowrap`}
                                style={{ width: header === t('projectCode') || header === t('createAt') || header === t('createBy') || header === t('status') || header === t('action') ? '5%' : 'auto' }}
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                
                <tbody>
                    {data.map((item, index) => {
                        const isSelected = item.id === selectedId;
                        
                        const rowClass = isSelected 
                            ? 'bg-green-50 transition duration-150 ease-in-out' 
                            : 'hover:bg-gray-50';

                        const borderClass = index < data.length - 1 
                            ? 'border-b border-solid border-[#CDCDCD]' 
                            : 'border-b-0';

                        const handleCellClick = (e: React.MouseEvent) => {
                            e.stopPropagation();
                            setSelectedId(item.id); 
                            // onRowClick(item.id);
                        };
                        
                        return (
                            <tr 
                                key={item.id} 
                                className={`${rowClass} ${borderClass} cursor-pointer`}
                            >

                                <td className="px-4 py-3 whitespace-nowrap text-[14px] text-[#024023] font-semibold text-center">
                                        {item.projectCode}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[14px] text-center text-[#024023] font-semibold truncate">{item.projectName}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[14px] text-center font-semibold text-[#024023]">{item.address}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[14px] text-center font-semibold text-[#024023]">{item.status}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[14px] text-center font-semibold text-[#024023]">{item.createdAt}</td>

                                <td className={`px-4 py-3 whitespace-nowrap text-center font-semibold text-[#024023]`}>{item.createBy}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[14px] font-semibold text-[#024023] text-center">
                                    <div className="flex space-x-2">
                                        <button 
                                            className={` hover:bg-opacity-80 transition duration-150`}
                                            onClick={() => console.log('Chỉnh sửa dự án')}
                                        >
                                            <Image 
                                                src={Edit} 
                                                alt="Edit" 
                                                width={24} 
                                                height={24}
                                                className="w-10 h-10 text-red-500"
                                            />
                                        </button>
                                        <button 
                                            className=" hover:bg-opacity-80 transition duration-150"
                                            onClick={() => console.log('Đóng/Xóa dự án')}
                                        >
                                            <Image 
                                                src={Delete} 
                                                alt="Delete" 
                                                width={24} 
                                                height={24}
                                                className="w-10 h-10" 
                                            />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
