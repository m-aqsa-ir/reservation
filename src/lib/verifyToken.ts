import {
  JsonWebTokenError,
  TokenExpiredError,
  verify
} from "jsonwebtoken"

function verifyToken(
  token: string,
  key: string
): "expired" | "invalid" | Object {
  try {
    const payload = verify(token, key)
    return payload
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return "expired"
    }
    if (error instanceof JsonWebTokenError) return "invalid"

    throw error
  }
}

export type VerifyMainToken = "expired" | "invalid" | { phone: string }

export function verifyTokenMain(token: string) {
  const key = process.env.AUTH_JWT_KEY

  if (!key) {
    throw new Error("no jwt key")
  }

  return verifyToken(token, key) as VerifyMainToken
}

export function verifyTokenAdmin(token: string) {
  const key = process.env.AUTH_JWT_KEY_ADMIN

  if (!key) {
    throw new Error("no jwt key")
  }

  return verifyToken(token, key) as "expired" | "invalid" | { username: string }
}
