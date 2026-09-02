"use client";

import { ErrorPanel } from "@/components/error-panel";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <ErrorPanel error={error} reset={reset} />
      </div>
    </div>
  );
}
