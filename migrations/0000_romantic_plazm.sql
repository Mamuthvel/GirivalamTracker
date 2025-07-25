CREATE TABLE "groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "groups_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"latitude" real,
	"longitude" real,
	"last_seen" timestamp DEFAULT now() NOT NULL,
	"location_sharing" boolean DEFAULT true NOT NULL,
	"ping_enabled" boolean DEFAULT true NOT NULL,
	"socket_id" text
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"member_id" integer NOT NULL,
	"content" text NOT NULL,
	"type" text DEFAULT 'text' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pings" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"from_member_id" integer NOT NULL,
	"to_member_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
