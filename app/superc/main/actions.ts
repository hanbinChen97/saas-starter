'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
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
      // Check if profile with same vorname, nachname and birth date already exists
      const profileExists = await checkExistingProfile(
        data.vorname, 
        data.nachname,
        data.geburtsdatumDay,
        data.geburtsdatumMonth,
        data.geburtsdatumYear
      );
      
      if (profileExists) {
        return { 
          success: false, 
          message: 'Ein Profil mit diesem Vor- und Nachnamen sowie Geburtsdatum existiert bereits. Doppelte Registrierungen sind nicht erlaubt.' 
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

export const cancelAppointment = validatedActionWithUser(
  z.object({}), // No input validation needed for cancellation
  async (data, formData, user) => {
    try {
      // Get user's current appointment profile
      const profile = await db
        .select()
        .from(appointmentProfiles)
        .where(eq(appointmentProfiles.userId, user.id))
        .limit(1);

      if (!profile[0]) {
        return { 
          success: false, 
          message: '未找到预约信息。' 
        };
      }

      // Check if appointment can be cancelled (waiting or booked status)
      if (profile[0].appointmentStatus !== 'waiting' && profile[0].appointmentStatus !== 'booked') {
        return {
          success: false,
          message: '当前预约状态无法取消。'
        };
      }

      // Delete the appointment profile to cancel the appointment
      await db
        .delete(appointmentProfiles)
        .where(eq(appointmentProfiles.userId, user.id));

      return { success: true, message: '预约已成功取消！' };
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      return { success: false, message: '取消预约时发生错误。' };
    }
  }
);