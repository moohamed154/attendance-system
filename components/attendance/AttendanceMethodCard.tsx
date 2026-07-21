import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AttendanceMethodCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
  comingSoonText?: string;
  onClick?: () => void;
  disabled?: boolean;
  testId?: string;
}

export function AttendanceMethodCard({
  title,
  description,
  icon,
  comingSoon,
  comingSoonText = 'Coming Soon',
  onClick,
  disabled,
  testId
}: AttendanceMethodCardProps) {
  return (
    <Card 
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all duration-300",
        !disabled && "cursor-pointer hover:border-primary/50 hover:shadow-md hover:bg-accent/5 hover:-translate-y-1 active:scale-[0.98]",
        disabled && "opacity-80"
      )}
      onClick={!disabled ? onClick : undefined}
      data-testid={testId}
    >
      {comingSoon && (
        <div className="absolute top-3 ltr:right-3 rtl:left-3 z-10">
          <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary hover:bg-primary/10 font-medium px-3 py-1">
            {comingSoonText}
          </Badge>
        </div>
      )}
      <CardHeader className="pt-8 pb-6">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          {icon}
        </div>
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground mt-2 leading-relaxed min-h-[48px]">
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
