const SENSITIVE_KEY =
  /authorization|cookie|password|token|secret|private.?key|access.?key|resume(content|snapshot)?|idcard/i;

export class LoggerSanitizeUtil {
  static sanitize(value: unknown, seen = new WeakSet<object>()): unknown {
    if (value === null || value === undefined) return value;
    if (typeof value === 'string')
      return value.length > 2_000 ? `${value.slice(0, 2_000)}…` : value;
    if (typeof value !== 'object') return value;
    if (seen.has(value)) return '[Circular]';
    seen.add(value);
    if (Array.isArray(value)) {
      return value.slice(0, 100).map((item) => this.sanitize(item, seen));
    }
    const sanitized: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      sanitized[key] = SENSITIVE_KEY.test(key)
        ? '[REDACTED]'
        : this.sanitize(item, seen);
    }
    return sanitized;
  }
}
