"use client";
import { useRouter } from "next/navigation";
import Icon from "./Icon";

export default function Topbar({ name }: { name: string; title?: string }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  return (
    <header className="h-[68px] flex items-center justify-between px-8 border-b border-hairline bg-canvas/80 backdrop-blur-sm sticky top-0 z-10">
      <p className="text-sm text-muted">{today}</p>
      <div className="flex items-center gap-3">
        <span className="text-sm text-ink">{name}</span>
        <div className="h-8 w-8 rounded-full bg-accentlt text-accent grid place-items-center text-xs font-medium">
          {name.charAt(0)}
        </div>
        <button onClick={logout} className="text-faint hover:text-alert transition ml-1" title="Sign out">
          <Icon name="logout" className="h-[18px] w-[18px]" />
        </button>
      </div>
    </header>
  );
}
