'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { CalendarIcon, ClockIcon, MapPinIcon, UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import SuperCHeader from '../components/header';
import { AppointmentProfile } from '@/app/lib/db/schema';

interface QueueInfo {
  position: number;
  estimatedWaitTime: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<AppointmentProfile | null>(null);
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch('/api/superc/profile');
        if (response.ok) {
          const data = await response.json();
          setProfile(data.profile);
          setQueueInfo(data.queueInfo);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SuperCHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SuperCHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                未找到预约信息
              </h2>
              <p className="text-gray-600 mb-4">
                您还没有创建预约档案。请先完成预约信息填写。
              </p>
              <a
                href="/superc/main"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
              >
                创建预约档案
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const formatBirthDate = (day: number | null, month: number | null, year: number | null) => {
    if (!day || !month || !year) return '未设置';
    return `${year}年${month}月${day}日`;
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="secondary">等待中</Badge>;
      case 'booked':
        return <Badge variant="default" className="bg-green-500">已预约</Badge>;
      default:
        return <Badge variant="outline">未知状态</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SuperCHeader />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">个人资料</h1>
          <p className="text-gray-600 mt-2">查看您的预约信息和当前状态</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">姓名</label>
                <p className="text-gray-900">
                  {profile.vorname} {profile.nachname}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">邮箱</label>
                <p className="text-gray-900">{profile.email || '未设置'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">电话</label>
                <p className="text-gray-900">{profile.phone || '未设置'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">出生日期</label>
                <p className="text-gray-900">
                  {formatBirthDate(
                    profile.geburtsdatumDay,
                    profile.geburtsdatumMonth,
                    profile.geburtsdatumYear
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 预约状态 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                预约状态
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">当前状态</label>
                <div className="mt-1">
                  {getStatusBadge(profile.appointmentStatus)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">偏好地点</label>
                <div className="flex items-center mt-1">
                  <MapPinIcon className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-gray-900">{profile.preferredLocations || 'SuperC'}</span>
                </div>
              </div>
              {profile.appointmentDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">预约时间</label>
                  <p className="text-gray-900">
                    {new Date(profile.appointmentDate).toLocaleString('zh-CN')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 排队信息 */}
          {queueInfo && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  排队信息
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-6 bg-orange-50 rounded-lg">
                    <div className="text-3xl font-bold text-orange-600 mb-2">
                      #{queueInfo.position}
                    </div>
                    <p className="text-sm text-gray-600">当前排队位置</p>
                  </div>
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {queueInfo.estimatedWaitTime}
                    </div>
                    <p className="text-sm text-gray-600">预计等待时间</p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 text-center">
                    系统会自动为您监控预约机会，一旦有可用时间段将立即为您预约
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}