import { handleWithAuth } from "@/lib/apiHandle";
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


export default handleWithAuth(async ({ req, res, prisma }) => {
  const {
    timestamp, vip, cap, day, month, year, serviceIds, groupIds, desc
  }: AddDayBody = req.body

  const trimDesc = desc.trim()

  try {

    //: check uniqueness
    const m = await prisma.day.findFirst({
      where: {
        day, month, year, desc: trimDesc
      }
    })

    if (m != null) return res.status(403).json(403)


    const n = await prisma.day.create({
      data: {
        maxVolume: cap,
        day, month, year, timestamp, desc: trimDesc,
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
        return res.status(403).send("duplicate")
      }
    } else {
      console.error(error)
      return res.status(500).send("")
    }
  }
})