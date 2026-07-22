'use client';

import React, { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { confirmPayment, cancelReservation } from '@/actions/reservations/reservations';
import { ReservationCardDigitalTicket } from './ReservationCardDigitalTicket';
import { ReservationTimeline } from './ReservationTimeline';
import { AdminQRScannerModal } from './AdminQRScannerModal';
import { Search, CheckCircle2, XCircle, Filter, Ticket, Phone, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AdminReservationItem {
  id: string;
  reservationNumber: string;
  status: string;
  reservedAt: Date | string;
  expiresAt: Date | string;
  confirmedAt?: Date | string | null;
  confirmedBy?: string | null;
  qrToken?: string | null;
  student: {
    id: string;
    studentId: string;
    name: string;
    grade?: string | null;
    studentPhone?: string | null;
    parentPhone?: string | null;
  };
  session: {
    id: string;
    subject?: string | null;
    teacherName?: string | null;
    grade: string;
    dayOfWeek: number;
    time: string;
    price?: number | null;
    room?: string | null;
  };
  history?: any[];
}

export function AdminReservationsTable({
  initialData = [],
  totalCount: _totalCount = 0,
  userRole = 'ADMIN',
  locale = 'en',
}: {
  initialData: AdminReservationItem[];
  totalCount: number;
  userRole?: string;
  locale?: string;
}) {
  const [reservations, setReservations] = useState<AdminReservationItem[]>(initialData);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedTimelineItem, setSelectedTimelineItem] = useState<AdminReservationItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const isAdmin = userRole === 'ADMIN';

  const handleConfirm = (id: string) => {
    startTransition(async () => {
      const res = await confirmPayment(id, 'Confirmed by Admin in Dashboard');
      if ('success' in res && res.success) {
        setReservations((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: 'CONFIRMED' } : item))
        );
      }
    });
  };

  const handleCancel = (id: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    startTransition(async () => {
      const res = await cancelReservation(id, 'Cancelled by Admin');
      if ('success' in res && res.success) {
        setReservations((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: 'CANCELLED' } : item))
        );
      }
    });
  };

  const filteredData = reservations.filter((item) => {
    if (activeTab !== 'ALL' && item.status !== activeTab) return false;
    if (selectedGrade !== 'all' && item.session.grade !== selectedGrade) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNum = item.reservationNumber.toLowerCase().includes(q);
      const matchStudent =
        item.student.name.toLowerCase().includes(q) ||
        item.student.studentId.toLowerCase().includes(q) ||
        (item.student.parentPhone || '').includes(q);
      const matchSubject = (item.session.subject || '').toLowerCase().includes(q);
      if (!matchNum && !matchStudent && !matchSubject) return false;
    }
    return true;
  });

  const statusBadgeColors = {
    PENDING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    CONFIRMED: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30',
    CANCELLED: 'bg-muted text-muted-foreground border-border',
    EXPIRED: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
    COMPLETED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
  };

  return (
    <div className="space-y-6" data-testid="admin-reservations-page">
      {/* Top Header & Scanner Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" data-testid="dashboard-title">
            <Ticket className="w-6 h-6 text-primary" /> Reservations Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage student session reservations, offline payment confirmations, and digital tickets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AdminQRScannerModal locale={locale} />
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="space-y-4">
        <Tabs defaultValue="ALL" onValueChange={setActiveTab} data-testid="reservation-filter">
          <TabsList className="grid grid-cols-6 w-full max-w-2xl rounded-xl">
            <TabsTrigger value="ALL" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="PENDING" className="text-xs">Pending</TabsTrigger>
            <TabsTrigger value="CONFIRMED" className="text-xs">Confirmed</TabsTrigger>
            <TabsTrigger value="CANCELLED" className="text-xs">Cancelled</TabsTrigger>
            <TabsTrigger value="EXPIRED" className="text-xs">Expired</TabsTrigger>
            <TabsTrigger value="COMPLETED" className="text-xs">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by student name, parent phone, reservation number, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl text-xs"
              data-testid="reservation-search"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="h-9 text-xs rounded-xl border border-input bg-background px-3"
            >
              <option value="all">All Grades</option>
              <option value="Grade 1">Grade 1</option>
              <option value="Grade 2">Grade 2</option>
              <option value="Grade 3">Grade 3</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline Modal */}
      <Dialog open={!!selectedTimelineItem} onOpenChange={() => setSelectedTimelineItem(null)}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Status History Timeline
            </DialogTitle>
          </DialogHeader>
          {selectedTimelineItem && (
            <div className="space-y-3">
              <div className="text-xs font-mono font-bold text-primary">
                {selectedTimelineItem.reservationNumber} - {selectedTimelineItem.student.name}
              </div>
              <ReservationTimeline history={selectedTimelineItem.history || []} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Main Table */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
        <Table data-testid="reservation-table">
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="text-xs">Reservation #</TableHead>
              <TableHead className="text-xs">Student & Parent Phone</TableHead>
              <TableHead className="text-xs">Subject & Teacher</TableHead>
              <TableHead className="text-xs">Session</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Reserved Date</TableHead>
              <TableHead className="text-xs text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                  No reservations found.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/20">
                  <TableCell className="font-mono text-xs font-bold text-foreground" data-testid="reservation-number">
                    {item.reservationNumber}
                  </TableCell>

                  <TableCell className="text-xs">
                    <div className="font-semibold text-foreground">{item.student.name}</div>
                    <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                      <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                      {item.student.parentPhone || item.student.studentPhone || item.student.studentId}
                    </div>
                  </TableCell>

                  <TableCell className="text-xs">
                    <div className="font-medium text-foreground">{item.session.subject || 'General Session'}</div>
                    <div className="text-[11px] text-muted-foreground">{item.session.teacherName || 'Instructor'}</div>
                  </TableCell>

                  <TableCell className="text-xs font-medium">
                    {item.session.grade} • {item.session.time}
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("text-[11px] uppercase font-semibold px-2 py-0.5 rounded-full border", statusBadgeColors[item.status as keyof typeof statusBadgeColors])}
                      data-testid="reservation-status"
                    >
                      {item.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(item.reservedAt).toLocaleDateString()}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs rounded-xl gap-1 text-muted-foreground"
                        onClick={() => setSelectedTimelineItem(item)}
                      >
                        <Clock className="w-3.5 h-3.5" /> Timeline
                      </Button>

                      <ReservationCardDigitalTicket
                        reservation={item}
                        studentName={item.student.name}
                        locale={locale}
                        triggerLabel="Ticket"
                      />

                      {item.status === 'PENDING' && isAdmin && (
                        <Button
                          size="sm"
                          className="h-8 text-xs rounded-xl bg-green-600 hover:bg-green-700 text-white gap-1"
                          onClick={() => handleConfirm(item.id)}
                          disabled={isPending}
                          data-testid="confirm-payment-button"
                        >
                          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          Confirm Payment
                        </Button>
                      )}

                      {(item.status === 'PENDING' || (item.status === 'CONFIRMED' && isAdmin)) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-destructive hover:bg-destructive/10 rounded-xl gap-1"
                          onClick={() => handleCancel(item.id)}
                          disabled={isPending}
                          data-testid="cancel-reservation-button"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
