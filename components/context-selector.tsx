'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTaskStore } from '@/store/task-store';
import { parseSpecificContext, getAvailableContexts, parseTasksFile } from '@/lib/task-parser';
import { FileText, Layers, Info, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const ContextSelector: React.FC = () => {
  const { setTasksData } = useTaskStore();
  const [fileContent, setFileContent] = React.useState<string | null>(null);
  const [availableContexts, setAvailableContexts] = React.useState<string[]>([]);
  const [selectedContext, setSelectedContext] = React.useState<string>('');
  const [contextInfo, setContextInfo] = React.useState<Record<string, any>>({});
  const [isMultiContext, setIsMultiContext] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Analyze file when content changes
  React.useEffect(() => {
    if (!fileContent) {
      setAvailableContexts([]);
      setSelectedContext('');
      setContextInfo({});
      setIsMultiContext(false);
      return;
    }

    try {
      const contexts = getAvailableContexts(fileContent);
      setAvailableContexts(contexts);
      setIsMultiContext(contexts.length > 1 || contexts[0] !== 'default');
      
      // Get context information
      const data = JSON.parse(fileContent);
      const info: Record<string, any> = {};
      
      if (data.tasks && Array.isArray(data.tasks)) {
        info.default = {
          taskCount: data.tasks.length,
          description: data.metadata?.description || 'Single context file'
        };
      } else {
        contexts.forEach(context => {
          if (data[context]) {
            info[context] = {
              taskCount: data[context].tasks?.length || 0,
              description: data[context].metadata?.description || `Tasks from ${context} context`,
              created: data[context].metadata?.created_at || data[context].metadata?.created,
              updated: data[context].metadata?.updated_at || data[context].metadata?.updated
            };
          }
        });
      }
      
      setContextInfo(info);
      setError(null);
      
      // Auto-select first context
      if (contexts.length > 0) {
        setSelectedContext(contexts[0]);
      }
    } catch (err) {
      setError(`Failed to analyze file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [fileContent]);

  const loadAllContexts = () => {
    if (!fileContent) return;
    
    try {
      const data = parseTasksFile(fileContent);
      setTasksData(data);
      setError(null);
    } catch (err) {
      setError(`Failed to load all contexts: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const loadSpecificContext = (contextName: string) => {
    if (!fileContent || !contextName) return;
    
    try {
      const data = parseSpecificContext(fileContent, contextName);
      setTasksData(data);
      setError(null);
    } catch (err) {
      setError(`Failed to load context '${contextName}': ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // This component can be used by FileManager to set file content
  React.useEffect(() => {
    const handleFileLoad = (event: CustomEvent<string>) => {
      setFileContent(event.detail);
    };

    window.addEventListener('tasksFileLoaded', handleFileLoad as EventListener);
    return () => {
      window.removeEventListener('tasksFileLoaded', handleFileLoad as EventListener);
    };
  }, []);

  if (!fileContent || availableContexts.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2" />
            <p>Load a tasks.json file to see available contexts</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Layers className="h-5 w-5" />
          <span>Context Selection</span>
          {isMultiContext && (
            <Badge variant="secondary">Multi-Context</Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Context Information */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Available Contexts:</h4>
          <div className="grid gap-2">
            {availableContexts.map(context => {
              const info = contextInfo[context];
              return (
                <div 
                  key={context} 
                  className="flex items-center justify-between p-2 rounded border bg-muted/50"
                >
                  <div>
                    <span className="font-medium">{context}</span>
                    {info?.description && (
                      <p className="text-xs text-muted-foreground">{info.description}</p>
                    )}
                  </div>
                  <Badge variant="outline">
                    {info?.taskCount || 0} tasks
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Context Selection */}
        {isMultiContext && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Select Context:</h4>
            <Select value={selectedContext} onValueChange={setSelectedContext}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a context to load..." />
              </SelectTrigger>
              <SelectContent>
                {availableContexts.map(context => (
                  <SelectItem key={context} value={context}>
                    <div className="flex items-center space-x-2">
                      <span>{context}</span>
                      <Badge variant="secondary" className="text-xs">
                        {contextInfo[context]?.taskCount || 0}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col space-y-2">
          {isMultiContext ? (
            <>
              <Button 
                onClick={loadAllContexts}
                className="w-full"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Load All Contexts (Merged)
              </Button>
              
              <Button 
                onClick={() => loadSpecificContext(selectedContext)}
                disabled={!selectedContext}
                variant="outline"
                className="w-full"
              >
                Load Selected Context Only
              </Button>
            </>
          ) : (
            <Button 
              onClick={loadAllContexts}
              className="w-full"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Load Tasks
            </Button>
          )}
        </div>

        {/* Context Details */}
        {selectedContext && contextInfo[selectedContext] && (
          <div className="mt-4 p-3 rounded border bg-muted/30">
            <h5 className="font-medium text-sm mb-2">Context Details: {selectedContext}</h5>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Tasks: {contextInfo[selectedContext].taskCount}</p>
              {contextInfo[selectedContext].created && (
                <p>Created: {new Date(contextInfo[selectedContext].created).toLocaleDateString()}</p>
              )}
              {contextInfo[selectedContext].updated && (
                <p>Updated: {new Date(contextInfo[selectedContext].updated).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};