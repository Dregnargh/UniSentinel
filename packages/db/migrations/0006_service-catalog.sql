CREATE TABLE "cat_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"classification" text DEFAULT 'internal' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"owner_user_id" text,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cat_data_flows" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"source_kind" text NOT NULL,
	"source_id" text NOT NULL,
	"target_kind" text NOT NULL,
	"target_id" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"data_classification" text DEFAULT 'internal' NOT NULL,
	"protocol" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cat_relationships" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"source_kind" text NOT NULL,
	"source_id" text NOT NULL,
	"target_kind" text NOT NULL,
	"target_id" text NOT NULL,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cat_services" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"criticality" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"owner_user_id" text,
	"org_unit_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cat_assets" ADD CONSTRAINT "cat_assets_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cat_assets" ADD CONSTRAINT "cat_assets_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cat_data_flows" ADD CONSTRAINT "cat_data_flows_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cat_relationships" ADD CONSTRAINT "cat_relationships_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cat_services" ADD CONSTRAINT "cat_services_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cat_services" ADD CONSTRAINT "cat_services_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cat_services" ADD CONSTRAINT "cat_services_org_unit_id_org_units_id_fk" FOREIGN KEY ("org_unit_id") REFERENCES "public"."org_units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cat_assets_workspace" ON "cat_assets" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_cat_assets_type" ON "cat_assets" USING btree ("workspace_id","type");--> statement-breakpoint
CREATE INDEX "idx_cat_data_flows_workspace" ON "cat_data_flows" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_cat_relationships_workspace" ON "cat_relationships" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_cat_relationships" ON "cat_relationships" USING btree ("workspace_id","source_kind","source_id","target_kind","target_id","kind");--> statement-breakpoint
CREATE INDEX "idx_cat_services_workspace" ON "cat_services" USING btree ("workspace_id");