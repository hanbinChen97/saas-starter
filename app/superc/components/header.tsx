'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Search, LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/app/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { signOut } from '@/app/(login)/actions';
import { useRouter } from 'next/navigation';
import { User as UserType } from '@/app/lib/db/schema';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UserMenuProps {
  user?: UserType | null;
}

function UserMenu({ user: propUser }: UserMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  
  // Only use SWR if no user prop is provided (fallback for non-protected routes)
  const { data: fetchedUser, isLoading } = useSWR<UserType>(
    propUser === undefined ? '/api/user' : null, 
    fetcher
  );
  
  // Use prop user if provided, otherwise use fetched user
  const user = propUser !== undefined ? propUser : fetchedUser;

  async function handleSignOut() {
    await signOut();
    router.push('/superc');
  }

  // Show loading state only when fetching (not when user prop is provided)
  if (propUser === undefined && isLoading) {
    return (
      <div className="w-16 h-9 bg-gray-200 animate-pulse rounded-md"></div>
    );
  }

  // If no user, show login button
  if (!user) {
    return (
      <Button asChild className="bg-orange-600 hover:bg-orange-700">
        <Link href="/superc/login">登录</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        <Avatar className="cursor-pointer size-8">
          <AvatarImage alt={user.name || ''} />
          <AvatarFallback>
            {user.email[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1">
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/superc/profile" className="flex w-full items-center">
            <User className="mr-2 h-3 w-3" />
            <span>个人资料</span>
          </Link>
        </DropdownMenuItem>
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem className="w-full flex-1 cursor-pointer">
              <LogOut className="mr-2 h-3 w-3" />
              <span>退出登录</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface SuperCHeaderProps {
  user?: UserType | null;
}

export default function SuperCHeader({ user }: SuperCHeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/superc" className="flex items-center">
          <div className="h-8 w-8 bg-orange-500 rounded-full flex items-center justify-center">
            <Search className="h-4 w-4 text-white" />
          </div>
          <span className="ml-2 text-lg font-semibold text-gray-900">SupaC</span>
        </Link>
        <div className="flex items-center space-x-4">
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}