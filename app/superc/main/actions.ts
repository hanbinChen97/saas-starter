'use server';

import { z } from 'zod';
import { db } from '@/app/lib/db/drizzle';
import { appointmentProfiles } from '@/app/lib/db/schema';
import { validatedActionWithUser } from '@/app/lib/auth/middleware';
import { redirect } from 'next/navigation';

const createUserProfileSchema = z.object({
  vorname: z.string().min(1, 'Vorname ist erforderlich'),
  nachname: z.string().min(1, 'Nachname ist erforderlich'),
  phone: z.string().min(1, 'Telefonnummer ist erforderlich'),
  email: z.string().email('Gültige E-Mail-Adresse ist erforderlich'),
  geburtsdatumDay: z.string().transform((val) => parseInt(val)).pipe(z.number().min(1).max(31)),
  geburtsdatumMonth: z.string().transform((val) => parseInt(val)).pipe(z.number().min(1).max(12)),
  geburtsdatumYear: z.string().transform((val) => parseInt(val)).pipe(z.number().min(1900).max(new Date().getFullYear())),
  preferredLocations: z.string().optional().default('superc'),
});

export const createUserProfile = validatedActionWithUser(
  createUserProfileSchema,
  async (data, formData, user) => {
    try {
      await db.insert(appointmentProfiles).values({
        userId: user.id,
        vorname: data.vorname,
        nachname: data.nachname,
        phone: data.phone,
        geburtsdatumDay: data.geburtsdatumDay,
        geburtsdatumMonth: data.geburtsdatumMonth,
        geburtsdatumYear: data.geburtsdatumYear,
        preferredLocations: data.preferredLocations,
      });

      return { success: true, message: 'Profil erfolgreich erstellt!' };
    } catch (error) {
      console.error('Error creating user profile:', error);
      return { success: false, message: 'Fehler beim Erstellen des Profils.' };
    }
  }
);