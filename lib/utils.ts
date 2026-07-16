import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(time: string, format: string = '12h') {
  if (!time) return '';
  const [hoursStr, minutesStr] = time.split(':');
  if (!hoursStr || !minutesStr) return time;

  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  
  if (format === '24h') {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } else {
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }
}
