'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTaskStore } from '@/store/task-store';
import { TasksData } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Upload, 
  Download, 
  FileText, 
  AlertCircle,
  CheckCircle2,
  Database,
  Trash2
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { persistenceManager } from '@/lib/persistence';

import { parseTasksFile } from '@/lib/task-parser';

export const FileManager: React.FC = () => {
  const { tasksData, setTasksData, saveState, clearAll } = useTaskStore();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [isClearing, setIsClearing] = React.useState(false);
  const [storageInfo, setStorageInfo] = React.useState<{
    used: number;
    available: number;
    percentage: number;
  } | null>(null);

  // Load storage info on component mount
  React.useEffect(() => {
    const loadStorageInfo = async () => {
      try {
        const info = await persistenceManager.getStorageInfo();
        setStorageInfo(info);
      } catch (error) {
        console.error('Failed to load storage info:', error);
      }
    };
    
    loadStorageInfo();
    const interval = setInterval(loadStorageInfo, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data: TasksData = parseTasksFile(content);
        
        setTasksData(data);
        
        // Save file for persistence
        persistenceManager.saveFile(file, content).then(() => {
          console.log('File saved for persistence');
        }).catch(error => {
          console.warn('Failed to save file for persistence:', error);
        });
        
        setSuccess('Tasks loaded successfully!');
        setError(null);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError(`Failed to parse JSON file: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setSuccess(null);
      }
    };
    
    reader.readAsText(file);
  }, [setTasksData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
    },
    multiple: false,
  });

  const downloadTasksFile = () => {
    if (!tasksData) return;

    const dataStr = JSON.stringify(tasksData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `tasks-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    setSuccess('Tasks exported successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const createSampleData = () => {
    const sampleData: TasksData = {
      version: '1.0.0',
      metadata: {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_tasks: 3,
      },
      tasks: [
        {
          id: '1',
          title: 'Project Planning',
          description: 'Plan the overall project structure and timeline',
          status: 'in_progress',
          priority: 'high',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tags: ['planning', 'project'],
          subtasks: [
            {
              id: '1-1',
              title: 'Define Requirements',
              description: 'Gather and document all project requirements',
              status: 'completed',
              priority: 'high',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              tags: ['requirements'],
              subtasks: [],
              parent_id: '1',
              completion_percentage: 100,
            },
            {
              id: '1-2',
              title: 'Create Timeline',
              description: 'Develop project timeline with milestones',
              status: 'todo',
              priority: 'medium',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              tags: ['timeline'],
              subtasks: [],
              parent_id: '1',
              completion_percentage: 0,
            },
          ],
          assignee: 'John Doe',
          estimated_hours: 20,
          completion_percentage: 50,
        },
        {
          id: '2',
          title: 'Development Setup',
          description: 'Set up development environment and tools',
          status: 'todo',
          priority: 'medium',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tags: ['development', 'setup'],
          subtasks: [],
          estimated_hours: 8,
          completion_percentage: 0,
        },
        {
          id: '3',
          title: 'Testing Framework',
          description: 'Implement comprehensive testing framework',
          status: 'blocked',
          priority: 'high',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tags: ['testing', 'framework'],
          subtasks: [],
          assignee: 'Jane Smith',
          estimated_hours: 15,
          completion_percentage: 0,
        },
      ],
    };
    
    setTasksData(sampleData);
    setSuccess('Sample data loaded successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      return;
    }
    
    setIsClearing(true);
    try {
      await clearAll();
      setSuccess('All data cleared successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(`Failed to clear data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsClearing(false);
    }
  };

  const handleManualSave = async () => {
    try {
      await saveState();
      setSuccess('Data saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(`Failed to save data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>File Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-sm">Drop the tasks.json file here...</p>
            ) : (
              <div>
                <p className="text-sm font-medium mb-1">Drop your tasks.json file here</p>
                <p className="text-xs text-muted-foreground">or click to browse</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Button 
              onClick={downloadTasksFile} 
              disabled={!tasksData || tasksData.tasks.length === 0}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Tasks
            </Button>
            
            <Button onClick={createSampleData} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Load Sample Data
            </Button>
            
            <Button onClick={handleManualSave} variant="outline">
              <Database className="h-4 w-4 mr-2" />
              Save State
            </Button>
            
            <Button 
              onClick={handleClearAll} 
              variant="outline"
              disabled={isClearing}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isClearing ? 'Clearing...' : 'Clear All Data'}
            </Button>
          </div>

          {/* Status Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Task Statistics */}
          {tasksData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold">{tasksData.metadata.total_tasks}</p>
                <p className="text-xs text-muted-foreground">Total Tasks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {tasksData.tasks.filter(task => task.status === 'completed').length}
                </p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {tasksData.tasks.filter(task => task.status === 'in_progress').length}
                </p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {tasksData.tasks.filter(task => task.status === 'todo').length}
                </p>
                <p className="text-xs text-muted-foreground">To Do</p>
              </div>
            </div>
          )}
          
          {/* Storage Information */}
          {storageInfo && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Storage Usage</h4>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      storageInfo.percentage > 80 ? 'bg-red-500' :
                      storageInfo.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${storageInfo.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {storageInfo.percentage}% used
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(storageInfo.used / 1024 / 1024 * 100) / 100} MB of{' '}
                {Math.round(storageInfo.available / 1024 / 1024)} MB available
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};