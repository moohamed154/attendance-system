import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password?: string;
  dict: any;
}

export function PasswordStrength({ password = '', dict }: PasswordStrengthProps) {
  // Calculate strength score from 0 to 4
  const getStrength = (pass: string) => {
    if (!pass) return 0;
    if (pass.length < 6) return 1;
    
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    
    const hasLetters = /[a-zA-Z]/.test(pass);
    const hasNumbers = /[0-9]/.test(pass);
    const hasSymbols = /[^a-zA-Z0-9]/.test(pass);
    
    if (hasLetters && hasNumbers) score += 1;
    if (hasSymbols) score += 1;
    
    return Math.min(score, 4);
  };

  const strength = getStrength(password);
  
  const getStrengthColor = (s: number) => {
    switch (s) {
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-green-500';
      default: return 'bg-muted';
    }
  };

  const getStrengthText = (s: number) => {
    if (s === 0) return '';
    switch (s) {
      case 1: return dict.usersPage.passwordStrength.tooShort;
      case 2: return dict.usersPage.passwordStrength.weak;
      case 3: return dict.usersPage.passwordStrength.fair;
      case 4: return dict.usersPage.passwordStrength.strong;
      default: return '';
    }
  };

  const getTextColor = (s: number) => {
    switch (s) {
      case 1: return 'text-red-500';
      case 2: return 'text-orange-500';
      case 3: return 'text-yellow-600 dark:text-yellow-500';
      case 4: return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  }

  return (
    <div className="w-full mt-2">
      <div className="flex gap-1 h-1.5 mb-1.5">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn(
              "h-full flex-1 rounded-full transition-colors duration-300",
              strength >= step ? getStrengthColor(strength) : "bg-muted"
            )}
          />
        ))}
      </div>
      {strength > 0 && (
        <p className={cn("text-xs font-medium text-end", getTextColor(strength))}>
          {getStrengthText(strength)}
        </p>
      )}
    </div>
  );
}
