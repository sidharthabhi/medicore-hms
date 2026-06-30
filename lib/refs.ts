import { prisma } from "./db";

/** Atomic MRN generation — "MRN100042". Uses a counter row, upserted+incremented
 *  inside a transaction so two concurrent registrations can't collide. */
export async function nextMrn(): Promise<string> {
  const c = await prisma.counter.upsert({
    where: { id: "mrn" },
    create: { id: "mrn", value: 100001 },
    update: { value: { increment: 1 } },
  });
  return "MRN" + c.value;
}

export async function nextInvoiceNo(): Promise<string> {
  const c = await prisma.counter.upsert({
    where: { id: "invoice" },
    create: { id: "invoice", value: 1 },
    update: { value: { increment: 1 } },
  });
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  return `INV${ymd}-${String(c.value).padStart(4, "0")}`;
}

/** Next daily token for a doctor (resets each day). */
export async function nextToken(doctorId: string, day: Date): Promise<number> {
  const start = new Date(day); start.setHours(0,0,0,0);
  const end = new Date(day); end.setHours(23,59,59,999);
  const count = await prisma.appointment.count({
    where: { doctorId, scheduledAt: { gte: start, lte: end } },
  });
  return count + 1;
}
