import { TRPCError } from '@trpc/server'
import { t } from '@/server/api/trpc'
import { AuthLib } from '@/lib/auth.lib'

export const authMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.token) throw new TRPCError({ code: 'UNAUTHORIZED' })

  const session = await AuthLib.verifySession(ctx.token)
  if (!session) throw new TRPCError({ code: 'UNAUTHORIZED' })

  const user = await ctx.prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true },
  })
  if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' })

  return next({
    ctx: {
      ...ctx,
      user,
    },
  })
})
