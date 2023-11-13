import { verifyTokenAdmin } from "@/lib/verifyToken";
import { PrismaClient } from "@prisma/client";
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
    id: number
  } = req.body

  const orders = await prisma.order.findMany({
    where: { dayId: body.id }
  })

  if (orders.length == 0) {
    const a = await prisma.day.delete({
      where: {
        id: body.id
      }
    })

    return res.status(200).send("success")
  } else {
    return res.status(403).send("some orders connected to this day")
  }
}