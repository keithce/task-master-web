"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { useTaskStore } from "@/store/task-store";
import { Task } from "@/types/task";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  MoreHorizontal,
  Plus,
  User,
} from "lucide-react";
import React from "react";

interface TaskNodeProps {
  task: Task;
  level: number;
  parentId?: string;
}

const TaskNode: React.FC<TaskNodeProps> = ({ task, level, parentId }) => {
  const {
    selectedTask,
    setSelectedTask,
    expandedTasks,
    toggleTaskExpansion,
    createTask,
    deleteTask,
    findTaskById,
  } = useTaskStore();

  const isExpanded = expandedTasks.has(task.id);
  // Ensure exact match for selection - compare both ID and object reference
  const isSelected = selectedTask?.id === task.id && selectedTask === task;
  const hasSubtasks = task.subtasks.length > 0;

  // Format the ID display
  const displayId = parentId ? `${parentId}.${task.id}` : task.id;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "blocked":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-2">
      <Card
        className={`p-4 transition-all duration-200 cursor-pointer hover:shadow-md ${
          isSelected ? "ring-2 ring-primary shadow-lg" : ""
        }`}
        style={{ marginLeft: level * 24 }}
        onClick={() => setSelectedTask(task)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            {hasSubtasks && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTaskExpansion(task.id);
                }}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
                  #{displayId}
                </span>
                <h3 className="font-semibold text-sm truncate flex-1 min-w-0">{task.title}</h3>
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(task.priority)}`}
                />
              </div>

              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <Badge
                  className={getStatusColor(task.status)}
                  variant="secondary"
                >
                  {task.status.replace("_", " ")}
                </Badge>

                {task.assignee && (
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>{task.assignee}</span>
                  </div>
                )}

                {task.due_date && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(task.due_date).toLocaleDateString()}</span>
                  </div>
                )}

                {task.estimated_hours && (
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{task.estimated_hours}h</span>
                  </div>
                )}

                {task.subtasks.length > 0 && (
                  <span className="text-xs">
                    {task.subtasks.length} subtask
                    {task.subtasks.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {task.completion_percentage > 0 && (
                <div className="mt-2">
                  <Progress
                    value={task.completion_percentage}
                    className="h-1"
                  />
                </div>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => createTask(task.id)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Subtask
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => deleteTask(task.id)}
                className="text-destructive"
              >
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      {hasSubtasks && isExpanded && (
        <div className="space-y-2">
          {task.subtasks
            .sort((a, b) => {
              const aNum = parseInt(a.id) || 0;
              const bNum = parseInt(b.id) || 0;
              return aNum - bNum;
            })
            .map((subtask) => (
            <TaskNode key={subtask.id} task={subtask} level={level + 1} parentId={task.id} />
          ))}
        </div>
      )}
    </div>
  );
};

export const TaskTree: React.FC = () => {
  const { tasksData, createTask, getFilteredTasks } = useTaskStore();

  const filteredTasks = getFilteredTasks();

  if (!tasksData || tasksData.tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-muted-foreground">No tasks found</p>
        <Button onClick={() => createTask()}>
          <Plus className="h-4 w-4 mr-2" />
          Create First Task
        </Button>
      </div>
    );
  }

  if (filteredTasks.length === 0 && tasksData.tasks.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-muted-foreground">No tasks match current filters</p>
      </div>
    );
  }

  // Helper function to sort tasks numerically by ID recursively
  const sortTasksRecursively = (tasks: Task[]): Task[] => {
    const sorted = tasks.sort((a, b) => {
      const aNum = parseInt(a.id) || 0;
      const bNum = parseInt(b.id) || 0;
      return aNum - bNum;
    });
    
    return sorted.map(task => ({
      ...task,
      subtasks: task.subtasks.length > 0 ? sortTasksRecursively(task.subtasks) : []
    }));
  };

  // Sort filtered tasks while maintaining hierarchy
  const sortedFilteredTasks = sortTasksRecursively(filteredTasks);
  
  return (
    <div className="space-y-4 px-1">
      {sortedFilteredTasks.map((task) => (
        <TaskNode key={task.id} task={task} level={0} />
      ))}

      <Button
        onClick={() => createTask()}
        variant="outline"
        className="w-full border-dashed"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Root Task
      </Button>
    </div>
  );
};