export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { requireRole, errorResponse, HttpError } from "@/lib/guard";
import { oneOf } from "@/lib/validate";
import { audit } from "@/lib/audit";

// PATCH /api/beds/[id] — change bed status (e.g. CLEANING → AVAILABLE)
// Allowed: NURSE, ADMIN
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole("NURSE", "ADMIN");
    const b = await req.json();
    const status = oneOf(b.status, "Status", ["AVAILABLE","OCCUPIED","CLEANING","RESERVED"] as const);

    const bed = await prisma.bed.findUnique({ where: { id: params.id } });
    if (!bed) throw new HttpError(404, "Bed not found");

    // Can't manually free a bed that has an active admission
    if (status === "AVAILABLE") {
      const active = await prisma.admission.findFirst({
        where: { bedId: bed.id, dischargedAt: null },
      });
      if (active) throw new HttpError(409, "Bed has an active admission — discharge first");
    }

    await prisma.bed.update({ where: { id: bed.id }, data: { status: status as any } });
    await audit(session.uid, "UPDATE", "Bed", `${bed.bedNumber} → ${status}`);
    return Response.json({ ok: true, status });
  } catch (e) {
    return errorResponse(e);
  }
}
