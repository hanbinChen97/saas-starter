CREATE TABLE "appointment_profiles" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"vorname" text,
	"nachname" text,
	"phone" text,
	"geburtsdatum_day" integer,
	"geburtsdatum_month" integer,
	"geburtsdatum_year" integer,
	"preferred_locations" jsonb,
	"appointment_status" text DEFAULT 'waiting',
	"appointment_date" timestamp,
	"location_type" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "appointment_profiles" ADD CONSTRAINT "appointment_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;