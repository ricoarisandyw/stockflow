"use client";

import { useEffect, useMemo } from "react";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient } from "@/lib/api-client";
import { invoiceItemInputSchema } from "@/schemas/invoice.schema";
import { MoneyUtils } from "@/utils/money.utils";
import type { components } from "@/generated/api/schema";

type TInvoiceError = components["schemas"]["StandardErrorResponse"];
type TInvoiceSummary = components["schemas"]["InvoiceSummary"];

const invoiceFormSchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required."),
  dueDate: z.string().min(1, "Due date is required."),
  notes: z.string().trim().optional(),
  items: z.array(invoiceItemInputSchema).min(1, "At least one line item is required."),
});

type TFormInput = z.infer<typeof invoiceFormSchema>;

function toDateInputValue(iso: string): string {
  return iso.slice(0, 10);
}

export function FormInvoice({
  invoice,
  readOnly = false,
  onDone,
}: {
  invoice?: TInvoiceSummary;
  readOnly?: boolean;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const isEditing = Boolean(invoice) && !readOnly;
  const isViewing = Boolean(invoice) && readOnly;

  const productsQuery = useQuery({
    queryKey: ["products", { limit: 100 }],
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/products", { params: { query: { limit: 100 } } });
      if (error) throw error;
      return data;
    },
  });
  const products = productsQuery.data?.data ?? [];

  const invoiceDetailQuery = useQuery({
    queryKey: ["invoices", invoice?.id],
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/invoices/{id}", { params: { path: { id: invoice!.id } } });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(invoice),
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<TFormInput>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      customerName: "",
      dueDate: "",
      notes: "",
      items: [{ productId: "", quantity: 1 }],
    },
  });

  useEffect(() => {
    const detail = invoiceDetailQuery.data?.data;
    if (!detail) return;
    reset({
      customerName: detail.customerName,
      dueDate: toDateInputValue(detail.dueDate),
      notes: detail.notes ?? "",
      items: detail.items?.map((item) => ({ productId: item.productId, quantity: item.quantity })) ?? [
        { productId: "", quantity: 1 },
      ],
    });
  }, [invoiceDetailQuery.data, reset]);

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const watchedItems = useWatch({ control, name: "items" });

  const preview = useMemo(() => {
    const lines = watchedItems
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product || !item.quantity || item.quantity <= 0) return null;
        return { unitPrice: product.unitPrice, quantity: item.quantity };
      })
      .filter((line): line is { unitPrice: number; quantity: number } => line !== null);

    return MoneyUtils.calculate(lines);
  }, [watchedItems, products]);

  const saveMutation = useMutation<unknown, TInvoiceError, TFormInput>({
    mutationFn: async (values) => {
      const dueDate = new Date(values.dueDate);
      const payload = {
        customerName: values.customerName,
        dueDate: dueDate.toISOString(),
        notes: values.notes || undefined,
        items: values.items,
      };

      if (isEditing && invoice) {
        const { data, error } = await apiClient.PATCH("/invoices/{id}", {
          params: { path: { id: invoice.id } },
          body: payload,
        });
        if (error) throw error;
        return data;
      }

      const { data, error } = await apiClient.POST("/invoices", { body: payload });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onDone();
    },
    onError: (error) => {
      const details = error.error?.details;
      details?.forEach((d) => {
        if (d.field && d.message) setError(d.field as keyof TFormInput, { message: d.message });
      });
      setError("root", { message: error.error?.message ?? "Something went wrong. Please try again." });
    },
  });

  function onSubmit(values: TFormInput) {
    saveMutation.mutate(values);
  }

  if (Boolean(invoice) && invoiceDetailQuery.isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
        Loading invoice…
      </div>
    );
  }

  return (
    <form
      onSubmit={isViewing ? (e) => e.preventDefault() : handleSubmit(onSubmit)}
      className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-medium text-gray-900">
        {isViewing ? "Invoice detail" : isEditing ? "Edit invoice" : "New invoice"}
      </h2>

      {errors.root?.message && (
        <div role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errors.root.message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
            Customer name
          </label>
          <input
            id="customerName"
            type="text"
            disabled={isViewing}
            aria-invalid={errors.customerName ? true : undefined}
            aria-describedby={errors.customerName ? "customerName-error" : undefined}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:bg-gray-100 disabled:text-gray-500"
            {...register("customerName")}
          />
          {errors.customerName?.message && (
            <p id="customerName-error" className="mt-1 text-sm text-red-600">
              {errors.customerName.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
            Due date
          </label>
          <input
            id="dueDate"
            type="date"
            disabled={isViewing}
            aria-invalid={errors.dueDate ? true : undefined}
            aria-describedby={errors.dueDate ? "dueDate-error" : undefined}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:bg-gray-100 disabled:text-gray-500"
            {...register("dueDate")}
          />
          {errors.dueDate?.message && (
            <p id="dueDate-error" className="mt-1 text-sm text-red-600">
              {errors.dueDate.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <input
          id="notes"
          type="text"
          disabled={isViewing}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:bg-gray-100 disabled:text-gray-500"
          {...register("notes")}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Line items</h3>
          {!isViewing && (
            <button
              type="button"
              onClick={() => append({ productId: "", quantity: 1 })}
              className="text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              + Add item
            </button>
          )}
        </div>

        {errors.items?.message && <p className="text-sm text-red-600">{errors.items.message}</p>}

        <div className="space-y-2">
          {fields.map((field, index) => {
            const selectedProduct = products.find((p) => p.id === watchedItems[index]?.productId);
            return (
              <div key={field.id} className="flex items-start gap-2">
                <div className="flex-1">
                  <select
                    disabled={isViewing}
                    aria-invalid={errors.items?.[index]?.productId ? true : undefined}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:bg-gray-100 disabled:text-gray-500"
                    {...register(`items.${index}.productId` as const)}
                  >
                    <option value="">Select product…</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku}) — stock {product.quantityOnHand}
                      </option>
                    ))}
                  </select>
                  {errors.items?.[index]?.productId?.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.items[index]?.productId?.message}</p>
                  )}
                </div>

                <div className="w-28">
                  <input
                    type="number"
                    min={1}
                    step={1}
                    max={selectedProduct?.quantityOnHand}
                    disabled={isViewing}
                    aria-invalid={errors.items?.[index]?.quantity ? true : undefined}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:bg-gray-100 disabled:text-gray-500"
                    {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                  />
                  {errors.items?.[index]?.quantity?.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.items[index]?.quantity?.message}</p>
                  )}
                </div>

                <div className="w-32 pt-2 text-right text-sm text-gray-500">
                  {selectedProduct
                    ? MoneyUtils.lineTotal(
                      selectedProduct.unitPrice,
                      Math.max(0, watchedItems[index]?.quantity || 0)
                    ).toLocaleString()
                    : "—"}
                </div>

                {!isViewing && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="pt-2 text-sm font-medium text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-1 border-t border-gray-200 pt-4 text-sm">
        <div className="flex justify-between text-gray-500">
          <span>Subtotal</span>
          <span>{preview.subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>Tax ({preview.taxRate}%)</span>
          <span>{preview.taxAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-base font-medium text-gray-900">
          <span>Total</span>
          <span>{preview.total.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {!isViewing && (
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving…" : isEditing ? "Save changes" : "Create invoice"}
          </button>
        )}
        <button
          type="button"
          onClick={onDone}
          className={
            isViewing
              ? "rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              : "text-sm font-medium text-gray-500 hover:text-gray-900"
          }
        >
          {isViewing ? "Close" : "Cancel"}
        </button>
      </div>
    </form>
  );
}
