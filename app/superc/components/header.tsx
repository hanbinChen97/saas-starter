import Link from 'next/link';
import { Search } from 'lucide-react';
import { getUser } from '@/app/lib/db/queries';
import { UserMenu } from './user-menu';

export default async function SuperCHeader() {
  const user = await getUser();

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