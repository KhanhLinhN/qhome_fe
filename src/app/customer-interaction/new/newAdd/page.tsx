'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Arrow from '@/src/assets/Arrow.svg';
import DetailField from '@/src/components/base-service/DetailField';
import Select from '@/src/components/customer-interaction/Select';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/src/contexts/AuthContext';
import { getBuildingsByTenant, Building } from '@/src/services/base/buildingService';
import DateBox from '@/src/components/customer-interaction/DateBox';
import { useNewAdd } from '@/src/hooks/useNewAdd';
import { News, uploadNewsImage } from '@/src/services/customer-interaction/newService';
import { useNotifications } from '@/src/hooks/useNotifications';
import { getAllTenants, Tenant } from '@/src/services/base/tenantService';

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
    status: string;
    publishAt: string;
    expireAt: string;
    displayOrder: number;
    images: NewsImage[];
    targets: NewsTarget[];
}

export default function NewsAdd() {
    const router = useRouter();
    const t = useTranslations('News');
    const { user } = useAuth();
    const { addNews, loading, error, isSubmitting } = useNewAdd();
    const { show } = useNotifications();

    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [selectedTenantId, setSelectedTenantId] = useState<string>('');
    const [loadingTenants, setLoadingTenants] = useState(false);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [selectedBuildings, setSelectedBuildings] = useState<Building[]>([]);
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
        targets: [
            {
                targetType: 'ALL',
                buildingId: null,
                buildingName: null,
            },
        ],
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

    // Fetch buildings when tenant is selected
    useEffect(() => {
        const fetchBuildings = async () => {
            if (selectedTenantId) {
                setLoadingBuildings(true);
                try {
                    const data = await getBuildingsByTenant(selectedTenantId);
                    setBuildings(data);
                } catch (error) {
                    console.error('Lỗi khi tải danh sách tòa nhà:', error);
                    show('Không thể tải danh sách tòa nhà', 'error');
                } finally {
                    setLoadingBuildings(false);
                }
            } else {
                setBuildings([]);
                setSelectedBuildings([]);
            }
        };

        fetchBuildings();
    }, [selectedTenantId, show]);

    const handleBack = () => {
        router.back();
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isSubmitting) return;

        // Validation
        if (!selectedTenantId) {
            show('Vui lòng chọn dự án', 'error');
            return;
        }
        if (!formData.title.trim()) {
            show('Vui lòng nhập tiêu đề tin tức', 'error');
            return;
        }
        if (!formData.summary.trim()) {
            show('Vui lòng nhập tóm tắt tin tức', 'error');
            return;
        }
        if (!formData.bodyHtml.trim()) {
            show('Vui lòng nhập nội dung tin tức', 'error');
            return;
        }
        if (!formData.publishAt) {
            show('Vui lòng chọn ngày xuất bản', 'error');
            return;
        }
        if (formData.targets[0]?.targetType === 'BUILDING' && selectedBuildings.length === 0) {
            show('Vui lòng chọn ít nhất một tòa nhà', 'error');
            return;
        }

        try {
            console.log('Dữ liệu gửi đi:', formData);
            

            // Step 2: Tạo news trước (chưa có detail images)
            const newsData: News = {
                title: formData.title,
                summary: formData.summary,
                bodyHtml: formData.bodyHtml,
                coverImageUrl: formData.coverImageUrl,
                status: formData.status,
                publishAt: formData.publishAt,
                expireAt: formData.expireAt,
                displayOrder: formData.displayOrder,
                images: [], // Chưa có images
                targets: formData.targets,
            };

            const createdNews = await addNews(newsData, selectedTenantId);
            console.log('News created:', createdNews);

            // Step 3: Upload từng detail image với newsId
            if (formData.images.length > 0 && createdNews?.id) {
                setUploadingDetailImage(true);
                for (let i = 0; i < formData.images.length; i++) {
                    const img = formData.images[i];
                    if (img.file) {
                        try {
                            const uploadedImage = await uploadNewsImage(
                                selectedTenantId,
                                createdNews.id,
                                img.file,
                                img.caption,
                                i
                            );
                            console.log(`Image ${i + 1} uploaded:`, uploadedImage);
                        } catch (error) {
                            console.error(`Lỗi khi upload ảnh ${i + 1}:`, error);
                        }
                    }
                }
                setUploadingDetailImage(false);
            }
            
            // Show success message
            show('Tạo tin tức thành công!', 'success');
            
            // Redirect to news list
            router.push(`/customer-interaction/new/newList`);
        } catch (error) {
            console.error('Lỗi khi tạo tin tức:', error);
            show('Có lỗi xảy ra khi tạo tin tức!', 'error');
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
        setFormData((prev) => ({
            ...prev,
            publishAt: isoDate,
        }));
    };

    const handleExpireAtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // For expire date, set to end of day (23:59:59.999)
        let isoDate = '';
        if (e.target.value) {
            const date = new Date(e.target.value);
            date.setUTCHours(23, 59, 59, 999);
            isoDate = date.toISOString();
        }
        setFormData((prev) => ({
            ...prev,
            expireAt: isoDate,
        }));
    };

    const handleStatusChange = (item: { name: string; value: string }) => {
        setFormData((prevData) => ({
            ...prevData,
            status: item.value,
        }));
    };

    const handleTenantChange = (item: { name: string; value: string }) => {
        setSelectedTenantId(item.value);
        // Reset buildings khi đổi tenant
        setSelectedBuildings([]);
        setFormData((prevData) => ({
            ...prevData,
            targets: [
                {
                    targetType: 'ALL',
                    buildingId: null,
                    buildingName: null,
                },
            ],
        }));
    };

    const handleTargetTypeChange = (item: { name: string; value: string }) => {
        setSelectedBuildings([]);
        if (item.value === 'ALL') {
            setFormData((prevData) => ({
                ...prevData,
                targets: [
                    {
                        targetType: 'ALL',
                        buildingId: null,
                        buildingName: null,
                    },
                ],
            }));
        } else if (item.value === 'BUILDING') {
            setFormData((prevData) => ({
                ...prevData,
                targets: [
                    {
                        targetType: 'BUILDING',
                        buildingId: null,
                        buildingName: null,
                    },
                ],
            }));
        } else {
            setFormData((prevData) => ({
                ...prevData,
                targets: [],
            }));
        }
    };

    const handleBuildingToggle = (building: Building) => {
        const isSelected = selectedBuildings.some(b => b.id === building.id);
        
        if (isSelected) {
            // Remove building
            const newSelected = selectedBuildings.filter(b => b.id !== building.id);
            setSelectedBuildings(newSelected);
            setFormData((prev) => ({
                ...prev,
                targets: newSelected.map(b => ({
                    targetType: 'BUILDING',
                    buildingId: b.id,
                    buildingName: b.name,
                })),
            }));
        } else {
            // Add building
            const newSelected = [...selectedBuildings, building];
            setSelectedBuildings(newSelected);
            setFormData((prev) => ({
                ...prev,
                targets: newSelected.map(b => ({
                    targetType: 'BUILDING',
                    buildingId: b.id,
                    buildingName: b.name,
                })),
            }));
        }
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
            show('Vui lòng chọn ảnh!', 'error');
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

    return (
        <div className={`min-h-screen bg-[#F5F7FA] p-4 sm:p-8 font-sans`}>
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
                    Quay lại danh sách tin tức
                </span>
            </div>

            <form
                className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200"
                onSubmit={handleSubmit}
            >
                <div className="flex justify-between items-start border-b pb-4 mb-6">
                    <div className="flex items-center">
                        <h1 className={`text-2xl font-semibold text-[#02542D] mr-3`}>
                            Thêm tin tức mới
                        </h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    {/* Project/Tenant Selection */}
                    <div className={`flex flex-col mb-4 col-span-full`}>
                        <label className="text-md font-bold text-[#02542D] mb-1">
                            Dự án <span className="text-red-500">*</span>
                        </label>
                        <Select
                            options={tenants.map(tenant => ({ 
                                name: tenant.name, 
                                value: tenant.id 
                            }))}
                            value={selectedTenantId}
                            onSelect={handleTenantChange}
                            renderItem={(item) => item.name}
                            getValue={(item) => item.value}
                            placeholder={loadingTenants ? 'Đang tải...' : 'Chọn dự án'}
                            disable={loadingTenants}
                        />
                    </div>

                    {/* Title */}
                    <div className="col-span-full">
                        <DetailField
                            label="Tiêu đề"
                            value={formData.title}
                            onChange={handleChange}
                            name="title"
                            placeholder="Nhập tiêu đề tin tức"
                            readonly={false}
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
                        />
                    </div>

                    {/* Cover Image Upload */}
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
                            Trạng thái
                        </label>
                        <Select
                            options={[
                                { name: 'Nháp', value: 'DRAFT' },
                                { name: 'Đã xuất bản', value: 'PUBLISHED' },
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
                            Ngày xuất bản
                        </label>
                        <DateBox
                            value={formatISOToDate(formData.publishAt)}
                            onChange={handlePublishAtChange}
                            placeholderText="Chọn ngày xuất bản"
                        />
                    </div>

                    {/* Expire At */}
                    <div className={`flex flex-col mb-4 col-span-1`}>
                        <label className="text-md font-bold text-[#02542D] mb-1">
                            Ngày hết hạn
                        </label>
                        <DateBox
                            value={formatISOToDate(formData.expireAt)}
                            onChange={handleExpireAtChange}
                            placeholderText="Chọn ngày hết hạn"
                        />
                    </div>

                    {/* Target Type */}
                    <div className={`flex flex-col mb-4 col-span-full`}>
                        <label className="text-md font-bold text-[#02542D] mb-1">
                            Đối tượng nhận
                        </label>
                        <Select
                            options={[
                                { name: 'Tất cả', value: 'ALL' },
                                { name: 'Tòa nhà cụ thể', value: 'BUILDING' }
                            ]}
                            value={formData.targets[0]?.targetType || 'ALL'}
                            onSelect={handleTargetTypeChange}
                            renderItem={(item) => item.name}
                            getValue={(item) => item.value}
                            placeholder="Chọn đối tượng"
                        />

                        {formData.targets[0]?.targetType === 'BUILDING' && (
                            <div className="mt-4">
                                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                    Chọn tòa nhà
                                </label>
                                {loadingBuildings ? (
                                    <p className="text-gray-500 text-sm">Đang tải danh sách tòa nhà...</p>
                                ) : buildings.length === 0 ? (
                                    <p className="text-gray-500 text-sm">Không có tòa nhà nào</p>
                                ) : (
                                    <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
                                        {buildings.map((building) => {
                                            const isSelected = selectedBuildings.some(b => b.id === building.id);
                                            return (
                                                <label
                                                    key={building.id}
                                                    className={`flex items-center p-3 rounded-lg cursor-pointer transition ${
                                                        isSelected 
                                                            ? 'bg-[#02542D] text-white' 
                                                            : 'bg-white hover:bg-gray-100'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleBuildingToggle(building)}
                                                        className="w-4 h-4 rounded border-gray-300 text-[#02542D] focus:ring-[#02542D] mr-3"
                                                    />
                                                    <div className="flex-1">
                                                        <p className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                                                            {building.name}
                                                        </p>
                                                        <p className={`text-xs ${isSelected ? 'text-gray-200' : 'text-gray-500'}`}>
                                                            {building.code} - {building.address}
                                                        </p>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                                {selectedBuildings.length > 0 && (
                                    <p className="text-sm text-gray-600 mt-2">
                                        Đã chọn: <span className="font-semibold">{selectedBuildings.length}</span> tòa nhà
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Images Section */}
                    <div className="col-span-full mt-6">
                        <h3 className="text-lg font-bold text-[#02542D] mb-4">
                            Hình ảnh chi tiết
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

                        {/* Image List */}
                        {formData.images.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-md font-semibold text-gray-700">
                                    Danh sách hình ảnh ({formData.images.length})
                                </h4>
                                {formData.images.map((image, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-4 bg-white border border-gray-200 p-4 rounded-lg"
                                    >
                                        {image.preview && (
                                            <img
                                                src={image.preview}
                                                alt={image.caption || 'Image'}
                                                className="w-24 h-24 object-cover rounded-lg border border-gray-300 flex-shrink-0"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="space-y-3">
                                                <div>
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
                                                {image.file && (
                                                    <p className="text-xs text-gray-400">
                                                        File: {image.file.name}
                                                    </p>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveImage(index)}
                                                    className="px-3 py-1.5 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 transition"
                                                >
                                                    Xóa hình ảnh
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

