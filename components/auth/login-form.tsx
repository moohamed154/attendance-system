'use client';

import { useActionState, useEffect, useState } from 'react';
import { loginAction } from '@/actions/auth/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useFormStatus } from 'react-dom';
import { Dictionary } from '@/lib/i18n';

const initialState = {
  error: null as string | null,
};

function SubmitButton({ dict }: { dict: Dictionary }) {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full h-12" type="submit" disabled={pending} data-testid="login-button">
      {pending ? dict.login.signingIn : dict.login.signIn}
    </Button>
  );
}

export function LoginForm({ dict }: { dict: Dictionary }) {
  const [state, formAction] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state?.error]);

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl rounded-2xl overflow-hidden border-border/50 bg-background/50 backdrop-blur-xl">
      <CardHeader className="space-y-3 pb-6 text-center">
        <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
          <GraduationCap className="w-10 h-10 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">{dict.login.title}</CardTitle>
        <CardDescription>
          {dict.login.subtitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6" data-testid="login-form">
          <div className="space-y-2">
            <Label htmlFor="username">{dict.login.username}</Label>
            <Input 
              id="username" 
              name="username" 
              type="text" 
              placeholder="admin" 
              required 
              className="h-12"
              data-testid="username-input"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{dict.login.password}</Label>
            </div>
            <div className="relative">
              <Input 
                id="password" 
                name="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                required 
                className="h-12"
                data-testid="password-input"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 left-auto rtl:right-auto rtl:left-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <SubmitButton dict={dict} />
        </form>
      </CardContent>
    </Card>
  );
}
