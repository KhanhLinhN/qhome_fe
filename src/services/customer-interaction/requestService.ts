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
            if (value !== undefined && value !== null) {
                query.append(key, String(value));
            }
        });

        const queryString = query.toString();
        // Construct the full URL
        const url = `${process.env.NEXT_CUSTOMER_INTERACTION_API_URL}/requests${queryString ? `?${queryString}` : ''}`;

        console.log("Calling API:", url);

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result: Page<Request> = await response.json();
            return result;

        } catch (error) {
            console.error('An error occurred while fetching requests:', error);
            throw error;
        }
    }
}
