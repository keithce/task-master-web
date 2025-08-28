"use client";

import React from "react";
import { useTaskStore } from "@/store/task-store";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

export const BreadcrumbNav: React.FC = () => {
  const { selectedTask, findTaskById, setSelectedTask } = useTaskStore();

  const getBreadcrumbPath = () => {
    if (!selectedTask) return [];

    const path = [];
    let currentTask = selectedTask;

    while (currentTask) {
      path.unshift(currentTask);
      if (currentTask.parent_id) {
        const parentTask = findTaskById(currentTask.parent_id);
        if (parentTask) {
          currentTask = parentTask;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return path;
  };

  const breadcrumbPath = getBreadcrumbPath();

  if (!selectedTask) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center space-x-2">
              <Home className="h-4 w-4" />
              <span>Task Manager</span>
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            onClick={() => setSelectedTask(null)}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>Tasks</span>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {breadcrumbPath.map((task, index) => (
          <React.Fragment key={task.id}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {index === breadcrumbPath.length - 1 ? (
                <BreadcrumbPage>{task.title}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  onClick={() => setSelectedTask(task)}
                  className="cursor-pointer"
                >
                  {task.title}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
