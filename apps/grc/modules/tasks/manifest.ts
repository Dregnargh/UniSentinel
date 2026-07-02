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
};
