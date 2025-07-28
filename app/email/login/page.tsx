import { Login } from '@/app/(login)/login';
import { Suspense } from 'react';

export default function EmailLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Login module="email" />
    </Suspense>
  );
}