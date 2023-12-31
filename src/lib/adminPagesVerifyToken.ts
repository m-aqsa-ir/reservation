import { GetServerSidePropsContext } from "next";
import { verifyTokenAdmin } from "./verifyToken";

export function pageVerifyToken(
  { context, callbackSuccess }: {
    context: GetServerSidePropsContext, callbackSuccess?: Function
  }) {
  const token = context.req.cookies['AUTH_ADMIN']

  if (token == undefined) {
    return {
      redirect: { destination: '/admin/login' }
      , props: {}
    }
  }

  const verify = verifyTokenAdmin(token)

  if (verify == 'expired' || verify == 'invalid') {
    return {
      redirect: { destination: '/admin/login' }
      , props: {}
    }
  }

  if (callbackSuccess) return callbackSuccess()
  else return { props: {} }
}