import { Login } from '@/app/(login)/login';
import { Suspense } from 'react';

export default function SuperCLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Login module="superc" />
    </Suspense>
  );
}