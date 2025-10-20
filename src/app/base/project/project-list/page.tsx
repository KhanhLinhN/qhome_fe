'use client'
import {useTranslations} from 'next-intl';
import FilterForm from "../../../../components/base-service/FilterForm";
import Table from "../../../../components/customer-interaction/Table";
import { useMemo, useState } from 'react';
import { useProjectPage } from '@/src/hooks/useProjectPage';
import Pagination from '@/src/components/customer-interaction/Pagination';
import MainLayout from '@/src/components/layout/MainLayout';


export default function Home() {
  const t = useTranslations('Project');
  const headers = [t('projectCode'), t('projectName'), t('address'), t('status'), t('createAt'), t('createBy'), t('action')];

  const {
      data,
      loading,
      error,
      handleFilterChange,
      handleClear,
      handlePageChange,
  } = useProjectPage();

  const [filters, setFilters] = useState({
    projectCode: '',
    status: '',
    address: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const tableData = data?.content.map(item => ({
      projectCode: item.projectCode,
      requestCode: item.requestCode,
      residentName: item.residentName,
      title: item.title,
      status: item.status,
      priority: item.priority,
      createdAt: item.createdAt.slice(0, 10).replace(/-/g, '/'), // Format to YYYY/MM/DD
  })) || [];
  
  // Handle loading and error states
  if (loading) {
    return (
        <div className="px-[41px] py-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-2 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('loading')}</p>
          </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="px-[41px] py-12 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">
              {t('error')}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-2 text-white rounded-md hover:bg-primary-3"
            >
              {t('retry')}
            </button>
          </div>
        </div>
    );
  }

  return (
    <MainLayout>
      <div className="lg:col-span-1 space-y-6">
        <div className="max-w-screen overflow-x-hidden bg-[#F5F7FA]">
            <h1 className="text-2xl font-semibold text-[#02542D] mb-4">{t('requestlist')}</h1>
            <div className="bg-white p-6 rounded-xl w-full">
                <FilterForm
                  filters={filters}
                  page='project'
                  onFilterChange={handleFilterChange}
                  onSearch={handleSearch}
                  onClear={handleClear}
                ></FilterForm>
                <Table 
                    data={tableData} 
                    headers={headers}
                ></Table>
                <Pagination
                    currentPage={pageNo}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            </div>
        </div>
      </div>
    </MainLayout>
  )

};
