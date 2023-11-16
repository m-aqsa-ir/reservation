import { verifyTokenAdmin } from "@/lib/verifyToken";
import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient()

export type AddDayBody = {
  timestamp: number,
  vip: boolean,
  cap: number,
  desc: string,

  day: number,
  month: number,
  year: number,

  serviceIds: number[],
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

  const {
    timestamp, vip, cap, day, month, year, serviceIds, groupIds, desc
  }: AddDayBody = req.body

  try {
    const n = await prisma.day.create({
      data: {
        maxVolume: cap,
        day, month, year, timestamp, desc,
        isVip: vip,
        services: {
          connect: serviceIds.map(id => ({ id }))
        },
        GroupTypes: {
          connect: groupIds.map(id => ({ id }))
        }
      }
    })

    return res.status(200).send({
      id: n.id
    })
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code == 'P2002') {
        return res.status(400).send("duplicate")
      }
    } else {
      console.error(error)
      return res.status(500).send("")
    }
  }
}