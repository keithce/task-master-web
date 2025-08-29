'use client';

import React from 'react';
import { PersistenceProvider } from '@/components/persistence-provider';
import { TaskTree } from '@/components/task-tree';
import { TaskEditor } from '@/components/task-editor';
import { TaskFilters } from '@/components/task-filters';
import { FileManager } from '@/components/file-manager';
import { BreadcrumbNav } from '@/components/breadcrumb-nav';
import { TaskStats } from '@/components/task-stats';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, BarChart3, FolderOpen } from 'lucide-react';

export default function TaskMasterApp() {
  return (
    <PersistenceProvider>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Task Master
                </h1>
                <Separator orientation="vertical" className="h-6" />
                <BreadcrumbNav />
              </div>
              
              <div className="flex items-center space-x-2">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 container mx-auto p-4 min-h-0">
          <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border overflow-hidden">
            {/* Left Sidebar */}
            <ResizablePanel defaultSize={30} minSize={25}>
              <div className="h-full p-4 flex flex-col overflow-hidden">
                <Tabs defaultValue="tasks" className="h-full">
                  <TabsList className="flex-shrink-0 grid w-full grid-cols-3">
                    <TabsTrigger value="tasks">
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Tasks
                    </TabsTrigger>
                    <TabsTrigger value="stats">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Stats
                    </TabsTrigger>
                    <TabsTrigger value="files">
                      <Settings className="h-4 w-4 mr-2" />
                      Files
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="mt-4 flex-1 min-h-0 overflow-hidden">
                    <TabsContent value="tasks" className="h-full space-y-4 flex flex-col">
                      <div className="flex-shrink-0">
                        <TaskFilters />
                      </div>
                      <ScrollArea className="flex-1 min-h-0">
                        <div className="px-1">
                        <TaskTree />
                        </div>
                      </ScrollArea>
                    </TabsContent>
                    
                    <TabsContent value="stats" className="h-full">
                      <ScrollArea className="h-full">
                        <TaskStats />
                      </ScrollArea>
                    </TabsContent>
                    
                    <TabsContent value="files" className="h-full">
                      <ScrollArea className="h-full">
                        <FileManager />
                      </ScrollArea>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </ResizablePanel>

            <ResizableHandle />

            {/* Main Content Area */}
            <ResizablePanel defaultSize={70}>
              <div className="h-full p-4 overflow-hidden">
                <ScrollArea className="h-full">
                  <TaskEditor />
                </ScrollArea>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </PersistenceProvider>
  );
}