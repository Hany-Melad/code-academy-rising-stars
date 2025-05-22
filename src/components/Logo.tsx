
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export function Logo({ className, size = 'medium', showText = true }: LogoProps) {
  const sizeClasses = {
    small: 'h-6',
    medium: 'h-8',
    large: 'h-12'
  };

  return (
    <div className={cn("flex items-center", className)}>
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-academy-orange to-academy-blue opacity-75 rounded-full blur"></div>
        <div className={cn("flex items-center justify-center bg-white text-academy-blue font-bold rounded-full relative", sizeClasses[size])}>
          <span className={cn("text-academy-blue px-3", {
            "text-sm": size === 'small',
            "text-base": size === 'medium',
            "text-lg": size === 'large',
          })}>UPS</span>
        </div>
      </div>
      
      {showText && (
        <div className="ml-2 font-bold flex flex-col">
          <span className="text-academy-orange">Junior</span>
          <span className={cn("text-academy-blue leading-none", {
            "text-xs": size === 'small',
            "text-sm": size === 'medium',
            "text-base": size === 'large',
          })}>Coding Academy</span>
        </div>
      )}
    </div>
  );
}
