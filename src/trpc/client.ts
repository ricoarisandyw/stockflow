import { createTRPCReact } from '@trpc/react-query'
import type { TAppRouter } from '@/server/api/app.router'

export const api = createTRPCReact<TAppRouter>()
