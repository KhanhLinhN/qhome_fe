'use client';
import React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useNewsList } from '@/src/hooks/useNewsList';
import { deleteNews } from '@/src/services/customer-interaction/newService';
import { useAuth } from '@/src/contexts/AuthContext';
import Table from '@/src/components/base-service/Table';

export default function NewsList() {
    const t = useTranslations('News');
    const router = useRouter();
    const { newsList, loading, error, refetch } = useNewsList();
    const { user } = useAuth();

    const headers = ['Tiêu đề', 'Tóm tắt', 'Trạng thái', 'Ngày xuất bản', 'Ngày hết hạn', 'Hành động'];

    const handleAdd = () => {
        router.push('/customer-interaction/new/newAdd');
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
            alert('Xóa tin tức thành công!');
            refetch(); // Refresh list after deletion
        } catch (error) {
            console.error('Error deleting news:', error);
            alert('Có lỗi xảy ra khi xóa tin tức!');
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
            <div className="min-h-screen bg-[#F5F7FA] p-4 sm:p-8">
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
            <div className="min-h-screen bg-[#F5F7FA] p-4 sm:p-8">
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
        <div className="min-h-screen bg-[#F5F7FA] p-4 sm:p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
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

