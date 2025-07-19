'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Mail, Inbox, Send, Archive, Users, BarChart3, Clock, MessageSquare, Search, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  // SuperC-Terminator Bot 查询状态管理
  const [isQuerying, setIsQuerying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [queryComplete, setQueryComplete] = useState(false);

  // 查询步骤配置
  const querySteps = [
    '正在访问第一个网站...',
    '正在访问第二个网站...',
    '正在访问第三个网站...',
    '正在分析数据...',
    '查询完成'
  ];

  // 开始查询流程
  const startQuery = async () => {
    setIsQuerying(true);
    setCurrentStep(0);
    setQueryComplete(false);

    // 模拟查询步骤，每步等待2秒
    for (let i = 0; i < querySteps.length; i++) {
      setCurrentStep(i);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    setIsQuerying(false);
    setQueryComplete(true);
  };

  // 重置查询状态
  const resetQuery = () => {
    setIsQuerying(false);
    setCurrentStep(0);
    setQueryComplete(false);
  };
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Welcome to EmAilX</h1>
          <p className="text-gray-600 mt-1">Your intelligent email management center</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/dashboard/emails">
            <Mail className="h-4 w-4 mr-2" />
            Open Emails
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Quick Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,345</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">-5 from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent Today</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">+2 from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">+1% from last week</p>
          </CardContent>
        </Card>
      </div>

      {/* SuperC-Terminator Bot Section */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              SuperC-Terminator Bot
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              智能查询系统 - 模拟多网站数据检索流程
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 查询控制区域 */}
              <div className="flex items-center justify-between">
                <div className="space-x-3">
                  <Button 
                    onClick={startQuery} 
                    disabled={isQuerying}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {isQuerying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        查询中...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        开始查询
                      </>
                    )}
                  </Button>
                  {(queryComplete || isQuerying) && (
                    <Button 
                      onClick={resetQuery} 
                      variant="outline"
                      disabled={isQuerying}
                    >
                      重新开始
                    </Button>
                  )}
                </div>
                {queryComplete && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span className="font-medium">全部流程已模拟完成</span>
                  </div>
                )}
              </div>

              {/* 查询进度显示 */}
              {(isQuerying || queryComplete) && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium mb-3 text-gray-900">查询进度:</h4>
                  <div className="space-y-2">
                    {querySteps.map((step, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center space-x-3 transition-opacity duration-500 ${
                          index <= currentStep ? 'opacity-100' : 'opacity-30'
                        }`}
                      >
                        {index < currentStep || (index === currentStep && !isQuerying) ? (
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : index === currentStep && isQuerying ? (
                          <Loader2 className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-gray-300 rounded-full flex-shrink-0"></div>
                        )}
                        <span className={`text-sm ${
                          index <= currentStep ? 'text-gray-900 font-medium' : 'text-gray-500'
                        }`}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 功能说明 */}
              <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
                <p className="font-medium text-blue-900 mb-1">功能说明:</p>
                <ul className="space-y-1 text-blue-800">
                  <li>• 点击"开始查询"按钮启动模拟查询流程</li>
                  <li>• 每个步骤间隔2秒，展示真实查询体验</li>
                  <li>• 支持多次重复查询，可随时重新开始</li>
                  <li>• 当前为UI原型，后续可扩展实际功能</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New email from john@company.com</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Email sent to team@project.com</p>
                  <p className="text-xs text-muted-foreground">15 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">3 emails archived</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Email sync completed</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/emails">
                  <Inbox className="h-4 w-4 mr-2" />
                  View Inbox
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/emails">
                  <Send className="h-4 w-4 mr-2" />
                  Compose Email
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/emails">
                  <Archive className="h-4 w-4 mr-2" />
                  View Archive
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/emails">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Folders
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Overview */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>EmAilX Features</CardTitle>
            <p className="text-sm text-muted-foreground">
              Discover what makes EmAilX your perfect email companion
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Smart Email Management</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Organize, filter, and manage your emails with intelligent features
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">AI-Powered Replies</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Generate smart reply suggestions with artificial intelligence
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Email Analytics</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Track your email performance and productivity metrics
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
