import { prisma } from "./db";

export async function audit(userId: string | null, action: string, entity: string, detail?: string) {
  try {
    await prisma.auditLog.create({ data: { userId, action, entity, detail } });
  } catch (e) {
    console.error("audit failed", e); // never block the main action on audit failure
  }
}
