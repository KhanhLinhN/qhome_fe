import axios from '@/src/lib/axios';
import { WorkTask, TaskStatus } from '@/src/types/workTask';
import { Request } from '@/src/types/request';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8081';

// Map Request status to TaskStatus
function mapRequestStatusToTaskStatus(status: string): TaskStatus {
  const statusMap: Record<string, TaskStatus> = {
    'New': 'TODO',
    'Pending': 'TODO',
    'Processing': 'DOING',
    'Done': 'DONE',
    'Cancelled': 'TODO', // Cancelled tasks go back to TODO
  };
  return statusMap[status] || 'TODO';
}

// Map TaskStatus to Request status
function mapTaskStatusToRequestStatus(status: TaskStatus): string {
  const statusMap: Record<TaskStatus, string> = {
    'TODO': 'Pending',
    'DOING': 'Processing',
    'DONE': 'Done',
  };
  return statusMap[status];
}

// Convert Request to WorkTask
function mapRequestToWorkTask(request: Request, assignedTo?: string, assignedToName?: string): WorkTask {
  return {
    id: request.id,
    title: request.title,
    description: request.content,
    status: mapRequestStatusToTaskStatus(request.status),
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
      return requests.map(req => {
        const request: Request = {
          id: req.id,
          requestCode: req.id,
          residentId: req.residentId,
          residentName: req.contactName || 'N/A',
          unitId: req.unitId,
          imagePath: req.attachments && req.attachments.length > 0 ? req.attachments[0] : null,
          title: req.title,
          content: req.description || '',
          status: req.status === 'NEW' ? 'New' : 
                  req.status === 'PENDING' ? 'Pending' :
                  req.status === 'IN_PROGRESS' ? 'Processing' :
                  req.status === 'DONE' ? 'Done' : 'New',
          createdAt: req.createdAt ? new Date(req.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: req.updatedAt ? new Date(req.updatedAt).toISOString() : new Date().toISOString(),
          category: req.category,
          location: req.location,
          contactPhone: req.contactPhone,
          attachments: req.attachments || [],
          priority: req.priority,
        };

        return mapRequestToWorkTask(
          request,
          req.assignedTo,
          req.assignedToName
        );
      });
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
      if (status === 'DONE') {
        // Mark as complete
        await axios.patch(
          `${BASE_URL}/api/maintenance-requests/admin/${taskId}/complete`,
          {},
          { withCredentials: true }
        );
      } else if (status === 'DOING') {
        // Move to IN_PROGRESS by responding (this moves status to IN_PROGRESS)
        await axios.post(
          `${BASE_URL}/api/maintenance-requests/admin/${taskId}/respond`,
          {
            adminResponse: 'Đang xử lý công việc',
            estimatedCost: 0,
          },
          { withCredentials: true }
        );
      } else if (status === 'TODO') {
        // For TODO, we might need to cancel and resend, or just leave it
        // For now, we'll do nothing as TODO is the default state
        // If needed, we could cancel and resend, but that's complex
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

