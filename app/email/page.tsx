'use client';

import { ArrowRight, Mail, Shield, Zap, Globe } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { User } from '@/app/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function EmailLandingPage() {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Mail className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">EmAilX</span>
          </Link>
          <div className="flex items-center space-x-4">
            {user ? (
              <span className="text-sm text-gray-600">欢迎回来, {user.name || user.email}</span>
            ) : (
              <Link href="/email/login" className="text-sm text-blue-600 hover:text-blue-800">
                登录
              </Link>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                  <span className="block text-blue-600">EmAilX</span>
                  智能邮件管理系统
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                  连接任何IMAP邮箱服务，享受现代化的邮件管理体验。
                  AI辅助回复，高效管理，让邮件处理变得简单高效。
                </p>
                <div className="mt-8">
                  <Link 
                    href={user ? "/email/imaplogin" : "/email/login"}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    {user ? "进入系统" : "开始使用"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </div>
              </div>
              <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
                <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-8">
                    <div className="text-white text-center">
                      <Mail className="h-16 w-16 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">统一邮件管理</h3>
                      <p className="text-blue-100">
                        连接多个邮箱账户，统一管理所有邮件
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
            <div className="lg:text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">
                为什么选择 EmAilX？
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                专为现代邮件管理而设计的智能解决方案
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                  <Globe className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">通用IMAP支持</h3>
                <p className="mt-2 text-gray-600">
                  支持Gmail、Outlook、QQ邮箱等所有IMAP邮件服务
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">AI智能助手</h3>
                <p className="mt-2 text-gray-600">
                  AI辅助邮件回复，智能分类，提升工作效率
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">安全可靠</h3>
                <p className="mt-2 text-gray-600">
                  端到端加密，保护您的邮件隐私和数据安全
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              准备好开始了吗？
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              立即注册，体验智能邮件管理的便利
            </p>
            <div className="flex justify-center space-x-4">
              <Link 
                href="/email/sign-up"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                免费注册
              </Link>
              <Link 
                href="/email/login"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                立即登录
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}