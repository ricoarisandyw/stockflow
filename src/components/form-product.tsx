"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient } from "@/lib/api-client";
import {
  createProductSchema,
  type TCreateProductInput,
  type TUpdateProductInput,
} from "@/schemas/product.schema";
import type { components } from "@/generated/api/schema";

type TProduct = components["schemas"]["Product"];
type TProductError = components["schemas"]["StandardErrorResponse"];
type TFormValues = TCreateProductInput;

type TFormProductProps = {
  product?: TProduct;
  onDone: () => void;
};

export function FormProduct({ product, onDone }: TFormProductProps) {
  const queryClient = useQueryClient();
  const isEditing = Boolean(product);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: product
      ? {
          sku: product.sku,
          name: product.name,
          description: product.description ?? "",
          unitPrice: product.unitPrice,
          quantityOnHand: product.quantityOnHand,
        }
      : { sku: "", name: "", description: "", unitPrice: 0, quantityOnHand: 0 },
  });

  const saveMutation = useMutation<unknown, TProductError, TFormValues>({
    mutationFn: async (values) => {
      if (isEditing && product) {
        const updatePayload: TUpdateProductInput = {
          name: values.name,
          description: values.description,
          unitPrice: values.unitPrice,
          quantityOnHand: values.quantityOnHand,
        };
        const { data, error } = await apiClient.PATCH("/products/{id}", {
          params: { path: { id: product.id } },
          body: updatePayload,
        });
        if (error) throw error;
        return data;
      }

      const { data, error } = await apiClient.POST("/products", { body: values });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onDone();
    },
    onError: (error) => {
      const details = error.error?.details;
      details?.forEach((d) => {
        if (d.field && d.message) setError(d.field as keyof TFormValues, { message: d.message });
      });
      setError("root", { message: error.error?.message ?? "Something went wrong. Please try again." });
    },
  });

  function onSubmit(values: TFormValues) {
    saveMutation.mutate(values);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-medium text-gray-900">{isEditing ? "Edit product" : "Add product"}</h2>

      {errors.root?.message && (
        <div role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errors.root.message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
            SKU
          </label>
          <input
            id="sku"
            type="text"
            disabled={isEditing}
            aria-invalid={errors.sku ? true : undefined}
            aria-describedby={errors.sku ? "sku-error" : undefined}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:bg-gray-100 disabled:text-gray-500"
            {...register("sku")}
          />
          {errors.sku?.message && (
            <p id="sku-error" className="mt-1 text-sm text-red-600">
              {errors.sku.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            id="name"
            type="text"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "name-error" : undefined}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            {...register("name")}
          />
          {errors.name?.message && (
            <p id="name-error" className="mt-1 text-sm text-red-600">
              {errors.name.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <input
          id="description"
          type="text"
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? "description-error" : undefined}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          {...register("description")}
        />
        {errors.description?.message && (
          <p id="description-error" className="mt-1 text-sm text-red-600">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700">
            Unit price
          </label>
          <input
            id="unitPrice"
            type="number"
            min={0}
            step={1}
            aria-invalid={errors.unitPrice ? true : undefined}
            aria-describedby={errors.unitPrice ? "unitPrice-error" : undefined}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            {...register("unitPrice", { valueAsNumber: true })}
          />
          {errors.unitPrice?.message && (
            <p id="unitPrice-error" className="mt-1 text-sm text-red-600">
              {errors.unitPrice.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="quantityOnHand" className="block text-sm font-medium text-gray-700">
            Quantity on hand
          </label>
          <input
            id="quantityOnHand"
            type="number"
            min={0}
            step={1}
            aria-invalid={errors.quantityOnHand ? true : undefined}
            aria-describedby={errors.quantityOnHand ? "quantityOnHand-error" : undefined}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            {...register("quantityOnHand", { valueAsNumber: true })}
          />
          {errors.quantityOnHand?.message && (
            <p id="quantityOnHand-error" className="mt-1 text-sm text-red-600">
              {errors.quantityOnHand.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saveMutation.isPending ? "Saving…" : isEditing ? "Save changes" : "Add product"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
