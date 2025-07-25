'use server';

import { z } from 'zod';
import { db } from '@/app/lib/db/drizzle';
import { appointmentProfiles } from '@/app/lib/db/schema';
import { validatedActionWithUser } from '@/app/lib/auth/middleware';
import { checkExistingProfile } from '@/app/lib/db/queries';
import { redirect } from 'next/navigation';

const createUserProfileSchema = z.object({
  vorname: z.string().min(1, 'Vorname ist erforderlich'),
  nachname: z.string().min(1, 'Nachname ist erforderlich'),
  phone: z.string()
    .min(1, 'Telefonnummer ist erforderlich')
    .regex(/^0\d{5,14}$/, 'Telefonnummer muss mit 0 beginnen und zwischen 6 und 15 Ziffern enthalten (z.B. 0123456789)'),
  email: z.string()
    .min(1, 'E-Mail-Adresse ist erforderlich')
    .email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
  geburtsdatumDay: z.string().transform((val) => parseInt(val)).pipe(z.number().min(1).max(31)),
  geburtsdatumMonth: z.string().transform((val) => parseInt(val)).pipe(z.number().min(1).max(12)),
  geburtsdatumYear: z.string().transform((val) => parseInt(val)).pipe(z.number().min(1900).max(new Date().getFullYear())),
  preferredLocations: z.string().optional().default('superc'),
});

export const createUserProfile = validatedActionWithUser(
  createUserProfileSchema,
  async (data, formData, user) => {
    try {
      // Check if profile with same vorname and nachname already exists
      const profileExists = await checkExistingProfile(data.vorname, data.nachname);
      
      if (profileExists) {
        return { 
          success: false, 
          message: 'Ein Profil mit diesem Vor- und Nachnamen existiert bereits. Doppelte Registrierungen sind nicht erlaubt.' 
        };
      }

      await db.insert(appointmentProfiles).values({
        userId: user.id,
        vorname: data.vorname,
        nachname: data.nachname,
        email: data.email,
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