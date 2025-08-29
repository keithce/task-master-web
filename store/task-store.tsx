"use client";

import { persistenceManager } from "@/lib/persistence";
import { Task, TaskFilter, TasksData } from "@/types/task";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface TaskState {
  // State
  tasksData: TasksData | null;
  selectedTask: Task | null;
  filter: TaskFilter;
  expandedTasks: Set<string>;
  isHydrated: boolean;

  // Actions
  setTasksData: (data: TasksData | null) => void;
  setSelectedTask: (task: Task | null) => void;
  setFilter: (filter: TaskFilter) => void;
  toggleTaskExpansion: (taskId: string) => void;
  setIsHydrated: (hydrated: boolean) => void;

  // Task operations
  findTaskById: (id: string) => Task | null;
  getAllTasks: () => Task[];
  getFilteredTasks: () => Task[];
  createTask: (parentId?: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;

  // Persistence
  saveState: () => Promise<void>;
  restoreState: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      // Initial state
      tasksData: null,
      selectedTask: null,
      filter: {},
      expandedTasks: new Set(),
      isHydrated: false,

      // Basic setters
      setTasksData: (data) => {
        set({ tasksData: data });
        // Update metadata if data exists
        if (data) {
          const updatedData = {
            ...data,
            metadata: {
              ...data.metadata,
              updated_at: new Date().toISOString(),
              total_tasks: data.tasks.length,
            },
          };
          set({ tasksData: updatedData });
        }
      },

      setSelectedTask: (task) => set({ selectedTask: task }),

      setFilter: (filter) => set({ filter }),

      toggleTaskExpansion: (taskId) => {
        const { expandedTasks } = get();
        const newExpanded = new Set(expandedTasks);
        if (newExpanded.has(taskId)) {
          newExpanded.delete(taskId);
        } else {
          newExpanded.add(taskId);
        }
        set({ expandedTasks: newExpanded });
      },

      setIsHydrated: (hydrated) => set({ isHydrated: hydrated }),

      // Task operations
      findTaskById: (id) => {
        const { tasksData } = get();
        if (!tasksData) return null;

        const findInTasks = (tasks: Task[]): Task | null => {
          for (const task of tasks) {
            if (task.id === id) return task;
            const found = findInTasks(task.subtasks);
            if (found) return found;
          }
          return null;
        };

        return findInTasks(tasksData.tasks);
      },

      getAllTasks: () => {
        const { tasksData } = get();
        if (!tasksData) return [];

        const flattenTasks = (tasks: Task[]): Task[] => {
          const result: Task[] = [];
          for (const task of tasks) {
            result.push(task);
            result.push(...flattenTasks(task.subtasks));
          }
          return result;
        };

        return flattenTasks(tasksData.tasks);
      },

      getFilteredTasks: () => {
        const { tasksData, filter } = get();
        if (!tasksData) return [];

        const filterTasks = (tasks: Task[]): Task[] => {
          return tasks.filter((task) => {
            // Status filter
            if (filter.status && filter.status.length > 0) {
              if (!filter.status.includes(task.status)) return false;
            }

            // Priority filter
            if (filter.priority && filter.priority.length > 0) {
              if (!filter.priority.includes(task.priority)) return false;
            }

            // Search filter
            if (filter.search && filter.search.trim()) {
              const searchLower = filter.search.toLowerCase();
              const matchesTitle = task.title
                .toLowerCase()
                .includes(searchLower);
              const matchesDescription = task.description
                .toLowerCase()
                .includes(searchLower);
              const matchesTags = task.tags.some((tag) =>
                tag.toLowerCase().includes(searchLower),
              );
              if (!matchesTitle && !matchesDescription && !matchesTags)
                return false;
            }

            // Assignee filter
            if (filter.assignee && filter.assignee.trim()) {
              if (
                !task.assignee ||
                !task.assignee
                  .toLowerCase()
                  .includes(filter.assignee.toLowerCase())
              ) {
                return false;
              }
            }

            // Tags filter
            if (filter.tags && filter.tags.length > 0) {
              const hasMatchingTag = filter.tags.some((filterTag) =>
                task.tags.some((taskTag) =>
                  taskTag.toLowerCase().includes(filterTag.toLowerCase()),
                ),
              );
              if (!hasMatchingTag) return false;
            }

            return true;
          });
        };

        return filterTasks(tasksData.tasks);
      },

      createTask: (parentId) => {
        const { tasksData } = get();
        if (!tasksData) return;

        const newTask: Task = {
          id: crypto.randomUUID(),
          title: "New Task",
          description: "",
          status: "todo",
          priority: "medium",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tags: [],
          subtasks: [],
          parent_id: parentId,
          completion_percentage: 0,
        };

        if (parentId) {
          // Add as subtask
          const updateTasksRecursively = (tasks: Task[]): Task[] => {
            return tasks.map((task) => {
              if (task.id === parentId) {
                return {
                  ...task,
                  subtasks: [...task.subtasks, newTask],
                  updated_at: new Date().toISOString(),
                };
              }
              return {
                ...task,
                subtasks: updateTasksRecursively(task.subtasks),
              };
            });
          };

          const updatedTasks = updateTasksRecursively(tasksData.tasks);
          const updatedData = {
            ...tasksData,
            tasks: updatedTasks,
            metadata: {
              ...tasksData.metadata,
              updated_at: new Date().toISOString(),
              total_tasks: tasksData.metadata.total_tasks + 1,
            },
          };

          set({
            tasksData: updatedData,
            selectedTask: newTask,
          });
        } else {
          // Add as top-level task
          const updatedData = {
            ...tasksData,
            tasks: [...tasksData.tasks, newTask],
            metadata: {
              ...tasksData.metadata,
              updated_at: new Date().toISOString(),
              total_tasks: tasksData.metadata.total_tasks + 1,
            },
          };

          set({
            tasksData: updatedData,
            selectedTask: newTask,
          });
        }
      },

      updateTask: (taskId, updates) => {
        const { tasksData } = get();
        if (!tasksData) return;

        const updateTasksRecursively = (tasks: Task[]): Task[] => {
          return tasks.map((task) => {
            if (task.id === taskId) {
              const updatedTask = {
                ...task,
                ...updates,
                updated_at: new Date().toISOString(),
              };

              // Update selected task if it's the same
              const { selectedTask } = get();
              if (selectedTask && selectedTask.id === taskId) {
                set({ selectedTask: updatedTask });
              }

              return updatedTask;
            }
            return {
              ...task,
              subtasks: updateTasksRecursively(task.subtasks),
            };
          });
        };

        const updatedTasks = updateTasksRecursively(tasksData.tasks);
        const updatedData = {
          ...tasksData,
          tasks: updatedTasks,
          metadata: {
            ...tasksData.metadata,
            updated_at: new Date().toISOString(),
          },
        };

        set({ tasksData: updatedData });
      },

      deleteTask: (taskId) => {
        const { tasksData, selectedTask } = get();
        if (!tasksData) return;

        const deleteTaskRecursively = (tasks: Task[]): Task[] => {
          return tasks.filter((task) => {
            if (task.id === taskId) return false;
            task.subtasks = deleteTaskRecursively(task.subtasks);
            return true;
          });
        };

        const updatedTasks = deleteTaskRecursively(tasksData.tasks);
        const updatedData = {
          ...tasksData,
          tasks: updatedTasks,
          metadata: {
            ...tasksData.metadata,
            updated_at: new Date().toISOString(),
            total_tasks: updatedTasks.length,
          },
        };

        // Clear selected task if it was deleted
        const newSelectedTask =
          selectedTask && selectedTask.id === taskId ? null : selectedTask;

        set({
          tasksData: updatedData,
          selectedTask: newSelectedTask,
        });
      },

      // Persistence operations
      saveState: async () => {
        const { tasksData, selectedTask, filter, expandedTasks } = get();
        if (!tasksData) return;

        try {
          const state = {
            tasksData,
            selectedTaskId: selectedTask?.id,
            filter,
            expandedTasks: Array.from(expandedTasks),
          };
          await persistenceManager.saveAll(state);
        } catch (error) {
          console.error("Failed to save state:", error);
          throw error;
        }
      },

      restoreState: async () => {
        try {
          const restoredState = await persistenceManager.restoreAll();
          if (restoredState) {
            const selectedTask = restoredState.selectedTaskId
              ? get().findTaskById(restoredState.selectedTaskId)
              : null;

            set({
              tasksData: restoredState.tasksData || null,
              selectedTask,
              filter: restoredState.filter || {},
              expandedTasks: new Set(restoredState.expandedTasks || []),
              isHydrated: true,
            });
          } else {
            set({ isHydrated: true });
          }
        } catch (error) {
          console.error("Failed to restore state:", error);
          set({ isHydrated: true });
          throw error;
        }
      },

      clearAll: async () => {
        try {
          await persistenceManager.clearAll();
          set({
            tasksData: null,
            selectedTask: null,
            filter: {},
            expandedTasks: new Set(),
          });
        } catch (error) {
          console.error("Failed to clear all data:", error);
          throw error;
        }
      },
    }),
    {
      name: "task-store",
      storage: createJSONStorage(() => {
        // Ensure we're in the browser before accessing localStorage
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      partialize: (state) => ({
        tasksData: state.tasksData,
        filter: state.filter,
        expandedTasks: Array.from(state.expandedTasks), // Convert Set to Array for serialization
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert Array back to Set after rehydration
          state.expandedTasks = new Set(
            state.expandedTasks as unknown as string[],
          );
          state.setIsHydrated(true);
        }
      },
      // Skip hydration during SSR
      skipHydration: typeof window === "undefined",
    },
  ),
);

export { useTaskStore };
