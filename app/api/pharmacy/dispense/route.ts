export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { requireRole, errorResponse, HttpError } from "@/lib/guard";
import { str } from "@/lib/validate";
import { nextInvoiceNo } from "@/lib/refs";
import { audit } from "@/lib/audit";

// POST /api/pharmacy/dispense — dispense a prescription
// Allowed: PHARMACIST, ADMIN. Atomic: stock check + decrement + bill in a transaction.
export async function POST(req: Request) {
  try {
    const session = await requireRole("PHARMACIST", "ADMIN");
    const b = await req.json();
    const prescriptionId = str(b.prescriptionId, "Prescription")!;

    const rx = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: { medicine: true, patient: true },
    });
    if (!rx) throw new HttpError(404, "Prescription not found");
    if (rx.dispensed) throw new HttpError(409, "Already dispensed");

    // quantity = duration in days (1 unit/day assumption for demo)
    const qty = rx.durationDays;
    if (rx.medicine.stock < qty)
      throw new HttpError(409, `Insufficient stock: ${rx.medicine.stock} left, need ${qty}`);
    if (rx.medicine.expiryDate && rx.medicine.expiryDate.getTime() < Date.now())
      throw new HttpError(409, "Medicine has expired — cannot dispense");

    const amount = qty * rx.medicine.unitPrice;
    const invoiceNo = await nextInvoiceNo();

    const result = await prisma.$transaction(async (tx: any) => {
      await tx.medicine.update({
        where: { id: rx.medicineId }, data: { stock: { decrement: qty } },
      });
      await tx.prescription.update({
        where: { id: rx.id }, data: { dispensed: true },
      });
      const invoice = await tx.invoice.create({
        data: {
          invoiceNo, patientId: rx.patientId, total: amount, paid: 0, status: "UNPAID",
          items: { create: [{ label: `Pharmacy: ${rx.medicine.name} x${qty}`, category: "PHARMACY", amount }] },
        },
      });
      return invoice;
    });

    await audit(session.uid, "DISPENSE", "Prescription", `${rx.medicine.name} x${qty} → ${rx.patient.mrn}`);
    return Response.json({ invoiceId: result.id, invoiceNo, amount }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
