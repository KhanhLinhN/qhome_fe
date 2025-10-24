import { Request } from "@/src/types/request";
export interface BulkUpdateResponse {
  success: boolean;
  message: string;
  updatedCount?: number;
}

export interface GetRequestsParams {
  requestId?: string;
  title?: string;
  residentName?: string;
  tenantId?: string; 
  status?: string;
  priority?: string;
  pageNo?: number;
}

export interface StatusCounts {
    New?: number;
    Processing?: number;
    Responded?: number; 
    Closed?: number;
    total?: number;
    [key: string]: number | undefined;
}

export interface Page<Request> {
  content: Request[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number; 
}

export class RequestService {
    async getRequestList(params: GetRequestsParams = {}): Promise<Page<Request>> {
        const query = new URLSearchParams();

        // Add parameters to the query string
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                query.append(key, String(value));
            }
        });

        const queryString = query.toString();
        console.log('Request params:', params);
        console.log('Query string:', queryString);
        
        // Construct the full URL
        const url = `${process.env.NEXT_PUBLIC_CUSTOMER_INTERACTION_API_URL}/requests${queryString ? `?${queryString}` : ''}`;
        console.log('Full URL:', url);

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result: Page<Request> = await response.json();
            console.log('Fetched requests:', result);
            return result;

        } catch (error) {
            console.error('An error occurred while fetching requests:', error);
            throw error;
        }
    }

    async getRequestCounts(params: GetRequestsParams = {}): Promise<StatusCounts> {
        const query = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                query.append(key, String(value));
            }
        });

        const queryString = query.toString();
        console.log('Counts params:', params);
        console.log('Counts query string:', queryString);
        
        const url = `${process.env.NEXT_PUBLIC_CUSTOMER_INTERACTION_API_URL}/requests/counts${queryString ? `?${queryString}` : ''}`;
        console.log('Counts URL:', url);

        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result: StatusCounts = await response.json();
            return result;

        } catch (error) {
            console.error('An error occurred while fetching request counts:', error);
            throw error;
        }
    }
}
