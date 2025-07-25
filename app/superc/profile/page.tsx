import SuperCHeader from '../components/header';
import SuperCProfileClient from '../components/profile-client';
import { getUser } from '@/app/lib/db/queries';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  // Fetch user data on server side since this is a protected route
  const user = await getUser();
  
  // This should not happen due to middleware protection, but add as safety
  if (!user) {
    redirect('/superc/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Pass user data from server to prevent loading flash */}
      <SuperCHeader user={user} />
      
      {/* Profile content - Extract to client component for form interactions */}
      <SuperCProfileClient />
    </div>
  );
}