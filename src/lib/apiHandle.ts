import { NextApiRequest, NextApiResponse } from "next"
import { verifyTokenAdmin } from "./verifyToken"
import { PrismaClient } from "@prisma/client"
import { Dispatch } from "@reduxjs/toolkit"
import { showMessage } from "@/redux/messageSlice"
import { NextRouter } from "next/router"
import { getPrisma4AdminApi } from "./prismaGlobal"

export function handleWithAuth(
  callback: (a: {
    req: NextApiRequest
    res: NextApiResponse
    prisma: PrismaClient
  }) => Promise<any> | any
) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.cookies["AUTH_ADMIN"] == undefined) {
      return res.status(401).send("")
    }
    const tokenVerify = verifyTokenAdmin(req.cookies["AUTH_ADMIN"])
    if (tokenVerify == "expired" || tokenVerify == "invalid") {
      return res.status(401).send("")
    }

    const prisma = getPrisma4AdminApi()

    return callback({ req, res, prisma })
  }
}

export function resHandleNotAuth(
  res: Response,
  dispatch: Dispatch,
  router: NextRouter
) {
  if (res.status == 409 || res.status == 404) {
    dispatch(
      showMessage({ message: "اطلاعات تغییر کرده است.", type: "bg-warning" })
    )
    setTimeout(() => {
      router.reload()
    }, 1000)
  } else if (res.status == 401) {
    dispatch(showMessage({ message: "باید دوباره وارد شوید!" }))
    router.push("/admin")
  } else {
    console.log(res.status)
    res.text().then(console.log)
  }
}
