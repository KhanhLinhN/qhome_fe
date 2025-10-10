import { useEffect, useState } from 'react';
import { RequestService, GetRequestsParams, Page } from '@/src/services/customer-interaction/requestService';
import { Request } from '@/src/types/request';

interface useTableRequestReturn {
    requestPage: Page<Request> | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

const requestService = new RequestService();

export const RequestListForTable = (params: GetRequestsParams = {}): useTableRequestReturn => {
  const [requestPage, setRequestPage] = useState<Page<Request> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

    const fetchRequests = async () => {
        try {
        setLoading(true);
        setError(null);
        
        const data = await requestService.getRequestList(params);
        setRequestPage(data);

        } catch (err) {
        setError('Failed to load requests.');
        } finally {
        setLoading(false);
        }
    };
    useEffect(() => {
        fetchRequests();
    }, []);
    return {
        requestPage,
        loading,
        error,
        refetch: fetchRequests,
    };
}
