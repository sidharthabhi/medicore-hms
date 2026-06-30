import { prisma } from "./db";

function startOfToday() { const d = new Date(); d.setHours(0,0,0,0); return d; }
function endOfToday()   { const d = new Date(); d.setHours(23,59,59,999); return d; }

export async function getDashboardMetrics() {
  const t0 = startOfToday(), t1 = endOfToday();

  const [
    totalPatients, todayAppts, beds, revenueAgg,
    pendingLabs, lowStock,
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.appointment.count({ where: { scheduledAt: { gte: t0, lte: t1 } } }),
    prisma.bed.findMany({ select: { status: true } }),
    prisma.invoice.aggregate({ _sum: { paid: true }, where: { createdAt: { gte: t0, lte: t1 } } }),
    prisma.labOrder.count({ where: { status: { in: ["ORDERED","SAMPLE_COLLECTED","IN_PROGRESS"] } } }),
    prisma.medicine.findMany({ where: {}, select: { name: true, stock: true, reorderLevel: true } }),
  ]);

  const availableBeds = beds.filter((b: {status: string}) => b.status === "AVAILABLE").length;
  const occupiedBeds = beds.filter((b: {status: string}) => b.status === "OCCUPIED").length;
  const lowStockItems = lowStock.filter((m: {stock: number; reorderLevel: number}) => m.stock <= m.reorderLevel);

  // patient flow — last 14 days (encounters per day)
  const since = new Date(); since.setDate(since.getDate() - 13); since.setHours(0,0,0,0);
  const encs = await prisma.encounter.findMany({
    where: { createdAt: { gte: since } }, select: { createdAt: true },
  });
  const flowMap: Record<string, number> = {};
  for (let i = 0; i < 14; i++) {
    const d = new Date(since); d.setDate(since.getDate() + i);
    flowMap[d.toISOString().slice(5,10)] = 0;
  }
  encs.forEach((e: {createdAt: Date}) => {
    const k = e.createdAt.toISOString().slice(5,10);
    if (k in flowMap) flowMap[k]++;
  });
  const patientFlow = Object.entries(flowMap).map(([date, count]) => ({ date, count }));

  // revenue by month — last 6 months
  const since6 = new Date(); since6.setMonth(since6.getMonth() - 5); since6.setDate(1); since6.setHours(0,0,0,0);
  const invoices = await prisma.invoice.findMany({
    where: { createdAt: { gte: since6 } }, select: { paid: true, createdAt: true },
  });
  const revMap: Record<string, number> = {};
  const mNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    revMap[mNames[d.getMonth()]] = 0;
  }
  invoices.forEach((inv: {paid: number; createdAt: Date}) => {
    const k = mNames[inv.createdAt.getMonth()];
    if (k in revMap) revMap[k] += inv.paid;
  });
  const revenueByMonth = Object.entries(revMap).map(([month, revenue]) => ({ month, revenue: Math.round(revenue) }));

  // appointment status split (today)
  const statusRows = await prisma.appointment.groupBy({
    by: ["status"], _count: true,
    where: { scheduledAt: { gte: t0, lte: t1 } },
  });
  const apptStatus = statusRows.map((r: {status: string; _count: number}) => ({ name: r.status, value: r._count }));

  // upcoming appointments (today, with names)
  const upcoming = await prisma.appointment.findMany({
    where: { scheduledAt: { gte: t0, lte: t1 } },
    include: { patient: true, doctor: { include: { user: true } } },
    orderBy: { scheduledAt: "asc" }, take: 8,
  });

  return {
    kpis: {
      totalPatients,
      todayAppts,
      availableBeds,
      occupiedBeds,
      totalBeds: beds.length,
      revenueToday: Math.round(revenueAgg._sum.paid ?? 0),
      pendingLabs,
      lowStockCount: lowStockItems.length,
    },
    patientFlow,
    revenueByMonth,
    apptStatus,
    lowStockItems,
    upcoming: upcoming.map((a: any) => ({
      id: a.id,
      patient: `${a.patient.firstName} ${a.patient.lastName}`,
      doctor: a.doctor.user.name,
      time: a.scheduledAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: a.status,
    })),
  };
}
