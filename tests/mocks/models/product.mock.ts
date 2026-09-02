import { vi } from "vitest";

export interface MockProduct {
  id: string;
  userId: string;
  sku: string;
  name: string;
  description: string | null;
  unitPrice: number;
  quantityOnHand: number;
  createdAt: Date;
  updatedAt: Date;
}

let products: MockProduct[] = [];
let nextId = 1;

function reset() {
  products = [];
  nextId = 1;
}

function seedProduct(partial: Partial<MockProduct> & { userId: string }): MockProduct {
  const id = partial.id ?? `prd_${nextId++}`;
  const product: MockProduct = {
    id,
    userId: partial.userId,
    sku: partial.sku ?? id,
    name: partial.name ?? "Test Product",
    description: partial.description ?? null,
    unitPrice: partial.unitPrice ?? 850000,
    quantityOnHand: partial.quantityOnHand ?? 10,
    createdAt: partial.createdAt ?? new Date(),
    updatedAt: partial.updatedAt ?? new Date(),
  };
  products.push(product);
  return product;
}

function matchesSearch(product: MockProduct, search?: string) {
  if (!search) return true;
  const term = search.toLowerCase();
  return product.name.toLowerCase().includes(term) || product.sku.toLowerCase().includes(term);
}

type TProductWhere = {
  userId?: string;
  OR?: Array<{ name?: { contains?: string }; sku?: { contains?: string } }>;
};

function filterProducts(where: TProductWhere) {
  return products.filter((p) => {
    if (where.userId && p.userId !== where.userId) return false;
    if (where.OR) {
      const search = where.OR[0]?.name?.contains ?? where.OR[0]?.sku?.contains;
      if (!matchesSearch(p, search)) return false;
    }
    return true;
  });
}

export const productModel = {
  findUnique: vi.fn(
    async ({
      where,
    }: {
      where: { id?: string; userId_sku?: { userId: string; sku: string } };
    }) => {
      if (where.id) return products.find((p) => p.id === where.id) ?? null;
      if (where.userId_sku) {
        return (
          products.find(
            (p) => p.userId === where.userId_sku!.userId && p.sku === where.userId_sku!.sku
          ) ?? null
        );
      }
      return null;
    }
  ),
  findMany: vi.fn(
    async ({
      where,
      orderBy,
      skip = 0,
      take,
    }: {
      where: TProductWhere;
      orderBy?: Record<string, "asc" | "desc">;
      skip?: number;
      take?: number;
    }) => {
      let result = filterProducts(where);
      if (orderBy) {
        const [field, dir] = Object.entries(orderBy)[0] as [keyof MockProduct, "asc" | "desc"];
        result = [...result].sort((a, b) => {
          const av = a[field];
          const bv = b[field];
          if (av === bv) return 0;
          const cmp = av! > bv! ? 1 : -1;
          return dir === "asc" ? cmp : -cmp;
        });
      }
      return result.slice(skip, take ? skip + take : undefined);
    }
  ),
  count: vi.fn(async ({ where }: { where: TProductWhere }) => {
    return filterProducts(where).length;
  }),
  create: vi.fn(
    async ({
      data,
    }: {
      data: {
        userId: string;
        sku: string;
        name: string;
        description?: string;
        unitPrice: number;
        quantityOnHand: number;
      };
    }) => seedProduct(data)
  ),
  update: vi.fn(
    async ({
      where,
      data,
    }: {
      where: { id: string };
      data: Partial<Pick<MockProduct, "name" | "description" | "unitPrice">> & {
        quantityOnHand?: number | { increment?: number; decrement?: number };
      };
    }) => {
      const product = products.find((p) => p.id === where.id);
      if (!product) throw new Error("Product not found");

      const { quantityOnHand, ...rest } = data;
      Object.assign(product, rest);
      if (typeof quantityOnHand === "number") {
        product.quantityOnHand = quantityOnHand;
      } else if (quantityOnHand?.increment !== undefined) {
        product.quantityOnHand += quantityOnHand.increment;
      } else if (quantityOnHand?.decrement !== undefined) {
        product.quantityOnHand -= quantityOnHand.decrement;
      }
      product.updatedAt = new Date();
      return product;
    }
  ),
  delete: vi.fn(async ({ where }: { where: { id: string } }) => {
    const index = products.findIndex((p) => p.id === where.id);
    if (index === -1) throw new Error("Product not found");
    const [deleted] = products.splice(index, 1);
    return deleted;
  }),
};

export const productTestUtils = {
  reset,
  seedProduct,
  getProducts: () => products,
};
