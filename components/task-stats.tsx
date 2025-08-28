'use client';

import React from 'react';
import { useTaskStore } from '@/store/task-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react';

export const TaskStats: React.FC = () => {
  const { getAllTasks, getFilteredTasks, filter } = useTaskStore();
  const allTasks = getAllTasks();
  const filteredTasks = getFilteredTasks();
  
  // Check if filters are active
  const hasActiveFilters = Object.keys(filter).some(key => {
    const value = filter[key as keyof typeof filter];
    return value && (Array.isArray(value) ? value.length > 0 : true);
  });
  
  // Use filtered tasks for stats if filters are active
  const tasksForStats = hasActiveFilters ? filteredTasks : allTasks;

  const stats = {
    total: tasksForStats.length,
    completed: tasksForStats.filter(task => task.status === 'completed').length,
    inProgress: tasksForStats.filter(task => task.status === 'in_progress').length,
    blocked: tasksForStats.filter(task => task.status === 'blocked').length,
    overdue: tasksForStats.filter(task => 
      task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
    ).length,
  };

  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
  const avgCompletion = stats.total > 0 
    ? tasksForStats.reduce((sum, task) => sum + task.completion_percentage, 0) / stats.total 
    : 0;

  const totalEstimatedHours = tasksForStats.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
  const totalActualHours = tasksForStats.reduce((sum, task) => sum + (task.actual_hours || 0), 0);

  return (
    <div className="space-y-4">
      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          Showing {tasksForStats.length} of {allTasks.length} tasks (filtered)
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.completed} completed, {stats.inProgress} in progress
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
          <Progress value={completionRate} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgCompletion.toFixed(1)}%</div>
          <Progress value={avgCompletion} className="mt-2" />
        </CardContent>
      </Card>

      {stats.blocked > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.blocked}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      )}

      {stats.overdue > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <Calendar className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Time Tracking</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEstimatedHours}h</div>
          <p className="text-xs text-muted-foreground">
            {totalActualHours}h actual time logged
          </p>
        </CardContent>
      </Card>
    </div>
    </div>
  );
};