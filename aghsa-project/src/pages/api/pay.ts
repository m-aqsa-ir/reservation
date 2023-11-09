import { PayBundle } from "@/types";
import { PrismaClient } from "@prisma/client";
import _ from "lodash";
import { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const body: PayBundle = req.body

  const day = await prisma.day.findFirst({
    where: {
      AND: [
        { day: { equals: body.day.day } },
        { month: { equals: body.day.month } },
        { year: { equals: body.day.year } }
      ]
    }
  })

  if (!day) return res.status(401).send("no such day in db")

  const customer = await prisma.customer.upsert({
    create: {
      phone: body.phoneNum,
      name: body.groupLeaderName,
      nationalCode: body.nationalCode
    },
    update: {
      phone: body.phoneNum,
      name: body.groupLeaderName,
      nationalCode: body.nationalCode
    },
    where: {
      phone: body.phoneNum
    }
  })

  const order = await prisma.order.create({
    data: {
      volume: body.volume.volume,
      groupType: body.groupType,
      timeRegistered: body.reserveTimeTimestamp,

      customerId: customer.id,
      dayId: day?.id,

      Discount: body.volume.discountPercent != 0 ? {
        create: {
          value: body.volume.discountPercent,
          desc: `discount for volume ${body.volume.volume}`
        }
      } : undefined,
    }
  })

  await prisma.orderService.createMany({
    data: body.pac instanceof Array ? body.pac.map(i => ({
      price: i.price,
      isVip: day.isVip,
      orderId: order.id,
      serviceId: i.id
    })) : {
      price: body.pac.price,
      isVip: day.isVip,
      orderId: order.id,
      serviceId: body.pac.id,
    }
  })

  return res.status(200).send("success")
}