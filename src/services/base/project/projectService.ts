import { filters } from "@/src/components/base-service/FilterForm";
import { Project } from "@/src/types/project";
export interface BulkUpdateResponse {
  success: boolean;
  message: string;
  updatedCount?: number;
}

export interface PagedResponse<T> {
    content: T[];
    pageable: {
        pageNumber: number;
        pageSize: number;
    };
    totalElements: number;
}

const TOKEN_REQUEST_BODY = {
    "username": "qhomebase_user_fresh",
    "uid": "550e8400-e29b-41d4-a716-446655440008",
    "tenantId": "550e8400-e29b-41d4-a716-446655440007",
    "roles": ["tenant_manager", "tenant_owner"],
    "permissions": ["base.tenant.create", "base.tenant.read", "base.tenant.update", "base.tenant.delete", "base.tenant.delete.request", "base.tenant.delete.approve"]
};

export class ProjectService {
    async getProjectList(filters: filters, pageNo: number): Promise<PagedResponse<Project>> {
        let url = `${process.env.NEXT_PUBLIC_BASE_PROJECT_APT_URL}tenants`;
        const params = new URLSearchParams();
        
        params.append('page', pageNo.toString());
        params.append('size', '10'); 

        if (filters.codeName) {
            params.append('codeName', filters.codeName);
        }
        if (filters.status) {
            params.append('status', filters.status);
        }
        if (filters.address) {
            params.append('address', filters.address);
        }
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        try {
            const tokenResponse = await fetch('http://localhost:8088/api/test/generate-token', {
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json', 
                },
                body: JSON.stringify(TOKEN_REQUEST_BODY), 
            });            
            if (!tokenResponse.ok) {
                throw new Error(`Failed to fetch token! status: ${tokenResponse.status}`);
            }
            const tokenData = await tokenResponse.json(); 
            const token = tokenData.token; 

            const headers = {
                "User-Agent": "PostmanRuntime/7.49.0",
                "Accept": "*/*",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Authorization": `Bearer ${token}`, 
            };

            const response = await fetch(url, {
                method: 'GET', 
                headers: headers, 
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (Array.isArray(data)) {
                return {
                    content: data, 
                    pageable: { pageNumber: 0, pageSize: data.length > 0 ? data.length : 10 }, 
                    totalElements: data.length, 
                } as PagedResponse<Project>;
            } else {
                return data as PagedResponse<Project>;
            }

        } catch (error) {
            console.error('An error occurred while fetching requests:', error);
            throw error;
        }
    }
}
