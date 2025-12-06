import axios from '@/src/lib/axios';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8081';

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
      const response = await axios.get(`${BASE_URL}/api/kanban/columns`, {
        withCredentials: true,
      });
      return response.data;
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
      const response = await axios.get(`${BASE_URL}/api/kanban/status-mappings`, {
        withCredentials: true,
      });
      return response.data;
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

