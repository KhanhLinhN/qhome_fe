import { useState, useEffect, useCallback } from 'react';
import { Request } from '@/src/types/request';
import { ProcessLog } from '@/src/types/processLog';
import { RequestService } from '@/src/services/customer-interaction/requestDetailService';
import { RequestService as RequestListService } from '@/src/services/customer-interaction/requestService';
import { LogUpdateData } from '@/src/components/customer-interaction/RequestLogUpdate';
import { useAuth } from '@/src/contexts/AuthContext';

const requestService = new RequestService();
const requestListService = new RequestListService();

export const useRequestDetails = (requestId: string | string[] | undefined) => {
    const { user } = useAuth();
    const [requestData, setRequestData] = useState<Request | null>(null);
    const [logData, setLogData] = useState<ProcessLog[]>([]);
    
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const fetchData = useCallback(async () => {
        if (!requestId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const { request, logs } = await requestService.getRequestDetails(requestId.toString());
            console.log("Fetched request details:", request);
            setRequestData(request);
            setLogData(logs);
        } catch (err) {
            setError(err as Error);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [requestId]); 

    useEffect(() => {
        fetchData();
    }, [fetchData]); 

    const addLog = async (data: LogUpdateData) => {
        if (!requestId) return;

        setIsSubmitting(true);
        setError(null);
        try {
            await requestService.addRequestLog(requestId as string, data);
            await fetchData(); 
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateFee = async (fee: number) => {
        if (!requestId) return;

        setIsSubmitting(true);
        setError(null);
        try {
            await requestListService.updateFee(requestId as string, fee);
            await fetchData(); 
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    };

    const acceptOrDenyRequest = async (action: string, fee: number | null, repairedDate: string | null, note: string) => {
        if (!requestId) return;

        setIsSubmitting(true);
        setError(null);
        try {
            const staffName = user?.username || 'Staff';
            
            if (action === 'accept') {
                // Accept flow:
                // Step 1: Update fee
                if (fee !== null) {
                    await requestListService.updateFee(requestId as string, fee);
                }
                
                // Step 2: Create log request with status "Pending" (addProcessingLog will update status to Pending)
                const logContent = `${staffName} sẽ tới sửa chữa vào ngày ${repairedDate} với giá ${fee?.toLocaleString('vi-VN')} VND với ghi chú là: ${note}`;
                const logData: LogUpdateData = {
                    requestStatus: 'Pending', // This will update request status to Pending via addProcessingLog
                    content: logContent
                };
                await requestService.addRequestLog(requestId as string, logData);
                
            } else if (action === 'deny') {
                // Deny flow:
                // Step 1: Create log request with status "Done" (addProcessingLog will update status to Done)
                const logContent = `Từ chối: ${note}`;
                const logData: LogUpdateData = {
                    requestStatus: 'Done', // This will update request status to Done via addProcessingLog
                    content: logContent
                };
                await requestService.addRequestLog(requestId as string, logData);
            }
            
            await fetchData(); 
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    };

    return { 
        requestData, 
        logData, 
        loading, 
        error,
        isSubmitting,
        addLog,
        updateFee,
        acceptOrDenyRequest         
    };
};