import { NextApiRequest, NextApiResponse } from "next"
import { verifyTokenAdmin } from "./verifyToken"
import { PrismaClient } from "@prisma/client"
import { Dispatch } from "@reduxjs/toolkit"
import { showMessage } from "@/redux/messageSlice"
import { NextRouter } from "next/router"

export function handleWithAuth(callback: (a: {
  req: NextApiRequest,
  res: NextApiResponse,
  prisma: PrismaClient
}) => Promise<any> | any) {

  return async function handler(
    req: NextApiRequest,
    res: NextApiResponse
  ) {

    if (req.cookies['AUTH_ADMIN'] == undefined) {
      return res.status(401).send("")
    }
    const tokenVerify = verifyTokenAdmin(req.cookies['AUTH_ADMIN'])
    if (tokenVerify == 'expired' || tokenVerify == 'invalid') {
      return res.status(401).send("")
    }

    const prisma = new PrismaClient()

    return callback({ req, res, prisma })
  }

}

export function resHandleNotAuth(res: Response, dispatch: Dispatch, router: NextRouter) {
  if (res.status == 401) {
    dispatch(showMessage({ message: 'باید دوباره وارد شوید!' }))
    router.push('/admin')
  } else {
    console.log(res.status)
  }
}