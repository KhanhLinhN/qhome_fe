import React from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import Edit from '@/src/assets/Edit.svg';
import EditTable from '@/src/assets/EditTable.svg';
import Delete from '@/src/assets/Delete.svg';
import { useNotifications } from '@/src/hooks/useNotifications';

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
    categoryId?: string;
    categoryCode?: string;
    sortOrder?: number | null;
    disableDelete?: boolean;
    serviceId?: string;
    serviceCode?: string;
    serviceName?: string;
    categoryName?: string;
    pricingType?: string;
    bookingType?: string;
    isActive?: boolean;
    // News fields
    newsId?: string;
    title?: string;
    summary?: string;
    publishAt?: string;
    expireAt?: string;
    // Notification fields
    notificationId?: string;
    message?: string;
    type?: string;
    scope?: string;
    target?: string;
    // Account fields
    userId?: string;
    username?: string;
    roles?: string;
    active?: boolean;
    accountId?: string;
    accountType?: 'staff' | 'resident';
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
    const { show } = useNotifications();

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

    const getTypeLabel = (type: string) => {
        const typeMap: { [key: string]: string } = {
            'INFO': 'Thông tin',
            'WARNING': 'Cảnh báo',
            'ALERT': 'Khẩn cấp',
            'SUCCESS': 'Thành công',
            'ANNOUNCEMENT': 'Thông báo chung',
        };
        return typeMap[type] || type;
    };

    const getTypeColor = (type: string) => {
        const colorMap: { [key: string]: string } = {
            'INFO': 'text-blue-700 bg-blue-100',
            'WARNING': 'text-yellow-700 bg-yellow-100',
            'ALERT': 'text-red-700 bg-red-100',
            'SUCCESS': 'text-green-700 bg-green-100',
            'ANNOUNCEMENT': 'text-purple-700 bg-purple-100',
        };
        return colorMap[type] || 'text-gray-600 bg-gray-100';
    };

    const getScopeLabel = (scope: string) => {
        return scope === 'INTERNAL' ? 'Nội bộ' : 'Bên ngoài';
    };

    const getRoleBadge = (role: string) => {
        const normalized = role.trim().toUpperCase();
        switch (normalized) {
            case 'ADMIN':
                return { label: 'Admin', className: 'bg-red-100 text-red-700' };
            case 'ACCOUNTANT':
                return { label: 'Accountant', className: 'bg-blue-100 text-blue-700' };
            case 'TECHNICIAN':
                return { label: 'Technician', className: 'bg-orange-100 text-orange-700' };
            case 'SUPPORTER':
                return { label: 'Supporter', className: 'bg-purple-100 text-purple-700' };
            case 'RESIDENT':
                return { label: 'Resident', className: 'bg-gray-100 text-gray-700' };
            case 'UNIT_OWNER':
                return { label: 'Unit Owner', className: 'bg-teal-100 text-teal-700' };
            default:
                return { label: role, className: 'bg-slate-100 text-slate-700' };
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
                    {data.length === 0 ? (
                        <tr>
                            <td
                                colSpan={headers?.length ?? 1}
                                className="px-4 py-6 text-center text-sm text-gray-500"
                            >
                                Không có dữ liệu.
                            </td>
                        </tr>
                    ) : (
                        data.map((item, index) => {
                            const rowClass = 'hover:bg-gray-50';
                            const borderClass = index < data.length - 1
                                ? 'border-b border-solid border-[#CDCDCD]'
                                : 'border-b-0';
                            
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
                                        <td className="px-4 py-3 whitespace-nowrap text-[14px] text-center font-semibold text-[#024023]">{item.floors}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-[14px] text-center font-semibold text-[#024023]">{item.status}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-[14px] text-center font-semibold text-[#024023]">{item.createdAt}</td>
        
                                        <td className={`px-4 py-3 whitespace-nowrap text-center font-semibold text-[#024023]`}>{item.createBy}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-[14px] font-semibold text-[#024023] text-center">
                                            <div className="flex space-x-2 justify-center">
                                                <Link 
                                                    href={`/base/building/buildingDetail/${item.buildingId}`}
                                                    className="w-[47px] h-[34px] flex items-center justify-center rounded-md bg-blue-500 hover:bg-blue-600 transition"
                                                    title="Xem chi tiết"
                                                >
                                                    <Image 
                                                        src={Edit} 
                                                        alt="Edit" 
                                                        width={24} 
                                                        height={24}
                                                    />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }
                            if(type === "service"){
                                return (
                                    <tr
                                        key={item.serviceId}
                                        className={`${rowClass} ${borderClass} cursor-pointer`}
                                    >
                                        <td className="px-4 py-3 whitespace-nowrap text-[14px] text-center text-[#024023] font-semibold">
                                            {item.serviceCode}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-[14px] text-[#024023] font-semibold text-center truncate">
                                            {item.serviceName}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-[14px] text-center text-[#024023] font-semibold">
                                            {item.categoryName || '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-[14px] text-center text-[#024023] font-semibold">
                                            {item.pricingType || '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <span
                                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                    item.isActive
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-gray-200 text-gray-600'
                                                }`}
                                            >
                                                {item.isActive ? t('Service.active') : t('Service.inactive')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-[14px] text-center text-[#024023] font-semibold">
                                            {item.createdAt || '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-[14px] font-semibold text-[#024023] text-center">
                                            <div className="flex space-x-2 justify-center">
                                                <Link
                                                    href={`/base/serviceDetail/${item.serviceId}`}
                                                    className="w-[47px] h-[34px] flex items-center justify-center rounded-md bg-blue-500 hover:bg-blue-600 transition"
                                                    title={t('Service.viewDetail')}
                                                >
                                                    <Image
                                                        src={Edit}
                                                        alt="View detail"
                                                        width={24}
                                                        height={24}
                                                    />
                                                </Link>
                                                <button
                                                    onClick={() => item.serviceId && onDelete && onDelete(item.serviceId)}
                                                    className="w-[47px] h-[34px] flex items-center justify-center rounded-md bg-red-500 hover:bg-red-600 transition"
                                                >
                                                    <Image
                                                        src={Delete}
                                                        alt="Delete"
                                                        width={24}
                                                        height={24}
                                                    />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }
                            if(type === "service-category"){
                                const isDeleteDisabled = item.disableDelete ?? false;
                                return (
                                    <tr
                                        key={item.categoryId}
                                        className={`${rowClass} ${borderClass} cursor-pointer`}
                                    >
                                        <td className="px-4 py-3 whitespace-nowrap text-[14px] text-center text-[#024023] font-semibold">
                                            {item.categoryCode}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-[14px] text-[#024023] font-semibold text-center truncate">
                                            {item.categoryName}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <span
                                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                    item.isActive
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-gray-200 text-gray-600'
                                                }`}
                                            >
                                                {item.isActive ? t('ServiceCategory.active') : t('ServiceCategory.inactive')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-[14px] text-center text-[#024023] font-semibold">
                                            {item.createdAt || '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-[14px] font-semibold text-[#024023] text-center">
                                            <div className="flex space-x-2 justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => item.categoryId && onEdit && onEdit(item.categoryId)}
                                                    className="w-[47px] h-[34px] flex items-center justify-center rounded-md bg-[#739559] hover:bg-opacity-80 transition"
                                                >
                                                    <Image
                                                        src={Edit}
                                                        alt="Edit"
                                                        width={24}
                                                        height={24}
                                                    />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (isDeleteDisabled) {
                                                            return;
                                                        }
                                                        if (item.categoryId && onDelete) {
                                                            onDelete(item.categoryId);
                                                        }
                                                    }}
                                                    disabled={isDeleteDisabled}
                                                    className={`w-[47px] h-[34px] flex items-center justify-center rounded-md transition ${
                                                        isDeleteDisabled
                                                            ? 'bg-gray-300 cursor-not-allowed opacity-70'
                                                            : 'bg-red-500 hover:bg-red-600'
                                                    }`}
                                                >
                                                    <Image
                                                        src={Delete}
                                                        alt="Edit"
                                                        width={24}
                                                        height={24}
                                                    />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }
                            if(type === "account"){
                                const isActive = item.active ?? false;
                                const roleTokens = (item.roles ?? '')
                                    .split(',')
                                    .map(token => token.trim())
                                    .filter(Boolean);
                                const accountType = item.accountType ?? 'staff';
                                const detailHref = accountType === 'resident'
                                    ? `/accountDetailRe/${item.accountId ?? item.userId ?? ''}`
                                    : item.roles === 'admin' ? `/accountDetailStaff/${item.accountId ?? item.userId ?? ''}` : `/accountEditStaff/${item.accountId ?? item.userId ?? ''}`;
                                return (
                                    <tr
                                        key={item.userId ?? `account-${index}`}
                                        className={`${rowClass} ${borderClass}`}
                                    >
                                        <td className="px-4 py-3 whitespace-nowrap text-[14px] font-semibold text-[#024023] text-center">
                                            {item.username ?? '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-[14px] text-[#024023] text-center">
                                            {item.email ?? '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-[14px] text-[#024023] text-center">
                                            {roleTokens.length === 0 ? (
                                                '—'
                                            ) : (
                                                <div className="flex flex-wrap gap-1 justify-center">
                                                    {roleTokens.map((roleValue, roleIdx) => {
                                                        const badge = getRoleBadge(roleValue);
                                                        return (
                                                            <span
                                                                key={`${roleValue}-${roleIdx}`}
                                                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                                                            >
                                                                {badge.label}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-[14px] font-semibold text-center">
                                            <span
                                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                    isActive
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-gray-200 text-gray-600'
                                                }`}
                                            >
                                                {isActive ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-[14px] font-semibold text-[#024023] text-center">
                                            <div className="flex space-x-2 justify-center">
                                                <Link
                                                    href={detailHref}
                                                    className="w-[47px] h-[34px] flex items-center justify-center rounded-md bg-blue-500 hover:bg-blue-600 transition"
                                                >
                                                    <Image
                                                        src={Edit}
                                                        alt="Xem chi tiết"
                                                        width={24}
                                                        height={24}
                                                    />
                                                </Link>
                                                {item.roles === 'admin' ? (
                                                    <button 
                                                        onClick={() => {show('Bạn không có quyền chỉnh sửa tài khoản admin');}}
                                                        className="w-[47px] h-[34px] flex items-center justify-center rounded-md bg-gray-500 hover:bg-gray-600 transition"
                                                    >
                                                        <Image 
                                                            src={Delete} 
                                                            alt="Delete" 
                                                            width={24} 
                                                            height={24}
                                                        />
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const targetId = item.accountId ?? item.userId;
                                                            if (!targetId) {
                                                                show('Không thể xác định tài khoản để xoá.');
                                                                return;
                                                            }
                                                            if (onDelete) {
                                                                onDelete(targetId);
                                                            } else {
                                                                show('Chức năng xoá chưa được cấu hình.');
                                                            }
                                                        }}
                                                        className="w-[47px] h-[34px] flex items-center justify-center rounded-md bg-red-500 hover:bg-red-600 transition"
                                                    >
                                                        <Image
                                                            src={Delete}
                                                            alt="Delete"
                                                            width={24}
                                                            height={24}
                                                        />
                                                    </button>
                                                )}
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
                                                        className="w-[47px] h-[34px] flex items-center justify-center rounded-md bg-blue-500 hover:bg-blue-600 transition disabled:opacity-40"
                                                        onClick={() => item.newsId && onEdit(item.newsId)}
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Image 
                                                            src={Edit} 
                                                            alt="Edit" 
                                                            width={24} 
                                                            height={24}
                                                        />
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button 
                                                        className="w-[47px] h-[34px] flex items-center justify-center rounded-md bg-red-500 hover:bg-red-600 transition disabled:opacity-40"
                                                        onClick={() => item.newsId && onDelete(item.newsId)}
                                                        title="Xóa"
                                                    >
                                                        <Image 
                                                            src={Delete} 
                                                            alt="Delete" 
                                                            width={24} 
                                                            height={24}
                                                        />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }
                            if(type === "notification"){
                                return (
                                    <tr 
                                        key={item.notificationId} 
                                        className={`${rowClass} ${borderClass} cursor-pointer`}
                                    >
        
                                        <td className="px-4 py-3 text-[14px] text-[#024023] font-semibold text-left max-w-xs truncate">
                                            {item.title}
                                        </td>
                                        <td className="px-4 py-3 text-[14px] text-gray-700 text-left max-w-sm truncate">{item.message}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(item.type || '')}`}>
                                                {getTypeLabel(item.type || '')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-[14px] text-gray-700">{formatDate(item.createdAt || '')}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex space-x-2 justify-center">
                                                {onEdit && (
                                                    <button 
                                                        className="w-[47px] h-[34px] flex items-center justify-center rounded-md bg-blue-500 hover:bg-blue-600 transition disabled:opacity-40"
                                                        onClick={() => item.notificationId && onEdit(item.notificationId)}
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Image 
                                                            src={Edit} 
                                                            alt="Edit" 
                                                            width={24} 
                                                            height={24}
                                                        />
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button 
                                                        className="w-[47px] h-[34px] flex items-center justify-center rounded-md bg-red-500 hover:bg-red-600 transition disabled:opacity-40"
                                                        onClick={() => item.notificationId && onDelete(item.notificationId)}
                                                        title="Xóa"
                                                    >
                                                        <Image 
                                                            src={Delete} 
                                                            alt="Delete" 
                                                            width={24} 
                                                            height={24}
                                                        />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }
                            return null;
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
