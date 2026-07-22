'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Copy,
  Archive,
  Lock,
  Unlock,
  BarChart3,
  MapPin,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import {
  createReservationSession,
  updateReservationSession,
  toggleSessionReservationStatus,
  duplicateReservationSession,
  deleteReservationSession,
  getSessionDetailedStats,
} from '@/actions/reservations/reservations';

interface SessionItem {
  id: string;
  subject?: string | null;
  teacherName?: string | null;
  grade: string;
  dayOfWeek: number;
  time: string;
  capacity?: number | null;
  reservedSeats?: number | null;
  confirmedSeats?: number | null;
  price?: number | null;
  room?: string | null;
  description?: string | null;
  status?: string | null;
  isArchived?: boolean;
}

const DAYS_MAP: Record<number, string> = {
  0: 'Sunday / الأحد',
  1: 'Monday / الإثنين',
  2: 'Tuesday / الثلاثاء',
  3: 'Wednesday / الأربعاء',
  4: 'Thursday / الخميس',
  5: 'Friday / الجمعة',
  6: 'Saturday / السبت',
};

export function AdminSessionsManagement({ initialSessions = [] }: { initialSessions: SessionItem[] }) {
  const [sessions, setSessions] = useState<SessionItem[]>(initialSessions);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingSession, setEditingSession] = useState<SessionItem | null>(null);
  const [detailStats, setDetailStats] = useState<any | null>(null);

  // Form State
  const [formSubject, setFormSubject] = useState<string>('');
  const [formTeacher, setFormTeacher] = useState<string>('');
  const [formGrade, setFormGrade] = useState<string>('grade1');
  const [formDay, setFormDay] = useState<number>(0);
  const [formTime, setFormTime] = useState<string>('16:00');
  const [formCapacity, setFormCapacity] = useState<number>(30);
  const [formPrice, setFormPrice] = useState<number>(100);
  const [formRoom, setFormRoom] = useState<string>('Room 1');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formStatus, setFormStatus] = useState<string>('OPEN');

  const [saving, setSaving] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  function resetForm() {
    setFormSubject('');
    setFormTeacher('');
    setFormGrade('grade1');
    setFormDay(0);
    setFormTime('16:00');
    setFormCapacity(30);
    setFormPrice(100);
    setFormRoom('Room 1');
    setFormDescription('');
    setFormStatus('OPEN');
    setEditingSession(null);
    setActionError(null);
  }

  function handleOpenEdit(session: SessionItem) {
    setEditingSession(session);
    setFormSubject(session.subject || '');
    setFormTeacher(session.teacherName || '');
    setFormGrade(session.grade);
    setFormDay(session.dayOfWeek);
    setFormTime(session.time);
    setFormCapacity(session.capacity || 30);
    setFormPrice(session.price || 0);
    setFormRoom(session.room || 'Room 1');
    setFormDescription(session.description || '');
    setFormStatus(session.status || 'OPEN');
    setShowAddModal(true);
  }

  async function handleSaveSession(e: React.FormEvent) {
    e.preventDefault();
    setActionError(null);
    setSaving(true);

    if (editingSession) {
      const res = await updateReservationSession(editingSession.id, {
        subject: formSubject,
        teacherName: formTeacher,
        grade: formGrade,
        dayOfWeek: formDay,
        time: formTime,
        capacity: formCapacity,
        price: formPrice,
        room: formRoom,
        description: formDescription,
        status: formStatus,
      });

      setSaving(false);
      if (!res.success || !res.session) {
        setActionError(res.error || 'Failed to update session');
        return;
      }

      setSessions((prev) => prev.map((s) => (s.id === res.session!.id ? (res.session as SessionItem) : s)));
    } else {
      const res = await createReservationSession({
        subject: formSubject,
        teacherName: formTeacher,
        grade: formGrade,
        dayOfWeek: formDay,
        time: formTime,
        capacity: formCapacity,
        price: formPrice,
        room: formRoom,
        description: formDescription,
        status: formStatus,
      });

      setSaving(false);
      if (!res.success || !res.session) {
        setActionError(res.error || 'Failed to create session');
        return;
      }

      setSessions((prev) => [res.session as SessionItem, ...prev]);
    }

    setShowAddModal(false);
    resetForm();
  }

  async function handleToggleStatus(session: SessionItem, newStatus: 'OPEN' | 'CLOSED' | 'HIDDEN') {
    const res = await toggleSessionReservationStatus(session.id, newStatus);
    if (res.success && res.session) {
      setSessions((prev) => prev.map((s) => (s.id === res.session!.id ? (res.session as SessionItem) : s)));
    }
  }

  async function handleDuplicate(session: SessionItem) {
    const res = await duplicateReservationSession(session.id);
    if (res.success && res.session) {
      setSessions((prev) => [res.session as SessionItem, ...prev]);
    }
  }

  async function handleArchive(session: SessionItem) {
    if (!confirm('Are you sure you want to archive this session?')) return;
    const res = await deleteReservationSession(session.id);
    if (res.success) {
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
    }
  }

  async function handleViewStats(session: SessionItem) {
    const res = await getSessionDetailedStats(session.id);
    if (res.success && res.data) {
      setDetailStats(res.data);
    }
  }

  return (
    <div className="space-y-6" data-testid="admin-sessions-management">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">إدارة حصص الحجز — Reservation Sessions</h2>
          <p className="text-xs text-muted-foreground">
            إضافة وتعديل وإغلاق حصص الحجز ومتابعة نسب الإشغال والإيرادات
          </p>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          data-testid="admin-add-session-btn"
        >
          <Plus className="h-4 w-4 me-2" />
          <span>إضافة حصة جديدة</span>
        </Button>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((sess) => {
          const cap = sess.capacity || 30;
          const resSeats = sess.reservedSeats || 0;
          const confSeats = sess.confirmedSeats || 0;
          const price = sess.price || 0;

          const occupancy = Math.min(100, Math.round(((resSeats + confSeats) / cap) * 100));

          return (
            <Card key={sess.id} className="border-border shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">{sess.subject || 'General'}</CardTitle>
                  <CardDescription className="text-xs">{sess.teacherName || 'Teacher'} • {sess.grade}</CardDescription>
                </div>

                <Badge
                  variant={
                    sess.status === 'OPEN'
                      ? 'default'
                      : sess.status === 'CLOSED'
                      ? 'secondary'
                      : 'outline'
                  }
                  className="text-[10px]"
                >
                  {sess.status || 'OPEN'}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-muted/30 text-center text-xs">
                  <div>
                    <div className="text-muted-foreground text-[10px]">السعة</div>
                    <div className="font-semibold">{cap}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[10px]">المحجوز</div>
                    <div className="font-semibold text-amber-600">{resSeats}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[10px]">المؤكد</div>
                    <div className="font-semibold text-emerald-600">{confSeats}</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>نسبة الإشغال</span>
                    <span className="font-semibold text-foreground">{occupancy}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${occupancy}%` }}
                    />
                  </div>
                </div>

                {/* Info row */}
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span>{DAYS_MAP[sess.dayOfWeek]?.split('/')[0]}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span>{sess.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>{sess.room || 'Room 1'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <Tag className="h-3.5 w-3.5 text-primary" />
                    <span>{price} ج.م</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEdit(sess)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDuplicate(sess)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleArchive(sess)}>
                      <Archive className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-1">
                    {sess.status === 'OPEN' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 text-amber-600"
                        onClick={() => handleToggleStatus(sess, 'CLOSED')}
                      >
                        <Lock className="h-3 w-3 me-1" />
                        <span>إغلاق</span>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 text-emerald-600"
                        onClick={() => handleToggleStatus(sess, 'OPEN')}
                      >
                        <Unlock className="h-3 w-3 me-1" />
                        <span>فتح</span>
                      </Button>
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => handleViewStats(sess)}
                    >
                      <BarChart3 className="h-3 w-3 me-1" />
                      <span>التفاصيل</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add / Edit Session Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md p-6 space-y-4" data-testid="admin-session-form-modal">
          <DialogHeader>
            <DialogTitle>{editingSession ? 'تعديل بيانات الحصة' : 'إضافة حصة حجز جديدة'}</DialogTitle>
          </DialogHeader>

          {actionError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>خطأ</AlertTitle>
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSaveSession} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">اسم المادة / الكورس *</Label>
              <Input
                required
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                placeholder="مثال: فيزياء — الثانوية العامة"
                data-testid="input-session-subject"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">المعلم</Label>
                <Input
                  value={formTeacher}
                  onChange={(e) => setFormTeacher(e.target.value)}
                  placeholder="اسم المعلم"
                  data-testid="input-session-teacher"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">الصف الدراسي</Label>
                <select
                  value={formGrade}
                  onChange={(e) => setFormGrade(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  data-testid="select-session-grade"
                >
                  <option value="grade1">1 ثانوي</option>
                  <option value="grade2">2 ثانوي</option>
                  <option value="grade3">3 ثانوي</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">اليوم</Label>
                <select
                  value={formDay}
                  onChange={(e) => setFormDay(Number(e.target.value))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  data-testid="select-session-day"
                >
                  {Object.entries(DAYS_MAP).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">الوقت</Label>
                <Input
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  placeholder="مثال: 16:00"
                  data-testid="input-session-time"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">السعة الكلية</Label>
                <Input
                  type="number"
                  value={formCapacity}
                  onChange={(e) => setFormCapacity(Number(e.target.value))}
                  data-testid="input-session-capacity"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">السعر (ج.م)</Label>
                <Input
                  type="number"
                  value={formPrice}
                  onChange={(e) => setFormPrice(Number(e.target.value))}
                  data-testid="input-session-price"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">القاعة</Label>
                <Input
                  value={formRoom}
                  onChange={(e) => setFormRoom(e.target.value)}
                  data-testid="input-session-room"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">حالة الحجز</Label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                data-testid="select-session-status"
              >
                <option value="OPEN">مفتوح للحجز (OPEN)</option>
                <option value="CLOSED">مغلق مؤقتاً (CLOSED)</option>
                <option value="HIDDEN">مخفي عن الطلاب (HIDDEN)</option>
              </select>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={saving} data-testid="save-session-btn">
                {saving ? 'جاري الحفظ...' : 'حفظ البيانات'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Session Detail Drawer / Modal */}
      {detailStats && (
        <Dialog open={!!detailStats} onOpenChange={() => setDetailStats(null)}>
          <DialogContent className="max-w-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg flex items-center justify-between">
                <span>{detailStats.session.subject} — إحصائيات الجلسة</span>
                <Badge variant="outline">{detailStats.session.grade}</Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 rounded-lg bg-muted/40 border">
                <div className="text-muted-foreground">السعة الكلية</div>
                <div className="text-lg font-bold">{detailStats.stats.capacity}</div>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <div className="text-amber-800 dark:text-amber-300">المحجوز معلق</div>
                <div className="text-lg font-bold text-amber-600">{detailStats.stats.pending}</div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <div className="text-emerald-800 dark:text-emerald-300">المؤكد مدفوع</div>
                <div className="text-lg font-bold text-emerald-600">{detailStats.stats.confirmed}</div>
              </div>
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                <div className="text-primary">الإيراد المحصل</div>
                <div className="text-lg font-bold text-primary">{detailStats.stats.confirmedRevenue} ج.م</div>
              </div>
            </div>

            {/* Student Reservations Table inside Drawer */}
            <div className="space-y-2 pt-3 border-t">
              <div className="text-sm font-semibold">قائمة الطلاب المسجلين ({detailStats.session.reservations.length})</div>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="p-2 text-start">رقم الحجز</th>
                      <th className="p-2 text-start">الطالب</th>
                      <th className="p-2 text-start">هاتف ولي الأمر</th>
                      <th className="p-2 text-start">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {detailStats.session.reservations.map((r: any) => (
                      <tr key={r.id}>
                        <td className="p-2 font-mono font-semibold">{r.reservationNumber}</td>
                        <td className="p-2">{r.student.name}</td>
                        <td className="p-2 font-mono">{r.student.parentPhone}</td>
                        <td className="p-2">
                          <Badge variant={r.status === 'CONFIRMED' ? 'default' : 'secondary'} className="text-[10px]">
                            {r.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
