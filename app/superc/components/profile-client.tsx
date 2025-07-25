'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { CalendarIcon, ClockIcon, MapPinIcon, UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppointmentProfile } from '@/app/lib/db/schema';
import { cancelAppointment } from '../main/actions';

interface QueueInfo {
  position: number;
  estimatedWaitTime: string;
}

export default function SuperCProfileClient() {
  const [profile, setProfile] = useState<AppointmentProfile | null>(null);
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleCancelAppointment = async () => {
    if (!confirm('确定要取消预约吗？此操作无法撤销。')) {
      return;
    }

    setCancelling(true);
    setMessage(null);

    try {
      const formData = new FormData();
      const result = await cancelAppointment({}, formData);
      
      if ('success' in result && result.success) {
        setMessage({ type: 'success', text: result.message });
        // Refresh profile data after successful cancellation
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else if ('error' in result) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'error', text: result.message || '取消预约失败。' });
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setMessage({ type: 'error', text: '取消预约时发生错误。' });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              暂无预约信息
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
        return <Badge variant="default" className="bg-green-600">已预约</Badge>;
      case 'completed':
        return <Badge variant="outline" className="border-blue-600 text-blue-600">已完成</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">已取消</Badge>;
      default:
        return <Badge variant="secondary">未知状态</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">个人档案</h1>
        <p className="text-gray-600">查看和管理您的 SuperC 预约信息</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              个人信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">姓名</label>
                <p className="text-gray-900">{profile.vorname} {profile.nachname}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">邮箱</label>
                <p className="text-gray-900">{profile.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">电话</label>
                <p className="text-gray-900">{profile.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">生日</label>
                <p className="text-gray-900">
                  {formatBirthDate(profile.geburtsdatumDay, profile.geburtsdatumMonth, profile.geburtsdatumYear)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                预约信息
              </div>
              {getStatusBadge(profile.appointmentStatus)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">首选地点</label>
                <div className="flex items-center">
                  <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                  <p className="text-gray-900">{profile.preferredLocations}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">创建时间</label>
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                  <p className="text-gray-900">
                    {profile.createdAt ? new Date(profile.createdAt).toLocaleString('zh-CN') : '未知'}
                  </p>
                </div>
              </div>
            </div>

            {queueInfo && (
              <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-medium text-orange-900 mb-2">排队信息</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-orange-700">当前排队位置：</span>
                    <span className="font-medium text-orange-900">第 {queueInfo.position} 位</span>
                  </div>
                  <div>
                    <span className="text-orange-700">预计等待时间：</span>
                    <span className="font-medium text-orange-900">{queueInfo.estimatedWaitTime}</span>
                  </div>
                </div>
              </div>
            )}

            {profile.appointmentStatus === 'waiting' || profile.appointmentStatus === 'booked' ? (
              <div className="mt-6">
                <Button
                  onClick={handleCancelAppointment}
                  disabled={cancelling}
                  variant="destructive"
                  size="sm"
                >
                  {cancelling ? '取消中...' : '取消预约'}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}