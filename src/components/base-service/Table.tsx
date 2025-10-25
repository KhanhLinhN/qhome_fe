import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import Delete from '@/src/assets/DeleteTable.svg';
import Edit from '@/src/assets/EditTable.svg';

interface TableItemProps {
    projectId?: string;
    projectCode?: string;
    projectName?: string;
    address?: string;
    contact?: string;
    email?: string,
    status?: string;
    createBy?: string,
    createdAt?: string;
    buildingId?: string;
    buildingCode?: string;
    buildingName?: string;
    floors?: number;
    // News fields
    newsId?: string;
    title?: string;
    summary?: string;
    publishAt?: string;
    expireAt?: string;
}

interface TableProps {
    data: TableItemProps[];
    headers?: string[];
    type: string;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
}

const Table = ({ data, headers, type, onEdit, onDelete }: TableProps) => {
    const t = useTranslations();
    const [selectedId, setSelectedId] = useState<number | undefined>();
    console.log(data);

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN');
        } catch {
            return '-';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'DRAFT':
                return 'Nháp';
            case 'PUBLISHED':
                return 'Đã xuất bản';
            case 'ARCHIVED':
                return 'Đã lưu trữ';
            default:
                return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DRAFT':
                return 'text-gray-600 bg-gray-100';
            case 'PUBLISHED':
                return 'text-green-700 bg-green-100';
            case 'ARCHIVED':
                return 'text-orange-700 bg-orange-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    return (
        <div className="overflow-x-auto bg-white mt-6 border-t-4 bolder-solid border-[#14AE5C] h-[600px] overflow-y-auto">
            <table className="w-full rounded-xl">
                
                <thead>
                    <tr className="border-b-2 border-solid border-[#14AE5C] ">
                        {headers?.map((header, index) => (
                            <th
                                key={index}
                                className={`px-4 py-3 text-[14px] font-bold text-[#024023] uppercase tracking-wider text-center whitespace-nowrap`}
                                style={{ width: header === t('Project.projectCode') || header === t('Project.createAt') || header === t('Project.createBy') || header === t('Project.status') || header === t('Project.action') 
                                    || header === t('Building.buildingCode') || header === t('Building.createAt') || header === t('Building.createBy') || header === t('Building.status') || header === t('Building.action') || header === t('Building.floors') ? '5%' : 'auto' }}
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                
                <tbody>
                    {data.map((item, index) => {
                        const isSelected = item.projectId === selectedId;
                        
                        const rowClass = isSelected 
                            ? 'transition duration-150 ease-in-out' 
                            : 'hover:bg-gray-50';

                        const borderClass = index < data.length - 1 
                            ? 'border-b border-solid border-[#CDCDCD]' 
                            : 'border-b-0';
                        
                            if(type === "project"){
                                return (
                                    <tr 
                                        key={item.projectId} 
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
                                            <div className="flex space-x-2 justify-center">
                                                <button 
                                                    className={` hover:bg-opacity-80 transition duration-150`}
                                                    onClick={() => console.log('Chỉnh sửa dự án')}
                                                >
                                                    <Link href={`/base/project/projectDetail/${item.projectId}`}>
                                                        <Image 
                                                            src={Edit} 
                                                            alt="Edit" 
                                                            width={24} 
                                                            height={24}
                                                            className="w-10 h-10"
                                                        />
                                                    </Link>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }
                            if(type === "building"){
                                return (
                                    <tr 
                                        key={item.buildingId} 
                                        className={`${rowClass} ${borderClass} cursor-pointer`}
                                    >
        
                                        <td className="px-4 py-3 whitespace-nowrap text-[14px] text-[#024023] font-semibold text-center">
                                                {item.buildingCode}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-[14px] text-center text-[#024023] font-semibold truncate">{item.buildingName}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-[14px] text-center text-[#024023] font-semibold truncate">{item.projectName}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-[14px] text-center font-semibold text-[#024023]">{item.floors}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-[14px] text-center font-semibold text-[#024023]">{item.status}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-[14px] text-center font-semibold text-[#024023]">{item.createdAt}</td>
        
                                        <td className={`px-4 py-3 whitespace-nowrap text-center font-semibold text-[#024023]`}>{item.createBy}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-[14px] font-semibold text-[#024023] text-center">
                                            <div className="flex space-x-2 justify-center">
                                                <button 
                                                    className={` hover:bg-opacity-80 transition duration-150`}
                                                    onClick={() => console.log('Chỉnh sửa dự án')}
                                                >
                                                    <Link href={`/base/building/buildingDetail/${item.buildingId}`}>
                                                        <Image 
                                                            src={Edit} 
                                                            alt="Edit" 
                                                            width={34} 
                                                            height={34}
                                                        />
                                                    </Link>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }
                            if(type === "news"){
                                return (
                                    <tr 
                                        key={item.newsId} 
                                        className={`${rowClass} ${borderClass} cursor-pointer`}
                                    >
        
                                        <td className="px-4 py-3 text-[14px] text-[#024023] font-semibold text-left max-w-xs truncate">
                                            {item.title}
                                        </td>
                                        <td className="px-4 py-3 text-[14px] text-gray-700 text-left max-w-sm truncate">{item.summary}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status || '')}`}>
                                                {getStatusLabel(item.status || '')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-[14px] text-gray-700">{formatDate(item.publishAt || '')}</td>
                                        <td className="px-4 py-3 text-center text-[14px] text-gray-700">{formatDate(item.expireAt || '')}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex space-x-2 justify-center">
                                                {onEdit && (
                                                    <button 
                                                        className="hover:opacity-70 transition"
                                                        onClick={() => item.newsId && onEdit(item.newsId)}
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Image 
                                                            src={Edit} 
                                                            alt="Edit" 
                                                            width={32} 
                                                            height={32}
                                                        />
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button 
                                                        className="hover:opacity-70 transition"
                                                        onClick={() => item.newsId && onDelete(item.newsId)}
                                                        title="Xóa"
                                                    >
                                                        <Image 
                                                            src={Delete} 
                                                            alt="Delete" 
                                                            width={32} 
                                                            height={32}
                                                        />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
