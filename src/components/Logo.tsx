
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export function Logo({ className }: { className?: string }) {
  return (
    <img
      src="https://i.postimg.cc/G2nz8KtS/logo-2.png"
      alt="UPS"
      className={cn(
        "object-contain object-left h-[30px] align-middle max-w-full inline-block",
        className
      )}
    />
  );
}
