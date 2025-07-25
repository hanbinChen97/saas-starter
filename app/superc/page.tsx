import { ArrowRight, Search, Calendar, Shield } from 'lucide-react';
import Link from 'next/link';
import { Terminal } from './terminal';

export default function SupaCLandingPage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                <span className="block text-orange-600">SupaC</span>
                SuperC 自动预约系统
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                告别频繁查询网页！我们的智能系统自动为您预约 SuperC，
                节省时间，提高效率。
              </p>
              <div className="mt-8">
                <Link 
                  href="/superc/login"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
                >
                  开始使用
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <Terminal />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Simplified */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              为什么选择 SupaC？
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              专为 SuperC 预约而设计的自动化解决方案
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white mx-auto">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">自动预约</h3>
              <p className="mt-2 text-gray-600">
                自动监控 SuperC 官网，发现可用时间立即预约
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white mx-auto">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">告别手动查询</h3>
              <p className="mt-2 text-gray-600">
                无需频繁刷新网页，系统 24/7 自动为您工作
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white mx-auto">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">个人信息安全可靠</h3>
              <p className="mt-2 text-gray-600">
                严格保护您的个人信息，确保数据安全
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}