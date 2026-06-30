export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { requireRole, errorResponse, HttpError } from "@/lib/guard";
import { str, num } from "@/lib/validate";
import { audit } from "@/lib/audit";

// POST /api/payments — record a payment (full or partial)
// Allowed: ACCOUNTANT, RECEPTIONIST, ADMIN
export async function POST(req: Request) {
  try {
    const session = await requireRole("ACCOUNTANT", "RECEPTIONIST", "ADMIN");
    const b = await req.json();
    const invoiceId = str(b.invoiceId, "Invoice")!;
    const amount = num(b.amount, "Amount", { min: 0.01 })!;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }, include: { patient: true },
    });
    if (!invoice) throw new HttpError(404, "Invoice not found");
    if (invoice.status === "PAID") throw new HttpError(409, "Invoice already fully paid");

    const due = invoice.total - invoice.paid;
    if (amount > due + 0.001) throw new HttpError(422, `Amount exceeds due (₹${due.toFixed(2)})`);

    const newPaid = invoice.paid + amount;
    const status = newPaid >= invoice.total - 0.001 ? "PAID" : "PARTIAL";

    await prisma.invoice.update({
      where: { id: invoiceId }, data: { paid: newPaid, status },
    });

    await audit(session.uid, "PAYMENT", "Invoice", `${invoice.invoiceNo} +₹${amount} (${status})`);
    return Response.json({ invoiceNo: invoice.invoiceNo, paid: newPaid, status });
  } catch (e) {
    return errorResponse(e);
  }
}
