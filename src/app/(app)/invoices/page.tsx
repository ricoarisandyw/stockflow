"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { FormInvoiceCreate } from "@/components/form-invoice-create";
import { SkeletonComponent } from "@/components/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { components } from "@/generated/api/schema";

type TInvoiceStatus = components["schemas"]["InvoiceStatus"];
type TInvoiceSummary = components["schemas"]["InvoiceSummary"];
type TInvoiceError = components["schemas"]["StandardErrorResponse"];
type TInvoiceAction = "issue" | "pay" | "cancel";

const TRANSITION_ACTIONS: Record<TInvoiceStatus, TInvoiceAction[]> = {
  DRAFT: ["issue", "cancel"],
  ISSUED: ["pay", "cancel"],
  PAID: [],
  CANCELLED: [],
};

const ACTION_LABELS: Record<TInvoiceAction, string> = {
  issue: "Issue",
  pay: "Mark Paid",
  cancel: "Cancel",
};

const ACTION_CONFIRM_MESSAGES: Record<TInvoiceAction, (invoice: TInvoiceSummary) => string> = {
  issue: (invoice) =>
    `Issue invoice "${invoice.invoiceNumber}"? This will deduct stock for its line items.`,
  pay: (invoice) => `Mark invoice "${invoice.invoiceNumber}" as paid?`,
  cancel: (invoice) =>
    invoice.status === "ISSUED"
      ? `Cancel invoice "${invoice.invoiceNumber}"? Stock for its line items will be restored.`
      : `Cancel invoice "${invoice.invoiceNumber}"?`,
};

const PAGE_LIMIT_OPTIONS = [5, 10, 25, 50, 100] as const;
const STATUS_FILTERS: { label: string; value: TInvoiceStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Issued", value: "ISSUED" },
  { label: "Paid", value: "PAID" },
  { label: "Cancelled", value: "CANCELLED" },
];

const STATUS_BADGE_STYLES: Record<TInvoiceStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  ISSUED: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TInvoiceStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(PAGE_LIMIT_OPTIONS[0]);

  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, limit]);

  const invoicesQuery = useQuery({
    queryKey: ["invoices", { page, limit, search: debouncedSearch, status }],
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/invoices", {
        params: {
          query: {
            page,
            limit,
            search: debouncedSearch || undefined,
            status: status === "ALL" ? undefined : status,
          },
        },
      });
      if (error) throw error;
      return data;
    },
  });

  const invoices = invoicesQuery.data?.data ?? [];
  const meta = invoicesQuery.data?.meta;

  const transitionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: TInvoiceAction }) => {
      const { error } =
        action === "issue"
          ? await apiClient.POST("/invoices/{id}/issue", { params: { path: { id } } })
          : action === "pay"
            ? await apiClient.POST("/invoices/{id}/pay", { params: { path: { id } } })
            : await apiClient.POST("/invoices/{id}/cancel", { params: { path: { id } } });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error: TInvoiceError) => {
      window.alert(error.error?.message ?? "Failed to update invoice status.");
    },
  });

  function handleTransition(invoice: TInvoiceSummary, action: TInvoiceAction) {
    if (!window.confirm(ACTION_CONFIRM_MESSAGES[action](invoice))) return;
    transitionMutation.mutate({ id: invoice.id, action });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Invoices</h1>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            New invoice
          </button>
        )}
      </div>

      {showForm && <FormInvoiceCreate onDone={() => setShowForm(false)} />}

      <div className="flex items-center justify-between gap-4">
        <input
          type="search"
          placeholder="Search by customer or invoice number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />

        <label className="flex items-center gap-2 text-sm text-gray-500">
          Rows per page
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          >
            {PAGE_LIMIT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatus(filter.value)}
            className={
              status === filter.value
                ? "rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white"
                : "rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            }
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Invoice #</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Customer</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Due date</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Total</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoicesQuery.isFetching && (
              <SkeletonComponent.tableRows
                rows={limit}
                columnWidths={["w-28", "w-32", "w-24", "w-16", "ml-auto w-20", "ml-auto w-24"]}
              />
            )}

            {!invoicesQuery.isFetching && invoicesQuery.isError && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-red-600">
                  Failed to load invoices.
                </td>
              </tr>
            )}

            {!invoicesQuery.isFetching && !invoicesQuery.isError && invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No invoices found.
                </td>
              </tr>
            )}

            {!invoicesQuery.isFetching &&
              invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-4 py-2 font-medium text-gray-900">{invoice.invoiceNumber}</td>
                  <td className="px-4 py-2 text-gray-900">{invoice.customerName}</td>
                  <td className="px-4 py-2 text-gray-500">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_STYLES[invoice.status]}`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-gray-900">{invoice.total.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">
                    {TRANSITION_ACTIONS[invoice.status].length === 0 && (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                    {TRANSITION_ACTIONS[invoice.status].map((action) => (
                      <button
                        key={action}
                        type="button"
                        onClick={() => handleTransition(invoice, action)}
                        disabled={transitionMutation.isPending}
                        className={
                          action === "cancel"
                            ? "ml-3 text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                            : "ml-3 text-sm font-medium text-gray-500 hover:text-gray-900 disabled:opacity-50"
                        }
                      >
                        {ACTION_LABELS[action]}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Page {meta.page} of {meta.totalPages} ({meta.totalItems} items)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-md border border-gray-300 px-3 py-1 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className="rounded-md border border-gray-300 px-3 py-1 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
