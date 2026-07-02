CREATE TABLE "rsk_assessments" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"risk_id" text NOT NULL,
	"kind" text NOT NULL,
	"likelihood" integer NOT NULL,
	"impact" integer NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"assessed_by_name" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rsk_risks" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"ref" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"owner_user_id" text,
	"org_unit_id" text,
	"inherent_likelihood" integer NOT NULL,
	"inherent_impact" integer NOT NULL,
	"residual_likelihood" integer,
	"residual_impact" integer,
	"treatment_strategy" text,
	"treatment_notes" text DEFAULT '' NOT NULL,
	"next_review_at" timestamp with time zone,
	"accepted_by_name" text,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rsk_scope_items" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"risk_id" text NOT NULL,
	"name" text NOT NULL,
	"kind" text DEFAULT 'other' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"promoted_to" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rsk_treatment_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"risk_id" text NOT NULL,
	"title" text NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"due_date" timestamp with time zone,
	"promoted_to" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rsk_assessments" ADD CONSTRAINT "rsk_assessments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsk_assessments" ADD CONSTRAINT "rsk_assessments_risk_id_rsk_risks_id_fk" FOREIGN KEY ("risk_id") REFERENCES "public"."rsk_risks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsk_risks" ADD CONSTRAINT "rsk_risks_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsk_risks" ADD CONSTRAINT "rsk_risks_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsk_risks" ADD CONSTRAINT "rsk_risks_org_unit_id_org_units_id_fk" FOREIGN KEY ("org_unit_id") REFERENCES "public"."org_units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsk_scope_items" ADD CONSTRAINT "rsk_scope_items_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsk_scope_items" ADD CONSTRAINT "rsk_scope_items_risk_id_rsk_risks_id_fk" FOREIGN KEY ("risk_id") REFERENCES "public"."rsk_risks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsk_treatment_actions" ADD CONSTRAINT "rsk_treatment_actions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsk_treatment_actions" ADD CONSTRAINT "rsk_treatment_actions_risk_id_rsk_risks_id_fk" FOREIGN KEY ("risk_id") REFERENCES "public"."rsk_risks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_rsk_assessments_risk" ON "rsk_assessments" USING btree ("risk_id");--> statement-breakpoint
CREATE INDEX "idx_rsk_risks_workspace" ON "rsk_risks" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_rsk_risks_ref" ON "rsk_risks" USING btree ("workspace_id","ref");--> statement-breakpoint
CREATE INDEX "idx_rsk_scope_items_risk" ON "rsk_scope_items" USING btree ("risk_id");--> statement-breakpoint
CREATE INDEX "idx_rsk_treatment_actions_risk" ON "rsk_treatment_actions" USING btree ("risk_id");