# MediCore HMS — Hospital Management System

Full-stack Hospital Management System: **Next.js 14 (App Router)**, **TypeScript**,
**Tailwind CSS**, **Prisma**, **PostgreSQL**, **Recharts**. Role-based access control
across 8 roles, a live analytics dashboard, 11 operational modules, and validated
write flows with audit logging.

---

## Quick start

You need a PostgreSQL database. Easiest is a free cloud one (Neon / Supabase), or
local Postgres.

```bash
# 1. Install
npm install

# 2. Set your database URL
#    edit .env →  DATABASE_URL="postgresql://user:pass@host:5432/hms"

# 3. Create tables + seed demo data
npm run setup        # = prisma db push && prisma db seed

# 4. Run
npm run dev          # http://localhost:3000
```

### Demo accounts (password: `password`)

| Email | Role |
|---|---|
| admin@hms.dev | Admin |
| doctor@hms.dev | Doctor |
| nurse@hms.dev | Nurse |
| reception@hms.dev | Receptionist |
| pharmacy@hms.dev | Pharmacist |
| lab@hms.dev | Lab Technician |
| accounts@hms.dev | Accountant |

---

## Security model (3 layers)

1. **Route** — `middleware.ts` blocks unauthenticated access to every internal page.
2. **API** — each route calls `requireAccess()` / `requireRole()` before mutating.
3. **UI** — `lib/rbac.ts` hides modules a role can't use (usability, not security).

Plus: opaque `cuid` IDs in URLs (no enumeration), per-record ownership checks
(a patient can only open their own record — see `app/(dashboard)/patients/[id]`),
bcrypt password hashing, JWT in httpOnly cookies, and an audit log on every
sensitive mutation.

---

## API reference (write flows)

Every endpoint: authenticate → authorize → validate → mutate (transaction where
needed) → audit → respond. Errors return `{ error }` with a proper status code.

| Method | Endpoint | Role(s) | Does |
|---|---|---|---|
| POST | `/api/auth/login` | public | Sign in, issue JWT cookie |
| POST | `/api/auth/logout` | any | Clear session |
| POST | `/api/patients` | Admin, Reception | Register patient (generates MRN, dup-check) |
| POST | `/api/appointments` | Admin, Reception, Doctor | Book (schedule + slot-clash checks, token) |
| POST | `/api/encounters` | Doctor (full), Nurse (vitals) | Record a clinical visit |
| POST | `/api/pharmacy/dispense` | Pharmacist, Admin | Dispense Rx (stock−, expiry check, bill) |
| POST | `/api/admissions` | Admin, Doctor, Nurse, Reception | Admit to bed (occupy) |
| PATCH | `/api/admissions/[id]` | Admin, Doctor, Nurse | Discharge (free bed, summary, room bill) |
| POST | `/api/payments` | Accountant, Reception, Admin | Record payment (full/partial) |
| PATCH | `/api/beds/[id]` | Nurse, Admin | Change bed status |

### Business rules enforced server-side
- **Registration**: 10-digit phone, valid DOB (not future), duplicate detection.
- **Booking**: no past dates, doctor not on leave, within weekly schedule, no
  double-booking a 30-min slot, daily token per doctor.
- **Dispense**: can't exceed stock, can't dispense expired meds, atomic stock
  decrement + invoice creation in one transaction.
- **Admit**: bed must be AVAILABLE, no existing active admission for the patient.
- **Discharge**: computes room charge by days × daily rate, frees bed to CLEANING.
- **Payment**: can't exceed amount due; auto-sets PARTIAL vs PAID.

---

## Deploy

Vercel (app) + Neon (Postgres). Set `DATABASE_URL` and `JWT_SECRET` as environment
variables in Vercel. `prisma generate` runs on build. Seed once via `npm run db:seed`
against the production DB (or skip and create real data).

---

## Project structure

```
app/
  (auth)/login/              login page
  (dashboard)/               authed shell + 11 module pages
  api/                       write-flow endpoints (see table above)
lib/
  auth.ts    JWT + bcrypt + sessions
  guard.ts   requireSession / requireAccess / requireRole + error handling
  rbac.ts    role → module access matrix
  validate.ts  input validators (str/phone/email/date/num/oneOf)
  refs.ts    atomic MRN / invoice / token generation (Counter table)
  audit.ts   audit logging
  metrics.ts dashboard aggregations
prisma/
  schema.prisma   full model (Postgres + enums)
  seed.ts         realistic demo data
middleware.ts     edge route protection
```
