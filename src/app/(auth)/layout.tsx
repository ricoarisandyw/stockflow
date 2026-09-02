import { redirect } from "next/navigation";
import { SessionLib } from "@/lib/session.lib";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await SessionLib.getSession();
  if (session) redirect("/products");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">StockFlow</h1>
          <p className="mt-1 text-sm text-gray-500">Inventory & invoicing for small distributors.</p>
        </div>
        {children}
      </div>
    </div>
  );
}
