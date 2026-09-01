import { cache } from 'react'
import { appRouter } from '@/server/api/app.router'
import { createTRPCContext } from '@/server/api/context'

const createContext = cache(async () => createTRPCContext())

export const api = async () => {
  const ctx = await createContext()
  return appRouter.createCaller(ctx)
}
