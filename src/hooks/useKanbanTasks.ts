import { useState, useEffect, useCallback, useMemo } from 'react';
import { WorkTask, TaskStatus, TaskFilter, KanbanColumnConfig } from '@/src/types/workTask';
import { workTaskService } from '@/src/services/workMa/workTaskService';
import { useAuth } from '@/src/contexts/AuthContext';
import { EmployeeRoleDto } from '@/src/services/iam/employeeService';
import { fetchStaffAccounts, UserAccountInfo } from '@/src/services/iam/userService';
import { kanbanConfigService } from '@/src/services/workMa/kanbanConfigService';

export function useKanbanTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeRoleDto[]>([]);
  const [columnsConfig, setColumnsConfig] = useState<KanbanColumnConfig[]>([]);
  const [filter, setFilter] = useState<TaskFilter>({});

  const isAdmin = useMemo(() => {
    return user?.roles?.some(role => role.toUpperCase() === 'ADMIN') ?? false;
  }, [user]);

  // Get user's role (first non-admin role, or undefined if admin)
  const userRole = useMemo(() => {
    if (!user?.roles || user.roles.length === 0) return undefined;
    // If admin, return undefined (will show "all")
    if (isAdmin) return undefined;
    // Find first role that is not ADMIN
    const nonAdminRole = user.roles.find(role => role.toUpperCase() !== 'ADMIN');
    return nonAdminRole?.toUpperCase();
  }, [user, isAdmin]);

  // Initialize filter based on user role
  useEffect(() => {
    if (userRole) {
      // Non-admin: fix role to user's role
      setFilter(prev => ({ ...prev, role: userRole }));
    } else if (isAdmin) {
      // Admin: set to "all" (undefined)
      setFilter(prev => ({ ...prev, role: undefined }));
    }
  }, [userRole, isAdmin]);

  // Load employees (staff) for filtering and name mapping
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const staffList = await fetchStaffAccounts();
        // Map UserAccountInfo to EmployeeRoleDto format
        const empList: EmployeeRoleDto[] = staffList.map(staff => ({
          userId: staff.userId,
          username: staff.username,
          email: staff.email,
          fullName: staff.username, // Use username as fallback
          assignedRoles: (staff.roles || []).map(role => ({
            roleName: role,
            assignedAt: '',
            assignedBy: '',
          })),
          totalPermissions: 0,
        }));
        setEmployees(empList);
      } catch (err) {
        console.error('Failed to load employees:', err);
      }
    };

    loadEmployees();
  }, []);

  // Map employee names to tasks when employees are loaded
  useEffect(() => {
    if (employees.length > 0 && tasks.length > 0) {
      setTasks(prevTasks => {
        const tasksWithNames = prevTasks.map(task => {
          if (task.assignedTo && !task.assignedToName) {
            const employee = employees.find(emp => emp.userId === task.assignedTo);
            if (employee) {
              return {
                ...task,
                assignedToName: employee.fullName || employee.username,
              };
            }
          }
          return task;
        });
        
        // Only update if there are changes
        const hasChanges = tasksWithNames.some((task, index) => 
          task.assignedToName !== prevTasks[index]?.assignedToName
        );
        
        return hasChanges ? tasksWithNames : prevTasks;
      });
    }
  }, [employees, tasks.length]);

  // Load kanban columns configuration
  useEffect(() => {
    const loadColumnsConfig = async () => {
      try {
        const config = await kanbanConfigService.getColumnsConfig();
        // Sort by order
        config.sort((a, b) => (a.order || 0) - (b.order || 0));
        setColumnsConfig(config);
        console.log('Loaded kanban columns config:', config);
      } catch (err) {
        console.error('Failed to load columns config:', err);
        // Set default config on error
        const defaultConfig = [
          { id: 'todo', status: 'TODO', title: 'To Do', color: 'bg-gray-100', borderColor: 'border-gray-300', order: 1 },
          { id: 'doing', status: 'DOING', title: 'Doing', color: 'bg-blue-100', borderColor: 'border-blue-300', order: 2 },
          { id: 'done', status: 'DONE', title: 'Done', color: 'bg-green-100', borderColor: 'border-green-300', order: 3 },
        ];
        setColumnsConfig(defaultConfig);
      }
    };

    loadColumnsConfig();
  }, []);

  // Load tasks
  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const allTasks = await workTaskService.getAllTasks();
      setTasks(allTasks);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Filter tasks based on current filter
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // For non-admin, always filter by user's role first
    const effectiveRole = !isAdmin && userRole ? userRole : filter.role;

    // Apply role filter (if filtering by role)
    if (effectiveRole && effectiveRole !== 'all') {
      const employeesInRole = employees.filter(emp => 
        emp.assignedRoles.some(r => r.roleName.toUpperCase() === effectiveRole.toUpperCase())
      );
      const employeeIds = employeesInRole.map(emp => emp.userId);
      filtered = filtered.filter(task => 
        task.assignedTo && employeeIds.includes(task.assignedTo)
      );
    }

    // Apply employee filter
    if (filter.employeeId && filter.employeeId !== 'all') {
      filtered = filtered.filter(task => task.assignedTo === filter.employeeId);
    }

    return filtered;
  }, [tasks, filter, employees]);

  // Group tasks by status dynamically based on columns config
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, WorkTask[]> = {};
    
    // Initialize groups from columns config
    columnsConfig.forEach(column => {
      grouped[column.status] = [];
    });

    // Group tasks by their status
    filteredTasks.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      } else {
        // If status doesn't match any column, add to first column as fallback
        if (columnsConfig.length > 0) {
          const firstStatus = columnsConfig[0].status;
          if (!grouped[firstStatus]) {
            grouped[firstStatus] = [];
          }
          grouped[firstStatus].push(task);
        }
      }
    });

    return grouped;
  }, [filteredTasks, columnsConfig]);

  // Update task status (drag and drop)
  const updateTaskStatus = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    try {
      await workTaskService.updateTaskStatus(taskId, newStatus);
      
      // Optimistically update local state
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update task status');
      // Reload tasks on error
      loadTasks();
    }
  }, [loadTasks]);

  // Assign task to employee (admin only)
  const assignTask = useCallback(async (taskId: string, employeeId: string) => {
    try {
      await workTaskService.assignTask(taskId, employeeId, user?.userId);
      
      // Reload tasks to get updated assignee info
      await loadTasks();
    } catch (err: any) {
      setError(err.message || 'Failed to assign task');
      throw err;
    }
  }, [loadTasks, user?.userId]);

  // Update filter
  const updateFilter = useCallback((newFilter: Partial<TaskFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  }, []);

  return {
    tasks: filteredTasks,
    tasksByStatus,
    columnsConfig,
    loading,
    error,
    employees,
    filter,
    isAdmin,
    userRole, // Add userRole to return
    updateTaskStatus,
    assignTask,
    updateFilter,
    refetch: loadTasks,
  };
}

