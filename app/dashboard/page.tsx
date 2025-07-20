import { Button } from '@/app/components/ui/button';
import { ArrowRight, Mail, MessageSquare, BarChart3, Shield, Zap, Users } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLandingPage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                Welcome to 
                <span className="block text-blue-600">EmAilX Dashboard</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                The intelligent email management platform that transforms how you handle communications. 
                Connect any email account and experience AI-powered productivity.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0 space-y-4 sm:space-y-0 sm:space-x-4 sm:flex">
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                  <Link href="/dashboard/login">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                  <Link href="/">
                    Back to Home
                  </Link>
                </Button>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                <div className="relative block w-full bg-white rounded-lg overflow-hidden">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 px-6 py-8">
                    <div className="flex items-center justify-center">
                      <div className="bg-blue-600 p-3 rounded-full">
                        <Mail className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <h3 className="mt-4 text-xl font-medium text-gray-900 text-center">
                      Smart Email Dashboard
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 text-center">
                      Manage all your emails in one place with AI assistance
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need for email management
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              EmAilX provides powerful tools to help you manage, organize, and respond to emails more efficiently.
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <Mail className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Universal Email Access</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Connect to any email provider - Gmail, Outlook, Yahoo, or your custom IMAP server. 
                  One interface for all your accounts.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">AI-Powered Responses</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Generate intelligent reply suggestions and compose emails with AI assistance. 
                  Save time while maintaining your personal voice.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Email Analytics</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Track your email productivity with detailed analytics. Monitor response times, 
                  email volume, and communication patterns.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <Shield className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Secure & Private</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Your emails are encrypted and stored securely. We prioritize your privacy 
                  and never access your personal communications.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <Zap className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Lightning Fast</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Built with modern technology for instant email synchronization and 
                  responsive interface across all devices.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <Users className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Team Collaboration</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Share email templates, collaborate on responses, and manage team 
                  communications efficiently.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Ready to revolutionize your email experience?
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-gray-500">
                Join thousands of users who have already transformed their email workflow with EmAilX. 
                Connect your email account and start experiencing intelligent email management today.
              </p>
              <div className="mt-8 space-y-4 sm:space-y-0 sm:space-x-4 sm:flex">
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                  <Link href="/dashboard/login">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                  <Link href="/">
                    Back to Home
                  </Link>
                </Button>
              </div>
            </div>
            <div className="mt-8 lg:mt-0 flex justify-center lg:justify-end">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-lg">
                <div className="flex items-center justify-center space-x-4">
                  <div className="bg-blue-600 p-4 rounded-full">
                    <Mail className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">EmAilX</div>
                    <div className="text-sm text-gray-600">Intelligent Email Management</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}