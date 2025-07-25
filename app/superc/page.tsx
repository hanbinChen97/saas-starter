import { ArrowRight, Search, Calendar, Shield } from 'lucide-react';
import Link from 'next/link';
import { Terminal } from './terminal';
import SuperCHeader from './components/header';
import { getUser } from '@/app/lib/db/queries';
import SupaCLandingPageClient from './SupaCLandingPageClient';

export default async function SupaCLandingPage() {
  // Fetch user data server-side (null if not authenticated)
  const user = await getUser();
  
  return (
    <div className="min-h-screen bg-white">
      <SuperCHeader user={user} />
      <SupaCLandingPageClient />
    </div>
  );
}