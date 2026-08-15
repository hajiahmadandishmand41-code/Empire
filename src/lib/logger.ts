/**
 * Structured logger — Phase 8.
 *
 * Zero-dependency JSON logger safe for both Node.js and the Edge
 * runtime. Emits a single JSON line per event so log aggregators
 * (Vercel, Datadog, Loki, Grafana) can parse them without config.
 *
 * Log level is controlled by `LOG_LEVEL` env var (debug|info|warn|error).
 * In production `debug` is dropped by default.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function currentLevel(): number {
  const env = (process.env.LOG_LEVEL ?? '').toLowerCase();
  if (env === 'debug' || env === 'info' || env === 'warn' || env === 'error') {
    return LEVELS[env];
  }
  return process.env.NODE_ENV === 'production' ? LEVELS.info : LEVELS.debug;
}

export interface LogFields {
  [key: string]: unknown;
  requestId?: string;
  userId?: string;
  route?: string;
  method?: string;
  status?: number;
  durationMs?: number;
}

function emit(level: LogLevel, message: string, fields: LogFields = {}, err?: unknown): void {
  if (LEVELS[level] < currentLevel()) return;

  const record: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...fields,
  };

  if (err instanceof Error) {
    record.error = {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    };
  } else if (err !== undefined) {
    record.error = err;
  }

  const line = safeStringify(record);
  const sink = level === 'error' || level === 'warn' ? console.error : console.log;
  sink(line);
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ ts: new Date().toISOString(), level: 'error', msg: 'log_serialization_failed' });
  }
}

export const logger = {
  debug: (message: string, fields?: LogFields) => emit('debug', message, fields),
  info: (message: string, fields?: LogFields) => emit('info', message, fields),
  warn: (message: string, fields?: LogFields, err?: unknown) => emit('warn', message, fields, err),
  error: (message: string, fields?: LogFields, err?: unknown) => emit('error', message, fields, err),
};

/** Generate a short request id for tracing without crypto dependency. */
export function newRequestId(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}
