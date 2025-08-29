export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  created_at: string;
  updated_at: string;
  subtasks: Task[];
  parent_id?: string;
  dependencies?: string[];
  details?: string;
  testStrategy?: string;
}

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "completed"
  | "blocked"
  | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

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
    description?: string;
  };
  tasks: Task[];
}
