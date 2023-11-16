import { PrismaClient } from "@prisma/client";
import _ from "lodash";
import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "soap";

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  const body: PayBundle = req.body

  //: find day
  const day = await prisma.day.findFirst({
    where: {
      id: body.day.id
    },
    include: {
      Order: {
        where: {
          status: { not: 'await-payment' }
        }
      }
    }
  })

  if (!day) return res.status(401).send("no such day in db")

  //: check volume more than day volume
  const sumOfPreviousPaidOrders = day.Order.reduce((sum, i) => sum + i.volume, 0)

  const realCap = day.maxVolume - sumOfPreviousPaidOrders

  if (body.volume.volume > realCap) {
    return res.status(403).send("selected volume is more than capacity")
  }

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
      dayId: day.id,

      Discount: body.volume.discountPercent != 0 ? {
        create: {
          value: body.volume.discountPercent,
          desc: `برای تعداد ${body.volume.volume}`
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


  const args = {
    'MerchantID': process.env.ZARIN_PAL_MERCHANT_ID!,
    'Amount': order.prePayAmount,
    'Description': '',
    'Email': '',
    'Mobile': '',
    'CallbackURL': (process.env.PAYMENT_CALLBACK_URL_BASE ?? "http://localhost:3000/ticket") +
      `?orderID=${order.id}&amount=${order.prePayAmount}`,
  };

  const resPayment: {
    status: true, url: string, authority: string
  } | {
    status: false, code: string
  } = await new Promise((resolve, _) => {
    createClient(process.env.ZARIN_PAL_SOAP_SERVER!, function (_, client) {
      client.PaymentRequest(args, function (_: any, res: string) {
        const data: {
          Status: string,
          Authority: string
        } = JSON.parse(JSON.stringify(res))

        if (Number(data.Status) === 100) {
          var url = process.env.ZARIN_PAL_PAY_SERVER! + data.Authority;
          resolve({
            authority: data.Authority,
            url: url,
            status: true
          })
        } else {
          resolve({
            status: false,
            code: data.Status,
          })
        }
      })
    })
  })

  if (resPayment.status) {

    await prisma.order.update({
      data: {
        paymentAuthority: resPayment.authority
      },
      where: {
        id: order.id
      }
    })

    return res.status(200).send(resPayment.url)
  } else {
    return res.status(503).send("some problems")
  }
}