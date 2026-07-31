'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Loader2 } from 'lucide-react';
import { copyPreviousMonthSubscriptions } from '@/actions/payments/payments';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { useDictionary } from '@/components/shared/dictionary-provider';

export function CopyPreviousMonthButton({ dict: propsDict }: { dict?: any }) {
  const contextDict = useDictionary();
  const dict = propsDict || contextDict;
  const isArabic = dict?.general?.save === 'حفظ' || dict?.paymentsPage?.currency === 'ج.م';
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCopy = async () => {
    setLoading(true);
    const res = await copyPreviousMonthSubscriptions(7, 2026, 8, 2026);
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else if (res.success && res.data) {
      toast.success(isArabic ? 'تم نسخ الاشتراكات بنجاح' : 'Subscriptions Copied Successfully', {
        description: (
          <div className="whitespace-pre-line text-xs font-mono mt-1">
            {res.data.message}
          </div>
        ),
      });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-muted/40 hover:bg-muted" data-testid="copy-previous-month-button">
          <Copy className="w-4 h-4" />
          {dict?.paymentsPage?.copyPreviousMonth || (isArabic ? 'نسخ اشتراكات يوليو' : 'Copy July Subscriptions')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {dict?.paymentsPage?.copyPreviousMonth || (isArabic ? 'نسخ اشتراكات شهر يوليو (7/2026 ← 8/2026)' : 'Copy July Subscriptions (7/2026 → 8/2026)')}
          </DialogTitle>
          <DialogDescription>
            {dict?.paymentsPage?.copyPreviousMonthDesc || (isArabic
              ? 'نسخ جميع سجلات الاشتراك من شهر يوليو إلى شهر أغسطس مع منع تكرار السجلات للطلاب.'
              : 'Copy all subscription records from July 2026 to August 2026 using the Payment table as the source of truth.')}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2 my-2 border border-border/50">
          <p className="flex justify-between">
            <span className="text-muted-foreground">{isArabic ? 'الشهر المصدر:' : 'Source Month:'}</span>
            <span className="font-semibold">{isArabic ? 'يوليو (7 / 2026)' : 'July (7 / 2026)'}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-muted-foreground">{isArabic ? 'الشهر الوجهة:' : 'Destination Month:'}</span>
            <span className="font-semibold">{isArabic ? 'أغسطس (8 / 2026)' : 'August (8 / 2026)'}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-muted-foreground">{isArabic ? 'الحالة الأولية:' : 'Initial Status:'}</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">{isArabic ? 'غير مدفوع (0 مدفوع)' : 'UNPAID (0 Paid)'}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-muted-foreground">{isArabic ? 'حماية التكرار:' : 'Duplicate Protection:'}</span>
            <span className="font-semibold text-green-600 dark:text-green-400">{isArabic ? 'تخطي الموجود' : 'Skip Existing'}</span>
          </p>
        </div>

        <Button onClick={handleCopy} disabled={loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 rtl:ml-2 ltr:mr-2 animate-spin" /> : null}
          {loading ? (dict?.loadingStates?.processing || (isArabic ? 'جاري المعالجة...' : 'Processing...')) : (isArabic ? 'تأكيد نسخ الاشتراكات' : 'Confirm Copy Subscriptions')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
