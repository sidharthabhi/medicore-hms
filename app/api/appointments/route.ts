export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { requireAccess, errorResponse, HttpError } from "@/lib/guard";
import { str, dateValue } from "@/lib/validate";
import { nextToken } from "@/lib/refs";
import { audit } from "@/lib/audit";

// POST /api/appointments — book an appointment
// Allowed: ADMIN, RECEPTIONIST, DOCTOR
export async function POST(req: Request) {
  try {
    const session = await requireAccess("appointments");
    if (!["ADMIN", "RECEPTIONIST", "DOCTOR"].includes(session.role))
      throw new HttpError(403, "Not allowed to book appointments");

    const b = await req.json();
    const patientId = str(b.patientId, "Patient")!;
    const doctorId  = str(b.doctorId, "Doctor")!;
    const scheduledAt = dateValue(b.scheduledAt, "Date/time")!;
    const reason = str(b.reason, "Reason", { optional: true });

    if (scheduledAt.getTime() < Date.now() - 60_000)
      throw new HttpError(422, "Cannot book in the past");

    const [patient, doctor] = await Promise.all([
      prisma.patient.findUnique({ where: { id: patientId } }),
      prisma.doctor.findUnique({ where: { id: doctorId }, include: { schedules: true } }),
    ]);
    if (!patient) throw new HttpError(404, "Patient not found");
    if (!doctor) throw new HttpError(404, "Doctor not found");
    if (doctor.onLeave) throw new HttpError(409, "Doctor is on leave");

    // Within doctor's weekly schedule?
    const dow = scheduledAt.getDay();
    const hhmm = scheduledAt.toTimeString().slice(0, 5);
    const sched = doctor.schedules.find((s: any) => s.dayOfWeek === dow);
    if (!sched || hhmm < sched.startTime || hhmm >= sched.endTime)
      throw new HttpError(409, "Outside the doctor's available hours");

    // Slot clash? (same doctor, same 30-min slot)
    const slotStart = new Date(scheduledAt); slotStart.setSeconds(0, 0);
    const slotEnd = new Date(slotStart.getTime() + 30 * 60_000);
    const clash = await prisma.appointment.findFirst({
      where: {
        doctorId, status: { notIn: ["CANCELLED", "NO_SHOW"] },
        scheduledAt: { gte: slotStart, lt: slotEnd },
      },
    });
    if (clash) throw new HttpError(409, "That slot is already booked");

    const token = await nextToken(doctorId, scheduledAt);
    const appt = await prisma.appointment.create({
      data: { patientId, doctorId, scheduledAt, token, reason: reason ?? null },
    });

    await audit(session.uid, "CREATE", "Appointment", `${patient.mrn} → Dr ${doctorId} #${token}`);
    return Response.json({ id: appt.id, token }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
