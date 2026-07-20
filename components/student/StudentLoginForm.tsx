'use client';

import { useActionState } from 'react';
import { studentLoginAction } from '@/actions/student-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Phone, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface StudentLoginFormProps {
  dict: any;
  locale: string;
}

export function StudentLoginForm({ dict, locale }: StudentLoginFormProps) {
  const t = dict.studentAuth?.login || {};
  const [showPassword, setShowPassword] = useState(false);
  const [state, action, isPending] = useActionState(studentLoginAction, null);
  const isRtl = locale === 'ar';

  return (
    <div className={cn(
      "w-full space-y-8",
      isRtl && "text-right"
    )} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center shadow-lg">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t.title || 'Student Portal'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t.subtitle || 'Sign in with your phone number and password'}
          </p>
        </div>
      </div>

      {/* Login Form */}
      <form action={action} className="space-y-5">
        {/* Error */}
        {state?.error && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium">
            {t.phone || 'Phone Number'}
          </Label>
          <div className="relative">
            <Phone className={cn(
              "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none",
              isRtl ? "right-3" : "left-3"
            )} />
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder={t.phonePlaceholder || 'e.g., 01012345678'}
              className={cn(
                "h-12 rounded-xl bg-background border-border/70",
                isRtl ? "pr-10 text-right" : "pl-10"
              )}
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            {t.password || 'Password'}
          </Label>
          <div className="relative">
            <Lock className={cn(
              "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none",
              isRtl ? "right-3" : "left-3"
            )} />
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder={t.passwordPlaceholder || 'Enter your password'}
              className={cn(
                "h-12 rounded-xl bg-background border-border/70",
                isRtl ? "pr-10 pl-12 text-right" : "pl-10 pr-12"
              )}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1",
                isRtl ? "left-3" : "right-3"
              )}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t.defaultPasswordHint || 'Default password is your student ID number'}
          </p>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-12 rounded-xl font-semibold text-base shadow-md"
        >
          {isPending ? (t.signingIn || 'Signing in...') : (t.signIn || 'Sign In')}
        </Button>
      </form>

    </div>
  );
}
