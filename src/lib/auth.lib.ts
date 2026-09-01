import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)
const COOKIE_NAME = 'stockflow_token'

export type TSessionPayload = {
  userId: string
}

async function signSession(payload: TSessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

async function verifySession(token: string): Promise<TSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as TSessionPayload
  } catch {
    return null
  }
}

export const AuthLib = {
  COOKIE_NAME,
  signSession,
  verifySession,
}
