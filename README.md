# Task Master - Professional Task Management Interface

A comprehensive web application for managing tasks from the task-master.dev ecosystem. This application provides a visual interface for viewing, navigating, and updating tasks.json files with full CRUD operations.

## Features

### Core Functionality
- **Hierarchical Task Management**: Tree-view display of tasks and subtasks with expandable/collapsible nodes
- **Full CRUD Operations**: Create, read, update, and delete tasks with real-time editing
- **Advanced Search & Filtering**: Filter by status, priority, assignee, tags, and text search
- **File Import/Export**: Upload and download tasks.json files with validation
- **Drag & Drop**: Intuitive file upload with visual feedback

### User Interface
- **Responsive Design**: Optimized for mobile, tablet, and desktop viewing
- **Dark/Light Mode**: Seamless theme switching with system preference detection
- **Professional Design**: Clean, modern interface with subtle animations and micro-interactions
- **Accessibility**: WCAG compliant with proper keyboard navigation and screen reader support

### Task Features
- **Progress Tracking**: Visual progress bars and completion percentages
- **Time Management**: Estimated vs actual hours tracking
- **Priority System**: Visual priority indicators with color coding
- **Tag System**: Flexible tagging with easy management
- **Status Workflow**: Complete task lifecycle management
- **Due Date Management**: Calendar integration with overdue task highlighting

## Technology Stack

- **Framework**: Next.js 13+ with App Router
- **UI Components**: Shadcn/ui component library
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand for efficient state management
- **Type Safety**: TypeScript throughout the application
- **File Handling**: React Dropzone for file operations
- **Theme System**: Next-themes for dark/light mode

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Usage

#### Loading Tasks
1. **Import File**: Drag and drop a tasks.json file onto the upload area, or click to browse
2. **Sample Data**: Click "Load Sample Data" to start with example tasks
3. **Manual Creation**: Create tasks directly using the interface

#### Managing Tasks
1. **View Tasks**: Browse the hierarchical task tree in the left sidebar
2. **Edit Tasks**: Click any task to open the editor panel
3. **Create Subtasks**: Use the dropdown menu or add button to create nested tasks
4. **Filter Tasks**: Use the search and filter options to find specific tasks
5. **Export Data**: Download your tasks as a JSON file for backup or sharing

#### Navigation
- **Breadcrumbs**: Track your current location in the task hierarchy
- **Tree Navigation**: Expand/collapse task groups for focused viewing
- **Quick Access**: Jump between tasks using the search functionality

## Task Structure

The application supports the complete task-master.dev schema including:

- **Basic Properties**: ID, title, description, status, priority
- **Time Tracking**: Created/updated dates, due dates, estimated/actual hours
- **Organization**: Tags, assignee, parent/child relationships
- **Progress**: Completion percentage, status workflow
- **Metadata**: Version tracking, statistics

## File Format

Tasks are stored in JSON format with the following structure:

```json
{
  "version": "1.0.0",
  "metadata": {
    "created_at": "2025-01-27T...",
    "updated_at": "2025-01-27T...",
    "total_tasks": 5
  },
  "tasks": [
    {
      "id": "unique-id",
      "title": "Task Title",
      "description": "Task description",
      "status": "todo|in_progress|completed|blocked|cancelled",
      "priority": "low|medium|high|urgent",
      "created_at": "ISO date string",
      "updated_at": "ISO date string",
      "due_date": "ISO date string (optional)",
      "tags": ["tag1", "tag2"],
      "subtasks": [...],
      "parent_id": "parent-task-id (optional)",
      "assignee": "username (optional)",
      "estimated_hours": 8,
      "actual_hours": 6,
      "completion_percentage": 75
    }
  ]
}
```

## Contributing

This project uses:
- **ESLint**: Code linting and formatting
- **TypeScript**: Type checking and enhanced development experience
- **Prettier**: Code formatting (configure as needed)

### Development Guidelines
1. Follow the established file structure and naming conventions
2. Maintain TypeScript strict typing throughout the application
3. Use Shadcn/ui components for consistency
4. Implement proper error handling and loading states
5. Write responsive code that works across all device sizes

## Deployment

To build for production:

```bash
npm run build
```

The application is configured for static export and can be deployed to any static hosting provider.

## License

This project is open source and available under the MIT License.