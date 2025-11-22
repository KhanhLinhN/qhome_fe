'use client'
import { useTranslations } from 'next-intl';
import Table from '../../../../components/base-service/Table';
import { useSupplierPage } from '@/src/hooks/useSupplierPage';
import Pagination from '@/src/components/customer-interaction/Pagination';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

export default function SupplierListPage() {
  const t = useTranslations('Supplier');
  const router = useRouter();
  const headers = ['Tên nhà cung cấp', 'Loại', 'Người liên hệ', 'Điện thoại', 'Email', 'Trạng thái', 'Ngày tạo'];

  const {
    data,
    loading,
    error,
    pageNo,
    totalPages,
    handlePageChange,
  } = useSupplierPage();

  const tableData = useMemo(() => {
    return data?.content.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      contactPerson: item.contactPerson,
      phone: item.phone,
      email: item.email,
      status: item.isActive ? 'Hoạt động' : 'Không hoạt động',
      createdAt: item.createdAt?.slice(0, 10).replace(/-/g, '/') || '',
    })) || [];
  }, [data]);

  const handleRowClick = (rowId: string) => {
    router.push(`/asset-maintain/supplier/supplierDetail/${rowId}`);
  };

  if (loading) {
    return (
      <div className="px-[41px] py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-2 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-[41px] py-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Lỗi: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-2 text-white rounded-md hover:bg-primary-3"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-1 space-y-6">
      <div className="max-w-screen overflow-x-hidden">
        <h1 className="text-2xl font-semibold text-[#02542D] mb-4">Danh sách nhà cung cấp</h1>
        <div className="bg-white p-6 rounded-xl w-full min-h-[200px]">
          <Table 
            data={tableData} 
            headers={headers}
            type="supplier"
            onRowClick={handleRowClick}
          />
          <Pagination
            currentPage={pageNo + 1}
            totalPages={totalPages}
            onPageChange={(page) => handlePageChange(page - 1)}
          />
        </div>
      </div>
    </div>
  );
}
