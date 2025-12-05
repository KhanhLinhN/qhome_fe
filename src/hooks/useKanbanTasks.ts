import { useState, useEffect, useCallback, useMemo } from 'react';
import { WorkTask, TaskStatus, TaskFilter } from '@/src/types/workTask';
import { workTaskService } from '@/src/services/workMa/workTaskService';
import { useAuth } from '@/src/contexts/AuthContext';
import { getEmployeesInTenant, EmployeeRoleDto } from '@/src/services/iam/employeeService';

export function useKanbanTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeRoleDto[]>([]);
  const [filter, setFilter] = useState<TaskFilter>({
    showAll: false,
  });

  const isAdmin = useMemo(() => {
    return user?.roles?.some(role => role.toUpperCase() === 'ADMIN') ?? false;
  }, [user]);

  // Load employees for filtering
  useEffect(() => {
    const loadEmployees = async () => {
      if (!user?.tenantId) return;
      
      try {
        const empList = await getEmployeesInTenant(user.tenantId);
        setEmployees(empList);
      } catch (err) {
        console.error('Failed to load employees:', err);
      }
    };

    loadEmployees();
  }, [user?.tenantId]);

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

  // Filter tasks based on current filter and user role
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Apply role-based filtering
    if (!isAdmin && !filter.showAll) {
      // Non-admin users see only their own tasks by default
      if (user?.userId) {
        filtered = filtered.filter(task => task.assignedTo === user.userId);
      }
    }

    // Apply employee filter
    if (filter.employeeId && filter.employeeId !== 'all') {
      filtered = filtered.filter(task => task.assignedTo === filter.employeeId);
    }

    // Apply role filter (if filtering by role)
    if (filter.role && filter.role !== 'all') {
      const employeesInRole = employees.filter(emp => 
        emp.assignedRoles.some(r => r.roleName.toUpperCase() === filter.role?.toUpperCase())
      );
      const employeeIds = employeesInRole.map(emp => emp.userId);
      filtered = filtered.filter(task => 
        task.assignedTo && employeeIds.includes(task.assignedTo)
      );
    }

    return filtered;
  }, [tasks, filter, isAdmin, user?.userId, employees]);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, WorkTask[]> = {
      TODO: [],
      DOING: [],
      DONE: [],
    };

    filteredTasks.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });

    return grouped;
  }, [filteredTasks]);

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
      await workTaskService.assignTask(taskId, employeeId);
      
      // Reload tasks to get updated assignee info
      await loadTasks();
    } catch (err: any) {
      setError(err.message || 'Failed to assign task');
      throw err;
    }
  }, [loadTasks]);

  // Update filter
  const updateFilter = useCallback((newFilter: Partial<TaskFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  }, []);

  return {
    tasks: filteredTasks,
    tasksByStatus,
    loading,
    error,
    employees,
    filter,
    isAdmin,
    updateTaskStatus,
    assignTask,
    updateFilter,
    refetch: loadTasks,
  };
}

