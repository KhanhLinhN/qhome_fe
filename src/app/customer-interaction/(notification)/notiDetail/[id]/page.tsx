'use client';
import React, { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Arrow from '@/src/assets/Arrow.svg';
import { useRouter, useParams } from 'next/navigation';
import { getNotificationDetail } from '@/src/services/customer-interaction/notiService';
import { Notification } from '@/src/types/notification';
import { useNotifications } from '@/src/hooks/useNotifications';
import { getBuilding, Building } from '@/src/services/base/buildingService';
import { useTranslations } from 'next-intl';

export default function NotificationDetail() {
    const router = useRouter();
    const params = useParams();
    const { show } = useNotifications();
    const id = params?.id as string;
    const t = useTranslations("Noti");

    const [notification, setNotification] = useState<Notification | null>(null);
    const [loading, setLoading] = useState(true);
    const [building, setBuilding] = useState<Building | null>(null);

    useEffect(() => {
        const fetchNotification = async () => {
            if (!id) return;

            setLoading(true);
            try {
                const data = await getNotificationDetail(id);
                setNotification(data);
                
                // Fetch building if targetBuildingId exists
                if (data.scope === 'EXTERNAL' && data.targetBuildingId) {
                    try {
                        const buildingData = await getBuilding(data.targetBuildingId);
                        setBuilding(buildingData);
                    } catch (error) {
                        console.error('Error fetching building:', error);
                    }
                }
            } catch (error) {
                console.error('Error fetching notification detail:', error);
                show(t('fetchDetailError'), 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchNotification();
    }, [id, show]);

    const handleBack = () => {
        router.push(`/customer-interaction/notiList`);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateString;
        }
    };

    const getTypeLabel = (type: string) => {
        const typeMap: { [key: string]: string } = {
            'INFO': t('information'),
            'WARNING': t('warning'),
            'ALERT': t('alert'),
            'SUCCESS': t('success'),
            'ANNOUNCEMENT': t('announcement'),
        };
        return typeMap[type] || type;
    };

    const getTypeColor = (type: string) => {
        const colorMap: { [key: string]: string } = {
            'INFO': 'bg-blue-100 text-blue-800',
            'WARNING': 'bg-yellow-100 text-yellow-800',
            'ALERT': 'bg-red-100 text-red-800',
            'SUCCESS': 'bg-green-100 text-green-800',
            'ANNOUNCEMENT': 'bg-purple-100 text-purple-800',
        };
        return colorMap[type] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="min-h-screen p-4 sm:p-8">
                <div className="max-w-4xl mx-auto">
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

    if (!notification) {
        return (
            <div className="min-h-screen p-4 sm:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
                        <p className="text-red-600 mb-4">{t('notFound')}</p>
                        <button
                            onClick={handleBack}
                            className="px-4 py-2 bg-[#02542D] text-white rounded-md hover:bg-opacity-80"
                        >
                            {t('goBack')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 sm:p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <div
                    className="mb-6 flex items-center cursor-pointer"
                    onClick={handleBack}
                >
                    <Image
                        src={Arrow}
                        alt="Back"
                        width={20}
                        height={20}
                        className="w-5 h-5 mr-2"
                    />
                    <span className="text-[#02542D] font-bold text-2xl hover:text-opacity-80 transition duration-150">
                        {t('goBack')}
                    </span>
                </div>

                {/* Notification Detail Card */}
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 sm:p-8">
                    {/* Header */}
                    <div className="border-b pb-4 mb-6">
                        <h1 className="text-3xl font-bold text-[#02542D] mb-2">
                            {notification.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className={`px-3 py-1 rounded-full font-semibold ${getTypeColor(notification.type)}`}>
                                {getTypeLabel(notification.type)}
                            </span>
                            <span className="px-3 py-1 rounded-full font-semibold bg-gray-100 text-gray-800">
                                {notification.scope === 'INTERNAL' ? 'Nội bộ' : 'Bên ngoài'}
                            </span>
                            {notification.createdAt && (
                                <span>{t('createdAt')}: {formatDate(notification.createdAt)}</span>
                            )}
                        </div>
                    </div>

                    {/* Icon */}
                    {notification.iconUrl && (
                        <div className="mb-6">
                            <img
                                src={notification.iconUrl}
                                alt="Notification icon"
                                className="w-16 h-16 rounded-lg border border-gray-300"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>
                    )}

                    {/* Message */}
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-[#02542D] mb-2">{t('content')}</h2>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{notification.message}</p>
                    </div>

                    {/* Action URL */}
                    {notification.actionUrl && (
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-[#02542D] mb-2">{t('actionUrl')}</h2>
                            <a
                                href={notification.actionUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                            >
                                {notification.actionUrl}
                            </a>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="border-t pt-6 mt-6">
                        <h2 className="text-lg font-semibold text-[#02542D] mb-4">{t('information')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-semibold text-gray-700">{t('scope')}:</span>
                                <span className="ml-2 text-gray-600">
                                    {notification.scope === 'INTERNAL' ? t('internal') : t('external')}
                                </span>
                            </div>
                            {notification.targetRole && (
                                <div>
                                    <span className="font-semibold text-gray-700">{t('targetRole')}:</span>
                                    <span className="ml-2 text-gray-600">{notification.targetRole}</span>
                                </div>
                            )}
                            {notification.scope === 'EXTERNAL' && (
                                <div>
                                    <span className="font-semibold text-gray-700">{t('building')}:</span>
                                    <span className="ml-2 text-gray-600">
                                        {building 
                                            ? `${building.name} (${building.code})`
                                            : notification.targetBuildingId 
                                            ? `ID: ${notification.targetBuildingId}`
                                            : 'Tất cả tòa nhà'}
                                    </span>
                                </div>
                            )}
                            {notification.referenceId && (
                                <div>
                                    <span className="font-semibold text-gray-700">{t('referenceId')}:</span>
                                    <span className="ml-2 text-gray-600">{notification.referenceId}</span>
                                </div>
                            )}
                            {notification.referenceType && (
                                <div>
                                    <span className="font-semibold text-gray-700">{t('referenceType')}:</span>
                                    <span className="ml-2 text-gray-600">{notification.referenceType}</span>
                                </div>
                            )}
                            {notification.createdAt && (
                                <div>
                                    <span className="font-semibold text-gray-700">{t('createdAt')}:</span>
                                    <span className="ml-2 text-gray-600">{formatDate(notification.createdAt)}</span>
                                </div>
                            )}
                            {notification.updatedAt && (
                                <div>
                                    <span className="font-semibold text-gray-700">{t('updatedAt')}:</span>
                                    <span className="ml-2 text-gray-600">{formatDate(notification.updatedAt)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center space-x-3 mt-8">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                        >
                            {t('back')}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push(`/customer-interaction/notiEdit/${id}`)}
                            className="px-6 py-2 bg-[#02542D] text-white rounded-lg hover:bg-opacity-80 transition shadow-md"
                        >
                            {t('edit')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

