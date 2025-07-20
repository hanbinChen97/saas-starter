import { Login } from '@/app/(login)/login';
import { Suspense } from 'react';

export default function DashboardLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Login module="dashboard" />
    </Suspense>
  );
}