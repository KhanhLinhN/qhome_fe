import { useCallback, useEffect, useState } from 'react';
import { RequestService, StatusCounts, GetRequestsParams, Page } from '@/src/services/customer-interaction/requestService';
import { RequestFilters } from '@/src/components/customer-interaction/FilterForm';
import { Request } from '@/src/types/request';

const initialFilters: RequestFilters = {
    status: '',
    dateFrom: '',
    dateTo: ''
};

const requestService = new RequestService();

export const useRequests = (loadOnMount: boolean = true) => {
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
            const params: GetRequestsParams = {
                ...currentFilters,
                pageNo: currentPage,
            };

            const [listResponse, countsResponse] = await Promise.all([
                requestService.getRequestList(params),
                requestService.getRequestCounts(currentFilters)
            ]);

            setData(listResponse);
            setStatusCounts(countsResponse);
        } catch (err) {
            setError('Failed to fetch requests.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (loadOnMount) {
            fetchData(initialFilters, 0);
        }
    }, [fetchData, loadOnMount]);

    const handleFilterChange = (name: keyof RequestFilters, value: string) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value,
        }));
    };

    const handleSearch = () => {
        const newPageNo = 0;
        setPageNo(newPageNo);
        fetchData(filters, newPageNo);
    };

    const handleClear = () => {
        setFilters(initialFilters);
        setPageNo(0);
        fetchData(initialFilters, 0);
    };

    const handlePageChange = (newPage: number) => {
        setPageNo(newPage);
        fetchData(filters, newPage);
    };

    const handleStatusChange = (status: string) => {
        const updatedFilters = { ...filters, status };
        setFilters(updatedFilters);
        setPageNo(0);
        fetchData(updatedFilters, 0);
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
