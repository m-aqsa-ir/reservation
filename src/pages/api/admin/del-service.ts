import { verifyTokenAdmin } from "@/lib/verifyToken"
import { PrismaClient } from "@prisma/client"
import { NextApiRequest, NextApiResponse } from "next"

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.cookies["AUTH_ADMIN"] == undefined) {
    return res.status(401).send("")
  }
  const tokenVerify = verifyTokenAdmin(req.cookies["AUTH_ADMIN"])
  if (tokenVerify == "expired" || tokenVerify == "invalid") {
    return res.status(401).send("")
  }

  const body: { id: number } = req.body

  const a = await prisma.service.findFirst({
    where: { id: body.id },
    include: {
      OrderService: true,
      day: true
    }
  })

  if (a == null) {
    return res.status(404).send("no such service")
  }

  if (a.OrderService.length != 0) {
    return res.status(403).send("order")
  }

  if (a.day.length != 0) {
    return res.status(403).send("day")
  }

  //: deleting
  await prisma.service.delete({
    where: { id: body.id }
  })

  return res.status(200).send("success")
}
