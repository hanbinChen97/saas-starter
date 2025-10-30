'use client';

import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Coffee } from 'lucide-react';

interface DonationCardProps {
  title?: string;
  className?: string;
}

export default function DonationCard({ title = "喜欢我们的服务吗？", className }: DonationCardProps) {
  return (
    <Card className={`bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 ${className}`}>
      <CardContent className="pt-6">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <Coffee className="h-8 w-8 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {title}
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
              PayPal 请我们喝咖啡
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
