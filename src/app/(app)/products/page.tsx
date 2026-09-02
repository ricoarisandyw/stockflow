"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { FormProduct } from "@/components/form-product";
import { SkeletonComponent } from "@/components/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { components } from "@/generated/api/schema";

type TProduct = components["schemas"]["Product"];

const PAGE_LIMIT_OPTIONS = [5, 10, 25, 50, 100] as const;

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(PAGE_LIMIT_OPTIONS[0]);
  const [formMode, setFormMode] = useState<"none" | "create" | TProduct>("none");

  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, limit]);

  const productsQuery = useQuery({
    queryKey: ["products", { page, limit, search: debouncedSearch }],
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/products", {
        params: { query: { page, limit, search: debouncedSearch || undefined } },
      });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await apiClient.DELETE("/products/{id}", { params: { path: { id } } });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: components["schemas"]["StandardErrorResponse"]) => {
      window.alert(error.error?.message ?? "Failed to delete product.");
    },
  });

  function handleDelete(product: TProduct) {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    deleteMutation.mutate(product.id);
  }

  const products = productsQuery.data?.data ?? [];
  const meta = productsQuery.data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Products</h1>
        {formMode === "none" && (
          <button
            type="button"
            onClick={() => setFormMode("create")}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Add product
          </button>
        )}
      </div>

      {formMode !== "none" && (
        <FormProduct
          product={formMode === "create" ? undefined : formMode}
          onDone={() => setFormMode("none")}
        />
      )}

      <div className="flex items-center justify-between gap-4">
        <input
          type="search"
          placeholder="Search by name or SKU…"
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

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">SKU</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Name</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Unit price</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Stock</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {productsQuery.isFetching && (
              <SkeletonComponent.tableRows
                rows={limit}
                columnWidths={["w-16", "w-32", "ml-auto w-20", "ml-auto w-10", "ml-auto w-24"]}
              />
            )}

            {!productsQuery.isFetching && productsQuery.isError && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-red-600">
                  Failed to load products.
                </td>
              </tr>
            )}

            {!productsQuery.isFetching && !productsQuery.isError && products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  No products found.
                </td>
              </tr>
            )}

            {!productsQuery.isFetching &&
              products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-2 text-gray-900">{product.sku}</td>
                  <td className="px-4 py-2 text-gray-900">{product.name}</td>
                  <td className="px-4 py-2 text-right text-gray-900">{product.unitPrice}</td>
                  <td className="px-4 py-2 text-right text-gray-900">{product.quantityOnHand}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setFormMode(product)}
                      className="mr-3 text-sm font-medium text-gray-500 hover:text-gray-900"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product)}
                      disabled={deleteMutation.isPending}
                      className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      Delete
                    </button>
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
