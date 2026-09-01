import { cookies } from 'next/headers'
import { AuthLib } from '@/lib/auth.lib'
import { prisma } from '@/lib/prisma'

export async function createTRPCContext() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AuthLib.COOKIE_NAME)?.value

  return {
    prisma,
    token,
  }
}

export type TTrpcContext = Awaited<ReturnType<typeof createTRPCContext>>
