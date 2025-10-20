import { Project } from "@/src/types/project";
export interface BulkUpdateResponse {
  success: boolean;
  message: string;
  updatedCount?: number;
}


export class ProjectService {
    async getProjectList() {
        // Construct the full URL
        const url = `${process.env.NEXT_PUBLIC_BASE_PROJECT_APT_URL}//tenants`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result: Project = await response.json();
            console.log('Fetched requests:', result);
            return result;

        } catch (error) {
            console.error('An error occurred while fetching requests:', error);
            throw error;
        }
    }
}
