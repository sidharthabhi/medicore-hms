export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { PageHeader, StatusBadge, Table, Empty } from "@/components/ui";
import Link from "next/link";
import Icon from "@/components/Icon";

export default async function AppointmentsPage() {
  const appts = await prisma.appointment.findMany({
    include: { patient: true, doctor: { include: { user: true } } },
    orderBy: { scheduledAt: "desc" }, take: 60,
  });
  return (
    <div>
      <PageHeader title="Appointments" subtitle={`${appts.length} recent`}
        action={<Link href="/appointments/new" className="btn btn-primary"><Icon name="plus" className="h-4 w-4 mr-1.5" />Book appointment</Link>} />
      <Table head={["Token", "Date / Time", "Patient", "Doctor", "Reason", "Status"]}>
        {appts.map((a: any) => (
          <tr key={a.id} className="hover:bg-canvas/60 transition">
            <td className="px-5 py-3.5 figure text-muted">#{a.token}</td>
            <td className="px-5 py-3.5 figure text-xs text-muted">
              {a.scheduledAt.toLocaleDateString()} · {a.scheduledAt.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}
            </td>
            <td className="px-5 py-3.5 text-ink">{a.patient.firstName} {a.patient.lastName}</td>
            <td className="px-5 py-3.5 text-muted">{a.doctor.user.name}</td>
            <td className="px-5 py-3.5 text-muted">{a.reason ?? "—"}</td>
            <td className="px-5 py-3.5"><StatusBadge status={a.status} /></td>
          </tr>
        ))}
        {appts.length === 0 && <Empty span={6}>No appointments yet.</Empty>}
      </Table>
    </div>
  );
}
