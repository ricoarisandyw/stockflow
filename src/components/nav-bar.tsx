"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

const NAV_LINKS = [
  { href: "/products", label: "Products" },
  { href: "/invoices", label: "Invoices" },
];

export function NavBar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (!window.confirm("Log out of StockFlow?")) return;

    setIsLoggingOut(true);
    await apiClient.POST("/auth/logout");
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-base font-semibold text-gray-900">StockFlow</span>
          <nav className="flex items-center gap-4">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    isActive
                      ? "text-sm font-medium text-gray-900"
                      : "text-sm font-medium text-gray-500 hover:text-gray-900"
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{userName}</span>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 disabled:opacity-50"
          >
            {isLoggingOut ? "Logging out…" : "Log out"}
          </button>
        </div>
      </div>
    </header>
  );
}
