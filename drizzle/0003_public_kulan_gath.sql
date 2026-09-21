ALTER TABLE "trip_requests" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "trip_requests" ALTER COLUMN "departure_city" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "trip_requests" ALTER COLUMN "departure_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "trip_requests" ALTER COLUMN "adults" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "trip_requests" ALTER COLUMN "adults" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "trip_requests" ALTER COLUMN "children" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "trip_requests" ALTER COLUMN "children" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "trip_requests" ALTER COLUMN "trip_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "trip_requests" ALTER COLUMN "budget" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "trip_requests" ALTER COLUMN "accommodation" DROP NOT NULL;