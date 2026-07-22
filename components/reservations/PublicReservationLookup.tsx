'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Calendar,
  Ticket,
  ShieldCheck,
  User,
  Phone,
  BookOpen,
  MapPin,
  Tag,
  Key,
  Edit,
} from 'lucide-react';
import { lookupPublicReservation, updatePublicReservationBeforePayment } from '@/actions/reservations/public-reservations';
import { ReservationTimeline } from './ReservationTimeline';
import { ReservationCardDigitalTicket } from './ReservationCardDigitalTicket';
import Link from 'next/link';

const DAYS_MAP: Record<number, { en: string; ar: string }> = {
  0: { en: 'Sunday', ar: 'الأحد' },
  1: { en: 'Monday', ar: 'الإثنين' },
  2: { en: 'Tuesday', ar: 'الثلاثاء' },
  3: { en: 'Wednesday', ar: 'الأربعاء' },
  4: { en: 'Thursday', ar: 'الخميس' },
  5: { en: 'Friday', ar: 'الجمعة' },
  6: { en: 'Saturday', ar: 'السبت' },
};

export function PublicReservationLookup({ locale = 'ar' }: { locale?: string }) {
  const isAr = locale === 'ar';

  const [resNumberInput, setResNumberInput] = useState<string>('');
  const [trackingCodeInput, setTrackingCodeInput] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reservationData, setReservationData] = useState<any | null>(null);

  const [showTicketModal, setShowTicketModal] = useState<boolean>(false);

  // Edit before payment modal
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editParentName, setEditParentName] = useState<string>('');
  const [editStudentPhone, setEditStudentPhone] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setReservationData(null);

    if (!resNumberInput.trim() || !trackingCodeInput.trim()) {
      setErrorMessage(
        isAr
          ? 'يرجى إدخال كل من رقم الحجز وكود التتبع.'
          : 'Please enter both Reservation Number and Tracking Code.'
      );
      return;
    }

    setLoading(true);
    const res = await lookupPublicReservation(resNumberInput, trackingCodeInput);
    setLoading(false);

    if (!res.success || !res.data) {
      setErrorMessage(res.error || (isAr ? 'لم يتم العثور على حجز.' : 'Reservation not found.'));
      return;
    }

    setReservationData(res.data);
  }

  function handleOpenEditModal() {
    if (!reservationData) return;
    setEditParentName(reservationData.parentName || '');
    setEditStudentPhone(reservationData.studentPhone || '');
    setEditNotes('');
    setEditSuccessMsg(null);
    setEditModalOpen(true);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!reservationData) return;

    setEditSubmitting(true);
    const res = await updatePublicReservationBeforePayment({
      reservationNumber: reservationData.reservationNumber,
      trackingCode: reservationData.trackingCode,
      parentName: editParentName,
      studentPhone: editStudentPhone,
      notes: editNotes,
    });
    setEditSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || (isAr ? 'فشل التعديل' : 'Update failed'));
      return;
    }

    setEditSuccessMsg(isAr ? 'تم تحديث البيانات بنجاح.' : 'Reservation details updated.');
    setTimeout(() => setEditModalOpen(false), 1500);

    // Refresh lookup
    const updated = await lookupPublicReservation(reservationData.reservationNumber, reservationData.trackingCode);
    if (updated.success && updated.data) {
      setReservationData(updated.data);
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6" data-testid="public-reservation-lookup">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          {isAr ? 'استعلام وتتبع حالة الحجز' : 'Reservation Status Lookup'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isAr
            ? 'أدخل رقم الحجز (RES-...) وكود التتبع (e.g. 4F8K-92LM) للاطلاع على حالة حجزك والتذكرة.'
            : 'Enter Reservation Number & Tracking Code to check status and open pass.'}
        </p>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="resNum" className="text-xs font-medium">
                  {isAr ? 'رقم الحجز (Reservation Number) *' : 'Reservation Number *'}
                </Label>
                <div className="relative">
                  <Ticket className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="resNum"
                    placeholder="RES-20260722-XXXXXX"
                    value={resNumberInput}
                    onChange={(e) => setResNumberInput(e.target.value)}
                    className="ps-9 font-mono uppercase text-xs"
                    data-testid="input-lookup-res-number"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="trackCode" className="text-xs font-medium">
                  {isAr ? 'كود التتبع السرّي (Tracking Code) *' : 'Tracking Code *'}
                </Label>
                <div className="relative">
                  <Key className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="trackCode"
                    placeholder="4F8K-92LM"
                    value={trackingCodeInput}
                    onChange={(e) => setTrackingCodeInput(e.target.value)}
                    className="ps-9 font-mono uppercase text-xs"
                    data-testid="input-lookup-tracking-code"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Link href="/reserve">
                <Button variant="ghost" size="sm" type="button">
                  {isAr ? '← حجز حقيق جديد' : '← New Booking'}
                </Button>
              </Link>
              <Button type="submit" disabled={loading} size="sm" data-testid="lookup-search-btn">
                <Search className="h-4 w-4 me-1.5" />
                <span>{loading ? (isAr ? 'جاري البحث...' : 'Searching...') : isAr ? 'استعلام' : 'Look Up'}</span>
              </Button>
            </div>
          </form>

          {errorMessage && (
            <Alert variant="destructive" className="mt-4" data-testid="lookup-error-alert">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{isAr ? 'خطأ' : 'Error'}</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {reservationData && (
        <Card className="border-border shadow-md" data-testid="lookup-results-card">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <span>{reservationData.studentName}</span>
                  <Badge variant="outline" className="text-[11px]">
                    {reservationData.grade}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs font-mono mt-1 text-primary">
                  {reservationData.reservationNumber} • Code: {reservationData.trackingCode}
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    reservationData.status === 'CONFIRMED'
                      ? 'default'
                      : reservationData.status === 'PENDING'
                      ? 'secondary'
                      : 'destructive'
                  }
                  className="text-xs"
                >
                  {reservationData.status}
                </Badge>
                {reservationData.status === 'PENDING' && (
                  <Button variant="outline" size="sm" onClick={handleOpenEditModal} data-testid="edit-before-payment-btn">
                    <Edit className="h-3.5 w-3.5 me-1" />
                    <span>{isAr ? 'تعديل البيانات' : 'Edit Details'}</span>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/20">
                <BookOpen className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-muted-foreground">{isAr ? 'المادة والحصة' : 'Subject'}</div>
                  <div className="font-semibold">{reservationData.session.subject} ({reservationData.session.teacherName})</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/20">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-muted-foreground">{isAr ? 'الموعد' : 'Schedule'}</div>
                  <div className="font-semibold">
                    {isAr ? DAYS_MAP[reservationData.session.dayOfWeek]?.ar : DAYS_MAP[reservationData.session.dayOfWeek]?.en} • {reservationData.session.time}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
              <Button size="sm" onClick={() => setShowTicketModal(true)} data-testid="open-ticket-modal-btn">
                <Ticket className="h-4 w-4 me-2" />
                <span>{isAr ? 'عرض التذكرة الرقمية ورمز الـ QR' : 'Open Digital Ticket & QR'}</span>
              </Button>

              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>{isAr ? 'حجز مسجل ومحمي بمركز البيانات' : 'Verified Database Reservation'}</span>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <div className="text-sm font-semibold">{isAr ? 'سجل تتبع الحالة' : 'Status History Timeline'}</div>
              <ReservationTimeline history={reservationData.history} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Before Payment Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md p-6 space-y-4" data-testid="edit-before-payment-dialog">
          <DialogHeader>
            <DialogTitle>{isAr ? 'تعديل بيانات الحجز قبل الدفع' : 'Edit Details Before Payment'}</DialogTitle>
            <DialogDescription className="text-xs">
              {isAr
                ? 'يمكنك تعديل بيانات الاتصال واسم ولي الأمر. لا يمكن تغيير الحصة أو المادة.'
                : 'You can edit contact phone and parent name before payment.'}
            </DialogDescription>
          </DialogHeader>

          {editSuccessMsg && (
            <Alert className="border-emerald-500 bg-emerald-500/10 text-emerald-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription>{editSuccessMsg}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label htmlFor="editParent">{isAr ? 'اسم ولي الأمر' : 'Parent Name'}</Label>
              <Input id="editParent" value={editParentName} onChange={(e) => setEditParentName(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="editPhone">{isAr ? 'هاتف الطالب' : 'Student Phone'}</Label>
              <Input id="editPhone" value={editStudentPhone} onChange={(e) => setEditStudentPhone(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="editNotes">{isAr ? 'ملاحظات' : 'Notes'}</Label>
              <Input id="editNotes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setEditModalOpen(false)}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button size="sm" type="submit" disabled={editSubmitting}>
                {editSubmitting ? (isAr ? 'جاري الحفظ...' : 'Saving...') : isAr ? 'حفظ التغييرات' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ticket Modal */}
      {reservationData && (
        <ReservationCardDigitalTicket
          open={showTicketModal}
          onClose={() => setShowTicketModal(false)}
          reservationNumber={reservationData.reservationNumber}
          trackingCode={reservationData.trackingCode}
          studentName={reservationData.studentName}
          parentName={reservationData.parentName}
          grade={reservationData.grade}
          subject={reservationData.session.subject}
          teacherName={reservationData.session.teacherName}
          time={reservationData.session.time}
          dayOfWeek={reservationData.session.dayOfWeek}
          qrToken={reservationData.qrToken}
          status={reservationData.status}
          locale={locale}
        />
      )}
    </div>
  );
}
