/**
 * Task Parser for handling both single-context and multi-context tasks.json files
 */

import { TasksData, Task } from '@/types/task';
import { v4 as uuidv4 } from 'uuid';

export class TaskParser {
  static parse(content: string): TasksData {
    try {
      const data = JSON.parse(content);
      
      // Check if it's single-context format (has direct tasks array)
      if (data.tasks && Array.isArray(data.tasks)) {
        return this.validateAndNormalize(data);
      }
      
      // Check if it's multi-context format
      const contexts = this.getAvailableContexts(content);
      if (contexts.length > 0) {
        // Merge all contexts
        return this.mergeAllContexts(data);
      }
      
      throw new Error('No valid tasks found in file');
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON syntax: ${error.message}`);
      }
      throw error;
    }
  }

  static getAvailableContexts(content: string): string[] {
    try {
      const data = JSON.parse(content);
      
      // Single-context format
      if (data.tasks && Array.isArray(data.tasks)) {
        return ['default'];
      }
      
      // Multi-context format
      const contexts: string[] = [];
      for (const [key, value] of Object.entries(data)) {
        if (this.isValidContext(value)) {
          contexts.push(key);
        }
      }
      
      return contexts;
    } catch (error) {
      return [];
    }
  }

  static parseSpecificContext(content: string, contextName: string): TasksData {
    try {
      const data = JSON.parse(content);
      
      // Handle default context for single-context format
      if (contextName === 'default' && data.tasks && Array.isArray(data.tasks)) {
        return this.validateAndNormalize(data);
      }
      
      // Handle specific context for multi-context format
      if (data[contextName] && this.isValidContext(data[contextName])) {
        const contextData = data[contextName];
        const tasksData: TasksData = {
          version: '1.0.0',
          metadata: {
            created_at: contextData.metadata?.created || contextData.metadata?.created_at || new Date().toISOString(),
            updated_at: contextData.metadata?.updated || contextData.metadata?.updated_at || new Date().toISOString(),
            total_tasks: contextData.tasks.length,
            description: contextData.metadata?.description || `Tasks from ${contextName} context`
          },
          tasks: contextData.tasks.map((task: any) => this.normalizeTask(task, contextName))
        };
        
        return this.validateAndNormalize(tasksData);
      }
      
      throw new Error(`Context "${contextName}" not found`);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON syntax: ${error.message}`);
      }
      throw error;
    }
  }

  private static isValidContext(value: any): boolean {
    return (
      typeof value === 'object' &&
      value !== null &&
      Array.isArray(value.tasks) &&
      value.tasks.length >= 0
    );
  }

  private static mergeAllContexts(data: any): TasksData {
    const allTasks: Task[] = [];
    let totalTasks = 0;
    const contexts: string[] = [];
    
    for (const [contextName, contextData] of Object.entries(data)) {
      if (this.isValidContext(contextData)) {
        contexts.push(contextName);
        const contextTasks = (contextData as any).tasks.map((task: any) => 
          this.normalizeTask(task, contextName)
        );
        allTasks.push(...contextTasks);
        totalTasks += contextTasks.length;
      }
    }

    const tasksData: TasksData = {
      version: '1.0.0',
      metadata: {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_tasks: totalTasks,
        description: `Merged tasks from contexts: ${contexts.join(', ')}`
      },
      tasks: allTasks
    };

    return this.validateAndNormalize(tasksData);
  }

  private static normalizeTask(task: any, context?: string): Task {
    // Generate ID if missing
    const id = task.id ? String(task.id) : uuidv4();
    
    // Normalize status
    const statusMap: Record<string, string> = {
      'pending': 'todo',
      'done': 'completed',
      'in-progress': 'in_progress',
      'in_progress': 'in_progress'
    };
    const status = statusMap[task.status] || task.status || 'todo';
    
    // Normalize priority
    const priorityMap: Record<string, string> = {
      'critical': 'urgent',
      'normal': 'medium'
    };
    const priority = priorityMap[task.priority] || task.priority || 'medium';
    
    // Add context as a tag if provided and handle various tag formats
    const tags = Array.isArray(task.tags) ? [...task.tags] : (task.tags ? [task.tags] : []);
    if (context && context !== 'default') {
      tags.unshift(context);
    }

    // Handle subtasks recursively - check various possible field names
    const rawSubtasks = task.subtasks || task.sub_tasks || task.children || [];
    const subtasks = Array.isArray(rawSubtasks) ? rawSubtasks.map((subtask: any) => 
      this.normalizeTask(subtask, context)
    ) : [];


    // Handle parent_id - check various field names
    const parentId = task.parent_id || task.parentId || task.parentTaskId || task.parent_task_id;
    const normalizedTask: Task = {
      id,
      title: task.title || 'Untitled Task',
      description: task.description || '',
      status: status as Task['status'],
      priority: priority as Task['priority'],
      created_at: task.created_at || task.createdAt || new Date().toISOString(),
      updated_at: task.updated_at || task.updatedAt || new Date().toISOString(),
      subtasks: subtasks,
      parent_id: parentId ? String(parentId) : undefined,
      dependencies: Array.isArray(task.dependencies) ? task.dependencies.map(String) : [],
      tags: tags,
      details: task.details || '',
      testStrategy: task.testStrategy || task.test_strategy || ''
    };

    return normalizedTask;
  }

  private static validateAndNormalize(data: TasksData): TasksData {
    if (!data.tasks || !Array.isArray(data.tasks)) {
      throw new Error('Invalid format: tasks must be an array');
    }

    // Normalize metadata
    const metadata = {
      created_at: data.metadata?.created_at || new Date().toISOString(),
      updated_at: data.metadata?.updated_at || new Date().toISOString(),
      total_tasks: data.tasks.length,
      description: data.metadata?.description || 'Task list'
    };

    return {
      version: data.version || '1.0.0',
      metadata,
      tasks: data.tasks
    };
  }
}

// Export convenience functions for backward compatibility
export function parseTasksFile(content: string): TasksData {
  return TaskParser.parse(content);
}

export function getAvailableContexts(content: string): string[] {
  return TaskParser.getAvailableContexts(content);
}

export function parseSpecificContext(content: string, contextName: string): TasksData {
  return TaskParser.parseSpecificContext(content, contextName);
}