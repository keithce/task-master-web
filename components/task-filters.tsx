'use client';

import React from 'react';
import { useTaskStore } from '@/store/task-store';
import { TaskStatus, TaskPriority } from '@/types/task';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Filter, X, Tag } from 'lucide-react';

export const TaskFilters: React.FC = () => {
  const { filter, setFilter, getAllTasks } = useTaskStore();

  const statusOptions: TaskStatus[] = ['todo', 'in_progress', 'completed', 'blocked', 'cancelled'];
  const priorityOptions: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

  // Get all unique tags from all tasks
  const allTasks = getAllTasks();
  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    allTasks.forEach(task => {
      task.tags?.forEach(tag => {
        if (tag.trim()) tagSet.add(tag);
      });
    });
    return Array.from(tagSet).sort();
  }, [allTasks]);

  const updateFilter = (key: keyof typeof filter, value: any) => {
    const newFilter = { ...filter, [key]: value };
    // Clean up empty arrays to prevent filtering issues
    if (Array.isArray(value) && value.length === 0) {
      delete newFilter[key];
    }
    setFilter(newFilter);
  };

  const clearFilter = (key: keyof typeof filter) => {
    const newFilter = { ...filter };
    delete newFilter[key];
    setFilter(newFilter);
  };

  const hasActiveFilters = Object.keys(filter).some(key => {
    const value = filter[key as keyof typeof filter];
    return value && (Array.isArray(value) ? value.length > 0 : true);
  });

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={filter.search || ''}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="flex-1"
        />
        {filter.search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearFilter('search')}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Status
              {filter.status && filter.status.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filter.status.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {statusOptions.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={filter.status?.includes(status) || false}
                onCheckedChange={(checked) => {
                  const currentStatus = filter.status || [];
                  if (checked) {
                    const newStatus = [...currentStatus, status];
                    updateFilter('status', newStatus);
                  } else {
                    const newStatus = currentStatus.filter(s => s !== status);
                    updateFilter('status', newStatus);
                  }
                }}
              >
                {status === 'in_progress' ? 'In Progress' : 
                 status.charAt(0).toUpperCase() + status.slice(1)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Priority
              {filter.priority && filter.priority.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filter.priority.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {priorityOptions.map((priority) => (
              <DropdownMenuCheckboxItem
                key={priority}
                checked={filter.priority?.includes(priority) || false}
                onCheckedChange={(checked) => {
                  const currentPriority = filter.priority || [];
                  if (checked) {
                    const newPriority = [...currentPriority, priority];
                    updateFilter('priority', newPriority);
                  } else {
                    const newPriority = currentPriority.filter(p => p !== priority);
                    updateFilter('priority', newPriority);
                  }
                }}
              >
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Tag className="h-4 w-4 mr-2" />
              Tags
              {filter.tags && filter.tags.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filter.tags.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {allTags.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No tags found
              </div>
            ) : (
              allTags.map((tag) => (
                <DropdownMenuCheckboxItem
                  key={tag}
                  checked={filter.tags?.includes(tag) || false}
                  onCheckedChange={(checked) => {
                    const currentTags = filter.tags || [];
                    if (checked) {
                      const newTags = [...currentTags, tag];
                      updateFilter('tags', newTags);
                    } else {
                      const newTags = currentTags.filter(t => t !== tag);
                      updateFilter('tags', newTags);
                    }
                  }}
                >
                  {tag}
                </DropdownMenuCheckboxItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter({})}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active filter badges */}
      <div className="flex flex-wrap gap-2">
        {filter.status?.map((status) => (
          <Badge key={status} variant="default" className="flex items-center space-x-1">
            <span>Status: {status.replace('_', ' ')}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 ml-1"
              onClick={() => {
                const newStatus = filter.status?.filter(s => s !== status) || [];
                if (newStatus.length === 0) {
                  clearFilter('status');
                } else {
                  updateFilter('status', newStatus);
                }
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
        
        {filter.priority?.map((priority) => (
          <Badge key={priority} variant="default" className="flex items-center space-x-1">
            <span>Priority: {priority}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 ml-1"
              onClick={() => {
                const newPriority = filter.priority?.filter(p => p !== priority) || [];
                if (newPriority.length === 0) {
                  clearFilter('priority');
                } else {
                  updateFilter('priority', newPriority);
                }
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
        
        {filter.tags?.map((tag) => (
          <Badge key={`tag-${tag}`} variant="default" className="flex items-center space-x-1">
            <span>Tag: {tag}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 ml-1"
              onClick={() => {
                const newTags = filter.tags?.filter(t => t !== tag) || [];
                if (newTags.length === 0) {
                  clearFilter('tags');
                } else {
                  updateFilter('tags', newTags);
                }
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  );
};