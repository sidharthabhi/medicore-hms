import { prisma } from "@/lib/db";
import { PageHeader, StatusBadge, Table, Empty } from "@/components/ui";

export default async function LabPage() {
  const orders = await prisma.labOrder.findMany({ include: { patient: true }, orderBy: { orderedAt: "desc" }, take: 60 });
  const pending = orders.filter((o: any) => o.status !== "COMPLETED").length;
  return (
    <div>
      <PageHeader title="Laboratory" subtitle={`${pending} pending of ${orders.length}`} />
      <Table head={["Test", "Patient", "Ordered", "Price", "Status"]}>
        {orders.map((o: any) => (
          <tr key={o.id} className="hover:bg-canvas/60 transition">
            <td className="px-5 py-3.5 text-ink">{o.testName}</td>
            <td className="px-5 py-3.5 text-muted">{o.patient.firstName} {o.patient.lastName}</td>
            <td className="px-5 py-3.5 figure text-xs text-muted">{o.orderedAt.toLocaleDateString()}</td>
            <td className="px-5 py-3.5 figure text-muted">₹{o.price}</td>
            <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
          </tr>
        ))}
        {orders.length === 0 && <Empty span={5}>No lab orders.</Empty>}
      </Table>
    </div>
  );
}
