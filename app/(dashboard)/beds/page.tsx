export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";

const tone: Record<string, string> = {
  AVAILABLE: "bg-okwash text-ok border-ok/20",
  OCCUPIED: "bg-alertwash text-alert border-alert/20",
  CLEANING: "bg-warnwash text-warn border-warn/20",
  RESERVED: "bg-hairline text-muted border-hairline",
};

export default async function BedsPage() {
  const beds = await prisma.bed.findMany({ orderBy: [{ ward: "asc" }, { bedNumber: "asc" }] });
  const wards = [...new Set(beds.map((b: any) => b.ward))];
  const avail = beds.filter((b: any) => b.status === "AVAILABLE").length;

  return (
    <div>
      <PageHeader title="Beds & Wards" subtitle={`${avail} of ${beds.length} beds available`} />
      <div className="flex gap-2 mb-7 rise">
        {Object.entries({AVAILABLE:"Available",OCCUPIED:"Occupied",CLEANING:"Cleaning",RESERVED:"Reserved"}).map(([k,v]) => (
          <span key={k} className={`pill border ${tone[k]}`}><span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />{v}</span>
        ))}
      </div>
      <div className="space-y-5">
        {wards.map((ward, wi) => {
          const wb = beds.filter((b: any) => b.ward === ward);
          const free = wb.filter((b:any)=>b.status==="AVAILABLE").length;
          return (
            <div key={ward as string} className="card shadow-card p-6 rise" style={{ animationDelay: `${wi*60}ms` }}>
              <div className="flex items-baseline justify-between mb-5">
                <h2 className="font-serif text-lg text-ink">{ward as string}</h2>
                <p className="eyebrow">{free} / {wb.length} free</p>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-2">
                {wb.map((b: any) => (
                  <div key={b.id}
                    className={`aspect-square rounded-xl border grid place-items-center figure text-xs ${tone[b.status]}`}
                    title={`${b.bedNumber} — ${b.status.toLowerCase()}`}>
                    {b.bedNumber}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
