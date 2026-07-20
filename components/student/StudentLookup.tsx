'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { lookupStudent } from '@/actions/students/students';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { KeyRound, AlertCircle } from 'lucide-react';

interface StudentLookupProps {
  dict: any;
}

export function StudentLookup({ dict }: StudentLookupProps) {
  const router = useRouter();
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sp = dict.studentPortal || {};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!studentId || !/^\d+$/.test(studentId.trim())) {
      setError(sp.invalidId || 'Please enter a valid numeric Student ID.');
      return;
    }

    setLoading(true);
    try {
      const res = await lookupStudent(studentId.trim());
      if (res.error) {
        if (res.error === 'Student not found') {
          setError(sp.notFound || 'Student ID not found. Please verify and try again.');
        } else {
          setError(res.error);
        }
      } else if (res.token) {
        router.push(`/student/card/${res.token}`);
      }
    } catch {
      setError(sp.errorOccurred || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-border/40 shadow-xl rounded-3xl bg-card overflow-hidden relative">
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary/80 via-primary to-primary/80" />
      <CardHeader className="pt-8 pb-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-6 h-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">{sp.title || 'Student Portal'}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
          {sp.subtitle || 'Access your digital student card and attendance QR code.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-8 px-6 sm:px-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="student-id" className="text-sm font-semibold text-foreground/80 block">
              {sp.enterId || 'Enter Student ID'}
            </label>
            <Input
              id="student-id"
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              placeholder={sp.idPlaceholder || 'e.g., 1118'}
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="h-12 rounded-xl border-border/50 text-center font-mono text-lg tracking-wider focus-visible:ring-primary/20 bg-background"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <div className="flex gap-2.5 items-start p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 rounded-xl text-base font-semibold shadow-md active:scale-[0.98] transition-transform"
            disabled={loading}
          >
            {loading ? (sp.searching || 'Searching...') : (sp.viewCard || 'View My Card')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
