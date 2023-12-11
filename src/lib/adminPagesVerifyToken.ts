import { GetServerSidePropsContext } from "next"
import { verifyTokenAdmin } from "./verifyToken"
import { PrismaClient } from "@prisma/client"
import { getPrisma4AdminPages } from "./prismaGlobal"

export function pageVerifyToken({
  context,
  callbackSuccess
}: {
  context: GetServerSidePropsContext
  callbackSuccess?: (p: PrismaClient) => any
}) {
  const token = context.req.cookies["AUTH_ADMIN"]

  if (token == undefined) {
    return {
      redirect: { destination: "/admin/login" },
      props: {}
    }
  }

  const verify = verifyTokenAdmin(token)

  if (verify == "expired" || verify == "invalid") {
    return {
      redirect: { destination: "/admin/login" },
      props: {}
    }
  }

  if (callbackSuccess) return callbackSuccess(getPrisma4AdminPages())
  else return { props: {} }
}
