'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Arrow from '@/src/assets/Arrow.svg';
import DetailField from '@/src/components/base-service/DetailField';
import Select from '@/src/components/customer-interaction/Select';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/src/contexts/AuthContext';
import { getBuildings, Building } from '@/src/services/base/buildingService';
import DateBox from '@/src/components/customer-interaction/DateBox';
import { useNewEdit } from '@/src/hooks/useNewEdit';
import { 
    UpdateNewsRequest, 
    NewsImageDto, 
    uploadMultipleNewsImages, 
    deleteNewsImage, 
    updateNewsImageCaption,
    uploadNewsImageFile,
    uploadNewsImageFiles
} from '@/src/services/customer-interaction/newService';
import { NotificationScope, NewsStatus } from '@/src/types/news';
import { useNotifications } from '@/src/hooks/useNotifications';
import { getAllTenants, Tenant } from '@/src/services/base/tenantService';
import Delete from '@/src/assets/Delete.svg';

interface NewsImage {
    id?: string;
    url: string;
    caption: string;
    sortOrder: number;
    file?: File;
    preview?: string;
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

export default function NewsEdit() {
    const router = useRouter();
    const params = useParams();
    const t = useTranslations('News');
    const { user } = useAuth();
    const newsId = params?.id as string;
    const { news, updateNewsItem, loading: loadingNews, error, isSubmitting } = useNewEdit(newsId);
    const { show } = useNotifications();

    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [selectedTenantId, setSelectedTenantId] = useState<string>('');
    const [loadingTenants, setLoadingTenants] = useState(false);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [selectedBuildingId, setSelectedBuildingId] = useState<string>('all'); // 'all' means all buildings, otherwise building.id
    const [loadingBuildings, setLoadingBuildings] = useState(false);

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
    const [uploadingCoverImage, setUploadingCoverImage] = useState(false);
    const [uploadingDetailImage, setUploadingDetailImage] = useState(false);
    const imageInputRef = React.useRef<HTMLInputElement>(null);

    // Validation errors state
    const [errors, setErrors] = useState<{
        title?: string;
        summary?: string;
        bodyHtml?: string;
        publishAt?: string;
        expireAt?: string;
    }>({});

    // Load existing news data when it's fetched
    useEffect(() => {
        if (news) {
            const isAllBuildings = news.scope === 'EXTERNAL' && !news.targetBuildingId;
            
            setFormData({
                title: news.title || '',
                summary: news.summary || '',
                bodyHtml: news.bodyHtml || '',
                coverImageUrl: news.coverImageUrl || '',
                status: news.status || 'DRAFT',
                publishAt: news.publishAt || '',
                expireAt: news.expireAt || '',
                displayOrder: news.displayOrder || 1,
                images: (news.images || []).map(img => ({
                    id: img.id,
                    url: img.url,
                    caption: img.caption || '',
                    sortOrder: img.sortOrder || 0,
                    preview: img.url,
                })),
                scope: news.scope || 'EXTERNAL',
                targetRole: news.targetRole,
                targetBuildingId: news.targetBuildingId || undefined,
            });
            setCoverImagePreview(news.coverImageUrl || '');
            
            // Set selectedBuildingId based on targetBuildingId
            setSelectedBuildingId(isAllBuildings ? 'all' : (news.targetBuildingId || 'all'));
        }
    }, [news]);

    // Fetch buildings when tenant is selected or when news loads with targetBuildingId
    useEffect(() => {
        const fetchBuildings = async () => {
            if (selectedTenantId || (news && news.scope === 'EXTERNAL')) {
                setLoadingBuildings(true);
                try {
                    const allBuildings = await getBuildings();
                    // Filter by tenantId if selectedTenantId exists
                    const filtered = selectedTenantId 
                        ? allBuildings.filter((b: Building) => b.tenantId === selectedTenantId)
                        : allBuildings;
                    setBuildings(filtered);
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
    }, [selectedTenantId, show, formData.targetBuildingId, news]);

    const handleBack = () => {
        router.push(`/customer-interaction/new/newDetail/${newsId}`);
    };

    // Validate individual field
    const validateField = (fieldName: string, value: string, currentFormData?: NewsFormData) => {
        const data = currentFormData || formData;
        const newErrors = { ...errors };
        
        switch (fieldName) {
            case 'title':
                if (!value || value.trim() === '') {
                    newErrors.title = 'Vui lòng nhập tiêu đề tin tức';
                } else {
                    delete newErrors.title;
                }
                break;
            case 'summary':
                if (!value || value.trim() === '') {
                    newErrors.summary = 'Vui lòng nhập tóm tắt tin tức';
                } else {
                    delete newErrors.summary;
                }
                break;
            case 'bodyHtml':
                if (!value || value.trim() === '') {
                    newErrors.bodyHtml = 'Vui lòng nhập nội dung tin tức';
                } else {
                    delete newErrors.bodyHtml;
                }
                break;
            case 'publishAt':
                if (!value || value.trim() === '') {
                    newErrors.publishAt = 'Vui lòng chọn ngày xuất bản';
                } else {
                    // Validate publishAt < expireAt
                    const expireAt = fieldName === 'publishAt' ? data.expireAt : value;
                    const publishAt = fieldName === 'publishAt' ? value : data.publishAt;
                    if (expireAt && publishAt >= expireAt) {
                        newErrors.publishAt = 'Ngày xuất bản phải nhỏ hơn ngày hết hạn';
                    } else {
                        delete newErrors.publishAt;
                    }
                }
                break;
            case 'expireAt':
                if (!value || value.trim() === '') {
                    newErrors.expireAt = 'Vui lòng chọn ngày hết hạn';
                } else {
                    // Validate publishAt < expireAt
                    const publishAt = fieldName === 'expireAt' ? data.publishAt : value;
                    const expireAt = fieldName === 'expireAt' ? value : data.expireAt;
                    if (publishAt && publishAt >= expireAt) {
                        newErrors.expireAt = 'Ngày hết hạn phải lớn hơn ngày xuất bản';
                    } else {
                        delete newErrors.expireAt;
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
            newErrors.title = 'Vui lòng nhập tiêu đề tin tức';
        }

        // Validate summary
        if (!formData.summary || formData.summary.trim() === '') {
            newErrors.summary = 'Vui lòng nhập tóm tắt tin tức';
        }

        // Validate bodyHtml
        if (!formData.bodyHtml || formData.bodyHtml.trim() === '') {
            newErrors.bodyHtml = 'Vui lòng nhập nội dung tin tức';
        }

        // Validate publishAt
        if (!formData.publishAt || formData.publishAt.trim() === '') {
            newErrors.publishAt = 'Vui lòng chọn ngày xuất bản';
        }

        // Validate expireAt
        if (!formData.expireAt || formData.expireAt.trim() === '') {
            newErrors.expireAt = 'Vui lòng chọn ngày hết hạn';
        }

        // Validate publishAt < expireAt
        if (formData.publishAt && formData.expireAt) {
            if (formData.publishAt >= formData.expireAt) {
                newErrors.publishAt = 'Ngày xuất bản phải nhỏ hơn ngày hết hạn';
                newErrors.expireAt = 'Ngày hết hạn phải lớn hơn ngày xuất bản';
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
            show('Vui lòng kiểm tra lại các trường bắt buộc', 'error');
            return;
        }

        // Additional validations
        if (formData.scope === 'EXTERNAL' && selectedBuildingId === '') {
            show('Vui lòng chọn tòa nhà hoặc chọn "Tất cả tòa nhà" cho tin tức EXTERNAL', 'error');
            return;
        }
        if (formData.scope === 'INTERNAL' && !formData.targetRole) {
            show('Vui lòng nhập target role cho tin tức INTERNAL', 'error');
            return;
        }

        try {
            // Step 1: Upload cover image first if there's a new file (before updating news)
            let coverImageUrl = formData.coverImageUrl && formData.coverImageUrl.trim() ? formData.coverImageUrl : undefined;
            
            if (coverImageFile) {
                setUploadingCoverImage(true);
                try {
                    const ownerId = newsId;
                    const coverResponse = await uploadNewsImageFile(coverImageFile, ownerId, user?.userId);
                    coverImageUrl = coverResponse.fileUrl; // Use fileUrl from response
                } catch (error) {
                    console.error('Error uploading cover image:', error);
                    show('Lỗi khi upload ảnh bìa', 'error');
                    setUploadingCoverImage(false);
                    return;
                } finally {
                    setUploadingCoverImage(false);
                }
            }

            // Step 2: Update news with coverImageUrl (if available)
            // Build request object, only including fields that should be updated
            const request: UpdateNewsRequest = {
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
            if (coverImageUrl) {
                request.coverImageUrl = coverImageUrl;
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
            // Don't include images in update request

            await updateNewsItem(request);

            // Step 3: Handle images - separate new images and existing images
            const imagesWithFiles = formData.images.filter(img => img.file && !img.id);
            const imagesWithUrls = formData.images.filter(img => !img.file && img.url && !img.id);
            const existingImages = formData.images.filter(img => img.id);

            // Delete images that were removed (compare with original news.images)
            if (news && news.images) {
                const originalImageIds = news.images.map(img => img.id).filter(id => id) as string[];
                const currentImageIds = existingImages.map(img => img.id).filter(id => id) as string[];
                const deletedImageIds = originalImageIds.filter(id => !currentImageIds.includes(id));
                
                // Delete removed images
                for (const imageId of deletedImageIds) {
                    try {
                        await deleteNewsImage(imageId);
                    } catch (error) {
                        console.error(`Error deleting image ${imageId}:`, error);
                    }
                }
            }

            // Upload new detail images and add to news
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
                            sortOrder: existingImages.length + index,
                            fileSize: uploadResponses[index]?.fileSize,
                            contentType: uploadResponses[index]?.contentType,
                        })),
                        ...imagesWithUrls.map((img, index) => ({
                            newsId: newsId,
                            url: img.url,
                            caption: img.caption || '',
                            sortOrder: existingImages.length + imagesWithFiles.length + index,
                        })),
                    ];

                    // Add new images to news via NewsImageController
                    if (imageDtos.length > 0) {
                        await uploadMultipleNewsImages(imageDtos);
                    }

                    // Update captions for existing images that changed
                    for (const existingImg of existingImages) {
                        const originalImg = news?.images?.find(img => img.id === existingImg.id);
                        if (originalImg && originalImg.caption !== existingImg.caption && existingImg.id) {
                            try {
                                await updateNewsImageCaption(existingImg.id, existingImg.caption || '');
                            } catch (error) {
                                console.error(`Error updating image caption ${existingImg.id}:`, error);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error uploading detail images:', error);
                    show('Lỗi khi upload hình ảnh chi tiết', 'error');
                    setUploadingDetailImage(false);
                    return;
                } finally {
                    setUploadingDetailImage(false);
                }
            } else {
                // Only caption updates for existing images - update via NewsImageController
                for (const existingImg of existingImages) {
                    const originalImg = news?.images?.find(img => img.id === existingImg.id);
                    if (originalImg && originalImg.caption !== existingImg.caption && existingImg.id) {
                        try {
                            await updateNewsImageCaption(existingImg.id, existingImg.caption || '');
                        } catch (error) {
                            console.error(`Error updating image caption ${existingImg.id}:`, error);
                        }
                    }
                }
            }
            
            // Show success message
            show('Cập nhật tin tức thành công!', 'success');
            
            // Redirect to news detail
            router.push(`/customer-interaction/new/newDetail/${newsId}`);
        } catch (error) {
            console.error('Lỗi khi cập nhật tin tức:', error);
            show('Có lỗi xảy ra khi cập nhật tin tức!', 'error');
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
            // Show preview
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
            // Show preview
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
        // Add image với file (sẽ upload sau)
        if (newImage.file || newImage.url) {
            setFormData((prev) => ({
                ...prev,
                images: [
                    ...prev.images,
                    { 
                        url: newImage.url || '', // Should be uploaded URL
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
            show('Vui lòng chọn ảnh hoặc nhập URL!', 'error');
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

    if (loadingNews) {
        return (
            <div className="min-h-screen p-4 sm:p-8">
                <div className="max-w-4xl mx-auto">
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

    if (!news) {
        return (
            <div className="min-h-screen p-4 sm:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
                        <p className="text-red-600 mb-4">Không tìm thấy tin tức</p>
                        <button
                            onClick={handleBack}
                            className="px-4 py-2 bg-[#02542D] text-white rounded-md hover:bg-opacity-80"
                        >
                            Quay lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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
                    Quay lại
                </span>
            </div>

            <form
                className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200"
                onSubmit={handleSubmit}
            >
                <div className="flex justify-between items-start border-b pb-4 mb-6">
                    <div className="flex items-center">
                        <h1 className={`text-2xl font-semibold text-[#02542D] mr-3`}>
                            Chỉnh sửa tin tức
                        </h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    {/* Title */}
                    <div className="col-span-full">
                        <DetailField
                            label="Tiêu đề"
                            value={formData.title}
                            onChange={handleChange}
                            name="title"
                            placeholder="Nhập tiêu đề tin tức"
                            readonly={false}
                            required={true}
                            error={errors.title}
                        />
                    </div>

                    {/* Summary */}
                    <div className="col-span-full">
                        <DetailField
                            label="Tóm tắt"
                            value={formData.summary}
                            onChange={handleChange}
                            name="summary"
                            type="textarea"
                            placeholder="Nhập tóm tắt ngắn gọn"
                            readonly={false}
                            required={true}
                            error={errors.summary}
                        />
                    </div>

                    {/* Body HTML */}
                    <div className="col-span-full">
                        <DetailField
                            label="Nội dung (HTML)"
                            value={formData.bodyHtml}
                            onChange={handleChange}
                            name="bodyHtml"
                            type="textarea"
                            placeholder="Nhập nội dung HTML"
                            readonly={false}
                            required={true}
                            error={errors.bodyHtml}
                        />
                    </div>

                    {/* Cover Image */}
                    <div className="col-span-full">
                        <label className="text-md font-bold text-[#02542D] mb-2 block">
                            Ảnh bìa
                        </label>
                        <div className="flex flex-col gap-3">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleCoverImageChange}
                                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#02542D] file:text-white hover:file:bg-opacity-80 file:cursor-pointer border border-gray-300 rounded-lg cursor-pointer"
                            />
                            {(coverImagePreview || formData.coverImageUrl) && (
                                <div className="relative w-full max-w-md">
                                    <img
                                        src={coverImagePreview || formData.coverImageUrl}
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
                            Trạng thái
                        </label>
                        <Select
                            options={[
                                { name: 'Nháp', value: 'DRAFT' },
                                { name: 'Đã lên lịch', value: 'SCHEDULED' },
                                { name: 'Đã xuất bản', value: 'PUBLISHED' },
                                { name: 'Ẩn', value: 'HIDDEN' },
                                { name: 'Hết hạn', value: 'EXPIRED' },
                                { name: 'Đã lưu trữ', value: 'ARCHIVED' },
                            ]}
                            value={formData.status}
                            onSelect={handleStatusChange}
                            renderItem={(item) => item.name}
                            getValue={(item) => item.value}
                            placeholder="Chọn trạng thái"
                        />
                    </div>

                    {/* Display Order */}
                    <div className={`flex flex-col mb-4 col-span-1`}>
                        <label className="text-md font-bold text-[#02542D] mb-1">
                            Thứ tự hiển thị
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
                            Ngày xuất bản <span className="text-red-500">*</span>
                        </label>
                        <DateBox
                            value={formatISOToDate(formData.publishAt)}
                            onChange={handlePublishAtChange}
                            placeholderText="Chọn ngày xuất bản"
                        />
                        {errors.publishAt && (
                            <span className="text-red-500 text-xs mt-1">{errors.publishAt}</span>
                        )}
                    </div>

                    {/* Expire At */}
                    <div className={`flex flex-col mb-4 col-span-1`}>
                        <label className="text-md font-bold text-[#02542D] mb-1">
                            Ngày hết hạn <span className="text-red-500">*</span>
                        </label>
                        <DateBox
                            value={formatISOToDate(formData.expireAt)}
                            onChange={handleExpireAtChange}
                            placeholderText="Chọn ngày hết hạn"
                        />
                        {errors.expireAt && (
                            <span className="text-red-500 text-xs mt-1">{errors.expireAt}</span>
                        )}
                    </div>

                    {/* Scope */}
                    <div className={`flex flex-col mb-4 col-span-full`}>
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

                        {formData.scope === 'INTERNAL' && (
                            <div className="mt-4">
                                <label className="text-sm font-semibold text-gray-700 mb-2 block">
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

                        {formData.scope === 'EXTERNAL' && (
                            <div className="mt-4">
                                <label className="text-sm font-semibold text-gray-700 mb-2 block">
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
                    </div>

                    {/* Images Section */}
                    <div className="col-span-full mt-6">
                        <h3 className="text-lg font-bold text-[#02542D] mb-4">
                            Hình ảnh chi tiết ({formData.images.length})
                        </h3>

                        {/* Add Image Form */}
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                        Chọn hình ảnh
                                    </label>
                                    <input
                                        ref={imageInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageFileChange}
                                        className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#02542D] file:text-white hover:file:bg-opacity-80 file:cursor-pointer border border-gray-300 rounded-lg cursor-pointer mb-2"
                                    />
                                </div>
                                
                                {(newImage.preview || newImage.url) && (
                                    <div className="relative w-full max-w-xs">
                                        <img
                                            src={newImage.preview || newImage.url}
                                            alt="Preview"
                                            className="w-full h-32 object-cover rounded-lg border border-gray-300"
                                        />
                                    </div>
                                )}
                                
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                        Mô tả hình ảnh
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
                                        placeholder="Nhập mô tả hình ảnh"
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
                                Thêm hình ảnh
                            </button>
                        </div>

                        {/* Edit captions for existing images */}
                        {formData.images.length > 0 && (
                            <div className="mt-4 space-y-3">
                                <h4 className="text-md font-semibold text-gray-700">
                                    Chỉnh sửa mô tả hình ảnh
                                </h4>
                                {formData.images.map((image, index) => (
                                    <div
                                        key={image.id || index}
                                        className="flex items-center gap-3 bg-white border border-gray-200 p-3 rounded-lg"
                                    >
                                        {(image.preview || image.url) && (
                                            <img
                                                src={image.preview || image.url}
                                                alt={image.caption || `Image ${index + 1}`}
                                                className="w-16 h-16 object-cover rounded-lg border border-gray-300 flex-shrink-0"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">
                                                Mô tả hình ảnh #{index + 1}
                                            </label>
                                            <input
                                                type="text"
                                                value={image.caption}
                                                onChange={(e) => handleImageCaptionChange(index, e.target.value)}
                                                placeholder="Nhập mô tả cho hình ảnh này"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02542D] focus:border-transparent outline-none text-sm"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(index)}
                                            className="px-3 py-2 text-sm bg-red-600 border border-red-600 rounded hover:bg-red-800 transition flex-shrink-0"
                                        >
                                            <Image
                                                src={Delete}
                                                alt="Delete"
                                                width={20}
                                                height={20}
                                                className="w-5 h-5"
                                            />
                                        </button>
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
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-[#02542D] text-white rounded-lg hover:bg-opacity-80 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isSubmitting || uploadingCoverImage || uploadingDetailImage}
                            >
                                {(isSubmitting || uploadingCoverImage || uploadingDetailImage) ? 'Đang lưu...' : 'Cập nhật'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

