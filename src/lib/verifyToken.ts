import { createHash } from "crypto"
import { JsonWebTokenError, TokenExpiredError, verify } from "jsonwebtoken"
import { GetServerSidePropsContext } from "next"

export type VerifyMainToken = "expired" | "invalid" | { phone: string }

// DEPRECATED
export function verifyTokenMain(token: string) {
  const key = process.env.AUTH_JWT_KEY

  if (!key) {
    throw new Error("no jwt key")
  }

  return verifyToken(token, key) as VerifyMainToken
}
// DEPRECATED
export function verifyTokenAdmin(token: string) {
  const key = process.env.AUTH_JWT_KEY_ADMIN

  if (!key) {
    throw new Error("no jwt key")
  }

  return verifyToken(token, key) as "expired" | "invalid" | { username: string }
}

////////////////////////////// NEW CODE

export function verifyToken<T>(token: string, key: string) {
  try {
    const payload = verify(token, key)
    return payload as T
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return "expired"
    }
    if (error instanceof JsonWebTokenError) return "invalid"

    throw error
  }
}

export function createMyHash(data: string, key: null | string = null) {
  const d = createHash("sha256").update(data)

  if (key) {
    return d.update(key).digest("base64")
  } else {
    return d.digest("base64")
  }
}

export function getEnvAuthKey() {
  const authJwtKey = process.env.AUTH_JWT_KEY
  if (!authJwtKey) {
    throw Error("no auth jwt key")
  }

  return authJwtKey
}

export type TokenPayload = {
  id: string
  phone: string
  name: string
  natCode: string
}

export function pageGetAuth(context: GetServerSidePropsContext) {
  const { cookies } = context.req

  const authToken = cookies["AUTH"]

  const redirectObj = {
    status: "redirect" as "redirect",
    obj: {
      props: {},
      redirect: {
        destination: "/_select"
      }
    }
  }

  if (!authToken) return redirectObj

  const v = verifyToken<TokenPayload>(authToken, getEnvAuthKey())

  if (v == "expired" || v == "invalid") {
    return redirectObj
  }

  return {
    status: "ok" as "ok",
    obj: v
  }
}
