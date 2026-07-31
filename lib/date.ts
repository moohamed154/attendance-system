import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

// Set default timezone to Cairo (Africa/Cairo)
dayjs.tz.setDefault('Africa/Cairo');

export { dayjs };

/**
 * Format any date into Cairo Timezone (Africa/Cairo)
 */
export function formatCairo(date?: Date | string | number | null, formatStr: string = 'YYYY-MM-DD HH:mm'): string {
  if (!date) return '-';
  return dayjs(date).tz('Africa/Cairo').format(formatStr);
}

/**
 * Get current date in Cairo timezone
 */
export function getCairoNow(): dayjs.Dayjs {
  return dayjs().tz('Africa/Cairo');
}
