import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Search, Coffee } from 'lucide-react';
import Link from 'next/link';
import SuperCHeader from '../components/header';
import SuperCMainForm from '../components/main-form';
import { getUser } from '@/app/lib/db/queries';
import { redirect } from 'next/navigation';

export default async function SuperCPage() {
  // Fetch user data on server side since this is a protected route
  const user = await getUser();
  
  // This should not happen due to middleware protection, but add as safety
  if (!user) {
    redirect('/superc/login');
  }
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Header - Pass user data from server to prevent loading flash */}
      <SuperCHeader user={user} />

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">SuperC Anmeldung</h1>
            <p className="text-lg text-gray-600">Füllen Sie das Formular aus, um sich für SuperC zu registrieren</p>
          </div>

          {/* Registration Form - Extract to client component for form interactions */}
          <SuperCMainForm />

          {/* 打赏卡片 */}
          <Card className="mt-8 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <Coffee className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  喜欢我们的服务吗？
                </h3>
                <p className="text-gray-600 mb-4">
                  如果您对我们的 SupaC 服务满意，欢迎请我们喝杯咖啡！☕
                </p>
                <Button 
                  asChild
                  variant="outline"
                  className="bg-white hover:bg-orange-50 border-orange-300 text-orange-700 hover:text-orange-800"
                >
                  <a 
                    href="https://www.paypal.com/paypalme/SupaCAachen?locale.x=de_DE&country.x=DE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                  >
                    <Coffee className="h-4 w-4 mr-2" />
                    请我们喝咖啡
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}