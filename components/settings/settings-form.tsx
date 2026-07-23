'use client';

import { useState, useTransition } from 'react';
import { updateSettings, deleteAllStudents, deleteAllSessions } from '@/actions/settings/settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Building2, Settings2, Ticket, Trash2, AlertTriangle, Loader2, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export function SettingsForm({
  initialSettings,
  dict,
  locale = 'ar',
}: {
  initialSettings: Record<string, string>;
  dict: any;
  locale?: string;
}) {
  const isAr = locale === 'ar';
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Confirmation Modals State
  const [confirmDeleteStudentsOpen, setConfirmDeleteStudentsOpen] = useState(false);
  const [confirmDeleteSessionsOpen, setConfirmDeleteSessionsOpen] = useState(false);

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
      toast.success(isAr ? 'تم حفظ التغييرات وإعادة التحديث بنجاح' : (dict.settingsPage?.success || 'Settings updated successfully'));
    }
  };

  const handleBulkDeleteStudents = () => {
    startTransition(async () => {
      const res = await deleteAllStudents();
      setConfirmDeleteStudentsOpen(false);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(isAr ? 'تم مسح جميع بيانات الطلاب وسجلاتهم نهائياً!' : 'All students deleted successfully');
      }
    });
  };

  const handleBulkDeleteSessions = () => {
    startTransition(async () => {
      const res = await deleteAllSessions();
      setConfirmDeleteSessionsOpen(false);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(isAr ? 'تم مسح جميع الحصص والمجموعات نهائياً!' : 'All sessions deleted successfully');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Center & Instructor Info */}
      <Card className="rounded-2xl border-border/50 shadow-sm bg-card">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <span>{isAr ? 'بيانات المركز والمدرس' : 'Center & Instructor Details'}</span>
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr ? 'تظهر هذه البيانات على كروت الحضور والمطبوعات والتذاكر الإلكترونية.' : 'Printed on student cards, attendance cards, and tickets.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="centerName" className="text-xs font-semibold">
              {isAr ? 'اسم المركز / الأكاديمية' : 'Center Name'}
            </Label>
            <Input
              id="centerName"
              name="centerName"
              defaultValue={initialSettings.centerName || ''}
              placeholder={isAr ? 'مثال: أكاديمية التفوق' : 'e.g. Excellence Academy'}
              className="rounded-xl text-xs"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teacherName" className="text-xs font-semibold">
              {isAr ? 'اسم المدرس / المحاضر' : 'Teacher Name'}
            </Label>
            <Input
              id="teacherName"
              name="teacherName"
              defaultValue={initialSettings.teacherName || ''}
              placeholder={isAr ? 'مثال: أ. محمد حمدي' : 'e.g. Mr. Mohamed Hamdy'}
              className="rounded-xl text-xs"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. General System Preferences */}
      <Card className="rounded-2xl border-border/50 shadow-sm bg-card">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            <span>{isAr ? 'الإعدادات العامة للنظام' : (dict.settingsPage?.generalInfo || 'System Settings')}</span>
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr ? 'تنسيق الوقت الافتراضي ورمز العملة المستخدمة في التقارير.' : 'Default time formats and currency symbols used in invoices.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currency" className="text-xs font-semibold">
              {isAr ? 'رمز العملة (مثال: ج.م، EGP، USD)' : (dict.settingsPage?.currency || 'Currency Symbol')}
            </Label>
            <Input
              id="currency"
              name="currency"
              defaultValue={initialSettings.currency || 'EGP'}
              className="rounded-xl text-xs font-mono"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeFormat" className="text-xs font-semibold">
              {isAr ? 'تنسيق عرض الوقت' : (dict.settingsPage?.timeFormat || 'Time Format')}
            </Label>
            <select
              id="timeFormat"
              name="timeFormat"
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs"
              defaultValue={initialSettings.timeFormat || '12h'}
            >
              <option value="12h">{isAr ? '12 ساعة (مثال: 4:00 مساءً)' : (dict.settingsPage?.format12h || '12-hour (e.g., 4:00 PM)')}</option>
              <option value="24h">{isAr ? '24 ساعة (مثال: 16:00)' : (dict.settingsPage?.format24h || '24-hour (e.g., 16:00)')}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* 3. Reservation System Settings */}
      <Card className="rounded-2xl border-border/50 shadow-sm bg-card" data-testid="reservation-settings">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            <span>{isAr ? 'إعدادات نظام الحجز والتذاكر' : 'Reservation System Settings'}</span>
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr ? 'التحكم في مهلة حجز المقاعد وقوائم الانتظار وبادئة تذكرة الـ QR.' : 'Configure ticket expiration windows, waiting lists, and QR rules.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reservation_enabled" className="text-xs font-semibold">
                {isAr ? 'تفعيل نظام الحجوزات' : 'Enable Reservations'}
              </Label>
              <select
                id="reservation_enabled"
                name="reservation_enabled"
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs"
                defaultValue={initialSettings.reservation_enabled ?? 'true'}
              >
                <option value="true">{isAr ? 'مفعل' : 'Enabled'}</option>
                <option value="false">{isAr ? 'معطل' : 'Disabled'}</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="waiting_list_enabled" className="text-xs font-semibold">
                {isAr ? 'تفعيل قائمة الانتظار' : 'Enable Waiting List'}
              </Label>
              <select
                id="waiting_list_enabled"
                name="waiting_list_enabled"
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs"
                defaultValue={initialSettings.waiting_list_enabled ?? 'true'}
              >
                <option value="true">{isAr ? 'مفعل' : 'Enabled'}</option>
                <option value="false">{isAr ? 'معطل' : 'Disabled'}</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_pending_reservations" className="text-xs font-semibold">
                {isAr ? 'أقصى عدد للحجوزات المعلقة للطالب' : 'Max Pending Reservations per Student'}
              </Label>
              <Input
                type="number"
                id="max_pending_reservations"
                name="max_pending_reservations"
                defaultValue={initialSettings.max_pending_reservations || '2'}
                min={1}
                max={10}
                className="rounded-xl text-xs"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservation_expiration_hours" className="text-xs font-semibold">
                {isAr ? 'مهلة انتهاء الحجز (بالساعات)' : 'Reservation Expiration Window (Hours)'}
              </Label>
              <Input
                type="number"
                id="reservation_expiration_hours"
                name="reservation_expiration_hours"
                defaultValue={initialSettings.reservation_expiration_hours || '48'}
                min={1}
                max={720}
                className="rounded-xl text-xs"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservation_prefix" className="text-xs font-semibold">
                {isAr ? 'بادئة رقم الحجز (مثال: RES)' : 'Reservation Code Prefix'}
              </Label>
              <Input
                id="reservation_prefix"
                name="reservation_prefix"
                defaultValue={initialSettings.reservation_prefix || 'RES'}
                className="rounded-xl text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allow_student_cancellation" className="text-xs font-semibold">
                {isAr ? 'السماح للطلاب بإلغاء الحجز المعلق' : 'Allow Student Cancellation'}
              </Label>
              <select
                id="allow_student_cancellation"
                name="allow_student_cancellation"
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs"
                defaultValue={initialSettings.allow_student_cancellation ?? 'true'}
              >
                <option value="true">{isAr ? 'مسموح' : 'Allowed'}</option>
                <option value="false">{isAr ? 'غير مسموح' : 'Disabled'}</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Label htmlFor="reservation_notes" className="text-xs font-semibold">
              {isAr ? 'ملاحظات تعليمات الدفع الافتراضية' : 'Default Payment Instructions'}
            </Label>
            <Input
              id="reservation_notes"
              name="reservation_notes"
              defaultValue={initialSettings.reservation_notes || 'Please visit the center within the configured reservation period to complete payment.'}
              className="rounded-xl text-xs"
            />
          </div>

          <div className="pt-2">
            <Button type="submit" className="rounded-xl gap-2 text-xs font-semibold" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{loading ? (isAr ? 'جارٍ الحفظ...' : 'Saving...') : (isAr ? 'حفظ التغييرات' : 'Save Changes')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 4. Bulk Delete & Data Wipe Danger Zone */}
      <Card className="rounded-2xl border-destructive/40 shadow-sm bg-destructive/5">
        <CardHeader className="pb-3 border-b border-destructive/20">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            <span>{isAr ? 'منطقة العمليات الشاملة ومسح البيانات' : 'Bulk Data Reset Danger Zone'}</span>
          </CardTitle>
          <CardDescription className="text-xs text-destructive/80">
            {isAr
              ? 'تتيح هذه الإجراءات حذف جميع سجلات الطلاب أو الحصص دفعة واحدة. انتبه: هذه العمليات نهائية ولا يمكن التراجع عنها.'
              : 'Bulk operations to delete all students or all session schedules at once. Action is irreversible.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Delete All Students */}
          <div className="p-4 rounded-xl border border-destructive/30 bg-background/80 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="font-bold text-xs text-destructive flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>{isAr ? 'حذف جميع الطلاب' : 'Delete All Students'}</span>
              </h4>
              <p className="text-[11px] text-muted-foreground mt-1">
                {isAr
                  ? 'حذف جميع حسابات الطلاب، سجلات الحضور، والمدفوعات والحجوزات المرتبطة بهم دفعة واحدة.'
                  : 'Deletes all student profiles, attendance histories, and payment logs.'}
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="rounded-xl text-xs gap-1.5 w-full font-semibold"
              onClick={() => setConfirmDeleteStudentsOpen(true)}
              disabled={isPending}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'مسح جميع الطلاب دفعة واحدة' : 'Wipe All Students'}</span>
            </Button>
          </div>

          {/* Delete All Sessions */}
          <div className="p-4 rounded-xl border border-destructive/30 bg-background/80 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="font-bold text-xs text-destructive flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>{isAr ? 'حذف جميع الحصص والمجموعات' : 'Delete All Sessions'}</span>
              </h4>
              <p className="text-[11px] text-muted-foreground mt-1">
                {isAr
                  ? 'حذف جميع مواعيد الحصص والجداول والمجموعات الدراسية وحجوزاتها دفعة واحدة.'
                  : 'Deletes all course sessions, schedules, and active bookings.'}
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="rounded-xl text-xs gap-1.5 w-full font-semibold"
              onClick={() => setConfirmDeleteSessionsOpen(true)}
              disabled={isPending}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'مسح جميع الحصص دفعة واحدة' : 'Wipe All Sessions'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal 1: Delete All Students */}
      <Dialog open={confirmDeleteStudentsOpen} onOpenChange={setConfirmDeleteStudentsOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span>{isAr ? 'تأكيد مسح جميع الطلاب نهائياً' : 'Confirm Wipe All Students'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-2">
              {isAr
                ? 'هل أنت متأكد من حذف جميع بيانات الطلاب وسجلات الحضور والمدفوعات نهائياً؟ هذا الإجراء سيقوم بتفريغ قوام الطلاب بالكامل ولا يمكن إلغاؤه.'
                : 'Are you completely sure you want to delete ALL students, attendance logs, and payments? This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => setConfirmDeleteStudentsOpen(false)}
              disabled={isPending}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="rounded-xl text-xs gap-1.5 font-semibold"
              onClick={handleBulkDeleteStudents}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span>{isAr ? 'نعم، مسح الكل الآن' : 'Yes, Delete All Students'}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal 2: Delete All Sessions */}
      <Dialog open={confirmDeleteSessionsOpen} onOpenChange={setConfirmDeleteSessionsOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span>{isAr ? 'تأكيد مسح جميع الحصص نهائياً' : 'Confirm Wipe All Sessions'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-2">
              {isAr
                ? 'هل أنت متأكد من حذف جميع الحصص والجداول والمجموعات نهائياً؟ هذا الإجراء سيحذف كافة المواعيد ولا يمكن التراجع عنه.'
                : 'Are you completely sure you want to delete ALL sessions and course schedules? This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => setConfirmDeleteSessionsOpen(false)}
              disabled={isPending}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="rounded-xl text-xs gap-1.5 font-semibold"
              onClick={handleBulkDeleteSessions}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span>{isAr ? 'نعم، مسح الحصص الآن' : 'Yes, Delete All Sessions'}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
