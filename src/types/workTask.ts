export type TaskStatus = string; // Dynamic status from database

export interface WorkTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assignedTo?: string;
  assignedToName?: string;
  assignedBy?: string;
  assignedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category?: string;
  dueDate?: string;
  tags?: string[];
  // Additional fields from maintenance requests
  requestCode?: string;
  residentId?: string;
  residentName?: string;
  unitId?: string;
  location?: string;
  contactPhone?: string;
  attachments?: string[];
}

export interface TaskFilter {
  role?: string;
  employeeId?: string;
  status?: TaskStatus;
  showAll?: boolean;
}

export interface KanbanColumnConfig {
  id: string;
  status: string;
  title: string;
  color: string;
  borderColor: string;
  order: number;
}

