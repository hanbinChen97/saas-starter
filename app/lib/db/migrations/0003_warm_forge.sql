DROP INDEX "status_created_at_idx";--> statement-breakpoint
ALTER TABLE "appointment_profiles" ALTER COLUMN "preferred_locations" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "appointment_profiles" ALTER COLUMN "preferred_locations" SET DEFAULT 'superc';--> statement-breakpoint
CREATE INDEX "waiting_queue_idx" ON "appointment_profiles" USING btree ("created_at") WHERE appointment_status = 'waiting';