import { JsonWebTokenError, TokenExpiredError, verify } from "jsonwebtoken";


export function verifyToken(token: string, key: string) {
  let payload: { phone: string } = { phone: '' }
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