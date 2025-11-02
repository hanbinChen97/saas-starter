
'use client';

import PayPalButton from '../../components/PayPalButton';
import { AppointmentProfile } from '@/app/lib/db/schema';

interface StatusBookedProps {
  profile: AppointmentProfile;
}

export default function StatusBooked({ profile }: StatusBookedProps) {
  return (
    <>
      {profile.appointmentDate && (
        <div>
          <label className="text-sm font-medium text-gray-500">预约时间</label>
          <p className="text-gray-900">
            {new Date(profile.appointmentDate).toLocaleString('zh-CN')}
          </p>
        </div>
      )}
      <div className="pt-4 border-t">
        <p className="text-sm text-gray-600 mb-4">
          您的预约已成功！如果您不小心错过了预约，想要立即重新开始新的排队，可以通过支付费用（5 欧）来支持我们的服务，并重新进入排队系统。
        </p>
        <div className="w-full max-w-xs mx-auto">
          <PayPalButton amount="5.00" />
        </div>
      </div>
    </>
  );
}
