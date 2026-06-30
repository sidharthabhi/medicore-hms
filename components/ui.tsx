export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-8 rise">
      <div>
        <h1 className="font-serif text-[28px] leading-tight text-ink tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const PILL: Record<string, string> = {
  AVAILABLE: "bg-okwash text-ok", OCCUPIED: "bg-alertwash text-alert",
  CLEANING: "bg-warnwash text-warn", RESERVED: "bg-hairline text-muted",
  BOOKED: "bg-accentlt text-accent", CHECKED_IN: "bg-warnwash text-warn",
  COMPLETED: "bg-okwash text-ok", CANCELLED: "bg-alertwash text-alert",
  NO_SHOW: "bg-hairline text-muted", PAID: "bg-okwash text-ok",
  UNPAID: "bg-alertwash text-alert", PARTIAL: "bg-warnwash text-warn",
  ORDERED: "bg-hairline text-muted", SAMPLE_COLLECTED: "bg-accentlt text-accent",
  IN_PROGRESS: "bg-warnwash text-warn",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`pill ${PILL[status] ?? "bg-hairline text-muted"}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      {status.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="card shadow-card overflow-hidden rise">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-hairline">
            {head.map((h) => (
              <th key={h} className="text-left eyebrow font-medium px-5 py-3.5">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">{children}</tbody>
      </table>
    </div>
  );
}

export function Empty({ children, span }: { children: React.ReactNode; span: number }) {
  return <tr><td colSpan={span} className="px-5 py-12 text-center text-sm text-faint">{children}</td></tr>;
}
