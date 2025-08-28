export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  created_at: string;
  updated_at: string;
  due_date?: string;
  tags: string[];
  subtasks: Task[];
  parent_id?: string;
  assignee?: string;
  estimated_hours?: number;
  actual_hours?: number;
  completion_percentage: number;
}

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  search?: string;
  assignee?: string;
  tags?: string[];
}

export interface TasksData {
  version: string;
  metadata: {
    created_at: string;
    updated_at: string;
    total_tasks: number;
  };
  tasks: Task[];
}