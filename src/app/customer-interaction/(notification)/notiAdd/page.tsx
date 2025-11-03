'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Arrow from '@/src/assets/Arrow.svg';
import DetailField from '@/src/components/base-service/DetailField';
import Select from '@/src/components/customer-interaction/Select';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/src/contexts/AuthContext';
import { getBuildings, Building } from '@/src/services/base/buildingService';
import { useNotificationAdd } from '@/src/hooks/useNotificationAdd';
import { 
    CreateNotificationRequest, 
} from '@/src/services/customer-interaction/notiService';
import { NotificationScope, NotificationType } from '@/src/types/notification';
import { useNotifications } from '@/src/hooks/useNotifications';

interface NotificationFormData {
    type: NotificationType;
    title: string;
    message: string;
    scope: NotificationScope;
    targetRole?: string;
    targetBuildingId?: string | null;
    referenceId?: string | null;
    referenceType?: string | null;
    actionUrl?: string | null;
    iconUrl?: string | null;
}

export default function NotificationAdd() {
    const router = useRouter();
    const t = useTranslations('Notification');
    const { user } = useAuth();
    const { addNotification, loading, error, isSubmitting } = useNotificationAdd();
    const { show } = useNotifications();

    const [buildings, setBuildings] = useState<Building[]>([]);
    const [selectedBuildingId, setSelectedBuildingId] = useState<string>('all'); // 'all' means all buildings, otherwise building.id
    const [loadingBuildings, setLoadingBuildings] = useState(false);

    const [formData, setFormData] = useState<NotificationFormData>({
        type: 'INFO',
        title: '',
        message: '',
        scope: 'EXTERNAL',
        targetRole: undefined,
        targetBuildingId: undefined,
        referenceId: null,
        referenceType: null,
        actionUrl: null,
        iconUrl: null,
    });

    // Validation errors state
    const [errors, setErrors] = useState<{
        title?: string;
        message?: string;
    }>({});

    // Fetch buildings when scope is EXTERNAL
    useEffect(() => {
        const fetchBuildings = async () => {
            if (formData.scope === 'EXTERNAL') {
                setLoadingBuildings(true);
                try {
                    const allBuildings = await getBuildings();
                    setBuildings(allBuildings);
                } catch (error) {
                    console.error('Lỗi khi tải danh sách tòa nhà:', error);
                    show('Không thể tải danh sách tòa nhà', 'error');
                } finally {
                    setLoadingBuildings(false);
                }
            } else {
                setBuildings([]);
                setSelectedBuildingId('all');
            }
        };

        fetchBuildings();
    }, [formData.scope, show]);

    const handleBack = () => {
        router.push('/customer-interaction/notiList');
    };

    // Validate individual field
    const validateField = (fieldName: string, value: string) => {
        const newErrors = { ...errors };
        
        switch (fieldName) {
            case 'title':
                if (!value || value.trim() === '') {
                    newErrors.title = 'Vui lòng nhập tiêu đề thông báo';
                } else {
                    delete newErrors.title;
                }
                break;
            case 'message':
                if (!value || value.trim() === '') {
                    newErrors.message = 'Vui lòng nhập nội dung thông báo';
                } else {
                    delete newErrors.message;
                }
                break;
        }
        
        setErrors(newErrors);
    };

    // Validate all fields
    const validateAllFields = (): boolean => {
        const newErrors: {
            title?: string;
            message?: string;
        } = {};

        // Validate title
        if (!formData.title || formData.title.trim() === '') {
            newErrors.title = 'Vui lòng nhập tiêu đề thông báo';
        }

        // Validate message
        if (!formData.message || formData.message.trim() === '') {
            newErrors.message = 'Vui lòng nhập nội dung thông báo';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isSubmitting) return;

        // Validate all fields
        if (!validateAllFields()) {
            show('Vui lòng kiểm tra lại các trường bắt buộc', 'error');
            return;
        }

        // Additional validations
        if (formData.scope === 'INTERNAL' && !formData.targetRole) {
            show('Vui lòng chọn target role cho thông báo INTERNAL', 'error');
            return;
        }

        try {
            // Build request object, only including fields that have values
            const request: CreateNotificationRequest = {
                type: formData.type,
                title: formData.title,
                message: formData.message,
                scope: formData.scope,
            };

            // Add optional fields only if they have values
            if (formData.scope === 'INTERNAL' && formData.targetRole && formData.targetRole.trim()) {
                request.targetRole = formData.targetRole.trim();
            }
            if (formData.scope === 'EXTERNAL') {
                request.targetBuildingId = selectedBuildingId === 'all' ? null : (selectedBuildingId || null);
            }
            if (formData.referenceId && formData.referenceId.trim()) {
                request.referenceId = formData.referenceId.trim();
            }
            if (formData.referenceType && formData.referenceType.trim()) {
                request.referenceType = formData.referenceType.trim();
            }
            if (formData.actionUrl && formData.actionUrl.trim()) {
                request.actionUrl = formData.actionUrl.trim();
            }
            if (formData.iconUrl && formData.iconUrl.trim()) {
                request.iconUrl = formData.iconUrl.trim();
            }

            console.log('Creating notification:', request);
            const createdNotification = await addNotification(request);
            
            // Show success message
            show('Tạo thông báo thành công!', 'success');
            
            // Redirect to notification list
            router.push(`/customer-interaction/notiList`);
        } catch (error) {
            console.error('Lỗi khi tạo thông báo:', error);
            show('Có lỗi xảy ra khi tạo thông báo!', 'error');
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Validate field on change
        validateField(name, value);
    };

    const handleTypeChange = (item: { name: string; value: string }) => {
        setFormData((prevData) => ({
            ...prevData,
            type: item.value as NotificationType,
        }));
    };

    const handleScopeChange = (item: { name: string; value: string }) => {
        setSelectedBuildingId('all');
        setFormData((prevData) => ({
            ...prevData,
            scope: item.value as NotificationScope,
            targetRole: undefined,
            targetBuildingId: undefined,
        }));
    };

    const handleBuildingChange = (item: { name: string; value: string }) => {
        setSelectedBuildingId(item.value);
        setFormData((prev) => ({
            ...prev,
            targetBuildingId: item.value === 'all' ? null as any : item.value,
        }));
    };

    function handleTargetRoleChange(item: { name: string; value: string; }): void {
        setFormData((prev) => ({
            ...prev,
            targetRole: item.value,
        }));
    }

    return (
        <div className={`min-h-screen  p-4 sm:p-8 font-sans`}>
            <div
                className="max-w-4xl mx-auto mb-6 flex items-center cursor-pointer"
                onClick={handleBack}
            >
                <Image
                    src={Arrow}
                    alt="Back"
                    width={20}
                    height={20}
                    className="w-5 h-5 mr-2"
                />
                <span
                    className={`text-[#02542D] font-bold text-2xl hover:text-opacity-80 transition duration-150 `}
                >
                    Quay lại danh sách thông báo
                </span>
            </div>

            <form
                className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200"
                onSubmit={handleSubmit}
            >
                <div className="flex justify-between items-start border-b pb-4 mb-6">
                    <div className="flex items-center">
                        <h1 className={`text-2xl font-semibold text-[#02542D] mr-3`}>
                            Thêm thông báo mới
                        </h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    {/* Type */}
                    <div className={`col-span-full`}>
                        <label className="text-md font-bold text-[#02542D] mb-1">
                            Loại thông báo
                        </label>
                        <Select
                            options={[
                                { name: 'Thông tin', value: 'NEWS' },
                                { name: 'Yêu cầu', value: 'REQUEST' },
                                { name: 'Hóa đơn', value: 'BILL' },
                                { name: 'Hợp đồng', value: 'CONTRACT' },
                                { name: 'Đọc điện nước', value: 'METER_READING' },
                                { name: 'Hệ thống', value: 'SYSTEM' },
                            ]}
                            value={formData.type}
                            onSelect={handleTypeChange}
                            renderItem={(item) => item.name}
                            getValue={(item) => item.value}
                            placeholder="Chọn loại thông báo"
                        />
                    </div>

                    {/* Title */}
                    <div className="col-span-full">
                        <DetailField
                            label="Tiêu đề"
                            value={formData.title}
                            onChange={handleChange}
                            name="title"
                            placeholder="Nhập tiêu đề thông báo"
                            readonly={false}
                            required={true}
                            error={errors.title}
                        />
                    </div>

                    {/* Message */}
                    <div className="col-span-full">
                        <DetailField
                            label="Nội dung"
                            value={formData.message}
                            onChange={handleChange}
                            name="message"
                            type="textarea"
                            placeholder="Nhập nội dung thông báo"
                            readonly={false}
                            required={true}
                            error={errors.message}
                        />
                    </div>

                    {/* Scope */}
                    <div className={`flex flex-col mb-4 col-span-1`}>
                        <label className="text-md font-bold text-[#02542D] mb-1">
                            Phạm vi (Scope)
                        </label>
                        <Select
                            options={[
                                { name: 'Nội bộ (INTERNAL)', value: 'INTERNAL' },
                                { name: 'Bên ngoài (EXTERNAL)', value: 'EXTERNAL' }
                            ]}
                            value={formData.scope}
                            onSelect={handleScopeChange}
                            renderItem={(item) => item.name}
                            getValue={(item) => item.value}
                            placeholder="Chọn phạm vi"
                        />
                    </div>

                    {/* Target Role (for INTERNAL) */}
                    {formData.scope === 'INTERNAL' && (
                        <div className="flex flex-col mb-4 col-span-1">
                            <label className="text-md font-bold text-[#02542D] mb-1 block">
                                Target Role <span className="text-red-500">*</span>
                            </label>
                            <Select
                                options={[
                                    { name: 'Tất cả', value: 'ALL' },
                                    { name: 'Quản trị viên', value: 'ADMIN' },
                                    { name: 'Kỹ sư', value: 'TECHNICIAN' },
                                    { name: 'Hỗ trợ', value: 'SUPPORTER' },
                                    { name: 'Tài khoản', value: 'ACCOUNT' },
                                    { name: 'Cư dân', value: 'RESIDENT' },
                                ]}
                                value={formData.targetRole}
                                onSelect={handleTargetRoleChange}
                                renderItem={(item) => item.name}
                                getValue={(item) => item.value}
                                placeholder="Chọn target role"
                            />
                        </div>
                    )}

                    {/* Target Building (for EXTERNAL) */}
                    {formData.scope === 'EXTERNAL' && (
                        <div className="flex flex-col mb-4 col-span-1">
                            <label className="text-md font-bold text-[#02542D] mb-1 block">
                                Chọn tòa nhà
                            </label>
                            {loadingBuildings ? (
                                <p className="text-gray-500 text-sm">Đang tải danh sách tòa nhà...</p>
                            ) : (
                                <Select
                                    options={[
                                        { name: 'Tất cả tòa nhà', value: 'all' },
                                        ...buildings.map(b => ({ 
                                            name: `${b.name} (${b.code})`, 
                                            value: b.id 
                                        }))
                                    ]}
                                    value={selectedBuildingId}
                                    onSelect={handleBuildingChange}
                                    renderItem={(item) => item.name}
                                    getValue={(item) => item.value}
                                    placeholder="Chọn tòa nhà"
                                />
                            )}
                        </div>
                    )}

                    {/* Action URL */}
                    <div className="col-span-1">
                        <DetailField
                            label="Action URL"
                            value={formData.actionUrl || ''}
                            onChange={handleChange}
                            name="actionUrl"
                            placeholder="Nhập Action URL (tùy chọn)"
                            readonly={false}
                        />
                    </div>

                    {/* Icon URL */}
                    <div className="col-span-1">
                        <DetailField
                            label="Icon URL"
                            value={formData.iconUrl || ''}
                            onChange={handleChange}
                            name="iconUrl"
                            placeholder="Nhập Icon URL (tùy chọn)"
                            readonly={false}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="col-span-full flex justify-center space-x-3 mt-8">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                            disabled={isSubmitting}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-[#02542D] text-white rounded-lg hover:bg-opacity-80 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

