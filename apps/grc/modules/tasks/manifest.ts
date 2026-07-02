import type { ModuleManifest } from "../types";

export const tasksManifest: ModuleManifest = {
  key: "tasks",
  name: "Tasks & Activities",
  description:
    "Task management with light project capabilities — plans, assignments, kanban and calendar. The execution engine risk treatments, findings and gaps delegate to.",
  icon: "tasks",
  plannedPhase: 5,
  navigation: [
    { path: "", label: "My tasks" },
    { path: "/all", label: "All tasks" },
    { path: "/board", label: "Board" },
    { path: "/activities", label: "Activities" },
  ],
  permissions: {
    module: "tasks",
    label: "Tasks & Activities",
    resources: [
      {
        resource: "tasks",
        label: "Tasks",
        description: "Individual tasks and assignments",
        actions: [
          { action: "view", label: "View tasks" },
          { action: "manage", label: "Create, edit and complete tasks" },
          { action: "assign", label: "Assign tasks to others" },
        ],
      },
      {
        resource: "activities",
        label: "Activities",
        description: "Plans / lightweight projects grouping tasks",
        actions: [
          { action: "view", label: "View activities" },
          { action: "manage", label: "Create, edit and close activities" },
        ],
      },
    ],
  },
  entityTypes: ["tasks:task", "tasks:activity"],
  emits: ["task.completed", "task.progress"],
  widgets: [
    {
      key: "tasks.my",
      title: "My open tasks",
      description: "Your open tasks, soonest due first",
      span: 2,
      permission: "tasks.tasks.view",
    },
    {
      key: "tasks.status",
      title: "Task workload",
      description: "Workspace task counts by status, with overdue",
      span: 1,
      permission: "tasks.tasks.view",
    },
  ],
  reports: [
    {
      key: "tasks.status",
      title: "Task status",
      description: "All tasks with status, priority, assignee and origin, filterable by status and priority.",
      permission: "tasks.tasks.view",
      params: [
        {
          name: "status",
          label: "Status",
          options: [
            { value: "all", label: "All statuses" },
            { value: "open", label: "Open (to do / in progress / blocked)" },
            { value: "done", label: "Done" },
          ],
        },
        {
          name: "priority",
          label: "Priority",
          options: [
            { value: "all", label: "All priorities" },
            { value: "urgent", label: "Urgent" },
            { value: "high", label: "High" },
            { value: "medium", label: "Medium" },
            { value: "low", label: "Low" },
          ],
        },
      ],
    },
  ],
};
