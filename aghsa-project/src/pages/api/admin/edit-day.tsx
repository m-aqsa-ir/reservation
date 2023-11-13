import { PrismaClient, Service } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient()

export type EditDayBody = {
  id: number,
  cap: number,
  isVip: boolean,
  services: number[]
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const body: EditDayBody = req.body

  const m = await prisma.day.findFirst({
    where: { id: body.id },
    include: {
      Order: { where: { status: 'paid' } },
      services: true
    }
  })

  if (!m) {
    return res.status(401).send("no such day")
  }

  //: check if the capacity is lower than sum of paid orders volume
  const sum = m.Order.reduce((sum, i) => sum + i.volume, 0)

  if (body.cap < sum) {
    return res.status(403).send("chosen cap is lower than paid orders")
  }

  const disconnect = m.services.map(i => i.id).filter(i => !body.services.includes(i))

  const newM = await prisma.day.update({
    where: {
      id: body.id
    },
    data: {
      maxVolume: body.cap,
      isVip: body.isVip,
      services: {
        disconnect: disconnect.map(i => ({
          id: i
        })),
        connect: body.services.map(i => ({
          id: i
        }))
      }
    }
  })


  return res.status(200).send('success')


}