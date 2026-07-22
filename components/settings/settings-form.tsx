'use client';

import { useState } from 'react';
import { updateSettings } from '@/actions/settings/settings';
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

    const reservation_enabled = formData.get('reservation_enabled') as string;
    const waiting_list_enabled = formData.get('waiting_list_enabled') as string;
    const max_pending_reservations = formData.get('max_pending_reservations') as string;
    const reservation_expiration_hours = formData.get('reservation_expiration_hours') as string;
    const allow_student_cancellation = formData.get('allow_student_cancellation') as string;
    const allow_card_download = formData.get('allow_card_download') as string;
    const allow_reservation_qr = formData.get('allow_reservation_qr') as string;
    const reservation_prefix = formData.get('reservation_prefix') as string;
    const reservation_notes = formData.get('reservation_notes') as string;

    const result = await updateSettings({
      centerName,
      teacherName,
      currency,
      timeFormat,
      reservation_enabled,
      waiting_list_enabled,
      max_pending_reservations,
      reservation_expiration_hours,
      allow_student_cancellation,
      allow_card_download,
      allow_reservation_qr,
      reservation_prefix,
      reservation_notes,
    });
    
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

      <Card className="rounded-2xl border-border/50 shadow-sm bg-card mb-6">
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
        </CardContent>
      </Card>

      {/* Reservation System Settings */}
      <Card className="rounded-2xl border-border/50 shadow-sm bg-card" data-testid="reservation-settings">
        <CardHeader>
          <CardTitle>إعدادات نظام الحجز (Reservation System Settings)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reservation_enabled">تفعيل الحجوزات (Enable Reservations)</Label>
              <select
                id="reservation_enabled"
                name="reservation_enabled"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue={initialSettings.reservation_enabled ?? 'true'}
              >
                <option value="true">مفعل (Enabled)</option>
                <option value="false">معطل (Disabled)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="waiting_list_enabled">تفعيل قائمة الانتظار (Enable Waiting List)</Label>
              <select
                id="waiting_list_enabled"
                name="waiting_list_enabled"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue={initialSettings.waiting_list_enabled ?? 'true'}
              >
                <option value="true">مفعل (Enabled)</option>
                <option value="false">معطل (Disabled)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_pending_reservations">أقصى عدد للحجوزات المعلقة للذات (Max Pending Reservations)</Label>
              <Input
                type="number"
                id="max_pending_reservations"
                name="max_pending_reservations"
                defaultValue={initialSettings.max_pending_reservations || '2'}
                min={1}
                max={10}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservation_expiration_hours">مهلة انتهاء الحجز بالساعات (Expiration Hours)</Label>
              <Input
                type="number"
                id="reservation_expiration_hours"
                name="reservation_expiration_hours"
                defaultValue={initialSettings.reservation_expiration_hours || '48'}
                min={1}
                max={720}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservation_prefix">بادئة رقم الحجز (Reservation Prefix)</Label>
              <Input
                id="reservation_prefix"
                name="reservation_prefix"
                defaultValue={initialSettings.reservation_prefix || 'RES'}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allow_student_cancellation">السماح للطلاب بإلغاء الحجز المعلق (Student Cancellation)</Label>
              <select
                id="allow_student_cancellation"
                name="allow_student_cancellation"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue={initialSettings.allow_student_cancellation ?? 'true'}
              >
                <option value="true">مفعل (Allowed)</option>
                <option value="false">غير مسموح (Disabled)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reservation_notes">ملاحظات الحجز الافتراضية (Default Payment Instructions)</Label>
            <Input
              id="reservation_notes"
              name="reservation_notes"
              defaultValue={initialSettings.reservation_notes || 'Please visit the center within the configured reservation period to complete payment.'}
            />
          </div>

          <Button type="submit" className="rounded-xl mt-4" disabled={loading}>
            {loading ? (dict.settingsPage?.saving || 'Saving...') : (dict.settingsPage?.saveChanges || 'Save Changes')}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
