import { cn } from '@/app/lib/utils';

const badgeVariants = {
  default: 'border-transparent bg-orange-600 text-white hover:bg-orange-700',
  secondary: 'border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200',
  destructive: 'border-transparent bg-red-600 text-white hover:bg-red-700',
  outline: 'text-gray-900 border-gray-300',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants;
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div 
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        badgeVariants[variant],
        className
      )} 
      {...props} 
    />
  );
}

export { Badge };