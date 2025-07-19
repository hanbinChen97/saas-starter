'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Search, Loader2, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function DemoPage() {
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
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <div className="h-8 w-8 bg-orange-500 rounded-full flex items-center justify-center">
              <Search className="h-4 w-4 text-white" />
            </div>
            <span className="ml-2 text-lg font-semibold text-gray-900">SuperC-Terminator Bot Demo</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              返回首页
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">SuperC-Terminator Bot</h1>
          <p className="text-lg text-gray-600">智能查询系统演示 - 模拟多网站数据检索流程</p>
        </div>

        {/* SuperC-Terminator Bot Section */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <Search className="h-5 w-5 mr-2" />
              查询控制台
            </CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              点击下方按钮开始模拟查询流程
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* 查询控制区域 */}
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center space-x-3">
                  <Button 
                    onClick={startQuery} 
                    disabled={isQuerying}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-8 py-3 text-lg"
                    size="lg"
                  >
                    {isQuerying ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        查询中...
                      </>
                    ) : (
                      <>
                        <Search className="h-5 w-5 mr-2" />
                        开始查询
                      </>
                    )}
                  </Button>
                  {(queryComplete || isQuerying) && (
                    <Button 
                      onClick={resetQuery} 
                      variant="outline"
                      disabled={isQuerying}
                      size="lg"
                    >
                      重新开始
                    </Button>
                  )}
                </div>
                {queryComplete && (
                  <div className="flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span className="font-medium">全部流程已模拟完成！</span>
                  </div>
                )}
              </div>

              {/* 查询进度显示 */}
              {(isQuerying || queryComplete) && (
                <div className="border rounded-lg p-6 bg-white shadow-sm">
                  <h4 className="font-medium mb-4 text-gray-900 text-center">查询进度</h4>
                  <div className="space-y-3">
                    {querySteps.map((step, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center space-x-3 transition-all duration-500 p-3 rounded-lg ${
                          index <= currentStep ? 'bg-blue-50 opacity-100' : 'opacity-40'
                        }`}
                      >
                        {index < currentStep || (index === currentStep && !isQuerying) ? (
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        ) : index === currentStep && isQuerying ? (
                          <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0"></div>
                        )}
                        <span className={`${
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
              <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
                <p className="font-medium text-blue-900 mb-2">💡 功能说明:</p>
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

          {/* 技术说明 */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              技术实现：React + TypeScript + Next.js | 
              状态管理：React Hooks | 
              样式：Tailwind CSS + shadcn/ui
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}