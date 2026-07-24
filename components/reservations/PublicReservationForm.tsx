'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  BookOpen,
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Tag,
  Search,
  Sparkles,
  ArrowRight,
  School,
  FileText,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { createPublicReservation, getPublicSessions } from '@/actions/reservations/public-reservations';
import { ReservationCardDigitalTicket } from './ReservationCardDigitalTicket';
import { useCenterSettings } from '@/components/shared/center-settings-provider';
import Link from 'next/link';

interface SessionItem {
  id: string;
  grade: string;
  subject?: string | null;
  teacherName?: string | null;
  dayOfWeek: number;
  time: string;
  capacity?: number | null;
  reservedSeats?: number | null;
  confirmedSeats?: number | null;
  price?: number | null;
  room?: string | null;
  status?: string | null;
}

const DAYS_MAP: Record<number, { en: string; ar: string }> = {
  0: { en: 'Sunday', ar: 'الأحد' },
  1: { en: 'Monday', ar: 'الإثنين' },
  2: { en: 'Tuesday', ar: 'الثلاثاء' },
  3: { en: 'Wednesday', ar: 'الأربعاء' },
  4: { en: 'Thursday', ar: 'الخميس' },
  5: { en: 'Friday', ar: 'الجمعة' },
  6: { en: 'Saturday', ar: 'السبت' },
};

const GRADE_MAP: Record<string, { en: string; ar: string }> = {
  grade1: { en: '1st Secondary', ar: 'الصف الأول الثانوي' },
  grade2: { en: '2nd Secondary', ar: 'الصف الثاني الثانوي' },
  grade3: { en: '3rd Secondary', ar: 'الصف الثالث الثانوي' },
};

