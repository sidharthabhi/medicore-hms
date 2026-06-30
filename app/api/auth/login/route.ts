export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active)
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  await createSession({ uid: user.id, role: user.role, name: user.name });
  await prisma.auditLog.create({
    data: { userId: user.id, action: "LOGIN", entity: "User", detail: user.email },
  });
  return NextResponse.json({ ok: true, role: user.role });
}
