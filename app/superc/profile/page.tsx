import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { CalendarIcon, ClockIcon, MapPinIcon, UserIcon } from 'lucide-react';
import SuperCHeader from '../components/header';
import { AppointmentProfile } from '@/app/lib/db/schema';
import { getUser } from '@/app/lib/db/queries';
import ProfilePageClient from './ProfilePageClient';

export default async function ProfilePage() {
  // Fetch user data server-side since this is a protected route
  const user = await getUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <SuperCHeader user={user} />
      <ProfilePageClient />
    </div>
  );
}