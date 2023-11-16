import { verifyTokenAdmin } from "@/lib/verifyToken";
import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient()

export type EditDayBody = {
  id: number,
  cap: number,
  isVip: boolean,
  services: number[],
  groupIds: number[]
}

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

  const body: EditDayBody = req.body

  const m = await prisma.day.findFirst({
    where: { id: body.id },
    include: {
      Order: { where: { status: 'paid' } },
      services: true,
      GroupTypes: true
    }
  })

  if (!m) {
    return res.status(404).send("no such day")
  }

  //: check if the capacity is lower than sum of paid orders volume
  const sum = m.Order.reduce((sum, i) => sum + i.volume, 0)

  if (body.cap < sum) {
    return res.status(403).send("chosen cap is lower than paid orders")
  }

  const disconnectServices = m
    .services
    .map(i => i.id)
    .filter(i => !body.services.includes(i))
    .map(id => ({ id }))

  const disconnectGroups = m
    .GroupTypes
    .map(i => i.id)
    .filter(i => !body.groupIds.includes(i))
    .map(id => ({ id }))

  const newM = await prisma.day.update({
    where: {
      id: body.id
    },
    data: {
      maxVolume: body.cap,
      isVip: body.isVip,
      services: {
        disconnect: disconnectServices,
        connect: body.services.map(id => ({ id }))
      },
      GroupTypes: {
        disconnect: disconnectGroups,
        connect: body.groupIds.map(id => ({ id }))
      }
    }
  })

  return res.status(200).send('success')
}