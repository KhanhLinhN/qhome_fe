'use client';
import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useNewsList } from '@/src/hooks/useNewsList';
import { deleteNews } from '@/src/services/customer-interaction/newService';
import { useAuth } from '@/src/contexts/AuthContext';
import Table from '@/src/components/base-service/Table';
import Select from '@/src/components/customer-interaction/Select';
import { useNotifications } from '@/src/hooks/useNotifications';
import { NewsStatus } from '@/src/types/news';

export default function NewsList() {
    const t = useTranslations('News');
    const router = useRouter();
    const { user } = useAuth();
    const { show } = useNotifications();
    
    const [selectedStatus, setSelectedStatus] = useState<NewsStatus | ''>('');
    
    const { newsList, loading, error, refetch } = useNewsList(selectedStatus || undefined);

    const headers = [t('title'), t('summary'), t('status'), t('publishDate'), t('endDate'), t('action')];

    const handleAdd = () => {
        router.push('/customer-interaction/new/newAdd');
    };

    const handleStatusChange = (item: { name: string; value: string }) => {
        setSelectedStatus(item.value as NewsStatus | '');
    };

    const handleEdit = (id: string) => {
        router.push(`/customer-interaction/new/newDetail/${id}`);
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('confirmDelete'))) {
            return;
        }

        try {
            await deleteNews(id);
            show(t('successDelete'), 'success');
            refetch(); // Refresh list after deletion
        } catch (error) {
            console.error('Error deleting news:', error);
            show(t('errorDelete'), 'error');
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
                            <p className="text-gray-600">{t('loading')}</p>
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
                            <p className="text-red-600 mb-4">{t('errorLoading')}</p>
                            <button
                                onClick={() => refetch()}
                                className="px-4 py-2 bg-[#02542D] text-white rounded-md hover:bg-opacity-80"
                            >
                                {t('retry')}
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
                            {t('newsList')}
                        </h1>
                        <button
                            onClick={handleAdd}
                            className="px-6 py-2 bg-[#02542D] text-white rounded-lg hover:bg-opacity-80 transition shadow-md font-semibold"
                        >
                            + {t('addNews')}
                        </button>
                    </div>
                    
                    {/* Filter Section */}
                    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-semibold text-[#02542D] whitespace-nowrap">
                                {t('selectStatus')}:
                            </label>
                            <div className="w-full max-w-md">
                                <Select
                                    options={[
                                        { name: t('allStatus'), value: '' },
                                        { name: t('draft'), value: 'DRAFT' },
                                        { name: t('scheduled'), value: 'SCHEDULED' },
                                        { name: t('published'), value: 'PUBLISHED' },
                                        { name: t('hidden'), value: 'HIDDEN' },
                                        { name: t('expired'), value: 'EXPIRED' },
                                    ]}
                                    value={selectedStatus}
                                    onSelect={handleStatusChange}
                                    renderItem={(item) => item.name}
                                    getValue={(item) => item.value}
                                    placeholder={t('selectStatus')}
                                />
                            </div>
                            {selectedStatus && (
                                <button
                                    onClick={() => setSelectedStatus('')}
                                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    {t('removeFilter')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table */}
                {newsList.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center text-gray-500">
                        {t('noNews')}
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
                        {/* <div className="mt-4 text-sm text-gray-600">
                            Tổng số: <span className="font-semibold">{newsList.length}</span> tin tức
                        </div> */}
                    </>
                )}
            </div>
        </div>
    );
}

