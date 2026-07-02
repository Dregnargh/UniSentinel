CREATE TABLE "domain_events" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"actor_user_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "entity_links" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"link_kind" text DEFAULT 'relates_to' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "module_entitlements" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"module_key" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"seats" integer,
	"expires_at" timestamp with time zone,
	"source" text DEFAULT 'license' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "domain_events" ADD CONSTRAINT "domain_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_links" ADD CONSTRAINT "entity_links_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_entitlements" ADD CONSTRAINT "module_entitlements_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_domain_events_time" ON "domain_events" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_entity_links_source" ON "entity_links" USING btree ("workspace_id","source_type","source_id");--> statement-breakpoint
CREATE INDEX "idx_entity_links_target" ON "entity_links" USING btree ("workspace_id","target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_entity_links" ON "entity_links" USING btree ("workspace_id","source_type","source_id","target_type","target_id","link_kind");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_module_entitlements" ON "module_entitlements" USING btree ("workspace_id","module_key");