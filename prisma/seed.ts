import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const adapter = new PrismaLibSql({ url, authToken });
const prisma = new PrismaClient({ adapter });

const DEMO_EMAIL = "staff@stockflow.dev";
const DEMO_PASSWORD = "Password123!";

const DEMO_PRODUCTS = [
  {
    sku: "KB-MCH-01",
    name: "Mechanical Keyboard TKL",
    description: "Wireless RGB Mechanical Keyboard",
    unitPrice: 850000,
    quantityOnHand: 25,
  },
  {
    sku: "MS-WL-02",
    name: "Wireless Mouse Ergonomic",
    description: "2.4GHz wireless mouse with silent click",
    unitPrice: 175000,
    quantityOnHand: 60,
  },
  {
    sku: "MN-27-4K",
    name: "27-inch 4K Monitor",
    description: "IPS panel, HDR400, 60Hz",
    unitPrice: 4200000,
    quantityOnHand: 12,
  },
  {
    sku: "HS-BT-03",
    name: "Bluetooth Headset",
    description: "Noise-cancelling over-ear headset",
    unitPrice: 650000,
    quantityOnHand: 40,
  },
  {
    sku: "WC-USB-01",
    name: "USB Webcam 1080p",
    description: "Autofocus webcam with built-in mic",
    unitPrice: 320000,
    quantityOnHand: 30,
  },
];

const TAX_RATE_PERCENT = Number(process.env.TAX_RATE_PERCENT ?? 11);

function buildTotals(items: { unitPrice: number; quantity: number }[]) {
  const lineTotals = items.map((item) => item.unitPrice * item.quantity);
  const subtotal = lineTotals.reduce((sum, value) => sum + value, 0);
  const taxAmount = Math.floor((subtotal * TAX_RATE_PERCENT) / 100);
  const total = subtotal + taxAmount;
  return { lineTotals, subtotal, taxAmount, total };
}

interface DemoInvoiceSpec {
  invoiceNumber: string;
  customerName: string;
  status: "DRAFT" | "ISSUED" | "PAID" | "CANCELLED";
  daysAgo: number;
  notes?: string;
  items: { sku: string; quantity: number }[];
}

const DEMO_INVOICES: DemoInvoiceSpec[] = [
  {
    invoiceNumber: "INV-2026-0001",
    customerName: "PT Teknologi Maju",
    status: "PAID",
    daysAgo: 14,
    items: [
      { sku: "KB-MCH-01", quantity: 2 },
      { sku: "MS-WL-02", quantity: 2 },
    ],
  },
  {
    invoiceNumber: "INV-2026-0002",
    customerName: "CV Sumber Digital",
    status: "ISSUED",
    daysAgo: 5,
    notes: "Pengiriman ke gudang cabang Bandung.",
    items: [{ sku: "MN-27-4K", quantity: 3 }],
  },
  {
    invoiceNumber: "INV-2026-0003",
    customerName: "Toko Elektronik Jaya",
    status: "DRAFT",
    daysAgo: 1,
    items: [
      { sku: "HS-BT-03", quantity: 4 },
      { sku: "WC-USB-01", quantity: 4 },
    ],
  },
  {
    invoiceNumber: "INV-2026-0004",
    customerName: "PT Nusantara Kreatif",
    status: "CANCELLED",
    daysAgo: 20,
    notes: "Dibatalkan atas permintaan pelanggan.",
    items: [{ sku: "KB-MCH-01", quantity: 1 }],
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      passwordHash,
      name: "Staff Distribution",
    },
  });

  const productBySku = new Map<string, Awaited<ReturnType<typeof prisma.product.upsert>>>();
  for (const product of DEMO_PRODUCTS) {
    const created = await prisma.product.upsert({
      where: { userId_sku: { userId: user.id, sku: product.sku } },
      update: {},
      create: { ...product, userId: user.id },
    });
    productBySku.set(product.sku, created);
  }

  let invoiceCount = 0;
  for (const spec of DEMO_INVOICES) {
    const existing = await prisma.invoice.findUnique({
      where: { invoiceNumber: spec.invoiceNumber },
    });
    if (existing) continue;

    const items = spec.items.map(({ sku, quantity }) => {
      const product = productBySku.get(sku);
      if (!product) throw new Error(`Seed product ${sku} not found`);
      return { product, quantity };
    });
    const { lineTotals, subtotal, taxAmount, total } = buildTotals(
      items.map(({ product, quantity }) => ({ unitPrice: product.unitPrice, quantity }))
    );

    const issueDate = new Date(Date.now() - spec.daysAgo * 24 * 60 * 60 * 1000);
    const dueDate = new Date(issueDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    await prisma.invoice.create({
      data: {
        userId: user.id,
        invoiceNumber: spec.invoiceNumber,
        customerName: spec.customerName,
        issueDate,
        dueDate,
        status: spec.status,
        notes: spec.notes,
        taxRate: TAX_RATE_PERCENT,
        subtotal,
        taxAmount,
        total,
        items: {
          create: items.map(({ product, quantity }, index) => ({
            productId: product.id,
            productName: product.name,
            unitPrice: product.unitPrice,
            quantity,
            lineTotal: lineTotals[index],
          })),
        },
      },
    });
    invoiceCount += 1;
  }

  console.log(
    `Seeded user ${user.email} with ${DEMO_PRODUCTS.length} products and ${invoiceCount} invoices.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
