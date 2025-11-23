import { ProcessLog } from "@/src/types/processLog";
import { Request } from "@/src/types/request";
import { LogUpdateData } from '@/src/components/customer-interaction/RequestLogUpdate';

export interface BulkUpdateResponse {
  success: boolean;
  message: string;
  updatedCount?: number;
}

interface RequestDetailsResponse {
    request: Request;
    logs: ProcessLog[];
}

export class RequestService {
    async getRequestDetails(requestId? : string) : Promise<RequestDetailsResponse> {
        
        // Construct the full URL
        const url = `${process.env.NEXT_PUBLIC_CUSTOMER_INTERACTION_API_URL}/requests/${requestId}`;
        const progressLogUrl = `${process.env.NEXT_PUBLIC_CUSTOMER_INTERACTION_API_URL}/requests-logs/${requestId}`;

        try {
            const [requestResponse, logsResponse] = await Promise.all([
                fetch(url),
                fetch(progressLogUrl)
            ]);

            if (!requestResponse.ok) {
                 throw new Error(`HTTP error! status for request: ${requestResponse.status}`);
            }
            if (!logsResponse.ok) {
                throw new Error(`HTTP error! status for logs: ${logsResponse.status}`);
            }

            const requestResult: Request = await requestResponse.json();
            const logsResult: ProcessLog[] = await logsResponse.json();

             return {
                request: requestResult,
                logs: logsResult
            };

        } catch (error) {
            console.error('An error occurred while fetching requests:', error);
            throw error;
        }
    }

    async addRequestLog(requestId: string, data: LogUpdateData): Promise<void> {
        const url = `${process.env.NEXT_PUBLIC_CUSTOMER_INTERACTION_API_URL}/requests-logs/${requestId}/logs`;

        console.log("url", url);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        console.log("requestId", requestId);
        console.log("data", data);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to add log entry.' }));
            throw new Error(errorData.message);
        }

    }

}
