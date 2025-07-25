'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { LogOut, User } from 'lucide-react';
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
import Link from 'next/link';
import { mutate } from 'swr';

interface UserMenuProps {
  user: UserType | null;
}

export function UserMenu({ user }: UserMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/superc');
  }

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