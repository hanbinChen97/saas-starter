'use client';

import Link from 'next/link';
import { use, useState, Suspense, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { CircleIcon, Home, LogOut, Menu, Briefcase, Settings, ChevronDown, ChevronRight, Users, CreditCard, UserPlus, Shield, Mail, ChevronLeft } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/app/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { signOut } from '@/app/(login)/actions';
import { useRouter } from 'next/navigation';
import { User } from '@/app/lib/db/schema';
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  if (!user) {
    return (
      <>
        <Link
          href="/pricing"
          className="text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Pricing
        </Link>
        <Button asChild className="rounded-full">
          <Link href="/sign-up">Sign Up</Link>
        </Button>
      </>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        <Avatar className="cursor-pointer size-8">
          <AvatarImage alt={user.name || ''} />
          <AvatarFallback>
            {user.email
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1">
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/dashboard/mail" className="flex w-full items-center">
            <Home className="mr-2 h-3 w-3" />
            <span>Emails</span>
          </Link>
        </DropdownMenuItem>
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem className="w-full flex-1 cursor-pointer">
              <LogOut className="mr-2 h-3 w-3" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Header() {
  return (
    <header className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center">
          <CircleIcon className="h-5 w-5 text-orange-500" />
          <span className="ml-2 text-lg font-semibold text-gray-900">EmAilX</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Suspense fallback={<div className="h-9" />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);

  // Auto-collapse sidebar when entering email page
  useEffect(() => {
    if (pathname.startsWith('/dashboard/mail')) {
      setIsSidebarCollapsed(true);
    }
  }, [pathname]);

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/dashboard/workspace', icon: Briefcase, label: 'Workspace' },
    { href: '/dashboard/mail', icon: Mail, label: 'Emails' }
  ];

  const settingsSubItems = [
    // { href: '/dashboard/settings/team', icon: Users, label: 'Team' },
    // { href: '/dashboard/settings/subscription', icon: CreditCard, label: 'Subscription' },
    // { href: '/dashboard/settings/members', icon: UserPlus, label: 'Members' },
    // { href: '/dashboard/settings/security', icon: Shield, label: 'Security' }
  ];

  return (
    <section className="flex flex-col h-full w-full">
      <Header />
      <div className="flex flex-col h-full w-full">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center">
            <span className="font-medium">EmAilX</span>
          </div>
          <Button
            className="-mr-3"
            variant="ghost"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Collapsed sidebar with icons */}
          {isSidebarCollapsed && (
            <aside className="hidden lg:block w-16 bg-gray-50 border-r border-gray-200">
              <div className="flex flex-col items-center py-4 space-y-2">
                {/* Expand button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 mb-2"
                  onClick={() => setIsSidebarCollapsed(false)}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
                
                {/* Navigation icons */}
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={pathname === item.href ? 'secondary' : 'ghost'}
                      size="sm"
                      className={`h-8 w-8 p-0 ${
                        pathname === item.href ? 'bg-gray-200' : ''
                      }`}
                      title={item.label}
                    >
                      <item.icon className="h-3 w-3" />
                    </Button>
                  </Link>
                ))}
              </div>
            </aside>
          )}

          {/* Full sidebar */}
          <aside
            className={`${isSidebarCollapsed ? 'w-0 lg:w-0' : 'w-64'} bg-white lg:bg-gray-50 border-r border-gray-200 lg:block ${
              isSidebarOpen ? 'block' : 'hidden'
            } lg:relative absolute inset-y-0 left-0 z-40 transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } ${isSidebarCollapsed ? 'lg:overflow-hidden' : ''}`}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <span className="font-medium text-gray-900">Navigation</span>
              {!isSidebarCollapsed && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setIsSidebarCollapsed(true)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
            </div>
            <nav className="h-full overflow-y-auto p-4">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} passHref>
                  <Button
                    variant={pathname === item.href ? 'secondary' : 'ghost'}
                    className={`shadow-none my-0.5 w-full justify-start text-sm ${
                      pathname === item.href ? 'bg-gray-100' : ''
                    }`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <item.icon className="h-3 w-3" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 overflow-hidden flex flex-col">{children}</main>
        </div>
      </div>
    </section>
  );
}
