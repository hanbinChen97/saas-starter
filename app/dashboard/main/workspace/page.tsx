'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Plus, Mail, MessageSquare, BarChart3, Settings, Users, Clock } from 'lucide-react';
import Link from 'next/link';

export default function WorkspacePage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg lg:text-2xl font-medium">Email Workspace</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your email workflow and productivity</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link href="/dashboard/emails">
            <Mail className="h-4 w-4 mr-2" />
            Open Emails
          </Link>
        </Button>
      </div>
      
      <div className="space-y-6">
        {/* Email Workspace overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Your Email Workspace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This is your email workspace where you can organize email accounts, create templates, 
              and manage your communication workflow with EmAilX's intelligent features.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/dashboard/emails" className="block">
                <div className="border border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                  <Mail className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-sm font-medium text-gray-900 mb-1">Connect Email Account</p>
                  <p className="text-xs text-muted-foreground">Get started with your first email connection</p>
                </div>
              </Link>
              
              <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium text-gray-900 mb-1">AI Templates</p>
                <p className="text-xs text-muted-foreground">Create smart email templates</p>
              </div>
              
              <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium text-gray-900 mb-1">Analytics Dashboard</p>
                <p className="text-xs text-muted-foreground">View email performance metrics</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/dashboard/emails">
                    <Mail className="h-4 w-4 mr-2" />
                    Manage Emails
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Workspace Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">Email account connected</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">Workspace initialized</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">EmAilX features available</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Available Features</CardTitle>
            <p className="text-sm text-muted-foreground">
              Explore EmAilX capabilities in your workspace
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <Mail className="h-6 w-6 text-blue-500 mb-2" />
                <h3 className="font-medium text-sm mb-1">Universal Email Access</h3>
                <p className="text-xs text-muted-foreground">Connect any IMAP email provider</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <MessageSquare className="h-6 w-6 text-green-500 mb-2" />
                <h3 className="font-medium text-sm mb-1">AI-Powered Replies</h3>
                <p className="text-xs text-muted-foreground">Smart response suggestions</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-500 mb-2" />
                <h3 className="font-medium text-sm mb-1">Email Analytics</h3>
                <p className="text-xs text-muted-foreground">Track email performance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}