import { Login } from '@/app/(login)/login';
import { Suspense } from 'react';

export default function DashboardSignUpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Login mode="signup" module="dashboard" />
    </Suspense>
  );
}