import { prisma } from "@/lib/db";
import { PageHeader, Table, Empty } from "@/components/ui";

export default async function PharmacyPage() {
  const meds = await prisma.medicine.findMany({ include: { supplier: true }, orderBy: { name: "asc" } });
  const low = meds.filter((m: any) => m.stock <= m.reorderLevel).length;
  return (
    <div>
      <PageHeader title="Pharmacy" subtitle={`${meds.length} items · ${low} low on stock`} />
      <Table head={["Medicine", "SKU", "Price", "Stock", "Supplier", "Expiry"]}>
        {meds.map((m: any) => {
          const isLow = m.stock <= m.reorderLevel;
          return (
            <tr key={m.id} className="hover:bg-canvas/60 transition">
              <td className="px-5 py-3.5 text-ink">{m.name}</td>
              <td className="px-5 py-3.5 figure text-xs text-faint">{m.sku}</td>
              <td className="px-5 py-3.5 figure text-muted">₹{m.unitPrice}</td>
              <td className="px-5 py-3.5">
                {isLow
                  ? <span className="pill bg-alertwash text-alert figure">{m.stock} · reorder {m.reorderLevel}</span>
                  : <span className="figure text-muted">{m.stock}</span>}
              </td>
              <td className="px-5 py-3.5 text-muted">{m.supplier?.name ?? "—"}</td>
              <td className="px-5 py-3.5 figure text-xs text-muted">{m.expiryDate?.toLocaleDateString() ?? "—"}</td>
            </tr>
          );
        })}
        {meds.length === 0 && <Empty span={6}>No medicines.</Empty>}
      </Table>
    </div>
  );
}
