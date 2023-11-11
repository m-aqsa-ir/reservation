import { PayBundle } from "@/types";
import { PrismaClient } from "@prisma/client";
import _ from "lodash";
import { NextApiRequest, NextApiResponse } from "next";
import ZarinPal from "zarinpal-checkout";

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {


  const body: PayBundle = req.body

  //: find day
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

  //: create or update customer info
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

  //: create orders
  const order = await prisma.order.create({
    data: {
      volume: body.volume.volume,
      groupName: body.groupName,
      groupType: body.groupType,
      timeRegistered: body.reserveTimeTimestamp,
      status: 'await-payment',


      prePayAmount: body.prepayAmount,
      calculatedAmount: body.calculatePrice,

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

  //: attach services
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

  const merchantID = process.env.ZARIN_PAL_MERCHANT_ID

  console.log(merchantID)

  if (merchantID == undefined) {
    return res.status(500).send("")
  }

  const zarinPal = ZarinPal.create(merchantID, false)

  try {
    const payRes = await zarinPal.PaymentRequest({
      Amount: 1,
      CallbackURL: (
        process.env.PAYMENT_CALLBACK_URL_BASE ?? "http://localhost:3000/ticket") +
        `?orderID=${order.id}&amount=${order.prePayAmount}`,
      Description: ''
    })

    //: save authority in DB
    await prisma.order.update({
      data: {
        paymentAuthority: payRes.authority
      },
      where: {
        id: order.id
      }
    })

    console.log(payRes)

    return res.status(200).send(payRes.url)

  } catch (error) {
    return res.status(500).send(error)
  }
}