
'use client';

import { AlertCircle } from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';

interface StatusErrorProps {
  email: string | null;
  newEmail: string;
  setNewEmail: (email: string) => void;
  handleUpdateEmail: () => void;
  updatingEmail: boolean;
}

export default function StatusError({ 
  email, 
  newEmail, 
  setNewEmail, 
  handleUpdateEmail, 
  updatingEmail 
}: StatusErrorProps) {
  return (
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
            {email || '未设置'}
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
  );
}
