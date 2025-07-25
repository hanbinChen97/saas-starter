import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Search, Loader2, CheckCircle, Coffee } from 'lucide-react';
import Link from 'next/link';
import { getUser } from '@/app/lib/db/queries';
import SuperCHeader from '../components/header';
import SuperCMainClient from './SuperCMainClient';

export default async function SuperCPage() {
  // Fetch user data server-side since this is a protected route
  const user = await getUser();

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Header with user data passed as prop */}
      <SuperCHeader user={user} />

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto">
        <SuperCMainClient />
      </main>
    </div>
  );
}