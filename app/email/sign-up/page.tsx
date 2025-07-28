import { Login } from '@/app/(login)/login';
import { Suspense } from 'react';

export default function EmailSignUpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Login mode="signup" module="email" />
    </Suspense>
  );
}