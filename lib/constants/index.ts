export const ROLES = {
  ADMIN: 'ADMIN',
  ASSISTANT: 'ASSISTANT',
} as const;

export const STATUSES = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
  INACTIVE: 'INACTIVE',
} as const;

export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  EXCUSED: 'EXCUSED',
} as const;

export const PAYMENT_STATUS = {
  PAID: 'PAID',
  UNPAID: 'UNPAID',
  PARTIAL: 'PARTIAL',
} as const;

export const VALIDATION_MESSAGES = {
  REQUIRED: 'هذا الحقل مطلوب',
  INVALID_PHONE: 'رقم هاتف غير صالح',
  INVALID_EMAIL: 'بريد إلكتروني غير صالح',
} as const;

export const LIMITS = {
  PAGINATION_DEFAULT: 50,
  MAX_FILE_SIZE: 5 * 1024 * 1024,
} as const;
