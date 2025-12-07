import axios from '@/src/lib/axios';
import { WorkTask, TaskStatus } from '@/src/types/workTask';
import { Request } from '@/src/types/request';
import { kanbanConfigService, StatusMapping } from './kanbanConfigService';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8081';
const STAFF_WORK_URL = process.env.NEXT_PUBLIC_STAFF_WORK_URL || 'http://localhost:8087';

// Cache for status mappings per tenant
const statusMappingsCache: Map<string, StatusMapping[]> = new Map();

// Map Request status to TaskStatus using config from database
async function mapRequestStatusToTaskStatus(status: string): Promise<TaskStatus> {
  const cacheKey = 'default';
  
  if (!statusMappingsCache.has(cacheKey)) {
    const mappings = await kanbanConfigService.getStatusMappings();
    statusMappingsCache.set(cacheKey, mappings);
  }
  
  const mappings = statusMappingsCache.get(cacheKey) || [];
  const mapping = mappings.find(m => 
    m.fromStatus.toUpperCase() === status.toUpperCase()
  );
  
  return mapping ? mapping.toStatus : 'TODO';
}

// Map TaskStatus to Request status using reverse mapping from config
async function mapTaskStatusToRequestStatus(status: TaskStatus): Promise<string> {
  const cacheKey = 'default';
  
  if (!statusMappingsCache.has(cacheKey)) {
    const mappings = await kanbanConfigService.getStatusMappings();
    statusMappingsCache.set(cacheKey, mappings);
  }
  
  const mappings = statusMappingsCache.get(cacheKey) || [];
  // Find reverse mapping (from kanban status to request status)
  const mapping = mappings.find(m => m.toStatus === status);
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
  private tenantId?: string;

  /**
   * Set tenant ID for this service instance
   */
  setTenantId(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Get all work tasks (from maintenance requests) with staff assignments
   */
  async getAllTasks(): Promise<WorkTask[]> {
    try {
      // Fetch maintenance requests
      const requestsResponse = await axios.get(`${BASE_URL}/api/maintenance-requests/all`, {
        withCredentials: true,
      });

      const requests: any[] = requestsResponse.data;
      
      // Fetch staff assignments for all tasks
      let assignmentsMap = new Map<string, string>(); // workTaskId -> staffId
      try {
        const assignmentsResponse = await axios.get(`${STAFF_WORK_URL}/api/staff-work-assignments`, {
          withCredentials: true,
        });
        
        const assignments: any[] = assignmentsResponse.data || [];
        assignments.forEach((assignment: any) => {
          if (assignment.workTaskId && assignment.staffId) {
            assignmentsMap.set(assignment.workTaskId, assignment.staffId);
          }
        });
      } catch (assignError) {
        console.warn('Failed to fetch staff assignments, continuing without them:', assignError);
      }
      
      // Map requests to work tasks with assignment info
      const mappedTasks = await Promise.all(
        requests.map(async (req) => {
          const assignedStaffId = assignmentsMap.get(req.id) || req.assignedTo;
          
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
            assignedStaffId,
            req.assignedToName // Name will be mapped later from employees list
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
   * Creates assignment in staff-work-service
   */
  async assignTask(taskId: string, employeeId: string, assignedBy?: string): Promise<void> {
    try {
      // Create assignment in staff-work-service
      await axios.post(
        `${STAFF_WORK_URL}/api/staff-work-assignments`,
        {
          staffId: employeeId,
          workTaskId: taskId,
          assignedBy: assignedBy,
          notes: `Assigned task ${taskId} to staff ${employeeId}`,
        },
        {
          withCredentials: true,
        }
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

