'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useNewsList } from '@/src/hooks/useNewsList';
import { deleteNews } from '@/src/services/customer-interaction/newService';
import { useAuth } from '@/src/contexts/AuthContext';
import Table from '@/src/components/base-service/Table';
import Select from '@/src/components/customer-interaction/Select';
import { useNotifications } from '@/src/hooks/useNotifications';
import { NewsStatus, NotificationScope } from '@/src/types/news';
import { updateNews } from '@/src/services/customer-interaction/newService';
import { getBuildings, type Building } from '@/src/services/base/buildingService';
import Pagination from '@/src/components/customer-interaction/Pagination';

export default function NewsList() {
    const t = useTranslations('News');
    const router = useRouter();
    const { user } = useAuth();
    const { show } = useNotifications();
    
    const [selectedStatus, setSelectedStatus] = useState<NewsStatus | ''>('');
    const [pageNo, setPageNo] = useState<number>(0);
    const [pageSize] = useState<number>(10);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    
    const { newsList, loading, error, refetch } = useNewsList(selectedStatus || undefined);

    const headers = [t('title'), t('summary'), t('status'), t('publishDate'), t('endDate'), t('action')];

    // Sort news by createdAt desc (newest first)
    const orderedNews = useMemo(() => {
        if (!newsList || newsList.length === 0) return [];
        return newsList.slice().sort((a, b) => {
            const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return tb - ta; // Descending order (newest first)
        });
    }, [newsList]);

    // Paginate the sorted news
    const paginatedNews = useMemo(() => {
        const startIndex = pageNo * pageSize;
        const endIndex = startIndex + pageSize;
        return orderedNews.slice(startIndex, endIndex);
    }, [orderedNews, pageNo, pageSize]);

    const totalPages = useMemo(() => {
        return pageSize > 0 ? Math.ceil(orderedNews.length / pageSize) : 0;
    }, [orderedNews.length, pageSize]);

    const handlePageChange = (newPage: number) => {
        setPageNo(newPage);
    };

    const handleStatusChange = (item: { name: string; value: string }) => {
        setSelectedStatus(item.value as NewsStatus | '');
        setPageNo(0); // Reset to first page when filter changes
    };

    const handleAdd = () => {
        router.push('/customer-interaction/new/newAdd');
    };


    const handleEdit = (id: string) => {
        router.push(`/customer-interaction/new/newDetail/${id}`);
    };

    const [changeOpen, setChangeOpen] = useState(false);
    const [changeId, setChangeId] = useState<string | null>(null);
    const [changeStatus, setChangeStatus] = useState<NewsStatus | ''>('');
    const [changeScope, setChangeScope] = useState<NotificationScope>('INTERNAL');
    const [changeTargetRole, setChangeTargetRole] = useState<string>('ALL');
    const [changeBuildingId, setChangeBuildingId] = useState<string>('all');
    const [changing, setChanging] = useState(false);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [loadingBuildings, setLoadingBuildings] = useState<boolean>(false);

    const handleOpenChangeStatusTarget = (id: string) => {
        setChangeId(id);
        // Prefill from existing item if available
        const item = newsList.find(n => n.id === id);
        if (item) {
            setChangeStatus(item.status ?? '');
            setChangeScope(item.scope ?? 'INTERNAL');
            setChangeTargetRole(item.targetRole ?? 'ALL');
            setChangeBuildingId(item.targetBuildingId ?? 'all');
        } else {
            setChangeStatus('');
            setChangeScope('INTERNAL');
            setChangeTargetRole('ALL');
            setChangeBuildingId('all');
        }
        setChangeOpen(true);
    };

    const handleCloseChange = () => {
        setChangeOpen(false);
        setChangeId(null);
        setChanging(false);
    };

    useEffect(() => {
        if (!changeOpen) return;
        let mounted = true;
        const loadBuildings = async () => {
            setLoadingBuildings(true);
            try {
                const result = await getBuildings();
                if (mounted) {
                    setBuildings(result);
                }
            } catch (e) {
                console.error('Failed to load buildings for news change target', e);
                setBuildings([]);
            } finally {
                setLoadingBuildings(false);
            }
        };
        void loadBuildings();
        return () => {
            mounted = false;
        };
    }, [changeOpen]);

    const handleConfirmChange = async () => {
        if (!changeId) return;
        if (!changeStatus) {
            show(t('statusRequired'), 'error');
            return;
        }
        try {
            setChanging(true);
            await updateNews(changeId, {
                status: changeStatus as NewsStatus,
                scope: changeScope,
                targetRole: changeScope === 'INTERNAL' ? (changeTargetRole || 'ALL') : undefined,
                targetBuildingId: changeScope === 'EXTERNAL'
                    ? (changeBuildingId === 'all' ? null : changeBuildingId)
                    : undefined,
            });
            show(t('updated'), 'success');
            await refetch();
            handleCloseChange();
        } catch (e: any) {
            console.error('Failed to update news status/target', e);
            show(t('errorUpdate'), 'error');
            setChanging(false);
        }
    };

    const handleDeleteClick = (id: string) => {
        setPendingDeleteId(id);
        setShowDeleteConfirm(true);
    };

    const handleDelete = async () => {
        if (!pendingDeleteId) return;
        setShowDeleteConfirm(false);
        const id = pendingDeleteId;
        setPendingDeleteId(null);

        try {
            await deleteNews(id);
            show(t('successDelete'), 'success');
            refetch(); // Refresh list after deletion
        } catch (error) {
            console.error('Error deleting news:', error);
            show(t('errorDelete'), 'error');
        }
    };

    // Transform paginated news list to table data format
    const tableData = paginatedNews.map((news) => ({
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
                                    onClick={() => {
                                        setSelectedStatus('');
                                        setPageNo(0);
                                    }}
                                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    {t('removeFilter')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table */}
                {orderedNews.length === 0 ? (
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
                            onDelete={handleDeleteClick}
                            onNewsChangeStatusAndTarget={handleOpenChangeStatusTarget}
                        />
                        <Pagination
                            currentPage={pageNo + 1}
                            totalPages={totalPages}
                            onPageChange={(page) => handlePageChange(page - 1)}
                        />
                        {changeOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                                <div className="bg-white w-full max-w-md rounded-lg shadow-xl p-6">
                                    <div className="flex items-start justify-between border-b pb-3 mb-4">
                                        <h3 className="text-lg font-semibold text-[#02542D]">{t('changeStatusTarget')}</h3>
                                        <button
                                            onClick={handleCloseChange}
                                            className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex flex-col">
                                            <label className="text-sm font-medium text-[#02542D]">{t('status')}</label>
                                            <select
                                                value={changeStatus}
                                                onChange={(e) => setChangeStatus(e.target.value as NewsStatus)}
                                                className="mt-1 h-10 rounded-md border border-gray-300 px-3 text-sm text-[#02542D] focus:outline-none focus:ring-2 focus:ring-[#02542D]/30"
                                            >
                                                <option value="">{t('selectStatus')}</option>
                                                <option value="DRAFT">{t('draft')}</option>
                                                <option value="SCHEDULED">{t('scheduled')}</option>
                                                <option value="PUBLISHED">{t('published')}</option>
                                                <option value="HIDDEN">{t('hidden')}</option>
                                                <option value="EXPIRED">{t('expired')}</option>
                                                <option value="ARCHIVED">{t('archived')}</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-sm font-medium text-[#02542D]">{t('scope')}</label>
                                            <Select
                                                options={[
                                                    { name: t('internal'), value: 'INTERNAL' },
                                                    { name: t('external'), value: 'EXTERNAL' },
                                                ]}
                                                value={changeScope}
                                                onSelect={(item) => setChangeScope(item.value as NotificationScope)}
                                                renderItem={(item) => item.name}
                                                getValue={(item) => item.value}
                                                placeholder={t('scope')}
                                            />
                                        </div>
                                        {changeScope === 'INTERNAL' && (
                                            <div className="flex flex-col">
                                                <label className="text-sm font-medium text-[#02542D]">{t('targetRole')}</label>
                                                <Select
                                                    options={[
                                                        { name: t('targetRoleAll'), value: 'ALL' },
                                                        { name: t('targetRoleAdmin'), value: 'ADMIN' },
                                                        { name: t('targetRoleTechnician'), value: 'TECHNICIAN' },
                                                        { name: t('targetRoleSupporter'), value: 'SUPPORTER' },
                                                        { name: t('targetRoleAccount'), value: 'ACCOUNT' },
                                                        { name: t('targetRoleResident'), value: 'RESIDENT' },
                                                    ]}
                                                    value={changeTargetRole}
                                                    onSelect={(item) => setChangeTargetRole(item.value)}
                                                    renderItem={(item) => item.name}
                                                    getValue={(item) => item.value}
                                                    placeholder={t('targetRole')}
                                                />
                                            </div>
                                        )}
                                        {changeScope === 'EXTERNAL' && (
                                            <div className="flex flex-col">
                                                <label className="text-sm font-medium text-[#02542D]">{t('selectBuilding')}</label>
                                                {loadingBuildings ? (
                                                    <p className="text-gray-500 text-sm">{t('loadingBuildings')}</p>
                                                ) : (
                                                    <Select
                                                        options={[
                                                            { name: t('allBuildings'), value: 'all' },
                                                            ...buildings.map((b) => ({
                                                                name: `${b.name} (${b.code})`,
                                                                value: b.id,
                                                            })),
                                                        ]}
                                                        value={changeBuildingId}
                                                        onSelect={(item) => setChangeBuildingId(item.value)}
                                                        renderItem={(item) => item.name}
                                                        getValue={(item) => item.value}
                                                        placeholder={t('selectBuilding')}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-end gap-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={handleCloseChange}
                                            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
                                            disabled={changing}
                                        >
                                            {t('cancel')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleConfirmChange}
                                            className="px-4 py-2 rounded-lg bg-[#02542D] text-white hover:bg-opacity-80 transition disabled:opacity-50"
                                            disabled={changing}
                                        >
                                            {changing ? t('saving') : t('save')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Summary */}
                        {/* <div className="mt-4 text-sm text-gray-600">
                            Tổng số: <span className="font-semibold">{newsList.length}</span> tin tức
                        </div> */}
                    </>
                )}
            </div>

            {/* Delete Confirm Popup */}
            <PopupComfirm
                isOpen={showDeleteConfirm}
                onClose={() => {
                    setShowDeleteConfirm(false);
                    setPendingDeleteId(null);
                }}
                onConfirm={handleDelete}
                popupTitle={t('confirmDelete')}
                popupContext=""
                isDanger={true}
            />
        </div>
    );
}

