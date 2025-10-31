'use client'
import {useTranslations} from 'next-intl';
import FilterForm from "../../../components/customer-interaction/FilterForm";
import Table from "../../../components/customer-interaction/Table";
import StatusTabs from "@/src/components/customer-interaction/StatusTabs";
import { useMemo, useState } from 'react';
import { useRequests } from '@/src/hooks/useTableRequest';
import Pagination from '@/src/components/customer-interaction/Pagination';


export default function Home() {
  const t = useTranslations('customer-interaction.Request');
  const headers = [t('requestNumber'), t('requestTitle'), t('residentName'), t('dateCreated'), t('priority'), t('status')];

  const {
      data,
      loading,
      error,
      filters,
      pageNo,
      totalPages,
      statusCounts,
      handleFilterChange,
      handleSearch,
      handleClear,
      handlePageChange,
  } = useRequests();

  const tableData = data?.content.map(item => ({
      id: item.id,
      requestCode: item.requestCode,
      residentName: item.residentName,
      title: item.title,
      status: item.status,
      priority: item.priority,
      createdAt: item.createdAt.slice(0, 10).replace(/-/g, '/'), // Format to YYYY/MM/DD
  })) || [];
  
  const tabData = useMemo(() => {
    const counts = statusCounts || {}; 
    
    return [
        { title: t('totalRequests'), count: counts.total || 0, status: '' },
        { title: t('newRequests'), count: counts.New || 0, status: 'new' },
        { title: t('processingRequests'), count: counts.Processing || 0, status: 'processing' },
        { title: t('respondedRequests'), count: counts.Responded || 0, status: 'responded' },
        { title: t('closedRequests'), count: counts.Closed || 0, status: 'closed' },
    ];
  }, [statusCounts, t]);
  
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
    <div className="lg:col-span-1 space-y-6">
      <div className="max-w-screen overflow-x-hidden ">
          <h1 className="text-2xl font-semibold text-[#02542D] mb-4">{t('requestlist')}</h1>
          <div className="bg-white p-6 rounded-xl w-full">
              <FilterForm
                filters={filters}
                onFilterChange={handleFilterChange}
                onSearch={handleSearch}
                onClear={handleClear}
              ></FilterForm>
              <StatusTabs 
                  tabList={tabData}
                  type={t("requests")}
              ></StatusTabs>
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

  )

};
