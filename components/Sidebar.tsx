"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";

export default function Sidebar({ nav, role }: { nav: any[]; role: string }) {
  const path = usePathname();
  return (
    <aside className="w-[232px] shrink-0 bg-canvas border-r border-hairline flex flex-col min-h-screen sticky top-0">
      <div className="h-[68px] flex items-center gap-2.5 px-6">
        <div className="h-7 w-7 rounded-lg bg-accent grid place-items-center">
          <span className="text-white text-sm font-serif font-semibold">M</span>
        </div>
        <span className="font-serif text-[19px] text-ink tracking-tight">MediCore</span>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {nav.map((n) => {
          const href = `/${n.key}`;
          const active = path === href || path.startsWith(href + "/");
          return (
            <Link key={n.key} href={href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all
                ${active
                  ? "bg-surface text-ink shadow-card border border-hairline"
                  : "text-muted hover:text-ink hover:bg-surface/60"}`}>
              <span className={active ? "text-accent" : "text-faint group-hover:text-muted"}>
                <Icon name={n.icon} />
              </span>
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-hairline">
        <p className="eyebrow">Signed in</p>
        <p className="text-sm text-ink mt-1 capitalize">{role.toLowerCase().replace("_", " ")}</p>
      </div>
    </aside>
  );
}
