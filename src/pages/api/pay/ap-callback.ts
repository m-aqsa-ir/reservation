import { apVerify } from "@/lib/aqhayePardakht"
import { nowPersianDateObject, resSendMessage } from "@/lib/lib"
import { checkAndModifyOrderState } from "@/lib/orderCheckState"
import { getPrisma4MainApi } from "@/lib/prismaGlobal"
import { sendSms, sendSmsToManager } from "@/lib/sendSms"
import { NextApiRequest, NextApiResponse } from "next"

const prisma = getPrisma4MainApi()

//: THIS API WILL BE CALLED BY `AGHAY-E PARDAKHT`
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  async function returnUnverified(order: any) {
    //: set order payment authority to null, meaning that payment was ** verified and was unsuccessful **
    await prisma.order.update({
      data: {
        paymentAuthority: null
      },
      where: {
        id: order.id
      }
    })

    return res.redirect(`/ticket?orderID=${order.id}`)
  }

  const body: {
    transid: string
    cardnumber: string
    tracking_number: string
    invoice_id: string //: order id
    bank: string
    status:
      | 0 //: un-success
      | 1 //: success
  } = req.body

  const order = await prisma.order.findFirst({
    where: {
      paymentAuthority: body.transid
    },
    include: {
      Customer: true,
      Day: true,
      Transaction: true,
      OrderService: {
        include: {
          Service: true
        }
      }
    }
  })

  if (!order) return res.status(500).send("")

  //: if payment unsuccessful
  if (body.status != 1) {
    return await returnUnverified(order)
  }

  if (order.paymentAuthority == null) return resSendMessage(res, 500, "")

  const appConfig = await prisma.appConfig.findFirst()

  if (appConfig == null) return resSendMessage(res, 500, "")

  //: verify transaction >>>
  if (!appConfig.appTestMode) {
    const verifyRes = await apVerify({
      transid: order.paymentAuthority,
      amount: order.prePayAmount,
      pin: appConfig.paymentPortalMerchantId
    })

    if (verifyRes != "verified") {
      return await returnUnverified(order)
    }
  }
  //: <<<

  //: check db for previous transactions
  let transaction = await prisma.transaction.findFirst({
    where: { payId: body.transid }
  })

  if (transaction != null)
    return res.status(500).send("another transaction exist")

  //: add transaction
  const now = nowPersianDateObject()

  transaction = await prisma.transaction.create({
    data: {
      payId: body.transid,
      payPortal: `درگاه پرداخت (آقای پرداخت)`,
      valuePaid: order.prePayAmount,
      payDate: now.format("YYYY/MM/DD-HH:mm"),
      payDateTimestamp: now.toUnix(),
      orderId: order.id,
      customerId: order.customerId
    }
  })

  //: set order status to paid
  await checkAndModifyOrderState(order.id, prisma)

  //: send sms for order
  await sendSms(
    order.Customer.phone,
    { "order-id": order.id },
    process.env.SMS_PATTERN_SUCCESS_ORDER!
  )

  //: send sms to managers
  if (appConfig)
    await sendSmsToManager(
      appConfig,
      {
        phone: order.Customer.phone.toString(),
        "order-id": order.id
      },
      process.env.SMS_PATTERN_SUCCESS_ORDER_ADMIN!
    )

  res.redirect(`/ticket?orderID=${order.id}`)

  return
}
