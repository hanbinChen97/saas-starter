'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/app/lib/db/drizzle';
import { appointmentProfiles } from '@/app/lib/db/schema';
import { validatedActionWithUser } from '@/app/lib/auth/middleware';

const updateEmailSchema = z.object({
  email: z.string()
    .min(1, 'E-Mail-Adresse ist erforderlich')
    .email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
});

export const updateProfileEmail = validatedActionWithUser(
  updateEmailSchema,
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

      // Check if current status is error
      if (profile[0].appointmentStatus !== 'error') {
        return {
          success: false,
          message: '只有错误状态下才能更新邮箱。'
        };
      }

      // Update email and change status to waiting
      await db
        .update(appointmentProfiles)
        .set({
          email: data.email,
          appointmentStatus: 'waiting',
          updatedAt: new Date()
        })
        .where(eq(appointmentProfiles.userId, user.id));

      return { success: true, message: '邮箱已更新，状态已恢复为等待中！' };
    } catch (error) {
      console.error('Error updating profile email:', error);
      return { success: false, message: '更新邮箱时发生错误。' };
    }
  }
);
