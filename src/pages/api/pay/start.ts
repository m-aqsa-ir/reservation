import { verifyTokenMain } from "@/lib/verifyToken";
import { PrismaClient } from "@prisma/client";
import _ from "lodash";
import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "soap";

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  //: check auth
  if (req.cookies['AUTH'] == undefined || req.cookies['AUTH'].trim() == '') {
    return res.status(401).send("")
  }
  const tokenVerify = verifyTokenMain(req.cookies['AUTH'])
  if (tokenVerify == 'expired' || tokenVerify == 'invalid') {
    return res.status(401).send("")
  }

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

  if (!day) return res.status(404).send("no such day in db")

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

  //: check services really exists
  const ss = body.pac == null ? body.services : [body.pac, ...body.services]
  const services = await Promise.all(
    ss.map(({ id }) => prisma.service.findFirst(
      { where: { id } }
    ))
  )

  if (services.some(i => i == null)) {
    return res.status(404).send("some services not exist!")
  }

  //: check one pac selected
  const pacSelected = services.reduce((ps, i) => i?.type == 'package' ? ps + 1 : ps, 0)

  if (pacSelected > 1) {
    return res.status(403).send('package more than one')
  }

  //: calc price
  const isVip = day.isVip
  const priceUnit = services.reduce((sum, i) => isVip ? (sum + (i!.priceVip ?? 0)) : (sum + i!.priceNormal), 0)
  const calculatedPrice = (priceUnit * body.volume.volume) * body.volume.discountPercent / 100

  if (calculatedPrice != body.calculatePrice) {
    return res.status(406).send('price not correct')
  }

  const prePayPercent = (await prisma.appConfig.findFirst())!.prePayDiscount
  const calculatedPrepay = Math.floor(calculatedPrice - (calculatedPrice * prePayPercent / 100))

  if (calculatedPrepay != body.prepayAmount) {
    return res.status(406).send('prepay price not correct')
  }

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
    data: [body.pac, ...body.services].filter(i => i != null).map(i => ({
      price: i!.price,
      isVip: day.isVip,
      orderId: order.id,
      serviceId: i!.id
    }))
  })

  //: connect to payment portal
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