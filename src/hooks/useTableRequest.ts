import { useCallback, useEffect, useState, useRef } from 'react';
import { RequestService, StatusCounts, GetRequestsParams, Page } from '@/src/services/customer-interaction/requestService';
import { RequestFilters } from '@/src/components/customer-interaction/FilterForm';
import { Request } from '@/src/types/request';

const initialFilters: RequestFilters = {
    status: '',
    dateFrom: '',
    dateTo: '',
    search: ''
};

// Default filters that exclude "Done" status
const defaultFilters: RequestFilters = {
    status: '',
    dateFrom: '',
    dateTo: '',
    search: ''
};

const requestService = new RequestService();

export const useRequests = (loadOnMount: boolean = true) => {
    const [data, setData] = useState<Page<Request> | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [allRequestsList, setAllRequestsList] = useState<Request[] | null>(null); // Store full list when using getAllRequests

    const [filters, setFilters] = useState<RequestFilters>(initialFilters);
    const [pageNo, setPageNo] = useState<number>(0);
    const [statusCounts, setStatusCounts] = useState<StatusCounts>({});
    const prevDateFromRef = useRef<string>('');
    const prevDateToRef = useRef<string>('');

    const fetchData = useCallback(async (currentFilters: RequestFilters, currentPage: number) => {
        setLoading(true);
        setError(null);
        try {
            const PAGE_SIZE = 10;
            
            // Check if any backend filter is applied (status, dateFrom, dateTo)
            // Note: search is filtered on frontend, so we don't include it here
            const hasBackendFilters = currentFilters.status || currentFilters.dateFrom || currentFilters.dateTo;
            
            let listResponse: Page<Request>;
            
            if (hasBackendFilters) {
                // Use filtered endpoint when backend filters are applied
                const params: GetRequestsParams = {
                    ...currentFilters,
                    pageNo: currentPage,
                };
                // Remove search from params since it's filtered on frontend
                delete params.search;
                listResponse = await requestService.getRequestList(params);
                // Clear allRequestsList when using filtered endpoint
                setAllRequestsList(null);
            } else {
                // Use getAllRequests when no backend filters - store full list for frontend pagination
                const allRequests = await requestService.getAllRequests();
                setAllRequestsList(allRequests);
                // Return full list in content, pagination will be handled in page component
                listResponse = {
                    content: allRequests,
                    totalPages: Math.ceil(allRequests.length / PAGE_SIZE),
                    totalElements: allRequests.length,
                    size: PAGE_SIZE,
                    number: currentPage
                };
            }

            // Always fetch counts separately (counts endpoint doesn't have getAll, so use filters)
            const countsResponse = await requestService.getRequestCounts(currentFilters);

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
            // Default: exclude "Done" status by setting status to empty string (which will be filtered on frontend if needed)
            fetchData(defaultFilters, 0);
        }
    }, [fetchData, loadOnMount]);

    const handleFilterChange = (name: keyof RequestFilters, value: string) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value,
        }));
    };

    // Auto-filter when both dateFrom and dateTo are filled and changed
    useEffect(() => {
        const dateFromChanged = prevDateFromRef.current !== (filters.dateFrom || '');
        const dateToChanged = prevDateToRef.current !== (filters.dateTo || '');
        
        // Only trigger if one of the dates changed and both are now filled
        if ((dateFromChanged || dateToChanged) && filters.dateFrom && filters.dateTo) {
            prevDateFromRef.current = filters.dateFrom;
            prevDateToRef.current = filters.dateTo;
            setPageNo(0);
            fetchData(filters, 0);
        } else {
            // Update refs even if not triggering fetch
            prevDateFromRef.current = filters.dateFrom || '';
            prevDateToRef.current = filters.dateTo || '';
        }
    }, [filters.dateFrom, filters.dateTo, fetchData]);

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
        // If status is empty string, don't filter by status (for "All" tab)
        const updatedFilters = { ...filters, status: status || '' };
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
        allRequestsList, // Export full list for frontend pagination
        handleFilterChange,
        handleStatusChange,
        handleSearch,
        handleClear,
        handlePageChange,
    };
}
