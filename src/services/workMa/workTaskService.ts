import axios from '@/src/lib/axios';
import { WorkTask, TaskStatus } from '@/src/types/workTask';
import { Request } from '@/src/types/request';
import { kanbanConfigService, StatusMapping } from './kanbanConfigService';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8081';

// Cache for status mappings
let statusMappingsCache: StatusMapping[] | null = null;

// Map Request status to TaskStatus using config from database
async function mapRequestStatusToTaskStatus(status: string): Promise<TaskStatus> {
  if (!statusMappingsCache) {
    statusMappingsCache = await kanbanConfigService.getStatusMappings();
  }
  
  const mapping = statusMappingsCache.find(m => 
    m.fromStatus.toUpperCase() === status.toUpperCase()
  );
  
  return mapping ? mapping.toStatus : 'TODO';
}

// Map TaskStatus to Request status using reverse mapping from config
async function mapTaskStatusToRequestStatus(status: TaskStatus): Promise<string> {
  if (!statusMappingsCache) {
    statusMappingsCache = await kanbanConfigService.getStatusMappings();
  }
  
  // Find reverse mapping (from kanban status to request status)
  const mapping = statusMappingsCache.find(m => m.toStatus === status);
  if (mapping) {
    return mapping.fromStatus;
  }
  
  // Fallback to default mapping if not found
  const reverseMap: Record<string, string> = {
    'TODO': 'PENDING',
    'DOING': 'IN_PROGRESS',
    'DONE': 'DONE',
  };
  
  return reverseMap[status] || 'PENDING';
}

// Convert Request to WorkTask
async function mapRequestToWorkTask(request: Request, assignedTo?: string, assignedToName?: string): Promise<WorkTask> {
  const mappedStatus = await mapRequestStatusToTaskStatus(request.status);
  return {
    id: request.id,
    title: request.title,
    description: request.content,
    status: mappedStatus,
    assignedTo: assignedTo,
    assignedToName: assignedToName,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    priority: request.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | undefined,
    category: request.category,
    requestCode: request.requestCode,
    residentId: request.residentId,
    residentName: request.residentName,
    unitId: request.unitId,
    location: request.location,
    contactPhone: request.contactPhone,
    attachments: request.attachments,
  };
}

export class WorkTaskService {
  /**
   * Get all work tasks (from maintenance requests)
   */
  async getAllTasks(): Promise<WorkTask[]> {
    try {
      const response = await axios.get(`${BASE_URL}/api/maintenance-requests/all`, {
        withCredentials: true,
      });

      const requests: any[] = response.data;
      
      // Map requests to work tasks
      // Note: We'll need to fetch assignee info separately if available
      const mappedTasks = await Promise.all(
        requests.map(async (req) => {
          const request: Request = {
            id: req.id,
            requestCode: req.id,
            residentId: req.residentId,
            residentName: req.contactName || 'N/A',
            unitId: req.unitId,
            imagePath: req.attachments && req.attachments.length > 0 ? req.attachments[0] : null,
            title: req.title,
            content: req.description || '',
            status: req.status || 'NEW', // Use status from database directly
            createdAt: req.createdAt ? new Date(req.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: req.updatedAt ? new Date(req.updatedAt).toISOString() : new Date().toISOString(),
            category: req.category,
            location: req.location,
            contactPhone: req.contactPhone,
            attachments: req.attachments || [],
            priority: req.priority,
          };

          return await mapRequestToWorkTask(
            request,
            req.assignedTo,
            req.assignedToName
          );
        })
      );

      return mappedTasks;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    try {
      const requestStatus = await mapTaskStatusToRequestStatus(status);
      
      // Use the appropriate endpoint based on the status
      if (requestStatus === 'DONE' || requestStatus === 'Done') {
        // Mark as complete
        await axios.patch(
          `${BASE_URL}/api/maintenance-requests/admin/${taskId}/complete`,
          {},
          { withCredentials: true }
        );
      } else if (requestStatus === 'IN_PROGRESS' || requestStatus === 'Processing') {
        // Move to IN_PROGRESS by responding
        await axios.post(
          `${BASE_URL}/api/maintenance-requests/admin/${taskId}/respond`,
          {
            adminResponse: 'Đang xử lý công việc',
            estimatedCost: 0,
          },
          { withCredentials: true }
        );
      } else {
        // For other statuses, try to update via a generic endpoint if available
        // This might need to be adjusted based on your API
        try {
          await axios.patch(
            `${BASE_URL}/api/maintenance-requests/${taskId}/status`,
            { status: requestStatus },
            { withCredentials: true }
          );
        } catch (err) {
          // If endpoint doesn't exist, log and continue
          console.warn('Status update endpoint not available, skipping update');
        }
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  /**
   * Assign task to employee (admin only)
   * Note: Assignment is done through the respond endpoint which moves status to IN_PROGRESS
   * The actual assignment tracking might need to be handled separately
   */
  async assignTask(taskId: string, employeeId: string): Promise<void> {
    try {
      // Use respond endpoint to assign and move to processing
      // Note: The backend might not track assignedTo directly through this endpoint
      // This is a limitation we'll work with for now
      await axios.post(
        `${BASE_URL}/api/maintenance-requests/admin/${taskId}/respond`,
        {
          adminResponse: `Đã gán công việc cho nhân viên`,
          estimatedCost: 0,
          note: `Assigned to: ${employeeId}`,
        },
        { withCredentials: true }
      );
    } catch (error) {
      console.error('Error assigning task:', error);
      throw error;
    }
  }

  /**
   * Get tasks assigned to a specific employee
   */
  async getTasksByEmployee(employeeId: string): Promise<WorkTask[]> {
    try {
      const allTasks = await this.getAllTasks();
      return allTasks.filter(task => task.assignedTo === employeeId);
    } catch (error) {
      console.error('Error fetching tasks by employee:', error);
      throw error;
    }
  }
}

export const workTaskService = new WorkTaskService();

