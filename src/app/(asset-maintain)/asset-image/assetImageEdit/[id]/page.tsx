'use client'
import React, { useState } from 'react';
import Image from 'next/image';
import Arrow from '@/src/assets/Arrow.svg';
import DetailField from '@/src/components/base-service/DetailField';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { uploadAssetImages, deleteAssetImage, setPrimaryImage, getAssetImageUrl, AssetResponse } from '@/src/services/asset-maintenance/assetImageService';
import { useNotifications } from '@/src/hooks/useNotifications';

export default function AssetImageEdit() {
    const t = useTranslations('AssetImage'); 
    const router = useRouter();
    const params = useParams();
    const assetId = params.id as string;
    const { show } = useNotifications();
    
    const [assetData, setAssetData] = useState<AssetResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    
    const handleBack = () => {
        router.push(`/asset-maintain/asset-image/assetImageDetail/${assetId}`);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setSelectedFiles(files);
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            show('Vui lòng chọn ít nhất một hình ảnh', 'error');
            return;
        }

        try {
            setUploading(true);
            const result = await uploadAssetImages(assetId, selectedFiles);
            setAssetData(result);
            setSelectedFiles([]);
            show('Tải lên hình ảnh thành công', 'success');
        } catch (err: unknown) {
            show('Tải lên hình ảnh thất bại: ' + (err?.message || ''), 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteImage = async (imageUrl: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa hình ảnh này?')) return;

        try {
            setLoading(true);
            const result = await deleteAssetImage(assetId, imageUrl);
            setAssetData(result);
            show('Xóa hình ảnh thành công', 'success');
        } catch (err: unknown) {
            show('Xóa hình ảnh thất bại: ' + (err?.message || ''), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSetPrimary = async (imageUrl: string) => {
        try {
            setLoading(true);
            const result = await setPrimaryImage(assetId, imageUrl);
            setAssetData(result);
            show('Đặt hình ảnh chính thành công', 'success');
        } catch (err: unknown) {
            show('Đặt hình ảnh chính thất bại: ' + (err?.message || ''), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        show('Lưu thành công', 'success');
        router.push(`/asset-maintain/asset-image/assetImageDetail/${assetId}`);
    };

    const images = assetData?.images || [];
    const primaryImage = assetData?.primaryImage;

    return (
        <div className="min-h-screen p-4 sm:p-8 font-sans">
            <div className="max-w-4xl mx-auto mb-6 flex items-center cursor-pointer" onClick={handleBack}>
                <Image
                    src={Arrow}
                    alt="Back"
                    width={20}
                    height={20}
                    className="w-5 h-5 mr-2"
                />
                <span className="text-[#02542D] font-bold text-2xl hover:text-opacity-80 transition duration-150">
                    Chỉnh sửa hình ảnh tài sản
                </span>
            </div>

            <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200">
                <div className="flex justify-between items-start border-b pb-4 mb-6">
                    <h1 className="text-2xl font-semibold text-[#02542D]">
                        Chỉnh sửa hình ảnh tài sản
                    </h1>
                </div>

                {assetData && (
                    <div className="mb-6">
                        <DetailField 
                            label="Tên tài sản"
                            value={assetData.name ?? ""} 
                            readonly={true}
                        />
                        {assetData.code && (
                            <DetailField 
                                label="Mã tài sản"
                                value={assetData.code ?? ""} 
                                readonly={true}
                            />
                        )}
                    </div>
                )}

                <div className="mb-6">
                    <label className="block text-md font-bold text-[#02542D] mb-2">
                        Tải lên hình ảnh
                    </label>
                    <div className="flex items-center space-x-3">
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-[#739559] file:text-white
                                hover:file:bg-opacity-80"
                        />
                        <button
                            onClick={handleUpload}
                            disabled={selectedFiles.length === 0 || uploading}
                            className="px-4 py-2 bg-[#739559] text-white rounded-md hover:bg-opacity-80 disabled:opacity-50"
                        >
                            {uploading ? 'Đang tải...' : 'Tải lên'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {images.map((imageUrl, index) => {
                        const fullImageUrl = imageUrl.startsWith('http') 
                            ? imageUrl 
                            : getAssetImageUrl(imageUrl);
                        const isPrimary = imageUrl === primaryImage;

                        return (
                            <div key={index} className="relative group">
                                <div className="relative aspect-square overflow-hidden rounded-lg border-2 border-gray-200">
                                    <Image
                                        src={fullImageUrl}
                                        alt={`Image ${index + 1}`}
                                        fill
                                        className="object-cover"
                                    />
                                    {isPrimary && (
                                        <div className="absolute top-2 left-2 bg-[#739559] text-white px-2 py-1 rounded text-xs font-semibold">
                                            Hình chính
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                                        <div className="opacity-0 group-hover:opacity-100 flex space-x-2">
                                            {!isPrimary && (
                                                <button
                                                    onClick={() => handleSetPrimary(imageUrl)}
                                                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                                                >
                                                    Đặt làm chính
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteImage(imageUrl)}
                                                disabled={loading}
                                                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {images.length === 0 && (
                    <div className="text-center py-12 text-gray-500 mb-6">
                        Chưa có hình ảnh nào. Vui lòng tải lên hình ảnh.
                    </div>
                )}

                <div className="flex justify-end space-x-3 mt-8">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-6 py-2 bg-[#739559] text-white rounded-md hover:bg-opacity-80"
                    >
                        Lưu
                    </button>
                </div>
            </div>
        </div>
    );
}
