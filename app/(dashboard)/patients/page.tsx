export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { PageHeader, StatusBadge, Table, Empty } from "@/components/ui";
import Link from "next/link";
import Icon from "@/components/Icon";

export default async function PatientsPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim() ?? "";
  const patients = await prisma.patient.findMany({
    where: q ? { OR: [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { mrn: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
    ] } : {},
    orderBy: { createdAt: "desc" }, take: 50,
  });

  return (
    <div>
      <PageHeader title="Patients" subtitle={`${patients.length} records`}
        action={<Link href="/patients/new" className="btn btn-primary"><Icon name="plus" className="h-4 w-4 mr-1.5" />Register</Link>} />

      <form className="mb-5 relative max-w-sm rise">
        <Icon name="search" className="h-4 w-4 absolute left-3.5 top-3.5 text-faint" />
        <input name="q" defaultValue={q} placeholder="Search name, MRN, or phone" className="input pl-10" />
      </form>

      <Table head={["MRN", "Name", "Gender", "Blood", "Phone", "Allergies"]}>
        {patients.map((p: any) => (
          <tr key={p.id} className="hover:bg-canvas/60 transition">
            <td className="px-5 py-3.5 figure text-xs text-muted">{p.mrn}</td>
            <td className="px-5 py-3.5">
              <Link href={`/patients/${p.id}`} className="text-ink hover:text-accent transition">{p.firstName} {p.lastName}</Link>
            </td>
            <td className="px-5 py-3.5 text-muted">{p.gender}</td>
            <td className="px-5 py-3.5 figure text-muted">{p.bloodGroup ?? "—"}</td>
            <td className="px-5 py-3.5 figure text-muted">{p.phone}</td>
            <td className="px-5 py-3.5">
              {p.allergies && p.allergies !== "None"
                ? <span className="pill bg-alertwash text-alert">{p.allergies}</span>
                : <span className="text-faint">—</span>}
            </td>
          </tr>
        ))}
        {patients.length === 0 && <Empty span={6}>No patients match "{q}".</Empty>}
      </Table>
    </div>
  );
}
