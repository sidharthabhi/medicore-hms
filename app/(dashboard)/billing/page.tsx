export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { PageHeader, StatusBadge, Table, Empty } from "@/components/ui";

export default async function BillingPage() {
  const invoices = await prisma.invoice.findMany({ include: { patient: true, items: true }, orderBy: { createdAt: "desc" }, take: 50 });
  const due = invoices.filter((i:any)=>i.status!=="PAID").reduce((s:number,i:any)=>s+(i.total-i.paid),0);
  return (
    <div>
      <PageHeader title="Billing" subtitle={`₹${due.toLocaleString()} outstanding`} />
      <Table head={["Invoice", "Patient", "Items", "Total", "Date", "Status"]}>
        {invoices.map((i: any) => (
          <tr key={i.id} className="hover:bg-canvas/60 transition">
            <td className="px-5 py-3.5 figure text-xs text-muted">{i.invoiceNo}</td>
            <td className="px-5 py-3.5 text-ink">{i.patient.firstName} {i.patient.lastName}</td>
            <td className="px-5 py-3.5 text-muted text-xs truncate max-w-[220px]">{i.items.map((it:any)=>it.label).join(", ")}</td>
            <td className="px-5 py-3.5 figure text-muted">₹{i.total.toLocaleString()}</td>
            <td className="px-5 py-3.5 figure text-xs text-muted">{i.createdAt.toLocaleDateString()}</td>
            <td className="px-5 py-3.5"><StatusBadge status={i.status} /></td>
          </tr>
        ))}
        {invoices.length === 0 && <Empty span={6}>No invoices.</Empty>}
      </Table>
    </div>
  );
}
