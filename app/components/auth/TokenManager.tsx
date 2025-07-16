'use client';

import { useTokenManager } from '@/app/hooks/useTokenManager';
import { usePathname } from 'next/navigation';

export function TokenManager() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');
  
  // Only run token management on dashboard pages
  if (isDashboard) {
    useTokenManager();
  }
  
  return null; // This component doesn't render anything
}