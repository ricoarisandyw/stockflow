import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma'

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)

  const user = await prisma.user.upsert({
    where: { email: 'demo@stockflow.dev' },
    update: {},
    create: {
      email: 'demo@stockflow.dev',
      passwordHash,
      name: 'Demo User',
    },
  })

  const products = [
    { sku: 'VAL-001', name: 'Ball Valve', description: '1/2 inch brass ball valve', unitPrice: 50000, quantityOnHand: 25 },
    { sku: 'PIP-002', name: 'PVC Pipe 3m', description: 'Standard 3-meter PVC pipe', unitPrice: 35000, quantityOnHand: 40 },
    { sku: 'FIT-003', name: 'Elbow Fitting', description: '90-degree elbow fitting', unitPrice: 12000, quantityOnHand: 100 },
    { sku: 'PMP-004', name: 'Water Pump', description: '125W submersible water pump', unitPrice: 350000, quantityOnHand: 8 },
    { sku: 'TAP-005', name: 'Faucet Tap', description: 'Chrome-plated kitchen faucet', unitPrice: 85000, quantityOnHand: 15 },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { userId_sku: { userId: user.id, sku: product.sku } },
      update: {},
      create: { ...product, userId: user.id },
    })
  }

  console.log('Seed complete:', user.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
