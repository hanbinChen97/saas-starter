'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { CalendarIcon, ClockIcon, MapPinIcon, UserIcon, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import SuperCHeader from '../components/header';
import { AppointmentProfile } from '@/app/lib/db/schema';
import { cancelAppointment } from '../main/actions';
import { updateProfileEmail } from './actions';
import { Input } from '@/app/components/ui/input';
import DonationCard from '../components/DonationCard';

interface QueueInfo {
  position: number;
  estimatedWaitTime: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<AppointmentProfile | null>(null);
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(false);

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

  const handleUpdateEmail = async () => {
    if (!newEmail) {
      setMessage({ type: 'error', text: '请输入新的邮箱地址。' });
      return;
    }

    setUpdatingEmail(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('email', newEmail);
      const result = await updateProfileEmail({}, formData);
      
      if ('success' in result && result.success) {
        setMessage({ type: 'success', text: result.message });
        // Refresh profile data after successful update
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else if ('error' in result) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'error', text: result.message || '更新邮箱失败。' });
      }
    } catch (error) {
      console.error('Error updating email:', error);
      setMessage({ type: 'error', text: '更新邮箱时发生错误。' });
    } finally {
      setUpdatingEmail(false);
    }
  };

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
      case 'error':
        return <Badge variant="destructive">错误</Badge>;
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

        {/* Message display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

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

              {/* Error status - allow email update */}
              {profile.appointmentStatus === 'error' && (
                <div className="pt-4 border-t border-red-200 bg-red-50 -mx-6 px-6 py-4">
                  <div className="flex items-start space-x-2 mb-4">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-red-900 mb-1">
                        预约出现错误
                      </h3>
                      <p className="text-sm text-red-700 mb-3">
                        您的预约信息处理失败，可能是邮箱地址有误。请更新您的邮箱地址以继续。
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        当前邮箱
                      </label>
                      <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                        {profile.email || '未设置'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        新邮箱地址
                      </label>
                      <Input
                        type="email"
                        placeholder="请输入新的邮箱地址"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full"
                        disabled={updatingEmail}
                      />
                    </div>
                    
                    <Button
                      onClick={handleUpdateEmail}
                      disabled={updatingEmail || !newEmail}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      {updatingEmail ? '更新中...' : '更新邮箱并恢复预约'}
                    </Button>
                  </div>
                </div>
              )}

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
              
              {/* Cancel button - only show if appointment status is waiting */}
              {profile.appointmentStatus === 'waiting' && (
                <div className="pt-4 border-t">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleCancelAppointment}
                    disabled={cancelling}
                    className="w-full"
                  >
                    {cancelling ? '取消中...' : '取消预约'}
                  </Button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    取消预约后，您的排队位置将会丢失
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Donation card - only show if appointment status is booked */}
          {profile.appointmentStatus === 'booked' && (
            <DonationCard 
              title="预约成功！喜欢我们的服务吗？"
              className="md:col-span-2"
            />
          )}

          {/* 排队信息 */}
          {queueInfo && profile.appointmentStatus === 'waiting' && (
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
