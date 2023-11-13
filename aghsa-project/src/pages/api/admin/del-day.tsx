import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

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