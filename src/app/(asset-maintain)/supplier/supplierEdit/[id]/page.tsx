'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Arrow from '@/src/assets/Arrow.svg';
import DetailField from '@/src/components/base-service/DetailField';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSupplierDetailPage } from '@/src/hooks/useSupplierDetailPage';
import { UpdateSupplierRequest } from '@/src/services/asset-maintenance/supplierService';
import { useAuth } from '@/src/contexts/AuthContext';
import { useNotifications } from '@/src/hooks/useNotifications';

export default function SupplierEdit() {
    const { user, hasRole } = useAuth();
    const t = useTranslations('Supplier');
    const router = useRouter();
    const params = useParams();
    const supplierId = params.id as string;
    const { show } = useNotifications();
    const { supplierData, loading, error, isSubmitting, editSupplier } = useSupplierDetailPage(supplierId);

    const [formData, setFormData] = useState<UpdateSupplierRequest>({
        name: '',
        type: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        taxCode: '',
        website: '',
        notes: '',
    });

    const [errors, setErrors] = useState<{[key: string]: string}>({});

    useEffect(() => {
        if (supplierData) {
            setFormData({
                name: supplierData.name || '',
                type: supplierData.type || '',
                contactPerson: supplierData.contactPerson || '',
                phone: supplierData.phone || '',
                email: supplierData.email || '',
                address: supplierData.address || '',
                taxCode: supplierData.taxCode || '',
                website: supplierData.website || '',
                notes: supplierData.notes || '',
            });
        }
    }, [supplierData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validate = (): boolean => {
        const newErrors: {[key: string]: string} = {};
        if (!formData.name?.trim()) newErrors.name = 'Tên nhà cung cấp là bắt buộc';
        if (!formData.type?.trim()) newErrors.type = 'Loại là bắt buộc';
        if (!formData.contactPerson?.trim()) newErrors.contactPerson = 'Người liên hệ là bắt buộc';
        if (!formData.phone?.trim()) newErrors.phone = 'Điện thoại là bắt buộc';
        if (!formData.email?.trim()) newErrors.email = 'Email là bắt buộc';
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }
        if (!formData.address?.trim()) newErrors.address = 'Địa chỉ là bắt buộc';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            await editSupplier(supplierId, formData);
            show('Cập nhật nhà cung cấp thành công', 'success');
            router.push(`/asset-maintain/supplier/supplierDetail/${supplierId}`);
        } catch (err: unknown) {
            show('Cập nhật nhà cung cấp thất bại: ' + (err?.message || ''), 'error');
        }
    };

    const handleBack = () => {
        router.push(`/asset-maintain/supplier/supplierDetail/${supplierId}`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-2 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen text-red-500">
                Lỗi: {error.message}
            </div>
        );
    }

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
                    Chi tiết nhà cung cấp
                </span>
            </div>

            <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200">
                <div className="flex justify-between items-start border-b pb-4 mb-6">
                    <h1 className="text-2xl font-semibold text-[#02542D]">
                        Chỉnh sửa nhà cung cấp
                    </h1>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                        <DetailField
                            label="Tên nhà cung cấp"
                            value={formData.name || ""}
                            onChange={handleChange}
                            name="name"
                            placeholder="Nhập tên nhà cung cấp"
                            readonly={false}
                            error={errors.name}
                            required
                        />
                        <div className="col-span-1 hidden md:block"></div>

                        <DetailField
                            label="Loại"
                            value={formData.type || ""}
                            onChange={handleChange}
                            name="type"
                            placeholder="Nhập loại"
                            readonly={false}
                            error={errors.type}
                            required
                        />

                        <DetailField
                            label="Người liên hệ"
                            value={formData.contactPerson || ""}
                            onChange={handleChange}
                            name="contactPerson"
                            placeholder="Nhập người liên hệ"
                            readonly={false}
                            error={errors.contactPerson}
                            required
                        />

                        <DetailField
                            label="Điện thoại"
                            value={formData.phone || ""}
                            onChange={handleChange}
                            name="phone"
                            placeholder="Nhập số điện thoại"
                            readonly={false}
                            error={errors.phone}
                            required
                        />

                        <DetailField
                            label="Email"
                            value={formData.email || ""}
                            onChange={handleChange}
                            name="email"
                            placeholder="Nhập email"
                            readonly={false}
                            error={errors.email}
                            required
                        />

                        <DetailField
                            label="Địa chỉ"
                            value={formData.address || ""}
                            onChange={handleChange}
                            name="address"
                            placeholder="Nhập địa chỉ"
                            readonly={false}
                            error={errors.address}
                            required
                            isFullWidth={true}
                        />

                        <DetailField
                            label="Mã số thuế"
                            value={formData.taxCode || ""}
                            onChange={handleChange}
                            name="taxCode"
                            placeholder="Nhập mã số thuế"
                            readonly={false}
                        />

                        <DetailField
                            label="Website"
                            value={formData.website || ""}
                            onChange={handleChange}
                            name="website"
                            placeholder="Nhập website"
                            readonly={false}
                        />

                        <DetailField
                            label="Ghi chú"
                            value={formData.notes || ""}
                            onChange={handleChange}
                            name="notes"
                            placeholder="Nhập ghi chú"
                            readonly={false}
                            type="textarea"
                            isFullWidth={true}
                        />
                    </div>

                    <div className="flex justify-end space-x-3 mt-8">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-[#739559] text-white rounded-md hover:bg-opacity-80 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
