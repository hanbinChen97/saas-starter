import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Check, Mail, MessageSquare, BarChart3, Crown } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Choose Your EmAilX Plan
          </h1>
          <p className="text-lg text-gray-600">
            Start free and upgrade as your email management needs grow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-blue-500" />
                Starter
              </CardTitle>
              <div className="mt-4">
                <span className="text-3xl font-bold">Free</span>
                <span className="text-gray-500 ml-2">forever</span>
              </div>
              <p className="text-sm text-gray-600">Perfect for personal use</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">1 Email Account</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">Basic Email Management</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">Email Sync</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">Mobile App Access</span>
                </li>
              </ul>
              <Button asChild className="w-full mt-6" variant="outline">
                <Link href="/dashboard/emails">
                  Get Started Free
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="relative border-blue-500 border-2">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                Most Popular
              </span>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />
                Professional
              </CardTitle>
              <div className="mt-4">
                <span className="text-3xl font-bold">$9</span>
                <span className="text-gray-500 ml-2">per month</span>
              </div>
              <p className="text-sm text-gray-600">For power users and professionals</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">5 Email Accounts</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">AI-Powered Replies</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">Email Templates</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">Priority Support</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">Advanced Analytics</span>
                </li>
              </ul>
              <Button asChild className="w-full mt-6 bg-blue-600 hover:bg-blue-700">
                <Link href="/dashboard">
                  Start Free Trial
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Crown className="h-5 w-5 mr-2 text-purple-500" />
                Enterprise
              </CardTitle>
              <div className="mt-4">
                <span className="text-3xl font-bold">$29</span>
                <span className="text-gray-500 ml-2">per month</span>
              </div>
              <p className="text-sm text-gray-600">For teams and organizations</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">Unlimited Email Accounts</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">Team Collaboration</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">Custom AI Training</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">Admin Dashboard</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">24/7 Premium Support</span>
                </li>
              </ul>
              <Button asChild className="w-full mt-6" variant="outline">
                <Link href="/dashboard">
                  Contact Sales
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Comparison */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Why Choose EmAilX?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <BarChart3 className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                  <h3 className="font-medium mb-2">Intelligent Analytics</h3>
                  <p className="text-sm text-gray-600">
                    Track email performance and optimize your communication strategy
                  </p>
                </div>
                <div>
                  <MessageSquare className="h-8 w-8 text-green-500 mx-auto mb-3" />
                  <h3 className="font-medium mb-2">AI-Powered Assistance</h3>
                  <p className="text-sm text-gray-600">
                    Generate smart replies and compose emails with artificial intelligence
                  </p>
                </div>
                <div>
                  <Mail className="h-8 w-8 text-purple-500 mx-auto mb-3" />
                  <h3 className="font-medium mb-2">Universal Compatibility</h3>
                  <p className="text-sm text-gray-600">
                    Works with Gmail, Outlook, Yahoo, and any IMAP email provider
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}