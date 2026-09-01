import { initTRPC } from '@trpc/server'
import superjson from 'superjson'
import type { TTrpcContext } from './context'
import { authMiddleware } from '../middleware/auth.middleware'

export const t = initTRPC.context<TTrpcContext>().create({
  transformer: superjson,
})

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(authMiddleware)