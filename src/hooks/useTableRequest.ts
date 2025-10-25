import { useCallback, useEffect, useState } from 'react';
import { RequestService, StatusCounts, GetRequestsParams, Page } from '@/src/services/customer-interaction/requestService';
import { RequestFilters } from '@/src/components/customer-interaction/FilterForm';
import { Request } from '@/src/types/request';
import { useAuth } from '@/src/contexts/AuthContext';

const initialFilters: RequestFilters = {
    requestId: '',
    title: '',
    residentName: '',
    tenantId: '',
    status: '',
    priority: '',
    dateFrom: '',
    dateTo: ''
};

const requestService = new RequestService();

export const useRequests = (loadOnMount: boolean = true) => {
    const { user } = useAuth();
    const tenantId = user?.tenantId;

    const [data, setData] = useState<Page<Request> | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [filters, setFilters] = useState<RequestFilters>(initialFilters);
    const [pageNo, setPageNo] = useState<number>(0);
    const [statusCounts, setStatusCounts] = useState<StatusCounts>({});

    
    const fetchData = useCallback(async (currentFilters: RequestFilters, currentPage: number) => {
        setLoading(true);
        setError(null);
        try {
            // Đảm bảo tenantId luôn được thêm vào params
            const params: GetRequestsParams = {
                ...currentFilters,
                tenantId: tenantId,
                pageNo: currentPage,
            };

            const filterParams = {
                ...currentFilters,
                tenantId: tenantId
            }

            console.log('Fetching with params:', params);
                
            const [listResponse, countsResponse] = await Promise.all([
                requestService.getRequestList(params),
                requestService.getRequestCounts(filterParams)
            ]);

            setData(listResponse);
            setStatusCounts(countsResponse);
        } catch (err) {
            setError('Failed to fetch requests.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [tenantId]); 

    // Tự động set tenantId vào filters khi có
    useEffect(() => {
        if (tenantId) {
            setFilters(prev => ({
                ...prev,
                tenantId: tenantId
            }));
        }
    }, [tenantId]);

    // Fetch data khi mount hoặc khi tenantId thay đổi
    useEffect(() => {
        if (loadOnMount) {
            const filtersWithTenant = {
                ...initialFilters,
                tenantId: tenantId || ''
            };
            fetchData(filtersWithTenant, 0);
        }
    }, [fetchData, loadOnMount, tenantId]);


    const handleFilterChange = (name: keyof RequestFilters, value: string) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value,
        }));
    };

    const handleSearch = () => {
        const newPageNo = 0;
        setPageNo(newPageNo); // Reset to first page on new search
        fetchData(filters, newPageNo);
    };

    const handleClear = () => {
        // Reset filters nhưng giữ lại tenantId
        setFilters({
            ...initialFilters,
            tenantId: tenantId || ''
        });
        setPageNo(0);
    };

    const handlePageChange = (newPage: number) => {
        setPageNo(newPage);
        fetchData(filters, newPage);
    };

    const handleStatusChange = (status: string) => {
        setFilters(prev => ({ ...prev, status: status }));
        setPageNo(0);
    };

    return {
        data,
        loading,
        error,
        filters,
        pageNo,
        totalPages: data?.totalPages ?? 0,
        statusCounts,
        handleFilterChange,
        handleStatusChange,
        handleSearch,
        handleClear,
        handlePageChange,
    };
}
