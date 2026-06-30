import { prisma } from "@/lib/db";
import { requireRole, errorResponse, HttpError } from "@/lib/guard";
import { str } from "@/lib/validate";
import { audit } from "@/lib/audit";

// POST /api/admissions — admit a patient to a bed
// Allowed: ADMIN, DOCTOR, NURSE, RECEPTIONIST
export async function POST(req: Request) {
  try {
    const session = await requireRole("ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST");
    const b = await req.json();
    const patientId = str(b.patientId, "Patient")!;
    const bedId = str(b.bedId, "Bed")!;

    const [patient, bed] = await Promise.all([
      prisma.patient.findUnique({ where: { id: patientId } }),
      prisma.bed.findUnique({ where: { id: bedId } }),
    ]);
    if (!patient) throw new HttpError(404, "Patient not found");
    if (!bed) throw new HttpError(404, "Bed not found");
    if (bed.status !== "AVAILABLE") throw new HttpError(409, `Bed is ${bed.status.toLowerCase()}`);

    // No active admission for this patient already
    const active = await prisma.admission.findFirst({
      where: { patientId, dischargedAt: null },
    });
    if (active) throw new HttpError(409, "Patient already admitted");

    const admission = await prisma.$transaction(async (tx: any) => {
      await tx.bed.update({ where: { id: bedId }, data: { status: "OCCUPIED" } });
      return tx.admission.create({ data: { patientId, bedId } });
    });

    await audit(session.uid, "ADMIT", "Admission", `${patient.mrn} → bed ${bed.bedNumber}`);
    return Response.json({ id: admission.id }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
