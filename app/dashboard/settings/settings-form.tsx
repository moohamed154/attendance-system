'use client';

import { useState } from 'react';
import { updateSettings } from '@/actions/settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function SettingsForm({ initialSettings, dict }: { initialSettings: Record<string, string>, dict: any }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const centerName = formData.get('centerName') as string;
    const teacherName = formData.get('teacherName') as string;
    const currency = formData.get('currency') as string;
    const timeFormat = formData.get('timeFormat') as string;

    const result = await updateSettings({ centerName, teacherName, currency, timeFormat });
    
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(dict.settingsPage?.success || 'Settings updated successfully');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card className="rounded-2xl border-border/50 shadow-sm bg-card mb-6">
        <CardHeader>
          <CardTitle>بيانات المركز (Center Information)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="centerName">اسم المركز (Center Name)</Label>
            <Input 
              id="centerName" 
              name="centerName" 
              defaultValue={initialSettings.centerName || ''} 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teacherName">اسم المدرس (Teacher Name)</Label>
            <Input 
              id="teacherName" 
              name="teacherName" 
              defaultValue={initialSettings.teacherName || ''} 
              required 
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/50 shadow-sm bg-card">
        <CardHeader>
          <CardTitle>{dict.settingsPage?.generalInfo || 'System Settings'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency">{dict.settingsPage?.currency || 'Currency Symbol (e.g. EGP, USD, ج.م)'}</Label>
            <Input 
              id="currency" 
              name="currency" 
              defaultValue={initialSettings.currency || 'EGP'} 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeFormat">{dict.settingsPage?.timeFormat || 'Time Format'}</Label>
            <select
              id="timeFormat"
              name="timeFormat"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              defaultValue={initialSettings.timeFormat || '12h'}
            >
              <option value="12h">{dict.settingsPage?.format12h || '12-hour (e.g., 4:00 PM)'}</option>
              <option value="24h">{dict.settingsPage?.format24h || '24-hour (e.g., 16:00)'}</option>
            </select>
          </div>
          <Button type="submit" className="rounded-xl mt-4" disabled={loading}>
            {loading ? (dict.settingsPage?.saving || 'Saving...') : (dict.settingsPage?.saveChanges || 'Save Changes')}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
