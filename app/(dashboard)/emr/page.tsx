import { prisma } from "@/lib/db";
import { PageHeader, Table, Empty } from "@/components/ui";
import Link from "next/link";

export default async function EmrPage() {
  const encs = await prisma.encounter.findMany({
    include: { patient: true, doctor: { include: { user: true } } },
    orderBy: { createdAt: "desc" }, take: 40,
  });
  return (
    <div>
      <PageHeader title="Medical Records" subtitle="Recent clinical encounters" />
      <Table head={["Date", "Patient", "Diagnosis", "Vitals", "Doctor"]}>
        {encs.map((e: any) => (
          <tr key={e.id} className="hover:bg-canvas/60 transition">
            <td className="px-5 py-3.5 figure text-xs text-muted">{e.createdAt.toLocaleDateString()}</td>
            <td className="px-5 py-3.5">
              <Link href={`/patients/${e.patientId}`} className="text-ink hover:text-accent transition">{e.patient.firstName} {e.patient.lastName}</Link>
            </td>
            <td className="px-5 py-3.5 text-muted">{e.diagnosis ?? "—"}</td>
            <td className="px-5 py-3.5 figure text-xs text-faint">
              {e.bpSystolic ? `BP ${e.bpSystolic}/${e.bpDiastolic}` : ""}{e.pulse ? ` · HR ${e.pulse}` : ""}
            </td>
            <td className="px-5 py-3.5 text-muted">{e.doctor.user.name}</td>
          </tr>
        ))}
        {encs.length === 0 && <Empty span={5}>No records.</Empty>}
      </Table>
    </div>
  );
}
