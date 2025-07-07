'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Menu, Briefcase, Settings, ChevronDown, ChevronRight, Users, CreditCard, UserPlus, Shield, Mail } from 'lucide-react';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);

  const navItems = [
    { href: '/dashboard/workspace', icon: Briefcase, label: 'Workspace' },
    { href: '/dashboard/emails', icon: Mail, label: 'Emails' }
  ];

  const settingsSubItems = [
    { href: '/dashboard/settings/team', icon: Users, label: 'Team' },
    { href: '/dashboard/settings/subscription', icon: CreditCard, label: 'Subscription' },
    { href: '/dashboard/settings/members', icon: UserPlus, label: 'Members' },
    { href: '/dashboard/settings/security', icon: Shield, label: 'Security' }
  ];

  return (
    <div className="flex flex-col min-h-[calc(100dvh-68px)] max-w-7xl mx-auto w-full">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4">
        <div className="flex items-center">
          <span className="font-medium">Workspace</span>
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

      <div className="flex flex-1 overflow-hidden h-full">
        {/* Sidebar */}
        <aside
          className={`w-64 bg-white lg:bg-gray-50 border-r border-gray-200 lg:block ${
            isSidebarOpen ? 'block' : 'hidden'
          } lg:relative absolute inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="h-full overflow-y-auto p-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} passHref>
                <Button
                  variant={pathname === item.href ? 'secondary' : 'ghost'}
                  className={`shadow-none my-1 w-full justify-start ${
                    pathname === item.href ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
            
            {/* Divider */}
            <div className="border-t border-gray-200 my-4"></div>
            
            {/* Settings Folder */}
            <div>
              <Button
                variant="ghost"
                className="shadow-none my-1 w-full justify-start"
                onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
              >
                {isSettingsExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <Settings className="h-4 w-4" />
                Settings
              </Button>
              
              {/* Settings Sub-items */}
              {isSettingsExpanded && (
                <div className="ml-4 border-l border-gray-200 pl-2">
                  {settingsSubItems.map((item) => (
                    <Link key={item.href} href={item.href} passHref>
                      <Button
                        variant={pathname === item.href ? 'secondary' : 'ghost'}
                        className={`shadow-none my-1 w-full justify-start text-sm ${
                          pathname === item.href ? 'bg-gray-100' : ''
                        }`}
                        onClick={() => setIsSidebarOpen(false)}
                      >
                        <item.icon className="h-3 w-3" />
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-hidden flex flex-col">{children}</main>
      </div>
    </div>
  );
}
