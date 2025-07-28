import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Mail, Search } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Welcome to SaaS Starter</h1>
            <p className="mt-2 text-lg text-gray-600">Choose your destination</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Email Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <Link href="/email">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Email Center</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-6">
                  Access your email management system with IMAP integration and advanced features
                </p>
                <Button className="w-full" variant="default">
                  Enter Email
                </Button>
              </CardContent>
            </Link>
          </Card>

          {/* SuperC Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <Link href="/superc">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                  <Search className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-xl">SuperC Registration</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-6">
                  Register for SuperC services and manage your application
                </p>
                <Button className="w-full" variant="outline">
                  Go to SuperC
                </Button>
              </CardContent>
            </Link>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>SaaS Starter Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
}