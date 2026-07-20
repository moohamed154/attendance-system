'use client';

import { useActionState } from 'react';
import { studentChangePasswordAction } from '@/actions/student-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface StudentChangePasswordFormProps {
  dict: any;
  locale: string;
  /** true = first-login forced change, false = voluntary change from profile */
  forced?: boolean;
}

export function StudentChangePasswordForm({ dict, locale, forced = true }: StudentChangePasswordFormProps) {
  const t = dict.studentAuth?.changePassword || {};
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [state, action, isPending] = useActionState<{ error?: string; success?: boolean } | null, FormData>(studentChangePasswordAction, null);
  const isRtl = locale === 'ar';

  return (
    <div className={cn("w-full space-y-8", isRtl && "text-right")} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Lock className="w-7 h-7 text-amber-500" />
          </div>
        </div>
        <h1 className="text-xl font-bold tracking-tight">{t.title || 'Change Password'}</h1>
        <p className="text-sm text-muted-foreground">{t.subtitle || 'You must set a new password before continuing'}</p>
      </div>

      {/* Error / Success */}
      {state?.error && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}
      {state?.success && (
        <div className="flex items-start gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-700 dark:text-green-400">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{t.success || 'Password changed successfully'}</span>
        </div>
      )}

      <form action={action} className="space-y-5">

        {/* Current Password — only shown on voluntary change, not forced first-login */}
        {!forced && (
          <PasswordField
            id="currentPassword"
            name="currentPassword"
            label={t.currentPassword || 'Current Password'}
            hint={isRtl ? 'كلمة المرور الافتراضية هي رقم الطالب' : 'Default password is your student ID number'}
            show={showCurrent}
            onToggle={() => setShowCurrent(v => !v)}
            isRtl={isRtl}
            autoComplete="current-password"
          />
        )}

        {/* New Password */}
        <PasswordField
          id="newPassword"
          name="newPassword"
          label={t.newPassword || 'New Password'}
          hint={t.minLength || 'Minimum 8 characters'}
          show={showNew}
          onToggle={() => setShowNew(v => !v)}
          isRtl={isRtl}
          autoComplete="new-password"
          minLength={8}
        />

        {/* Confirm Password */}
        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label={t.confirmPassword || 'Confirm New Password'}
          show={showConfirm}
          onToggle={() => setShowConfirm(v => !v)}
          isRtl={isRtl}
          autoComplete="new-password"
          minLength={8}
        />

        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-12 rounded-xl font-semibold text-base shadow-md"
        >
          {isPending ? (t.saving || 'Saving...') : (t.save || 'Save Password')}
        </Button>
      </form>
    </div>
  );
}

function PasswordField({
  id,
  name,
  label,
  hint,
  show,
  onToggle,
  isRtl,
  autoComplete,
  minLength,
}: {
  id: string;
  name: string;
  label: string;
  hint?: string;
  show: boolean;
  onToggle: () => void;
  isRtl: boolean;
  autoComplete?: string;
  minLength?: number;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <Lock className={cn(
          "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none",
          isRtl ? "right-3" : "left-3"
        )} />
        <Input
          id={id}
          name={name}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          className={cn(
            "h-12 rounded-xl bg-background border-border/70",
            isRtl ? "pr-10 pl-12 text-right" : "pl-10 pr-12"
          )}
          required
          minLength={minLength}
        />
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1",
            isRtl ? "left-3" : "right-3"
          )}
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
