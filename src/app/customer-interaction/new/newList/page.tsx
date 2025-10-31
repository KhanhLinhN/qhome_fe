'use client';
import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useNewsList } from '@/src/hooks/useNewsList';
import { deleteNews } from '@/src/services/customer-interaction/newService';
import { useAuth } from '@/src/contexts/AuthContext';
import Table from '@/src/components/base-service/Table';
import Select from '@/src/components/customer-interaction/Select';
import { getAllTenants, Tenant } from '@/src/services/base/tenantService';
import { useNotifications } from '@/src/hooks/useNotifications';

export default function NewsList() {
    const t = useTranslations('News');
    const router = useRouter();
    const { user } = useAuth();
    const { show } = useNotifications();
    
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [selectedTenantId, setSelectedTenantId] = useState<string>('');
    const [loadingTenants, setLoadingTenants] = useState(false);
    
    const { newsList, loading, error, refetch } = useNewsList(selectedTenantId);

    const headers = ['Tiêu đề', 'Tóm tắt', 'Trạng thái', 'Ngày xuất bản', 'Ngày hết hạn', 'Hành động'];

    // Fetch tenants when component mounts
    useEffect(() => {
        const fetchTenants = async () => {
            setLoadingTenants(true);
            try {
                const data = await getAllTenants();
                setTenants(data);
                
                // Set default tenant if user has tenantId
                if (user?.tenantId) {
                    setSelectedTenantId(user.tenantId);
                }
            } catch (error) {
                console.error('Lỗi khi tải danh sách dự án:', error);
                show('Không thể tải danh sách dự án', 'error');
            } finally {
                setLoadingTenants(false);
            }
        };

        fetchTenants();
    }, [user?.tenantId, show]);

    const handleAdd = () => {
        router.push('/customer-interaction/new/newAdd');
    };

    const handleTenantChange = (item: { name: string; value: string }) => {
        setSelectedTenantId(item.value);
    };

    const handleEdit = (id: string) => {
        router.push(`/customer-interaction/new/newEdit/${id}`);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa tin tức này?')) {
            return;
        }

        try {
            await deleteNews(id);
            show('Xóa tin tức thành công!', 'success');
            refetch(); // Refresh list after deletion
        } catch (error) {
            console.error('Error deleting news:', error);
            show('Có lỗi xảy ra khi xóa tin tức!', 'error');
        }
    };

    // Transform news list to table data format
    const tableData = newsList.map((news) => ({
        newsId: news.id,
        title: news.title,
        summary: news.summary,
        status: news.status,
        publishAt: news.publishAt,
        expireAt: news.expireAt,
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
                            <p className="text-red-600 mb-4">Có lỗi xảy ra khi tải danh sách tin tức!</p>
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
                            Danh sách tin tức
                        </h1>
                        <button
                            onClick={handleAdd}
                            className="px-6 py-2 bg-[#02542D] text-white rounded-lg hover:bg-opacity-80 transition shadow-md font-semibold"
                        >
                            + Thêm tin tức
                        </button>
                    </div>
                    
                    {/* Filter Section */}
                    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-semibold text-[#02542D] whitespace-nowrap">
                                Lọc theo dự án:
                            </label>
                            <div className="w-full max-w-md">
                                <Select
                                    options={[
                                        { name: 'Tất cả dự án', value: '' },
                                        ...tenants.map(tenant => ({ 
                                            name: tenant.name, 
                                            value: tenant.id 
                                        }))
                                    ]}
                                    value={selectedTenantId}
                                    onSelect={handleTenantChange}
                                    renderItem={(item) => item.name}
                                    getValue={(item) => item.value}
                                    placeholder={loadingTenants ? 'Đang tải...' : 'Chọn dự án'}
                                    disable={loadingTenants}
                                />
                            </div>
                            {selectedTenantId && (
                                <button
                                    onClick={() => setSelectedTenantId('')}
                                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Xóa bộ lọc
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table */}
                {newsList.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center text-gray-500">
                        Chưa có tin tức nào. Nhấn "Thêm tin tức" để tạo mới.
                    </div>
                ) : (
                    <>
                        <Table
                            data={tableData}
                            headers={headers}
                            type="news"
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                        {/* Summary */}
                        <div className="mt-4 text-sm text-gray-600">
                            Tổng số: <span className="font-semibold">{newsList.length}</span> tin tức
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

