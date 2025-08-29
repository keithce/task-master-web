"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useTaskStore } from "@/store/task-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save, X, ChevronRight, Trash2 } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  status: z.enum(["todo", "in_progress", "completed", "blocked", "cancelled"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  dependencies: z.array(z.string()).optional(),
  details: z.string().optional(),
  testStrategy: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

export const TaskEditor: React.FC = () => {
  const { selectedTask, updateTask, setSelectedTask, createTask, deleteTask, findTaskById, getAllTasks } = useTaskStore();
  const [newDependency, setNewDependency] = React.useState("");

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      dependencies: [],
      details: "",
      testStrategy: "",
    },
  });

  React.useEffect(() => {
    if (selectedTask) {
      form.reset({
        title: selectedTask.title || "",
        description: selectedTask.description || "",
        status: selectedTask.status,
        priority: selectedTask.priority,
        dependencies: selectedTask.dependencies || [],
        details: selectedTask.details || "",
        testStrategy: selectedTask.testStrategy || "",
      });
    }
  }, [selectedTask, form]);

  const onSubmit = (data: TaskFormData) => {
    if (selectedTask) {
      updateTask(selectedTask.id, data);
    }
  };

  const addDependency = () => {
    if (newDependency.trim() && selectedTask) {
      const currentDeps = form.getValues("dependencies") || [];
      if (!currentDeps.includes(newDependency.trim())) {
        form.setValue("dependencies", [...currentDeps, newDependency.trim()]);
        setNewDependency("");
      }
    }
  };

  const removeDependency = (depToRemove: string) => {
    const currentDeps = form.getValues("dependencies") || [];
    form.setValue(
      "dependencies",
      currentDeps.filter((dep) => dep !== depToRemove),
    );
  };

  const getFullTaskId = (task: any): string => {
    if (!task) return "";
    
    const buildIdPath = (currentTask: any): string[] => {
      const path = [currentTask.id];
      
      if (currentTask.parent_id) {
        const parent = findTaskById(currentTask.parent_id);
        if (parent) {
          path.unshift(...buildIdPath(parent));
        }
      }
      
      return path;
    };
    
    const idPath = buildIdPath(task);
    return idPath.join('.');
  };

  const getDependencyStatus = (depId: string) => {
    const depTask = findTaskById(depId);
    if (depTask) {
      return depTask.status === 'completed' ? '✅' : '⏱️';
    }
    return '❓'; // Unknown task
  };

  // Get all available task IDs for dependency selection
  const allTasks = getAllTasks();
  
  // Filter tasks that share at least one tag with the selected task
  const tasksWithSharedTags = React.useMemo(() => {
    if (!selectedTask || !selectedTask.tags || selectedTask.tags.length === 0) {
      return []; // No tags means no shared dependencies
    }
    
    const selectedTags = selectedTask.tags;
    
    // Deduplicate and filter tasks by shared tags, exclude self
    const uniqueTasks = allTasks.reduce((acc: Task[], task: Task) => {
      const existingTask = acc.find((t) => t.id === task.id);
      if (!existingTask && task.id !== selectedTask.id && task.tags) {
        // Check if task shares at least one tag with selected task
        const hasSharedTag = task.tags.some(tag => selectedTags.includes(tag));
        if (hasSharedTag) {
          acc.push(task);
        }
      }
      return acc;
    }, []);
    
    return uniqueTasks;
  }, [allTasks, selectedTask]);
  
  const availableTaskIds = tasksWithSharedTags
    .map(task => task.id)
    .sort((a, b) => {
      const aNum = parseInt(a) || 0;
      const bNum = parseInt(b) || 0;
      return aNum - bNum;
    });

  if (!selectedTask) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Select a task to edit</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          <div className="flex items-center space-x-2">
            <span>Edit Task</span>
            <span className="text-sm font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
              #{getFullTaskId(selectedTask)}
            </span>
            {selectedTask.tags && selectedTask.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedTask.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter task title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter task description..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="In-depth implementation instructions..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="testStrategy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Test Strategy</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Verification approach..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label>Dependencies</Label>
              <p className="text-xs text-muted-foreground">Task IDs that must be completed before this task</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {(form.watch("dependencies") || []).map((dep) => (
                  <Badge
                    key={dep}
                    variant="secondary"
                    className="flex items-center space-x-1"
                  >
                    <span>{getDependencyStatus(dep)} #{dep}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => removeDependency(dep)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex space-x-2">
                <Select
                  value={newDependency}
                  onValueChange={setNewDependency}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select task ID..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTaskIds.map((taskId) => (
                      <SelectItem key={taskId} value={taskId}>
                        <div className="flex items-center space-x-2">
                          <span>#{taskId}</span>
                          <span className="text-muted-foreground">
                            {tasksWithSharedTags.find(t => t.id === taskId)?.title}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                    {availableTaskIds.length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No tasks with shared tags found
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <Button 
                  type="button" 
                  onClick={addDependency} 
                  size="sm"
                  disabled={!newDependency.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>✅ = Completed dependency</p>
                <p>⏱️ = Pending dependency</p>
                <p>❓ = Unknown task ID</p>
              </div>
            </div>

            {/* Manual dependency input as fallback */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Or add dependency manually:</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter task ID..."
                  value={newDependency}
                  onChange={(e) => setNewDependency(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addDependency();
                    }
                  }}
                />
                <Button type="button" onClick={addDependency} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Subtasks Section */}
            {selectedTask && selectedTask.subtasks.length > 0 && (
              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    Subtasks ({selectedTask.subtasks.length})
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => createTask(selectedTask.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subtask
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedTask.subtasks
                    .sort((a, b) => {
                      const aNum = parseInt(a.id) || 0;
                      const bNum = parseInt(b.id) || 0;
                      return aNum - bNum;
                    })
                    .map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer group"
                      onClick={() => setSelectedTask(subtask)}
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
                          #{getFullTaskId(subtask)}
                        </span>
                        <span className="font-medium truncate flex-1 min-w-0">
                          {subtask.title}
                        </span>
                        <Badge
                          variant="secondary"
                          className={
                            subtask.status === "completed"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : subtask.status === "in_progress"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              : subtask.status === "blocked"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          }
                        >
                          {subtask.status.replace("_", " ")}
                        </Badge>
                      </div>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTask(subtask.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
          {selectedTask && selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
            )}

            {/* Add Subtask Button for tasks without subtasks */}
            {selectedTask && selectedTask.subtasks.length === 0 && (
              <div className="pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => createTask(selectedTask.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Subtask
                </Button>
              </div>
            )}

            <Button type="submit" className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
          {/* Add Subtask Button for tasks without subtasks */}
          {selectedTask && (!selectedTask.subtasks || selectedTask.subtasks.length === 0) && (