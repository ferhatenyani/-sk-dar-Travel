CREATE TABLE "voyages" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price" text,
	"image_url" text DEFAULT '' NOT NULL,
	"gallery_images" text[] DEFAULT '{}'::text[] NOT NULL,
	"departure_date" date,
	"return_date" date,
	"program" text DEFAULT '' NOT NULL,
	"included" text[] DEFAULT '{}'::text[] NOT NULL,
	"excluded" text[] DEFAULT '{}'::text[] NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "voyages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "trip_requests" ADD COLUMN "voyage_slug" text;--> statement-breakpoint
ALTER TABLE "trip_requests" ADD COLUMN "voyage_title" text;