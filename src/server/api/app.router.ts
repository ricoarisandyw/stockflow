import { createTRPCRouter } from '@/server/api/trpc'
import { authRouter } from '@/server/api/routers/auth.router'

export const appRouter = createTRPCRouter({
  auth: authRouter,
})

export type TAppRouter = typeof appRouter
