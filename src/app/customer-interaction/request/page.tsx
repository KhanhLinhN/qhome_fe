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
  const headers = [t('requestNumber'), t('requestTitle'), t('residentName'), t('dateCreated'), t('status'), t('action')];

  const {
      data,
      loading,
      error,
      filters,
      pageNo,
      totalPages,
      statusCounts,
      allRequestsList,
      handleFilterChange,
      handlePageChange,
      handleStatusChange,
      handleClear,
  } = useRequests();

  const [activeStatus, setActiveStatus] = useState<string>('');
  const PAGE_SIZE = 10;

  // Override handleClear to also reset activeStatus
  const handleClearWithStatus = () => {
    setActiveStatus('');
    handleClear();
  };

  // Filter data first, then sort, then paginate if using allRequestsList
  const { filteredTableData, filteredTotalPages } = useMemo(() => {
    // Use full list if available (when getAllRequests was used), otherwise use data.content (when backend filter was used)
    const sourceData = allRequestsList || data?.content || [];
    
    let filtered = [...sourceData];
    
    // Only filter Done when using allRequestsList (frontend pagination)
    // When backend filter is used, backend already handles status filtering
    if (activeStatus === '' && allRequestsList) {
      // Filter Done when showing "All" tab with full list
      filtered = filtered.filter(item => item.status !== 'Done');
    }
    // Note: When backend filter is used and activeStatus === '', backend still returns all including Done
    // We need to filter Done in this case too, but it will affect pagination
    
    // Apply search filter if search term exists (frontend filtering)
    if (filters.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(item => 
        (item.title?.toLowerCase().includes(searchTerm) || 
         item.requestCode?.toLowerCase().includes(searchTerm))
      );
    }
    
    // Sort by createdAt descending (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
    
    // Only paginate if using allRequestsList (frontend pagination)
    if (allRequestsList) {
      const totalFiltered = filtered.length;
      const totalPagesAfterFilter = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
      const startIndex = pageNo * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const paginatedData = filtered.slice(startIndex, endIndex);
      
      return {
        filteredTableData: paginatedData,
        filteredTotalPages: totalPagesAfterFilter
      };
    } else {
      // When backend pagination, filter Done if needed (but this affects current page only)
      if (activeStatus === '') {
        filtered = filtered.filter(item => item.status !== 'Done');
      }
      return {
        filteredTableData: filtered,
        filteredTotalPages: totalPages
      };
    }
  }, [allRequestsList, data?.content, activeStatus, filters.search, pageNo, totalPages]);

  const tableData = filteredTableData.map(item => ({
      id: item.id,
      requestCode: item.requestCode,
      residentName: item.residentName,
      title: item.title,
      status: item.status,
      createdAt: item.createdAt.slice(0, 10).replace(/-/g, '/'), // Format to YYYY/MM/DD
  }));

  // Use filtered totalPages when using allRequestsList (frontend pagination), otherwise use backend totalPages
  const displayTotalPages = allRequestsList ? filteredTotalPages : Math.max(totalPages, 1);
  
  const tabData = useMemo(() => {
    const counts = statusCounts || {}; 
    
    // Calculate total manually to ensure it includes New, Pending, Processing, and Done
    const calculatedTotal = (counts.New || 0) + (counts.Pending || 0) + (counts.Processing || 0) + (counts.Done || 0);
    const totalCount = counts.total || calculatedTotal;
    
    return [
        { title: t('totalRequests'), count: totalCount, status: '' },
        { title: t('New'), count: counts.New || 0, status: 'New' },
        { title: t('Pending'), count: counts.Pending || 0, status: 'Pending' },
        { title: t('Processing'), count: counts.Processing || 0, status: 'Processing' },
        { title: t('Done'), count: counts.Done || 0, status: 'Done' },
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
                onClear={handleClearWithStatus}
              ></FilterForm>
              <StatusTabs 
                  tabList={tabData}
                  type={t("requests")}
                  onStatusChange={(status) => {
                    setActiveStatus(status);
                    handleStatusChange(status);
                  }}
                  activeStatus={activeStatus}
              ></StatusTabs>
              <Table 
                  data={tableData} 
                  headers={headers}
              ></Table>
              {displayTotalPages > 1 && (
                  <Pagination
                      currentPage={pageNo + 1}
                      totalPages={displayTotalPages}
                      onPageChange={(newPage) => handlePageChange(newPage - 1)}
                  />
              )}
          </div>
      </div>
    </div>

  )

};
