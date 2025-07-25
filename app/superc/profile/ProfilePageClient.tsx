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

export default function ProfilePageClient() {
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
        } else if (response.status === 404) {
          // Profile not found
          setProfile(null);
        } else {
          console.error('Failed to load profile');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleCancel = async () => {
    if (!profile?.id) return;
    
    setCancelling(true);
    setMessage(null);
    
    try {
      const formData = new FormData();
      formData.append('appointmentId', profile.id.toString());
      
      const result = await cancelAppointment({}, formData);
      
      if ('success' in result && result.success) {
        setMessage({ type: 'success', text: '预约已成功取消' });
        // Reload profile after successful cancellation
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage({ 
          type: 'error', 
          text: 'error' in result ? result.error : (result.message || '取消预约失败，请重试')
        });
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setMessage({ 
        type: 'error', 
        text: '取消预约时发生错误，请重试' 
      });
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
    );
  }

  const formatBirthDate = (day: number | null, month: number | null, year: number | null) => {
    if (!day || !month || !year) return '未设置';
    return `${year}年${month}月${day}日`;
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'waiting':
        return <Badge className="bg-yellow-100 text-yellow-800">等待中</Badge>;
      case 'booked':
        return <Badge className="bg-green-100 text-green-800">已预约</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">未知状态</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">我的预约档案</h1>
        <p className="text-gray-600">查看和管理您的 SuperC 预约信息</p>
      </div>

      {message && (
        <Card className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardContent className="py-3">
            <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {message.text}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          </CardContent>
        </Card>

        {/* 预约信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              预约状态
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">状态</label>
              <div className="mt-1">
                {getStatusBadge(profile.appointmentStatus)}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">首选地点</label>
              <p className="text-gray-900 flex items-center">
                <MapPinIcon className="h-4 w-4 mr-1" />
                {profile.preferredLocations}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">创建时间</label>
              <p className="text-gray-900 flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                {profile.createdAt ? new Date(profile.createdAt).toLocaleString('zh-CN') : '未知'}
              </p>
            </div>
            {(profile.appointmentStatus === 'waiting' || profile.appointmentStatus === 'booked') && (
              <div className="pt-4">
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="w-full"
                >
                  {cancelling ? '取消中...' : '取消预约'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 队列信息 */}
      {queueInfo && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClockIcon className="h-5 w-5 mr-2" />
              排队信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">当前排队位置</label>
                <p className="text-2xl font-bold text-orange-600">第 {queueInfo.position} 位</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">预计等待时间</label>
                <p className="text-2xl font-bold text-blue-600">{queueInfo.estimatedWaitTime}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}