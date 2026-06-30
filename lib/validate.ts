import { HttpError } from "./guard";

export function str(v: unknown, field: string, opts: { min?: number; max?: number; optional?: boolean } = {}) {
  if (v == null || v === "") {
    if (opts.optional) return undefined;
    throw new HttpError(422, `${field} is required`);
  }
  if (typeof v !== "string") throw new HttpError(422, `${field} must be text`);
  const t = v.trim();
  if (opts.min && t.length < opts.min) throw new HttpError(422, `${field} too short`);
  if (opts.max && t.length > opts.max) throw new HttpError(422, `${field} too long`);
  return t;
}

export function phone(v: unknown, field = "Phone", optional = false) {
  const t = str(v, field, { optional });
  if (t === undefined) return undefined;
  if (!/^[0-9]{10}$/.test(t)) throw new HttpError(422, `${field} must be 10 digits`);
  return t;
}

export function email(v: unknown, field = "Email", optional = true) {
  const t = str(v, field, { optional });
  if (t === undefined) return undefined;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t)) throw new HttpError(422, `${field} is invalid`);
  return t;
}

export function dateValue(v: unknown, field: string, optional = false) {
  if (v == null || v === "") {
    if (optional) return undefined;
    throw new HttpError(422, `${field} is required`);
  }
  const d = new Date(v as string);
  if (isNaN(d.getTime())) throw new HttpError(422, `${field} is not a valid date`);
  return d;
}

export function num(v: unknown, field: string, opts: { min?: number; optional?: boolean } = {}) {
  if (v == null || v === "") {
    if (opts.optional) return undefined;
    throw new HttpError(422, `${field} is required`);
  }
  const n = Number(v);
  if (isNaN(n)) throw new HttpError(422, `${field} must be a number`);
  if (opts.min != null && n < opts.min) throw new HttpError(422, `${field} must be ≥ ${opts.min}`);
  return n;
}

export function oneOf<T extends string>(v: unknown, field: string, allowed: readonly T[]): T {
  if (!allowed.includes(v as T)) throw new HttpError(422, `${field} must be one of ${allowed.join(", ")}`);
  return v as T;
}
