'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useNewsList } from '@/src/hooks/useNewsList';
import { useNotificationList } from '@/src/hooks/useNotificationList';
import { deleteNews, updateNews } from '@/src/services/customer-interaction/newService';
import { deleteNotification, updateNotification, getNotificationsForRoleIncludingAll } from '@/src/services/customer-interaction/notiService';
import { useAuth } from '@/src/contexts/AuthContext';
import Table from '@/src/components/base-service/Table';
import Select from '@/src/components/customer-interaction/Select';
import { useNotifications } from '@/src/hooks/useNotifications';
import { NewsStatus, NotificationScope } from '@/src/types/news';
import { NotificationType } from '@/src/types/notification';
import Pagination from '@/src/components/customer-interaction/Pagination';
import { getBuildings, type Building } from '@/src/services/base/buildingService';
import PopupConfirm from '@/src/components/common/PopupComfirm';

type TabType = 'news' | 'notifications';

export default function StaffContentManagement() {
    const t = useTranslations('News');
    const tNoti = useTranslations('Noti');
    const router = useRouter();
    const { user } = useAuth();
    const { show } = useNotifications();
    
    const [activeTab, setActiveTab] = useState<TabType>('news');
    const [selectedStatus, setSelectedStatus] = useState<NewsStatus | ''>('');
    const [selectedType, setSelectedType] = useState<NotificationType | ''>('');
    const [pageNo, setPageNo] = useState<number>(0);
    const [pageSize] = useState<number>(10);
    const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: TabType; id: string } | null>(null);
    
    const { newsList, loading: newsLoading, error: newsError, refetch: refetchNews } = useNewsList(selectedStatus || undefined);
    const { notificationList, loading: notiLoading, error: notiError, refetch: refetchNoti } = useNotificationList(selectedType || undefined);
    
    const loading = activeTab === 'news' ? newsLoading : notiLoading;
    const error = activeTab === 'news' ? newsError : notiError;
    
    const filteredNews = useMemo(() => {
        if (!newsList || newsList.length === 0) return [];
        if (!user?.roles?.[0]) return [];
        
        const userRole = user.roles[0].toUpperCase();
        return newsList.filter(news => {
            if (news.scope === 'INTERNAL') {
                if (!news.targetRole || news.targetRole.toUpperCase() === 'ALL') return true;
                return news.targetRole.toUpperCase() === userRole;
            }
            return false;
        });
    }, [newsList, user?.roles]);
    
    const filteredNotifications = useMemo(() => {
        if (!notificationList || notificationList.length === 0) return [];
        if (!user?.roles?.[0] || !user?.userId) return [];
        
        const userRole = user.roles[0].toUpperCase();
        return notificationList.filter(noti => {
            if (noti.scope === 'INTERNAL') {
                if (!noti.targetRole || noti.targetRole.toUpperCase() === 'ALL') return true;
                return noti.targetRole.toUpperCase() === userRole;
            }
            return false;
        });
    }, [notificationList, user?.roles, user?.userId]);
    
    const orderedNews = useMemo(() => {
        if (!filteredNews || filteredNews.length === 0) return [];
        return filteredNews.slice().sort((a, b) => {
            const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return tb - ta;
        });
    }, [filteredNews]);
    
    const orderedNotifications = useMemo(() => {
        if (!filteredNotifications || filteredNotifications.length === 0) return [];
        return filteredNotifications.slice().sort((a, b) => {
            const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return tb - ta;
        });
    }, [filteredNotifications]);
    
    const paginatedNews = useMemo(() => {
        const startIndex = pageNo * pageSize;
        const endIndex = startIndex + pageSize;
        return orderedNews.slice(startIndex, endIndex);
    }, [orderedNews, pageNo, pageSize]);
    
    const paginatedNotifications = useMemo(() => {
        const startIndex = pageNo * pageSize;
        const endIndex = startIndex + pageSize;
        return orderedNotifications.slice(startIndex, endIndex);
    }, [orderedNotifications, pageNo, pageSize]);
    
    const totalPages = useMemo(() => {
        const items = activeTab === 'news' ? orderedNews : orderedNotifications;
        return pageSize > 0 ? Math.ceil(items.length / pageSize) : 0;
    }, [activeTab, orderedNews.length, orderedNotifications.length, pageSize]);
    
    const handlePageChange = (newPage: number) => {
        setPageNo(newPage);
    };
    
    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setPageNo(0);
    };
    
    const handleStatusChange = (item: { name: string; value: string }) => {
        setSelectedStatus(item.value as NewsStatus | '');
        setPageNo(0);
    };
    
    const handleTypeChange = (item: { name: string; value: string }) => {
        setSelectedType(item.value as NotificationType | '');
        setPageNo(0);
    };
    
    const handleAdd = () => {
        if (activeTab === 'news') {
            router.push('/customer-interaction/new/newAdd');
        } else {
            router.push('/customer-interaction/notiAdd');
        }
    };
    
    const handleEdit = (id: string) => {
        if (activeTab === 'news') {
            router.push(`/customer-interaction/new/newDetail/${id}`);
        } else {
            router.push(`/customer-interaction/notiDetail/${id}`);
        }
    };
    
    const handleDelete = (id: string) => {
        setItemToDelete({ type: activeTab, id });
        setIsDeletePopupOpen(true);
    };
    
    const confirmDelete = async () => {
        if (!itemToDelete) return;
        
        try {
            if (itemToDelete.type === 'news') {
                await deleteNews(itemToDelete.id);
                show(t('successDelete'), 'success');
                refetchNews();
            } else {
                await deleteNotification(itemToDelete.id);
                show(tNoti('messages.deleteSuccess'), 'success');
                refetchNoti();
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            if (itemToDelete.type === 'news') {
                show(t('errorDelete'), 'error');
            } else {
                show(tNoti('messages.deleteError'), 'error');
            }
        } finally {
            setItemToDelete(null);
            setIsDeletePopupOpen(false);
        }
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
    
    const handleOpenChange = (id: string) => {
        setChangeId(id);
        if (activeTab === 'news') {
            const item = newsList.find(n => n.id === id);
            if (item) {
                setChangeStatus(item.status ?? '');
                setChangeScope(item.scope ?? 'INTERNAL');
                setChangeTargetRole(item.targetRole ?? 'ALL');
                setChangeBuildingId(item.targetBuildingId ?? 'all');
            }
        } else {
            const item = notificationList.find(n => n.id === id);
            if (item) {
                setChangeScope(item.scope ?? 'INTERNAL');
                setChangeTargetRole(item.targetRole ?? 'ALL');
                setChangeBuildingId(item.targetBuildingId ?? 'all');
            }
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
                console.error('Failed to load buildings', e);
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
        try {
            setChanging(true);
            if (activeTab === 'news') {
                if (!changeStatus) {
                    show(t('statusRequired'), 'error');
                    return;
                }
                await updateNews(changeId, {
                    status: changeStatus as NewsStatus,
                    scope: changeScope,
                    targetRole: changeScope === 'INTERNAL' ? (changeTargetRole || 'ALL') : undefined,
                    targetBuildingId: changeScope === 'EXTERNAL'
                        ? (changeBuildingId === 'all' ? null : changeBuildingId)
                        : undefined,
                });
                show(t('updated'), 'success');
                await refetchNews();
            } else {
                await updateNotification(changeId, {
                    scope: changeScope,
                    targetRole: changeScope === 'INTERNAL' ? (changeTargetRole || 'ALL') : undefined,
                    targetBuildingId: changeScope === 'EXTERNAL'
                        ? (changeBuildingId === 'all' ? null : changeBuildingId)
                        : undefined,
                });
                show(tNoti('messages.updateScopeSuccess'), 'success');
                await refetchNoti();
            }
            handleCloseChange();
        } catch (e: any) {
            console.error('Failed to update', e);
            if (activeTab === 'news') {
                show(t('errorUpdate'), 'error');
            } else {
                show(tNoti('messages.updateScopeError'), 'error');
            }
            setChanging(false);
        }
    };
    
    const newsHeaders = [t('title'), t('summary'), t('status'), t('publishDate'), t('endDate'), t('action')];
    const notiHeaders = [tNoti('title'), tNoti('content'), tNoti('type'), tNoti('createdAt'), tNoti('action')];
    
    const newsTableData = paginatedNews.map((news) => ({
        newsId: news.id,
        title: news.title,
        summary: news.summary,
        status: news.status,
        publishAt: news.publishAt,
        expireAt: news.expireAt,
    }));
    
    const notiTableData = paginatedNotifications.map((notification) => ({
        notificationId: notification.id,
        title: notification.title,
        message: notification.message.length > 100 ? notification.message.substring(0, 100) + '...' : notification.message,
        type: notification.type,
        createdAt: notification.createdAt,
    }));
    
    if (loading) {
        return (
            <div className="min-h-screen p-4 sm:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#02542D] mx-auto mb-4"></div>
                            <p className="text-gray-600">{activeTab === 'news' ? t('loading') : tNoti('loading')}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="min-h-screen p-4 sm:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <p className="text-red-600 mb-4">{activeTab === 'news' ? t('errorLoading') : tNoti('errors.loadListFailed')}</p>
                            <button
                                onClick={() => activeTab === 'news' ? refetchNews() : refetchNoti()}
                                className="px-4 py-2 bg-[#02542D] text-white rounded-md hover:bg-opacity-80"
                            >
                                {activeTab === 'news' ? t('retry') : tNoti('retry')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    const currentItems = activeTab === 'news' ? orderedNews : orderedNotifications;
    const currentTableData = activeTab === 'news' ? newsTableData : notiTableData;
    const currentHeaders = activeTab === 'news' ? newsHeaders : notiHeaders;
    
    return (
        <div className="min-h-screen p-4 sm:p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-semibold text-[#02542D]">
                            Quản lý Nội dung Nội bộ
                        </h1>
                        <button
                            onClick={handleAdd}
                            className="px-6 py-2 bg-[#02542D] text-white rounded-lg hover:bg-opacity-80 transition shadow-md font-semibold"
                        >
                            + {activeTab === 'news' ? t('addNews') : tNoti('addNotification')}
                        </button>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-1">
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleTabChange('news')}
                                className={`flex-1 px-4 py-2 rounded-md font-semibold transition ${
                                    activeTab === 'news'
                                        ? 'bg-[#02542D] text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                Tin tức ({orderedNews.length})
                            </button>
                            <button
                                onClick={() => handleTabChange('notifications')}
                                className={`flex-1 px-4 py-2 rounded-md font-semibold transition ${
                                    activeTab === 'notifications'
                                        ? 'bg-[#02542D] text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                Thông báo ({orderedNotifications.length})
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                        {activeTab === 'news' ? (
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
                        ) : (
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-semibold text-[#02542D] whitespace-nowrap">
                                    {tNoti('filterByType')}:
                                </label>
                                <div className="w-full max-w-md">
                                    <Select
                                        options={[
                                            { name: tNoti('allTypes'), value: '' },
                                            { name: tNoti('info'), value: 'NEWS' },
                                            { name: tNoti('request'), value: 'REQUEST' },
                                            { name: tNoti('bill'), value: 'BILL' },
                                            { name: tNoti('contract'), value: 'CONTRACT' },
                                            { name: tNoti('meterReading'), value: 'METER_READING' },
                                            { name: tNoti('system'), value: 'SYSTEM' },
                                        ]}
                                        value={selectedType}
                                        onSelect={handleTypeChange}
                                        renderItem={(item) => item.name}
                                        getValue={(item) => item.value}
                                        placeholder={tNoti('selectType')}
                                    />
                                </div>
                                {selectedType && (
                                    <button
                                        onClick={() => {
                                            setSelectedType('');
                                            setPageNo(0);
                                        }}
                                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                    >
                                        {tNoti('clearFilter')}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                {currentItems.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center text-gray-500">
                        {activeTab === 'news' ? t('noNews') : tNoti('emptyList')}
                    </div>
                ) : (
                    <>
                        <Table
                            data={currentTableData}
                            headers={currentHeaders}
                            type={activeTab === 'news' ? 'news' : 'notification'}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onNewsChangeStatusAndTarget={activeTab === 'news' ? handleOpenChange : undefined}
                            onNotificationChangeScope={activeTab === 'notifications' ? handleOpenChange : undefined}
                        />
                        <Pagination
                            currentPage={pageNo + 1}
                            totalPages={totalPages}
                            onPageChange={(page) => handlePageChange(page - 1)}
                        />
                    </>
                )}
                
                {changeOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                        <div className="bg-white w-full max-w-md rounded-lg shadow-xl p-6">
                            <div className="flex items-start justify-between border-b pb-3 mb-4">
                                <h3 className="text-lg font-semibold text-[#02542D]">
                                    {activeTab === 'news' ? t('changeStatusTarget') : tNoti('changeScopeModal.title')}
                                </h3>
                                <button
                                    onClick={handleCloseChange}
                                    className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="space-y-4">
                                {activeTab === 'news' && (
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
                                )}
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-[#02542D]">
                                        {activeTab === 'news' ? t('scope') : tNoti('changeScopeModal.scope')}
                                    </label>
                                    <Select
                                        options={[
                                            { name: t('internal'), value: 'INTERNAL' },
                                            { name: t('external'), value: 'EXTERNAL' },
                                        ]}
                                        value={changeScope}
                                        onSelect={(item) => setChangeScope(item.value as NotificationScope)}
                                        renderItem={(item) => item.name}
                                        getValue={(item) => item.value}
                                        placeholder={activeTab === 'news' ? t('scope') : tNoti('changeScopeModal.selectScope')}
                                    />
                                </div>
                                {changeScope === 'INTERNAL' && (
                                    <div className="flex flex-col">
                                        <label className="text-sm font-medium text-[#02542D]">
                                            {activeTab === 'news' ? t('targetRole') : tNoti('changeScopeModal.targetRole')}
                                        </label>
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
                                            placeholder={activeTab === 'news' ? t('targetRole') : tNoti('changeScopeModal.selectTargetRole')}
                                        />
                                    </div>
                                )}
                                {changeScope === 'EXTERNAL' && (
                                    <div className="flex flex-col">
                                        <label className="text-sm font-medium text-[#02542D]">
                                            {activeTab === 'news' ? t('selectBuilding') : tNoti('changeScopeModal.selectBuilding')}
                                        </label>
                                        {loadingBuildings ? (
                                            <p className="text-gray-500 text-sm">
                                                {activeTab === 'news' ? t('loadingBuildings') : tNoti('changeScopeModal.loadingBuildings')}
                                            </p>
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
                                                placeholder={activeTab === 'news' ? t('selectBuilding') : tNoti('changeScopeModal.selectBuilding')}
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
                                    {activeTab === 'news' ? t('cancel') : tNoti('changeScopeModal.cancel')}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmChange}
                                    className="px-4 py-2 rounded-lg bg-[#02542D] text-white hover:bg-opacity-80 transition disabled:opacity-50"
                                    disabled={changing}
                                >
                                    {changing ? (activeTab === 'news' ? t('saving') : tNoti('changeScopeModal.saving')) : (activeTab === 'news' ? t('save') : tNoti('changeScopeModal.save'))}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                <PopupConfirm
                    isOpen={isDeletePopupOpen}
                    onClose={() => {
                        setIsDeletePopupOpen(false);
                        setItemToDelete(null);
                    }}
                    onConfirm={confirmDelete}
                    popupTitle={activeTab === 'news' ? t('confirmDelete') : tNoti('deleteConfirm.title')}
                    popupContext={activeTab === 'news' ? t('confirmDelete') : tNoti('deleteConfirm.message')}
                    isDanger={true}
                />
            </div>
        </div>
    );
}


