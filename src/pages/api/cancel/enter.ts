import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { checkAuth } from "./check";
import { resSendMessage } from "@/lib/lib";
import { sendSms, sendSmsToManager } from "@/lib/sendSms";


const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  const c = await checkAuth(req, prisma)

  if (c[0] != 200) {
    if (c.length == 1) return resSendMessage(res, c[0], '')
    else return res.status(c[0]).json(c[1])
  }

  const body: { orderId: number, reason: string } = req.body

  if (!body.reason) return resSendMessage(res, 400, '')

  const order = await prisma.order.findFirst({
    where: { id: body.orderId }, include: { Customer: true }
  })

  const orderCancel = await prisma.orderCancel.create({
    data: {
      orderId: body.orderId,
      reason: body.reason
    }
  })

  const appConfig = await prisma.appConfig.findFirst()
  if (appConfig) {
    await sendSmsToManager(appConfig, {
      "phone": order!.Customer.phone.toString(),
      "order-id": order!.id,
    }, process.env.SMS_PATTERN_CANCEL_ORDER_ADMIN!)
  }

  return resSendMessage(res, 200, '')

}