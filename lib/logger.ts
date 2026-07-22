export interface LogContext {
  requestId?: string;
  correlationId?: string;
  userId?: string;
  studentId?: string;
  reservationNumber?: string;
  sessionId?: string;
  route?: string;
  action?: string;
  duration?: number;
  status?: string;
  errorStack?: string;
  schedulerEvents?: string;
  qrEvents?: string;
  [key: string]: any;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function normalizeContext(arg1?: any, arg2?: any): Record<string, any> {
  let ctx: Record<string, any> = {};
  if (arg1) {
    if (typeof arg1 === 'string') {
      ctx.detail = arg1;
    } else if (arg1 instanceof Error) {
      ctx.error = arg1.message;
      ctx.stack = arg1.stack;
    } else if (typeof arg1 === 'object') {
      ctx = { ...arg1 };
    }
  }
  if (arg2) {
    if (typeof arg2 === 'object') {
      ctx = { ...ctx, ...arg2 };
    } else {
      ctx.extra = arg2;
    }
  }
  return ctx;
}

function formatLog(level: LogLevel, message: string, arg1?: any, arg2?: any) {
  const timestamp = new Date().toISOString();
  const context = normalizeContext(arg1, arg2);
  return JSON.stringify({
    timestamp,
    level,
    message,
    ...context,
  });
}

export const logger = {
  info(message: string, arg1?: any, arg2?: any) {
    console.log(formatLog('info', message, arg1, arg2));
  },
  warn(message: string, arg1?: any, arg2?: any) {
    console.warn(formatLog('warn', message, arg1, arg2));
  },
  error(message: string, arg1?: any, arg2?: any) {
    console.error(formatLog('error', message, arg1, arg2));
  },
  debug(message: string, arg1?: any, arg2?: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatLog('debug', message, arg1, arg2));
    }
  },
};
