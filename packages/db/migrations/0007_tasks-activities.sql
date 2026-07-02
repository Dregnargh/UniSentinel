CREATE TABLE "tsk_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"owner_user_id" text,
	"start_date" timestamp with time zone,
	"due_date" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tsk_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"task_id" text NOT NULL,
	"author_user_id" text,
	"author_name" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tsk_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"activity_id" text,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'todo' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"assignee_user_id" text,
	"due_date" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"origin_type" text,
	"origin_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tsk_activities" ADD CONSTRAINT "tsk_activities_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tsk_activities" ADD CONSTRAINT "tsk_activities_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tsk_comments" ADD CONSTRAINT "tsk_comments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tsk_comments" ADD CONSTRAINT "tsk_comments_task_id_tsk_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tsk_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tsk_tasks" ADD CONSTRAINT "tsk_tasks_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tsk_tasks" ADD CONSTRAINT "tsk_tasks_activity_id_tsk_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."tsk_activities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tsk_tasks" ADD CONSTRAINT "tsk_tasks_assignee_user_id_users_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tsk_activities_workspace" ON "tsk_activities" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_tsk_comments_task" ON "tsk_comments" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_tsk_tasks_workspace" ON "tsk_tasks" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_tsk_tasks_assignee" ON "tsk_tasks" USING btree ("assignee_user_id");--> statement-breakpoint
CREATE INDEX "idx_tsk_tasks_activity" ON "tsk_tasks" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "idx_tsk_tasks_origin" ON "tsk_tasks" USING btree ("workspace_id","origin_type","origin_id");