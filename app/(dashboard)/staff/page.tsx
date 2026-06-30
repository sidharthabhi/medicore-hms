import { prisma } from "@/lib/db";
import { PageHeader, Table, Empty } from "@/components/ui";

export default async function StaffPage() {
  const users = await prisma.user.findMany({
    where: { role: { not: "PATIENT" } },
    include: { staff: true, doctor: { include: { department: true } } },
    orderBy: { role: "asc" },
  });
  return (
    <div>
      <PageHeader title="Staff" subtitle={`${users.length} employees`} />
      <Table head={["Name", "Role", "Email", "Department", "Status"]}>
        {users.map((u: any) => (
          <tr key={u.id} className="hover:bg-canvas/60 transition">
            <td className="px-5 py-3.5 text-ink">{u.name}</td>
            <td className="px-5 py-3.5"><span className="pill bg-hairline text-muted capitalize">{u.role.replace("_"," ").toLowerCase()}</span></td>
            <td className="px-5 py-3.5 figure text-xs text-muted">{u.email}</td>
            <td className="px-5 py-3.5 text-muted">{u.doctor?.department?.name ?? u.staff?.designation ?? "—"}</td>
            <td className="px-5 py-3.5">{u.active ? <span className="pill bg-okwash text-ok">active</span> : <span className="text-faint">—</span>}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
