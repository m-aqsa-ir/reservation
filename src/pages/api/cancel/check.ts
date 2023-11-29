import { nowPersianDateObject, orderStatusEnum, resSendMessage } from "@/lib/lib";
import { verifyTokenMain } from "@/lib/verifyToken";
import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";


const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  const check = await checkAuth(req, prisma)

  if (check.length == 1) {
    return resSendMessage(res, check[0], '')
  } else {
    return res.status(check[0]).json(check[1])
  }
}

export async function checkAuth(req: NextApiRequest, db: PrismaClient): Promise<[number] | [number, object]> {
  const token = req.cookies.AUTH

  if (!token) return [401]

  const verified = verifyTokenMain(token)

  if (verified == 'expired' || verified == 'invalid') return [401]

  const body: { orderId: number } = req.body

  const order = await db.order.findFirst({
    where: { id: body.orderId },
    include: { Customer: true, OrderCancel: true, Day: true }
  })

  if (!order) return [404]
  if (verified.phone != order.Customer.phone) return [401]
  if (order.OrderCancel.length > 0) return [409]//: conflict
  if (order.orderStatus == orderStatusEnum.canceled) return [400]//: canceled before

  const appConfig = await prisma.appConfig.findFirst()

  if (!appConfig) return [500]

  const now = nowPersianDateObject()
  now.setHour(0).setMinute(0).setSecond(0).setMillisecond(0)
  now.add(appConfig.dayBeforeDayToCancel, 'day')

  if (order.Day.timestamp < now.toUnix()) return [403,
    { type: 'day-before-day', value: appConfig.dayBeforeDayToCancel },
  ]

  return [200]
}