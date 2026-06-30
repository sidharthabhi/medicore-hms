import { prisma } from "@/lib/db";
import { requireRole, errorResponse, HttpError } from "@/lib/guard";
import { str } from "@/lib/validate";
import { nextInvoiceNo } from "@/lib/refs";
import { audit } from "@/lib/audit";

// PATCH /api/admissions/[id] — discharge: free bed, write summary, raise room bill
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole("ADMIN", "DOCTOR", "NURSE");
    const b = await req.json();
    const summary = str(b.dischargeSummary, "Discharge summary", { min: 1 })!;

    const admission = await prisma.admission.findUnique({
      where: { id: params.id }, include: { bed: true, patient: true },
    });
    if (!admission) throw new HttpError(404, "Admission not found");
    if (admission.dischargedAt) throw new HttpError(409, "Already discharged");

    const now = new Date();
    const days = Math.max(1, Math.ceil((now.getTime() - admission.admittedAt.getTime()) / 86_400_000));
    const roomCharge = days * admission.bed.dailyRate;
    const invoiceNo = await nextInvoiceNo();

    await prisma.$transaction(async (tx: any) => {
      await tx.admission.update({
        where: { id: admission.id },
        data: { dischargedAt: now, dischargeSummary: summary },
      });
      await tx.bed.update({ where: { id: admission.bedId }, data: { status: "CLEANING" } });
      await tx.invoice.create({
        data: {
          invoiceNo, patientId: admission.patientId, total: roomCharge, paid: 0, status: "UNPAID",
          items: { create: [{ label: `Room: ${admission.bed.ward} ${days} day(s)`, category: "ROOM", amount: roomCharge }] },
        },
      });
    });

    await audit(session.uid, "DISCHARGE", "Admission", `${admission.patient.mrn} (${days}d, ₹${roomCharge})`);
    return Response.json({ days, roomCharge, invoiceNo });
  } catch (e) {
    return errorResponse(e);
  }
}
