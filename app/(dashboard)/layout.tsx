import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { NAV, can, Role } from "@/lib/rbac";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const role = session.role as Role;
  const nav = NAV.filter((n) => can(role, n.key));

  return (
    <div className="flex bg-canvas min-h-screen">
      <Sidebar nav={nav} role={role} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar name={session.name} />
        <main className="flex-1 px-8 py-8 max-w-[1180px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
