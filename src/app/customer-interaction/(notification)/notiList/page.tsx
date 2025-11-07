'use client';
import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useNotificationList } from '@/src/hooks/useNotificationList';
import { deleteNotification } from '@/src/services/customer-interaction/notiService';
import { useAuth } from '@/src/contexts/AuthContext';
import Table from '@/src/components/base-service/Table';
import Select from '@/src/components/customer-interaction/Select';
import { useNotifications } from '@/src/hooks/useNotifications';
import { NotificationType } from '@/src/types/notification';
import PopupConfirm from '@/src/components/common/PopupComfirm';

export default function NotificationList() {
    const t = useTranslations('Noti');
    const router = useRouter();
    const { user } = useAuth();
    const { show } = useNotifications();
    
    const [selectedType, setSelectedType] = useState<NotificationType | ''>('');
    const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
    const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
    
    const { notificationList, loading, error, refetch } = useNotificationList(selectedType || undefined);

    const headers = [t('title'), t('content'), t('type'), t('createdAt'), t('action')];

    const handleAdd = () => {
        router.push('/customer-interaction/notiAdd');
    };

    const handleTypeChange = (item: { name: string; value: string }) => {
        setSelectedType(item.value as NotificationType | '');
    };

    const handleEdit = (id: string) => {
        router.push(`/customer-interaction/notiDetail/${id}`);
    };

    const handleDelete = (id: string) => {
        setNotificationToDelete(id);
        setIsDeletePopupOpen(true);
    };

    const confirmDelete = async () => {
        if (!notificationToDelete) return;

        try {
            await deleteNotification(notificationToDelete);
            show('Xóa thông báo thành công!', 'success');
            refetch(); // Refresh list after deletion
        } catch (error) {
            console.error('Error deleting notification:', error);
            show('Có lỗi xảy ra khi xóa thông báo!', 'error');
        } finally {
            setNotificationToDelete(null);
        }
    };

    // Transform notification list to table data format
    const tableData = notificationList.map((notification) => ({
        notificationId: notification.id,
        title: notification.title,
        message: notification.message.length > 100 ? notification.message.substring(0, 100) + '...' : notification.message,
        type: notification.type,
        createdAt: notification.createdAt,
    }));

    // Handle loading state
    if (loading) {
        return (
            <div className="min-h-screen  p-4 sm:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#02542D] mx-auto mb-4"></div>
                            <p className="text-gray-600">Đang tải...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Handle error state
    if (error) {
        return (
            <div className="min-h-screen  p-4 sm:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <p className="text-red-600 mb-4">Có lỗi xảy ra khi tải danh sách thông báo!</p>
                            <button
                                onClick={() => refetch()}
                                className="px-4 py-2 bg-[#02542D] text-white rounded-md hover:bg-opacity-80"
                            >
                                Thử lại
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen  p-4 sm:p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-semibold text-[#02542D]">
                            Danh sách thông báo
                        </h1>
                        <button
                            onClick={handleAdd}
                            className="px-6 py-2 bg-[#02542D] text-white rounded-lg hover:bg-opacity-80 transition shadow-md font-semibold"
                        >
                            + Thêm thông báo
                        </button>
                    </div>
                    
                    {/* Filter Section */}
                    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-semibold text-[#02542D] whitespace-nowrap">
                                Lọc theo loại:
                            </label>
                            <div className="w-full max-w-md">
                                <Select
                                    options={[
                                        { name: 'Tất cả loại', value: '' },
                                        { name: 'Thông tin', value: 'NEWS' },
                                        { name: 'Yêu cầu', value: 'REQUEST' },
                                        { name: 'Hóa đơn', value: 'BILL' },
                                        { name: 'Hợp đồng', value: 'CONTRACT' },
                                        { name: 'Đọc điện nước', value: 'METER_READING' },
                                        { name: 'Hệ thống', value: 'SYSTEM' },
                                    ]}
                                    value={selectedType}
                                    onSelect={handleTypeChange}
                                    renderItem={(item) => item.name}
                                    getValue={(item) => item.value}
                                    placeholder="Chọn loại"
                                />
                            </div>
                            {selectedType && (
                                <button
                                    onClick={() => setSelectedType('')}
                                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Xóa bộ lọc
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table */}
                {notificationList.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center text-gray-500">
                        Chưa có thông báo nào. Nhấn "Thêm thông báo" để tạo mới.
                    </div>
                ) : (
                    <>
                        <Table
                            data={tableData}
                            headers={headers}
                            type="notification"
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                        {/* Summary */}
                        <div className="mt-4 text-sm text-gray-600">
                            Tổng số: <span className="font-semibold">{notificationList.length}</span> thông báo
                        </div>
                    </>
                )}
            </div>

            {/* Delete Confirmation Popup */}
            <PopupConfirm
                isOpen={isDeletePopupOpen}
                onClose={() => {
                    setIsDeletePopupOpen(false);
                    setNotificationToDelete(null);
                }}
                onConfirm={confirmDelete}
                popupTitle="Xác nhận xóa"
                popupContext="Bạn có chắc chắn muốn xóa thông báo này? Hành động này không thể hoàn tác."
                isDanger={true}
            />
        </div>
    );
}

