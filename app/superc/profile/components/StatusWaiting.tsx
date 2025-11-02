
'use client';

import { Button } from '@/app/components/ui/button';

interface StatusWaitingProps {
  handleCancelAppointment: () => void;
  cancelling: boolean;
}

export default function StatusWaiting({ handleCancelAppointment, cancelling }: StatusWaitingProps) {
  return (
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
  );
}