export function PublicReservationForm({ locale = 'ar' }: { locale?: string }) {
  const settings = useCenterSettings();
  const isAr = locale === 'ar';

  const [step, setStep] = useState<number>(1);
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [grade, setGrade] = useState<string>('grade1');

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(true);

  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [parentPhone, setParentPhone] = useState<string>('');
  const [studentPhone, setStudentPhone] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Case 1 Duplicate Popup Modal
  const [duplicateModalOpen, setDuplicateModalOpen] = useState<boolean>(false);
  const [duplicateStudentData, setDuplicateStudentData] = useState<any | null>(null);

  const [createdReservation, setCreatedReservation] = useState<any | null>(null);
  const [showTicketModal, setShowTicketModal] = useState<boolean>(false);

  useEffect(() => {
    async function loadSessions() {
      setLoadingSessions(true);
      const res = await getPublicSessions(grade, selectedSubject);
      if (res.success && res.data) {
        setSessions(res.data as SessionItem[]);
      }
      setLoadingSessions(false);
    }
    loadSessions();
  }, [grade, selectedSubject]);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  // Extract unique subjects available for the selected grade
  const subjectsList = Array.from(new Set(sessions.map((s) => s.subject || (isAr ? 'عام' : 'General'))));

  function handleStep3Next() {
    setErrorMessage(null);
    if (!studentName.trim() || !parentPhone.trim()) {
      setErrorMessage(
        isAr
          ? 'يرجى إدخال اسم الطالب ورقم هاتف ولي الأمر (مطلوب).'
          : 'Please enter student name and parent phone number.'
      );
      return;
    }

    const cleanParent = parentPhone.replace(/\D/g, '');
    const cleanStudent = studentPhone ? studentPhone.replace(/\D/g, '') : '';

    if (cleanStudent && cleanStudent === cleanParent) {
      setErrorMessage(
        isAr
          ? 'لا يمكن أن يكون رقم هاتف الطالب مطابقاً لرقم هاتف ولي الأمر. يرجى إدخال رقمين مختلفين أو ترك رقم الطالب فارغاً.'
          : 'Student phone number cannot be identical to parent phone number. Please enter distinct numbers or leave student phone blank.'
      );
      return;
    }

    setStep(4);
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setWarningMessage(null);

    if (!studentName.trim() || !parentPhone.trim() || !selectedSessionId) {
      setErrorMessage(
        isAr
          ? 'يرجى ملء جميع الحقول المطلوبة (اسم الطالب، هاتف ولي الأمر، والحصة).'
          : 'Please fill in all required fields.'
      );
      return;
    }

    const cleanParent = parentPhone.replace(/\D/g, '');
    const cleanStudent = studentPhone ? studentPhone.replace(/\D/g, '') : '';

    if (cleanStudent && cleanStudent === cleanParent) {
      setErrorMessage(
        isAr
          ? 'لا يمكن أن يكون رقم هاتف الطالب مطابقاً لرقم هاتف ولي الأمر. يرجى إدخال رقمين مختلفين أو ترك رقم الطالب فارغاً.'
          : 'Student phone number cannot be identical to parent phone number. Please enter distinct numbers or leave student phone blank.'
      );
      return;
    }

    setSubmitting(true);

    const res = await createPublicReservation({
      studentName,
      parentName: studentName,
      parentPhone,
      studentPhone,
      grade,
      sessionId: selectedSessionId,
    });

    setSubmitting(false);

    if (!res.success) {
      if (res.code === 'DUPLICATE_EXACT' && res.duplicateStudent) {
        setDuplicateStudentData(res.duplicateStudent);
        setDuplicateModalOpen(true);
      } else {
        setErrorMessage(res.error || (isAr ? 'فشل في حفظ الحجز.' : 'Failed to create reservation.'));
      }
      return;
    }

    if (res.warning) {
      setWarningMessage(res.warning);
    }

    if (res.data) {
      setCreatedReservation(res.data);
      setShowTicketModal(true);

      // Save locally
      try {
        const stored = localStorage.getItem('my_local_reservations');
        const list = stored ? JSON.parse(stored) : [];
        list.unshift({
          id: res.data.id,
          reservationNumber: res.data.reservationNumber,
          trackingCode: res.data.trackingCode,
          status: res.data.status,
          reservedAt: res.data.reservedAt,
          expiresAt: res.data.expiresAt,
          studentName: res.data.studentName,
          parentName: res.data.parentName,
          grade: res.data.grade,
          subject: res.data.session.subject,
          teacherName: res.data.session.teacherName,
          time: res.data.session.time,
          dayOfWeek: res.data.session.dayOfWeek,
        });
        localStorage.setItem('my_local_reservations', JSON.stringify(list));
      } catch (_err) {
        // ignore
      }
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6" data-testid="public-reservation-form">
      {/* Top Branding Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          {settings.centerLogo ? (
            <img src={settings.centerLogo} alt={settings.centerName} className="h-4 w-4 object-contain" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          <span>{(isAr ? settings.centerNameAr : settings.centerNameEn) || settings.centerName} — {isAr ? 'الحجز الفوري' : 'Instant Booking'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {isAr ? 'بوابة حجز المقاعد والدروس' : 'Classroom Seat Reservation Portal'}
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          {isAr
            ? 'اختر المادة والحصة وأدخل بياناتك لاستخراج تذكرتك الرقمية مباشرة بدون حساب.'
            : 'Select subject and session to generate your instant digital pass without account.'}
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-center gap-3">
        <Button variant={step < 5 ? 'default' : 'outline'} size="sm" onClick={() => setStep(1)}>
          <BookOpen className="h-4 w-4 me-2" />
          {isAr ? 'حجز جديد' : 'New Reservation'}
        </Button>
        <Link href="/reserve/my">
          <Button variant="outline" size="sm" data-testid="goto-my-reservations-link">
            <Search className="h-4 w-4 me-2" />
            {isAr ? 'استعلام وتتبع حجوزاتي' : 'Look Up My Reservations'}
          </Button>
        </Link>
      </div>

      {/* 4-Step Progress Indicator */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div className={`p-2 rounded-lg border transition-all ${step === 1 ? 'bg-primary text-primary-foreground font-bold' : 'bg-muted/40'}`}>
          1. {isAr ? 'المادة' : 'Subject'}
        </div>
        <div className={`p-2 rounded-lg border transition-all ${step === 2 ? 'bg-primary text-primary-foreground font-bold' : 'bg-muted/40'}`}>
          2. {isAr ? 'الحصة' : 'Session'}
        </div>
        <div className={`p-2 rounded-lg border transition-all ${step === 3 ? 'bg-primary text-primary-foreground font-bold' : 'bg-muted/40'}`}>
          3. {isAr ? 'البيانات' : 'Details'}
        </div>
        <div className={`p-2 rounded-lg border transition-all ${step === 4 ? 'bg-primary text-primary-foreground font-bold' : 'bg-muted/40'}`}>
          4. {isAr ? 'المراجعة' : 'Review'}
        </div>
      </div>

      {/* Wizard Container Card */}
      <Card className="border-border shadow-md">
        <CardHeader className="border-b bg-muted/30 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {step === 1 && (isAr ? 'الخطوة الأولى: اختيار المرحلة والمادة' : 'Step 1: Choose Grade & Subject')}
              {step === 2 && (isAr ? 'الخطوة الثانية: اختيار الحصة والوقت' : 'Step 2: Choose Session & Time')}
              {step === 3 && (isAr ? 'الخطوة الثالثة: إدخال بيانات الطالب والولي' : 'Step 3: Student Information')}
              {step === 4 && (isAr ? 'الخطوة الرابعة: مراجعة وتأكيد الحجز' : 'Step 4: Review & Confirm Reservation')}
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {step} / 4
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {errorMessage && (
            <Alert variant="destructive" data-testid="reservation-error-alert">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{isAr ? 'تنبيه' : 'Error'}</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {warningMessage && (
            <Alert className="border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200" data-testid="duplicate-warning">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle>{isAr ? 'ملاحظة' : 'Notice'}</AlertTitle>
              <AlertDescription>{warningMessage}</AlertDescription>
            </Alert>
          )}

          {/* STEP 1: CHOOSE SUBJECT & GRADE */}
          {step === 1 && (
            <div className="space-y-6" data-testid="wizard-step-1">
              {/* Grade Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">{isAr ? 'الصف الدراسي' : 'Grade Level'}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.entries(GRADE_MAP).map(([key, label]) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setGrade(key)}
                      className={`p-3 rounded-lg border text-start transition-all ${
                        grade === key ? 'border-primary bg-primary/5 ring-2 ring-primary/20 font-semibold' : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="text-xs">{isAr ? label.ar : label.en}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Filter Pill Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">{isAr ? 'تصفية حسب المادة' : 'Filter by Subject'}</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={selectedSubject === 'ALL' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSubject('ALL')}
                  >
                    {isAr ? 'جميع المواد' : 'All Subjects'}
                  </Button>
                  {subjectsList.map((subj) => (
                    <Button
                      key={subj}
                      type="button"
                      variant={selectedSubject === subj ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedSubject(subj)}
                    >
                      {subj}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Button type="button" onClick={() => setStep(2)} data-testid="public-step1-next">
                  <span>{isAr ? 'التالي: اختيار الحصة' : 'Next: Choose Session'}</span>
                  <ArrowRight className="h-4 w-4 ms-2 rotate-180 dir-ltr:rotate-0" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: CHOOSE SESSION */}
          {step === 2 && (
            <div className="space-y-6" data-testid="wizard-step-2">
              <div className="space-y-3">
                <Label className="text-xs font-semibold">{isAr ? 'الحصص والجلسات المتاحة' : 'Available Sessions'}</Label>

                {loadingSessions ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">{isAr ? 'جاري تحميل الحصص...' : 'Loading sessions...'}</div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8 border rounded-lg bg-muted/20 text-xs text-muted-foreground">
                    {isAr ? 'لا توجد حصص متاحة لهذا الاختيار.' : 'No sessions available.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sessions.map((sess) => {
                      const isSelected = selectedSessionId === sess.id;
                      const cap = sess.capacity || 30;
                      const resSeats = sess.reservedSeats || 0;
                      const avail = Math.max(0, cap - resSeats);
                      const isFull = avail <= 0 || sess.status === 'CLOSED';

                      return (
                        <div
                          key={sess.id}
                          onClick={() => !isFull && setSelectedSessionId(sess.id)}
                          className={`p-4 rounded-xl border text-start cursor-pointer transition-all ${
                            isFull
                              ? 'opacity-60 bg-muted/40 border-border cursor-not-allowed'
                              : isSelected
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                              : 'border-border hover:border-primary/50'
                          }`}
                          data-testid={`public-session-card-${sess.id}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-semibold text-sm">{sess.subject || 'General'}</div>
                              <div className="text-xs text-muted-foreground">{sess.teacherName || 'Teacher'}</div>
                            </div>
                            <Badge variant={isFull ? 'destructive' : isSelected ? 'default' : 'secondary'} className="text-[10px]">
                              {isFull ? (isAr ? 'مكتمل' : 'Full') : `${avail} ${isAr ? 'مقعد' : 'seats'}`}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-primary" />
                              <span>{isAr ? DAYS_MAP[sess.dayOfWeek]?.ar : DAYS_MAP[sess.dayOfWeek]?.en}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-primary" />
                              <span>{sess.time}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-primary" />
                              <span>{sess.room || 'Room 1'}</span>
                            </div>
                            <div className="flex items-center gap-1 font-semibold text-foreground">
                              <Tag className="h-3.5 w-3.5 text-primary" />
                              <span>{sess.price || 0} ج.م</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t flex justify-between">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  {isAr ? 'السابق' : 'Back'}
                </Button>
                <Button type="button" disabled={!selectedSessionId} onClick={() => setStep(3)} data-testid="public-step2-next">
                  <span>{isAr ? 'التالي: بيانات الطالب' : 'Next: Student Details'}</span>
                  <ArrowRight className="h-4 w-4 ms-2 rotate-180 dir-ltr:rotate-0" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: STUDENT INFORMATION */}
          {step === 3 && (
            <div className="space-y-4" data-testid="wizard-step-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="studentName" className="text-xs font-medium">{isAr ? 'اسم الطالب بالكامل *' : 'Student Full Name *'}</Label>
                  <Input
                    id="studentName"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder={isAr ? 'اسم الطالب رباعي' : 'Student Full Name'}
                    data-testid="public-input-student-name"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="parentPhone" className="text-xs font-medium">{isAr ? 'رقم هاتف ولي الأمر (مطلوب) *' : 'Parent Phone *'}</Label>
                  <Input
                    id="parentPhone"
                    type="tel"
                    required
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="01012345678"
                    className="dir-ltr"
                    data-testid="public-input-parent-phone"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="studentPhone" className="text-xs font-medium">{isAr ? 'رقم هاتف الطالب (اختياري)' : 'Student Phone (Optional)'}</Label>
                  <Input
                    id="studentPhone"
                    type="tel"
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                    placeholder="01112345678"
                    className="dir-ltr"
                    data-testid="public-input-student-phone"
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-between">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  {isAr ? 'السابق' : 'Back'}
                </Button>
                <Button
                  type="button"
                  disabled={!studentName.trim() || !parentPhone.trim()}
                  onClick={() => handleStep3Next()}
                  data-testid="public-step3-next"
                >
                  <span>{isAr ? 'التالي: مراجعة الحجز' : 'Next: Review Reservation'}</span>
                  <ArrowRight className="h-4 w-4 ms-2 rotate-180 dir-ltr:rotate-0" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW RESERVATION SCREEN */}
          {step === 4 && (
            <div className="space-y-5" data-testid="wizard-step-4">
              <div className="p-4 rounded-xl bg-muted/40 border space-y-3 text-xs sm:text-sm">
                <div className="font-semibold text-base border-b pb-2 text-primary">
                  {isAr ? 'معاينة ومراجعة بيانات الحجز' : 'Reservation Review Summary'}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground">{isAr ? 'طالب الحجز:' : 'Student:'}</span>{' '}
                    <span className="font-semibold">{studentName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{isAr ? 'هاتف ولي الأمر:' : 'Parent Phone:'}</span>{' '}
                    <span className="font-mono dir-ltr inline-block">{parentPhone}</span>
                  </div>
                  {studentPhone && (
                    <div>
                      <span className="text-muted-foreground">{isAr ? 'هاتف الطالب:' : 'Student Phone:'}</span>{' '}
                      <span className="font-mono dir-ltr inline-block">{studentPhone}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">{isAr ? 'الصف الدراسي:' : 'Grade:'}</span>{' '}
                    <span className="font-medium">{isAr ? GRADE_MAP[grade]?.ar : GRADE_MAP[grade]?.en}</span>
                  </div>
                  {selectedSession && (
                    <>
                      <div>
                        <span className="text-muted-foreground">{isAr ? 'المادة:' : 'Subject:'}</span>{' '}
                        <span className="font-semibold">{selectedSession.subject}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{isAr ? 'المعلم:' : 'Teacher:'}</span>{' '}
                        <span className="font-medium">{selectedSession.teacherName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{isAr ? 'الموعد:' : 'Schedule:'}</span>{' '}
                        <span>
                          {isAr ? DAYS_MAP[selectedSession.dayOfWeek]?.ar : DAYS_MAP[selectedSession.dayOfWeek]?.en} • {selectedSession.time}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{isAr ? 'السعر والقاعة:' : 'Price & Room:'}</span>{' '}
                        <span className="font-semibold">{selectedSession.price} ج.م • {selectedSession.room}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t flex justify-between">
                <Button type="button" variant="outline" onClick={() => setStep(3)}>
                  {isAr ? 'تعديل البيانات' : 'Edit Details'}
                </Button>
                <Button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmit()}
                  className="min-w-[180px]"
                  data-testid="public-submit-reservation-btn"
                >
                  {submitting ? (
                    <span>{isAr ? 'جاري إتمام الحجز...' : 'Processing...'}</span>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 me-2" />
                      <span>{isAr ? 'تأكيد واستخراج التذكرة' : 'Confirm & Issue Ticket'}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Case 1 Duplicate Popup Modal */}
      {duplicateStudentData && (
        <Dialog open={duplicateModalOpen} onOpenChange={setDuplicateModalOpen}>
          <DialogContent className="max-w-md p-6 space-y-4" data-testid="duplicate-popup-modal">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <span>{isAr ? 'الطالب مسجل مسبقاً' : 'Student Already Exists'}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isAr
                  ? 'هذا الطالب مسجل بالفعل بنفس رقم هاتف ولي الأمر في النظام.'
                  : 'This student already exists with the same parent phone number.'}
              </DialogDescription>
            </DialogHeader>

            <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs space-y-2">
              <div>
                <span className="text-muted-foreground">{isAr ? 'اسم الطالب:' : 'Student Name:'}</span>{' '}
                <span className="font-semibold">{duplicateStudentData.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{isAr ? 'هاتف ولي الأمر:' : 'Parent Phone:'}</span>{' '}
                <span className="font-mono dir-ltr inline-block">{duplicateStudentData.parentPhone}</span>
              </div>
              {duplicateStudentData.reservationNumber && (
                <div>
                  <span className="text-muted-foreground">{isAr ? 'رقم الحجز السابق:' : 'Active Reservation:'}</span>{' '}
                  <span className="font-mono font-bold text-primary">{duplicateStudentData.reservationNumber}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t flex items-center justify-between gap-3">
              <Button variant="outline" size="sm" onClick={() => setDuplicateModalOpen(false)}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Link href="/reserve/my">
                <Button size="sm" data-testid="duplicate-popup-goto-my">
                  {isAr ? 'الانتقال إلى حجوزاتي' : 'Go To My Reservations'}
                </Button>
              </Link>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Ticket Modal */}
      {createdReservation && (
        <ReservationCardDigitalTicket
          open={showTicketModal}
          onClose={() => setShowTicketModal(false)}
          reservationNumber={createdReservation.reservationNumber}
          trackingCode={createdReservation.trackingCode}
          studentName={createdReservation.studentName}
          parentName={createdReservation.parentName}
          grade={createdReservation.grade}
          subject={createdReservation.session.subject}
          teacherName={createdReservation.session.teacherName}
          time={createdReservation.session.time}
          dayOfWeek={createdReservation.session.dayOfWeek}
          qrToken={createdReservation.qrToken}
          status={createdReservation.status}
          locale={locale}
        />
      )}
    </div>
  );
}
