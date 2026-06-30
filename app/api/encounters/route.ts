import { prisma } from "@/lib/db";
import { requireAccess, errorResponse, HttpError } from "@/lib/guard";
import { str, num, oneOf } from "@/lib/validate";
import { audit } from "@/lib/audit";

// POST /api/encounters — create an encounter (record a visit)
// Doctors write full clinical data; nurses may record vitals only.
export async function POST(req: Request) {
  try {
    const session = await requireAccess("emr");
    const isDoctor = session.role === "DOCTOR" || session.role === "ADMIN";
    const isNurse = session.role === "NURSE";
    if (!isDoctor && !isNurse) throw new HttpError(403, "Not allowed to record encounters");

    const b = await req.json();
    const patientId = str(b.patientId, "Patient")!;
    const appointmentId = str(b.appointmentId, "Appointment", { optional: true });
    const type = b.type ? oneOf(b.type, "Type", ["OPD","IPD","EMERGENCY"] as const) : "OPD";

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new HttpError(404, "Patient not found");

    // Resolve the acting doctor
    let doctorId: string;
    if (isDoctor && session.role === "DOCTOR") {
      const doc = await prisma.doctor.findUnique({ where: { userId: session.uid } });
      if (!doc) throw new HttpError(400, "Doctor profile not found");
      doctorId = doc.id;
    } else {
      // admin or nurse must pass a doctorId (attending physician)
      doctorId = str(b.doctorId, "Attending doctor")!;
      const doc = await prisma.doctor.findUnique({ where: { id: doctorId } });
      if (!doc) throw new HttpError(404, "Doctor not found");
    }

    // Vitals (nurses + doctors)
    const vitals = {
      bpSystolic:  num(b.bpSystolic, "BP systolic", { optional: true, min: 40 }) ?? null,
      bpDiastolic: num(b.bpDiastolic, "BP diastolic", { optional: true, min: 30 }) ?? null,
      pulse:       num(b.pulse, "Pulse", { optional: true, min: 20 }) ?? null,
      tempC:       num(b.tempC, "Temperature", { optional: true, min: 30 }) ?? null,
      weightKg:    num(b.weightKg, "Weight", { optional: true, min: 1 }) ?? null,
    };

    // Clinical fields — doctors only
    const clinical = isDoctor ? {
      symptoms:  str(b.symptoms, "Symptoms", { optional: true }) ?? null,
      diagnosis: str(b.diagnosis, "Diagnosis", { optional: true }) ?? null,
      notes:     str(b.notes, "Notes", { optional: true }) ?? null,
    } : { symptoms: null, diagnosis: null, notes: null };

    // Allergy safety check — surface a warning (non-blocking) if prescribing later
    const encounter = await prisma.encounter.create({
      data: {
        patientId, doctorId, type: type as any,
        appointmentId: appointmentId ?? null,
        ...vitals, ...clinical,
      },
    });

    // If tied to an appointment, mark it completed
    if (appointmentId) {
      await prisma.appointment.update({
        where: { id: appointmentId }, data: { status: "COMPLETED" },
      }).catch(() => {});
    }

    await audit(session.uid, "CREATE", "Encounter", `${patient.mrn} (${type})`);
    return Response.json({ id: encounter.id }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
