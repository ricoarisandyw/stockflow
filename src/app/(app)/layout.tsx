import { redirect } from "next/navigation";
import { SessionLib } from "@/lib/session.lib";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/nav-bar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await SessionLib.getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="print:hidden">
        <NavBar userName={user.name ?? user.email} />
      </div>
      <main className="mx-auto max-w-5xl px-4 py-8 print:p-0">{children}</main>
    </div>
  );
}
