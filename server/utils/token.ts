import { SignJWT, type JWTPayload, jwtVerify } from 'jose'

type TokenPayload = {
  sub: string
  email: string
  role: string
}

const encoder = new TextEncoder()

function getSecret() {
  const config = useRuntimeConfig()
  const s = String(config.jwtSecret || '')
  const min = import.meta.dev ? 8 : 32
  if (s.length < min) {
    throw new Error(
      import.meta.dev
        ? 'JWT_SECRET is missing or too short (min 8 in dev, 32 in production)'
        : 'JWT_SECRET must be at least 32 characters in production'
    )
  }
  return encoder.encode(s)
}

/**
 * In API routes, useRuntimeConfig is available. For scripts, do not use this.
 */
export async function signAccessToken(data: TokenPayload) {
  const secret = getSecret()
  return new SignJWT({ email: data.email, role: data.role } satisfies Record<string, string>)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(data.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyAccessToken(token: string) {
  const secret = getSecret()
  const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] })
  return payload as JWTPayload & { email: string; role: string }
}
