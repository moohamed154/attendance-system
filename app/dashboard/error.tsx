'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report to Sentry in production (via sentry.client.config.ts automatic capture)
    // Log to console in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Dashboard boundary caught error:', error);
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-6 bg-card border rounded-2xl shadow-sm border-border/50 max-w-lg mx-auto mt-12">
      <div className="p-4 bg-destructive/10 rounded-full text-destructive">
        <AlertTriangle className="w-12 h-12" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Something went wrong</h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          An error occurred while loading this page. Please try again or refresh the page.
        </p>
        {error.message && (
          <pre className="mt-4 p-3 bg-muted rounded-lg text-xs font-mono text-left overflow-auto max-h-40 max-w-full text-muted-foreground border border-border/30">
            {error.message}
          </pre>
        )}
      </div>
      <div className="flex gap-4">
        <Button onClick={() => reset()} className="rounded-xl">
          <RotateCcw className="w-4 h-4 mr-2" />
          Try again
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()} className="rounded-xl">
          Reload page
        </Button>
      </div>
    </div>
  );
}
