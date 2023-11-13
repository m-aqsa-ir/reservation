import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient()

export type AddDayBody = {
  timestamp: number,
  vip: boolean,
  cap: number,

  day: number,
  month: number,
  year: number,

  serviceIds: number[]
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    timestamp, vip, cap, day, month, year, serviceIds
  }: AddDayBody = req.body

  try {
    const n = await prisma.day.create({
      data: {
        maxVolume: cap,
        day, month, year, timestamp,
        isVip: vip,
        services: {
          connect: serviceIds.map(i => ({ id: i }))
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