import { JsonWebTokenError, TokenExpiredError, verify } from "jsonwebtoken";


export function verifyToken(token: string) {
  let payload: { phone: string } = { phone: '' }

  const key = process.env.AUTH_JWT_KEY

  if (!key) {
    throw new Error('no jwt key')
  }

  try {
    payload = verify(token, key) as { phone: string }
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return 'expired'
    }
    if (error instanceof JsonWebTokenError)
      return 'invalid'

    throw error
  }

  return payload
}