import { verifyTokenAdmin } from "@/lib/verifyToken";
import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient()

export default async function handler(
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

  const body: {
    volume: number,
    discount: number
  } = req.body

  try {
    const a = await prisma.volumeList.create({
      data: {
        volume: body.volume,
        discountPercent: body.discount
      }
    })

    return res.status(200).send(a.id)
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError
      && error.code == 'P2002') {
      return res.status(403).send("another exist")
    } else {
      console.error(error)
    }
  }

}