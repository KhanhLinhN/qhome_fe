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
import DateBox from '@/src/components/customer-interaction/DateBox';
import { useNewAdd } from '@/src/hooks/useNewAdd';
import { 
    updateNews, 
    CreateNewsRequest, 
    UpdateNewsRequest, 
    NewsImageDto, 
    uploadMultipleNewsImages,
    uploadNewsImageFile,
    uploadNewsImageFiles
} from '@/src/services/customer-interaction/newService';
import { NotificationScope, NewsStatus } from '@/src/types/news';
import { useNotifications } from '@/src/hooks/useNotifications';

interface NewsImage {
    url: string;
    caption: string;
    sortOrder: number;
    file?: File;
    preview?: string;
}

interface NewsTarget {
    targetType: string;
    buildingId: string | null;
    buildingName?: string | null;
}

interface NewsFormData {
    title: string;
    summary: string;
    bodyHtml: string;
    coverImageUrl: string;
    status: NewsStatus;
    publishAt: string;
    expireAt: string;
    displayOrder: number;
    images: NewsImage[];
    scope: NotificationScope;
    targetRole?: string;
    targetBuildingId?: string | null;
}

export default function NewsAdd() {
    const router = useRouter();
    const t = useTranslations('News');
    const { user } = useAuth();
    const { addNews, loading, error, isSubmitting } = useNewAdd();
    const { show } = useNotifications();

    const [buildings, setBuildings] = useState<Building[]>([]);
    const [selectedBuildingId, setSelectedBuildingId] = useState<string>('all'); // 'all' means all buildings, otherwise building.id
    const [loadingBuildings, setLoadingBuildings] = useState(false);
    const [uploadingCoverImage, setUploadingCoverImage] = useState(false);
    const [uploadingDetailImage, setUploadingDetailImage] = useState(false);

    const [formData, setFormData] = useState<NewsFormData>({
        title: '',
        summary: '',
        bodyHtml: '',
        coverImageUrl: '',
        status: 'DRAFT',
        publishAt: '',
        expireAt: '',
        displayOrder: 1,
        images: [],
        scope: 'EXTERNAL',
        targetRole: undefined,
        targetBuildingId: undefined,
    });

    const [newImage, setNewImage] = useState<NewsImage>({
        url: '',
        caption: '',
        sortOrder: 0,
        file: undefined,
        preview: undefined,
    });
    
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<string>('');
    const imageInputRef = React.useRef<HTMLInputElement>(null);

    // Validation errors state
    const [errors, setErrors] = useState<{
        title?: string;
        summary?: string;
        bodyHtml?: string;
        publishAt?: string;
        expireAt?: string;
    }>({});

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
        router.push('/customer-interaction/new/newList');
    };

    // Validate individual field
    const validateField = (fieldName: string, value: string, currentFormData?: NewsFormData) => {
        const data = currentFormData || formData;
        const newErrors = { ...errors };
        
        switch (fieldName) {
            case 'title':
                if (!value || value.trim() === '') {
                    newErrors.title = t('titleRequired');
                } else {
                    delete newErrors.title;
                }
                break;
            case 'summary':
                if (!value || value.trim() === '') {
                    newErrors.summary = t('summaryRequired');
                } else {
                    delete newErrors.summary;
                }
                break;
            case 'bodyHtml':
                if (!value || value.trim() === '') {
                    newErrors.bodyHtml = t('bodyHtmlRequired');
                } else {
                    delete newErrors.bodyHtml;
                }
                break;
            case 'publishAt':
                if (!value || value.trim() === '') {
                    newErrors.publishAt = t('publishAtRequired');
                } else {
                    // Validate publishAt < expireAt
                    const expireAt = fieldName === 'publishAt' ? data.expireAt : value;
                    const publishAt = fieldName === 'publishAt' ? value : data.publishAt;
                    if (expireAt && publishAt >= expireAt) {
                        newErrors.publishAt = t('publishAtInvalid');
                    } else {
                        delete newErrors.publishAt;
                    }
                }
                break;
            case 'expireAt':
                if (!value || value.trim() === '') {
                    newErrors.expireAt = t('expireAtRequired');
                } else {
                    // Validate publishAt < expireAt
                    const publishAt = fieldName === 'expireAt' ? data.publishAt : value;
                    const expireAt = fieldName === 'expireAt' ? value : data.expireAt;
                    if (publishAt && publishAt >= expireAt) {
                        newErrors.expireAt = t('expireAtInvalid');
                    } else {
                        // For create page: expireAt must be > today
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const expireDate = new Date(value);
                        expireDate.setHours(0, 0, 0, 0);
                        if (expireDate <= today) {
                            newErrors.expireAt = t('expireAtInvalid');
                        } else {
                            delete newErrors.expireAt;
                        }
                    }
                }
                break;
        }
        
        setErrors(newErrors);
    };

    // Validate all fields
    const validateAllFields = (): boolean => {
        const newErrors: {
            title?: string;
            summary?: string;
            bodyHtml?: string;
            publishAt?: string;
            expireAt?: string;
        } = {};

        // Validate title
        if (!formData.title || formData.title.trim() === '') {
            newErrors.title = t('titleRequired');
        }

        // Validate summary
        if (!formData.summary || formData.summary.trim() === '') {
            newErrors.summary = t('summaryRequired');
        }

        // Validate bodyHtml
        if (!formData.bodyHtml || formData.bodyHtml.trim() === '') {
            newErrors.bodyHtml = t('bodyHtmlRequired');
        }

        // Validate publishAt
        if (!formData.publishAt || formData.publishAt.trim() === '') {
            newErrors.publishAt = t('publishAtRequired');
        }

        // Validate expireAt
        if (!formData.expireAt || formData.expireAt.trim() === '') {
            newErrors.expireAt = t('expireAtRequired');
        }

        // Validate publishAt < expireAt
        if (formData.publishAt && formData.expireAt) {
            if (formData.publishAt >= formData.expireAt) {
                newErrors.publishAt = t('publishAtInvalid');
                newErrors.expireAt = t('expireAtInvalid');
            }
        }

        // For create page: expireAt must be > today
        if (formData.expireAt) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const expireDate = new Date(formData.expireAt);
            expireDate.setHours(0, 0, 0, 0);
            if (expireDate <= today) {
                newErrors.expireAt = t('expireAtInvalid');
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isSubmitting) return;

        // Validate all fields
        if (!validateAllFields()) {
            show(t('checkRequiredFields'), 'error');
            return;
        }

        // Additional validations
        if (formData.scope === 'EXTERNAL' && selectedBuildingId === '') {
            show(t('selectBuildingForExternalNews'), 'error');
            return;
        }
        if (formData.scope === 'INTERNAL' && !formData.targetRole) {
            show(t('internalNewsTargetRoleRequired'), 'error');
            return;
        }

        try {
            // Step 1: Create news first (without coverImageUrl if it's a file - will upload after)
            // Build request object, only including fields that have values
            const request: CreateNewsRequest = {
                title: formData.title,
                bodyHtml: formData.bodyHtml,
                status: formData.status,
                scope: formData.scope,
                displayOrder: formData.displayOrder || 0,
            };

            // Add optional fields only if they have values
            if (formData.summary && formData.summary.trim()) {
                request.summary = formData.summary.trim();
            }
            // Only add coverImageUrl if it's a URL (not a file - file will be uploaded after)
            if (!coverImageFile && formData.coverImageUrl && formData.coverImageUrl.trim()) {
                request.coverImageUrl = formData.coverImageUrl.trim();
            }
            if (formData.publishAt) {
                request.publishAt = formData.publishAt;
            }
            if (formData.expireAt) {
                request.expireAt = formData.expireAt;
            }
            if (formData.scope === 'INTERNAL' && formData.targetRole && formData.targetRole.trim()) {
                request.targetRole = formData.targetRole.trim();
            }
            if (formData.scope === 'EXTERNAL') {
                request.targetBuildingId = selectedBuildingId === 'all' ? null : (selectedBuildingId || null);
            }
            // Don't include images in initial creation

            console.log('Creating news:', request);
            const createdNews = await addNews(request);
            
            if (!createdNews.id) {
                throw new Error('News created but no ID returned');
            }

            const newsId = createdNews.id;

            // Step 2: Upload cover image if there's a file (after creating news to get newsId)
            let coverImageUrl = request.coverImageUrl; // Keep existing URL if any
            
            if (coverImageFile) {
                setUploadingCoverImage(true);
                try {
                    // Upload with newsId as ownerId
                    const coverResponse = await uploadNewsImageFile(coverImageFile, newsId, user?.userId);
                    coverImageUrl = coverResponse.fileUrl; // Use fileUrl from response
                    
                    // Update news with coverImageUrl
                    const updateRequest: UpdateNewsRequest = {
                        coverImageUrl: coverImageUrl,
                    };
                    await updateNews(newsId, updateRequest);
                } catch (error) {
                    console.error('Error uploading cover image:', error);
                    show(t('coverImageUploadError'), 'error');
                    setUploadingCoverImage(false);
                    return;
                } finally {
                    setUploadingCoverImage(false);
                }
            }

            // Step 3: Upload detail images and add to news
            const imagesWithFiles = formData.images.filter(img => img.file);
            const imagesWithUrls = formData.images.filter(img => img.url && !img.file);
            
            if (imagesWithFiles.length > 0 || imagesWithUrls.length > 0) {
                setUploadingDetailImage(true);
                try {
                    // Upload files to get URLs
                    let uploadedImageUrls: string[] = [];
                    let uploadResponses: any[] = [];
                    if (imagesWithFiles.length > 0) {
                        const files = imagesWithFiles.map(img => img.file!);
                        const ownerId = newsId;
                        uploadResponses = await uploadNewsImageFiles(files, ownerId, user?.userId);
                        uploadedImageUrls = uploadResponses.map(res => res.fileUrl); // Use fileUrl from response
                    }

                    // Prepare imageDtos with newsId for NewsImageController
                    const imageDtos: NewsImageDto[] = [
                        ...imagesWithFiles.map((img, index) => ({
                            newsId: newsId,
                            url: uploadedImageUrls[index],
                            caption: img.caption || '',
                            sortOrder: index,
                            fileSize: uploadResponses[index]?.fileSize,
                            contentType: uploadResponses[index]?.contentType,
                        })),
                        ...imagesWithUrls.map((img, index) => ({
                            newsId: newsId,
                            url: img.url,
                            caption: img.caption || '',
                            sortOrder: imagesWithFiles.length + index,
                        })),
                    ];

                    // Add images to news via NewsImageController
                    if (imageDtos.length > 0) {
                        await uploadMultipleNewsImages(imageDtos);
                    }
                } catch (error) {
                    console.error('Error uploading detail images:', error);
                    show(t('detailImageUploadError'), 'error');
                    setUploadingDetailImage(false);
                    return;
                } finally {
                    setUploadingDetailImage(false);
                }
            }
            
            // Show success message
            show('Tạo tin tức thành công!', 'success');
            
            // Redirect to news list
            router.push(`/customer-interaction/new/newList`);
        } catch (error) {
            console.error('Lỗi khi tạo tin tức:', error);
            show(t('createNewsError'), 'error');
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

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: parseInt(value) || 0,
        }));
    };

    // Helper function to convert date to ISO 8601 format for backend
    const formatDateToISO = (dateString: string): string => {
        if (!dateString) return '';
        
        // If already in ISO format, return as is
        if (dateString.includes('T') && dateString.includes('Z')) {
            return dateString;
        }
        
        // Convert YYYY-MM-DD to YYYY-MM-DDTHH:mm:ss.SSSZ
        const date = new Date(dateString);
        // Set to start of day in UTC
        date.setUTCHours(0, 0, 0, 0);
        return date.toISOString();
    };

    // Helper function to convert ISO date to YYYY-MM-DD for DateBox display
    const formatISOToDate = (isoString: string): string => {
        if (!isoString) return '';
        
        // If already in YYYY-MM-DD format, return as is
        if (!isoString.includes('T')) {
            return isoString;
        }
        
        // Extract YYYY-MM-DD from ISO string
        return isoString.split('T')[0];
    };

    const handlePublishAtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isoDate = formatDateToISO(e.target.value);
        setFormData((prev) => {
            const newData = { ...prev, publishAt: isoDate };
            // Validate with updated data
            setTimeout(() => {
                validateField('publishAt', isoDate, newData);
                if (newData.expireAt) {
                    validateField('expireAt', newData.expireAt, newData);
                }
            }, 0);
            return newData;
        });
    };

    const handleExpireAtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // For expire date, set to end of day (23:59:59.999)
        let isoDate = '';
        if (e.target.value) {
            const date = new Date(e.target.value);
            date.setUTCHours(23, 59, 59, 999);
            isoDate = date.toISOString();
        }
        setFormData((prev) => {
            const newData = { ...prev, expireAt: isoDate };
            // Validate with updated data
            setTimeout(() => {
                validateField('expireAt', isoDate, newData);
                if (newData.publishAt) {
                    validateField('publishAt', newData.publishAt, newData);
                }
            }, 0);
            return newData;
        });
    };

    const handleStatusChange = (item: { name: string; value: string }) => {
        setFormData((prevData) => ({
            ...prevData,
            status: item.value as NewsStatus,
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

    const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverImageFile(file);
            
            // Show preview only (upload sau khi tạo news)
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Show preview only (upload sau khi tạo news)
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewImage((prev) => ({
                    ...prev,
                    file: file,
                    preview: reader.result as string,
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddImage = () => {
        // Add image với file (sẽ upload sau khi tạo news)
        if (newImage.file) {
            setFormData((prev) => ({
                ...prev,
                images: [
                    ...prev.images,
                    { 
                        url: '', // Sẽ có URL sau khi upload
                        caption: newImage.caption, 
                        sortOrder: prev.images.length,
                        file: newImage.file,
                        preview: newImage.preview,
                    },
                ],
            }));
            setNewImage({ 
                url: '', 
                caption: '', 
                sortOrder: 0,
                file: undefined,
                preview: undefined,
            });
            // Reset file input
            if (imageInputRef.current) {
                imageInputRef.current.value = '';
            }
        } else {
            show(t('selectImageError'), 'error');
        }
    };

    const handleRemoveImage = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };

    const handleImageCaptionChange = (index: number, newCaption: string) => {
        setFormData((prev) => ({
            ...prev,
            images: prev.images.map((img, i) => 
                i === index ? { ...img, caption: newCaption } : img
            ),
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
                    {t('back')}
                </span>
            </div>

            <form
                className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200"
                onSubmit={handleSubmit}
            >
                <div className="flex justify-between items-start border-b pb-4 mb-6">
                    <div className="flex items-center">
                        <h1 className={`text-2xl font-semibold text-[#02542D] mr-3`}>
                            {t('addNewNews')}
                        </h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">

                    {/* Title */}
                    <div className="col-span-full">
                        <DetailField
                            label={t('title')}
                            value={formData.title}
                            onChange={handleChange}
                            name="title"
                            placeholder={t('titlePlaceholder')}
                            readonly={false}
                            required={true}
                            error={errors.title}
                        />
                    </div>

                    {/* Summary */}
                    <div className="col-span-full">
                        <DetailField
                            label={t('summary')}
                            value={formData.summary}
                            onChange={handleChange}
                            name="summary"
                            type="textarea"
                            placeholder={t('summaryPlaceholder')}
                            readonly={false}
                            required={true}
                            error={errors.summary}
                        />
                    </div>

                    {/* Body HTML */}
                    <div className="col-span-full">
                        <DetailField
                            label={t('bodyHtml')}
                            value={formData.bodyHtml}
                            onChange={handleChange}
                            name="bodyHtml"
                            type="textarea"
                            placeholder={t('bodyHtmlPlaceholder')}
                            readonly={false}
                            required={true}
                            error={errors.bodyHtml}
                        />
                    </div>

                    {/* Cover Image Upload */}
                    <div className="col-span-full">
                        <label className="text-md font-bold text-[#02542D] mb-2 block">
                            {t('coverImage')}
                        </label>
                        <div className="flex flex-col gap-3">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleCoverImageChange}
                                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#02542D] file:text-white hover:file:bg-opacity-80 file:cursor-pointer border border-gray-300 rounded-lg cursor-pointer"
                            />
                            {coverImagePreview && (
                                <div className="relative w-full max-w-md">
                                    <img
                                        src={coverImagePreview}
                                        alt="Cover preview"
                                        className="w-full h-48 object-cover rounded-lg border border-gray-300"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCoverImageFile(null);
                                            setCoverImagePreview('');
                                            setFormData((prev) => ({
                                                ...prev,
                                                coverImageUrl: '',
                                            }));
                                        }}
                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status */}
                    <div className={`flex flex-col mb-4 col-span-1`}>
                        <label className="text-md font-bold text-[#02542D] mb-1">
                            {t('status')}
                        </label>
                        <Select
                            options={[
                                { name: t('draft'), value: 'DRAFT' },
                                { name: t('scheduled'), value: 'SCHEDULED' },
                                { name: t('published'), value: 'PUBLISHED' },
                                { name: t('hidden'), value: 'HIDDEN' },
                                { name: t('expired'), value: 'EXPIRED' },
                                { name: t('archived'), value: 'ARCHIVED' },
                            ]}
                            value={formData.status}
                            onSelect={handleStatusChange}
                            renderItem={(item) => item.name}
                            getValue={(item) => item.value}
                            placeholder={t('statusPlaceholder')}
                        />
                    </div>

                    {/* Display Order */}
                    <div className={`flex flex-col mb-4 col-span-1`}>
                        <label className="text-md font-bold text-[#02542D] mb-1">
                            {t('displayOrder')}
                        </label>
                        <input
                            type="number"
                            name="displayOrder"
                            value={formData.displayOrder}
                            onChange={handleNumberChange}
                            placeholder="1"
                            className="p-2 border border-[#739559] rounded-md text-[#34674F] focus:outline-none focus:ring-1 focus:ring-[#739559] shadow-inner transition duration-150"
                        />
                    </div>

                    {/* Publish At */}
                    <div className={`flex flex-col mb-4 col-span-1`}>
                        <label className="text-md font-bold text-[#02542D] mb-1">
                            {t('publishAt')} <span className="text-red-500">*</span>
                        </label>
                        <DateBox
                            value={formatISOToDate(formData.publishAt)}
                            onChange={handlePublishAtChange}
                            placeholderText={t('publishAtPlaceholder')}
                        />
                        {errors.publishAt && (
                            <span className="text-red-500 text-xs mt-1">{errors.publishAt}</span>
                        )}
                    </div>

                    {/* Expire At */}
                    <div className={`flex flex-col mb-4 col-span-1`}>
                        <label className="text-md font-bold text-[#02542D] mb-1">
                            {t('expireAt')} <span className="text-red-500">*</span>
                        </label>
                        <DateBox
                            value={formatISOToDate(formData.expireAt)}
                            onChange={handleExpireAtChange}
                            placeholderText={t('expireAtPlaceholder')}
                        />
                        {errors.expireAt && (
                            <span className="text-red-500 text-xs mt-1">{errors.expireAt}</span>
                        )}
                    </div>

                    {/* Scope */}
                    <div className={`flex flex-col mb-4 col-span-full`}>
                        <label className="text-md font-bold text-[#02542D] mb-1">
                            {t('scope')}
                        </label>
                        <Select
                            options={[
                                { name: t('internal'), value: 'INTERNAL' },
                                { name: t('external'), value: 'EXTERNAL' }
                            ]}
                            value={formData.scope}
                            onSelect={handleScopeChange}
                            renderItem={(item) => item.name}
                            getValue={(item) => item.value}
                            placeholder={t('scopePlaceholder')}
                        />

                        {formData.scope === 'INTERNAL' && (
                            <div className="mt-4">
                                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                    {t('targetRole')} <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    options={[
                                        { name: t('all'), value: 'ALL' },
                                        { name: t('admin'), value: 'ADMIN' },
                                        { name: t('technician'), value: 'TECHNICIAN' },
                                        { name: t('supporter'), value: 'SUPPORTER' },
                                        { name: t('account'), value: 'ACCOUNT' },
                                        { name: t('resident'), value: 'RESIDENT' },
                                    ]}
                                    value={formData.targetRole}
                                    onSelect={handleTargetRoleChange}
                                    renderItem={(item) => item.name}
                                    getValue={(item) => item.value}
                                    placeholder={t('targetRolePlaceholder')}
                                />
                            </div>
                        )}

                        {formData.scope === 'EXTERNAL' && (
                            <div className="mt-4">
                                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                    {t('selectBuilding')}
                                </label>
                                {loadingBuildings ? (
                                    <p className="text-gray-500 text-sm">{t('loadingBuildings')}</p>
                                ) : (
                                    <Select
                                        options={[
                                            { name: t('allBuildings'), value: 'all' },
                                            ...buildings.map(b => ({
                                                name: `${b.name} (${b.code})`, 
                                                value: b.id 
                                            }))
                                        ]}
                                        value={selectedBuildingId}
                                        onSelect={handleBuildingChange}
                                        renderItem={(item) => item.name}
                                        getValue={(item) => item.value}
                                        placeholder={t('selectBuildingPlaceholder')}
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Images Section */}
                    <div className="col-span-full mt-6">
                        <h3 className="text-lg font-bold text-[#02542D] mb-4">
                            {t('detailedImages')}
                        </h3>

                        {/* Add Image Form */}
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                        {t('selectImage')}
                                    </label>
                                    <input
                                        ref={imageInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageFileChange}
                                        className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#02542D] file:text-white hover:file:bg-opacity-80 file:cursor-pointer border border-gray-300 rounded-lg cursor-pointer"
                                    />
                                </div>
                                
                                {newImage.preview && (
                                    <div className="relative w-full max-w-xs">
                                        <img
                                            src={newImage.preview}
                                            alt="Preview"
                                            className="w-full h-32 object-cover rounded-lg border border-gray-300"
                                        />
                                    </div>
                                )}
                                
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                        {t('imageDescription')}
                                    </label>
                                    <input
                                        type="text"
                                        value={newImage.caption}
                                        onChange={(e) =>
                                            setNewImage((prev) => ({
                                                ...prev,
                                                caption: e.target.value,
                                            }))
                                        }
                                        placeholder={t('imageDescriptionPlaceholder')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02542D] focus:border-transparent outline-none"
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddImage}
                                disabled={!newImage.file && !newImage.url.trim()}
                                className="mt-4 px-4 py-2 bg-[#02542D] text-white rounded-lg hover:bg-opacity-80 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('addImage')}
                            </button>
                        </div>

                        {/* Image List */}
                        {formData.images.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-md font-semibold text-gray-700">
                                    {t('imageList')} ({formData.images.length})
                                </h4>
                                {formData.images.map((image, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-4 bg-white border border-gray-200 p-4 rounded-lg"
                                    >
                                        {(image.preview || image.url) && (
                                            <img
                                                src={image.preview || image.url}
                                                alt={image.caption || 'Image'}
                                                className="w-24 h-24 object-cover rounded-lg border border-gray-300 flex-shrink-0"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-600 mb-1 block">
                                                        {t('imageDescriptionLabel', { index: index + 1 })}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={image.caption}
                                                        onChange={(e) => handleImageCaptionChange(index, e.target.value)}
                                                        placeholder="Nhập mô tả cho hình ảnh này"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02542D] focus:border-transparent outline-none text-sm"
                                                    />
                                                </div>
                                                {image.file && (
                                                    <p className="text-xs text-gray-400">
                                                        {t('fileLabel')}: {image.file.name}
                                                    </p>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveImage(index)}
                                                    className="px-3 py-1.5 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 transition"
                                                >
                                                    {t('removeImage')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="col-span-full flex justify-center space-x-3 mt-8">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                            disabled={isSubmitting}
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-[#02542D] text-white rounded-lg hover:bg-opacity-80 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting || uploadingCoverImage || uploadingDetailImage}
                        >
                            {(isSubmitting || uploadingCoverImage || uploadingDetailImage) ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

