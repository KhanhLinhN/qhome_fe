import axios from '@/src/lib/axios';

const BASE_URL = process.env.NEXT_PUBLIC_STAFF_WORK_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8087';

export interface KanbanColumnConfig {
  id: string;
  status: string;
  title: string;
  color: string;
  borderColor: string;
  order: number;
}

export interface StatusMapping {
  fromStatus: string;
  toStatus: string;
}

export class KanbanConfigService {
  /**
   * Get kanban columns configuration from API
   * Falls back to default if API is not available
   */
  async getColumnsConfig(): Promise<KanbanColumnConfig[]> {
    try {
      // Try to get from API first
      const url = `${BASE_URL}/api/kanban/columns`;
      console.log('Fetching kanban columns from:', url);
      
      const response = await axios.get(url, {
        withCredentials: true,
      });
      
      console.log('Kanban columns response:', response.data);
      // Map backend DTO to frontend config
      if (!response.data || !Array.isArray(response.data)) {
        console.warn('Invalid response format from kanban columns API');
        return this.getDefaultColumns();
      }
      
      return response.data.map((dto: any) => ({
        id: dto.id || String(dto.id) || '',
        status: dto.status || '',
        title: dto.title || '',
        color: dto.color || 'bg-gray-100',
        borderColor: dto.borderColor || 'border-gray-300',
        order: dto.order || 0,
      }));
    } catch (error) {
      console.warn('Failed to fetch kanban columns from API, using defaults', error);
      // Return default configuration
      return this.getDefaultColumns();
    }
  }

  /**
   * Get status mappings from API
   */
  async getStatusMappings(): Promise<StatusMapping[]> {
    try {
      const url = `${BASE_URL}/api/kanban/status-mappings`;
      console.log('Fetching status mappings from:', url);
      
      const response = await axios.get(url, {
        withCredentials: true,
      });
      
      console.log('Status mappings response:', response.data);
      // Map backend DTO to frontend mapping
      if (!response.data || !Array.isArray(response.data)) {
        console.warn('Invalid response format from status mappings API');
        return this.getDefaultStatusMappings();
      }
      
      return response.data.map((dto: any) => ({
        fromStatus: dto.fromStatus || '',
        toStatus: dto.toStatus || '',
      }));
    } catch (error) {
      console.warn('Failed to fetch status mappings from API, using defaults', error);
      return this.getDefaultStatusMappings();
    }
  }

  /**
   * Default columns configuration (fallback)
   */
  private getDefaultColumns(): KanbanColumnConfig[] {
    return [
      {
        id: 'todo',
        status: 'TODO',
        title: 'To Do',
        color: 'bg-gray-100',
        borderColor: 'border-gray-300',
        order: 1,
      },
      {
        id: 'doing',
        status: 'DOING',
        title: 'Doing',
        color: 'bg-blue-100',
        borderColor: 'border-blue-300',
        order: 2,
      },
      {
        id: 'done',
        status: 'DONE',
        title: 'Done',
        color: 'bg-green-100',
        borderColor: 'border-green-300',
        order: 3,
      },
    ];
  }

  /**
   * Default status mappings (fallback)
   */
  private getDefaultStatusMappings(): StatusMapping[] {
    return [
      { fromStatus: 'New', toStatus: 'TODO' },
      { fromStatus: 'Pending', toStatus: 'TODO' },
      { fromStatus: 'Processing', toStatus: 'DOING' },
      { fromStatus: 'IN_PROGRESS', toStatus: 'DOING' },
      { fromStatus: 'Done', toStatus: 'DONE' },
      { fromStatus: 'DONE', toStatus: 'DONE' },
      { fromStatus: 'Cancelled', toStatus: 'TODO' },
    ];
  }
}

export const kanbanConfigService = new KanbanConfigService();

