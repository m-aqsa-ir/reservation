import { NextApiRequest, NextApiResponse } from "next"
import { checkAuth } from "./check"
import { resSendMessage } from "@/lib/lib"
import { sendSmsToManager } from "@/lib/sendSms"
import { getPrisma4MainApi } from "@/lib/prismaGlobal"
import { baleCancelRequest, sendBaleMessage } from "@/lib/sendBaleMessage"

const prisma = getPrisma4MainApi()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const c = await checkAuth(req, prisma)

  if (c[0] != 200) {
    if (c.length == 1) return resSendMessage(res, c[0], "")
    else return res.status(c[0]).json(c[1])
  }

  const body: { orderId: number; reason: string } = req.body

  if (!body.reason) return resSendMessage(res, 400, "")

  const order = await prisma.order.findFirst({
    where: { id: body.orderId },
    include: { Customer: true }
  })

  if (order == null) return resSendMessage(res, 404, "")

  const orderCancel = await prisma.orderCancel.create({
    data: {
      orderId: body.orderId,
      reason: body.reason
    }
  })

  const appConfig = await prisma.appConfig.findFirst()
  if (appConfig) {
    await sendSmsToManager(
      appConfig,
      {
        phone: order.Customer.phone.toString(),
        "order-id": order.id
      },
      process.env.SMS_PATTERN_CANCEL_ORDER_ADMIN!
    )

    await sendBaleMessage(
      appConfig,
      baleCancelRequest(order.Customer.name, order.Customer.phone, order.id, orderCancel.reason)
    )
  }

  return resSendMessage(res, 200, "")
}
