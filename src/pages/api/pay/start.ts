import {
  fetchPost,
  nowPersianDateObject,
  orderStatusEnum,
  resSendMessage
} from "@/lib/lib"
import { getPrisma4MainApi } from "@/lib/prismaGlobal"
import { verifyTokenMain } from "@/lib/verifyToken"
import { PayBundle } from "@/types"
import _ from "lodash"
import { NextApiRequest, NextApiResponse } from "next"

const prisma = getPrisma4MainApi()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  //: check auth
  if (req.cookies["AUTH"] == undefined || req.cookies["AUTH"].trim() == "") {
    return res.status(401).send("")
  }
  const tokenVerify = verifyTokenMain(req.cookies["AUTH"])
  if (tokenVerify == "expired" || tokenVerify == "invalid") {
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
        where: { orderStatus: orderStatusEnum.reserved }
      }
    }
  })

  if (!day) return res.status(404).send("no such day in db")

  //: check the appConfig.daysBeforeDayToReserve
  const appConfig = await prisma.appConfig.findFirst()
  if (appConfig == null) return res.status(500).send("app conf")

  const now = nowPersianDateObject()
  now.setHour(0).setMinute(0).setSecond(0).setMillisecond(0)
  now.add(appConfig.daysBeforeDayToReserve, "day")

  if (day.timestamp < now.toUnix())
    return res
      .status(403)
      .send(
        `شما باید از ${appConfig.daysBeforeDayToReserve} روز قبل سفارش را ثبت نماید!`
      )

  //: check volume more than day remained vol or min vol
  const previousReservedOrders = day.Order.reduce((sum, i) => sum + i.volume, 0)

  const remainedVol = day.maxVolume - previousReservedOrders

  if (body.volume.volume > remainedVol) {
    return res.status(403).send("ظرفیت انتخاب شده از ظرفیت روز بیشتر است.")
  }

  if (body.volume.volume < (day.minVolume ?? 0)) {
    return res.status(403).send("ظرفیت انتخابی از حداقل ظرفیت کمتر است!")
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
  const ss =
    body.package == null ? body.services : [body.package, ...body.services]
  const services = await Promise.all(
    ss.map(({ id }) => prisma.service.findFirst({ where: { id } }))
  )

  if (services.some((i) => i == null)) {
    return res.status(404).send("some services not exist!")
  }

  //: check one pac selected
  const pacSelected = services.reduce(
    (ps, i) => (i?.type == "package" ? ps + 1 : ps),
    0
  )

  if (pacSelected > 1) {
    return res.status(403).send("package more than one")
  }

  //: calc price
  const isVip = day.isVip
  const priceUnit = services.reduce(
    (sum, i) => (isVip ? sum + (i!.priceVip ?? 0) : sum + i!.priceNormal),
    0
  )
  const wholePrice = priceUnit * body.volume.volume
  const calculatedPrice =
    wholePrice - (wholePrice * body.volume.discountPercent) / 100

  if (calculatedPrice != body.calculatePrice) {
    return res.status(406).send("price not correct")
  }

  const prePayPercent = (await prisma.appConfig.findFirst())!.prePayDiscount
  const calculatedPrepay = Math.floor((calculatedPrice * prePayPercent) / 100)

  if (calculatedPrepay != body.prepayAmount) {
    return res.status(406).send("prepay price not correct")
  }

  //: create orders
  const order = await prisma.order.create({
    data: {
      volume: body.volume.volume,
      groupName: body.groupName,
      groupType: body.groupType,
      timeRegistered: body.reserveTimeTimestamp,
      status: "await-payment",

      prePayAmount: body.prepayAmount,
      calculatedAmount: body.calculatePrice,

      customerId: customer.id,
      dayId: day.id,

      orderTestMode: appConfig.appTestMode,

      Discount:
        body.volume.discountPercent != 0
          ? {
              create: {
                value: body.volume.discountPercent,
                desc: `برای تعداد ${body.volume.volume}`
              }
            }
          : undefined
    }
  })

  //: attach services
  await prisma.orderService.createMany({
    data: [body.package, ...body.services]
      .filter((i) => i != null)
      .map((i) => ({
        price: day.isVip ? i!.priceVip ?? 0 : i!.priceNormal,
        isVip: day.isVip,
        orderId: order.id,
        serviceId: i!.id
      }))
  })

  // /* ZARIN PAL CODES */ //
  // if (!appConfig.paymentPortalMerchantId) return resSendMessage(res, 500, "")
  //: connect to payment portal
  // const args = {
  //   'MerchantID': appConfig.paymentPortalMerchantId,
  //   'Amount': order.prePayAmount,
  //   'Description': '',
  //   'Email': '',
  //   'Mobile': '',
  //   'CallbackURL': (process.env.PAYMENT_CALLBACK_URL_BASE ?? "http://localhost:3000/ticket") +
  //     `?orderID=${order.id}&amount=${order.prePayAmount}`,
  // };

  // const resPayment: {
  //   status: true, url: string, authority: string
  // } | {
  //   status: false, code: string
  // } = await new Promise((resolve, _) => {
  //   createClient(process.env.ZARIN_PAL_SOAP_SERVER!, function (_, client) {
  //     client.PaymentRequest(args, function (_: any, res: string) {
  //       const data: {
  //         Status: string,
  //         Authority: string
  //       } = JSON.parse(JSON.stringify(res))

  //       if (Number(data.Status) === 100) {
  //         var url = process.env.ZARIN_PAL_PAY_SERVER! + data.Authority;
  //         resolve({
  //           authority: data.Authority,
  //           url: url,
  //           status: true
  //         })
  //       } else {
  //         resolve({
  //           status: false,
  //           code: data.Status,
  //         })
  //       }
  //     })
  //   })
  // })

  // if (resPayment.status) {

  //   await prisma.order.update({
  //     data: {
  //       paymentAuthority: resPayment.authority
  //     },
  //     where: {
  //       id: order.id
  //     }
  //   })

  //   return res.status(200).send(resPayment.url)
  // } else {
  //   return res.status(503).send("some problems")
  // }

  if (!appConfig.paymentPortalMerchantId && !appConfig.appTestMode) {
    return resSendMessage(res, 500, "not merchant id in app not test mode")
  }

  const reqBody = {
    pin: appConfig.appTestMode ? "sandbox" : appConfig.paymentPortalMerchantId,
    amount: order.prePayAmount,
    callback: process.env.WEBSITE_URL! + "/api/pay/ap-callback",
    invoice_id: order.id
  }

  const resPayment = await fetchPost(
    "https://panel.aqayepardakht.ir/api/v2/create",
    reqBody
  )

  if (resPayment.ok) {
    const body: {
      status: string
      transid: string
    } = await resPayment.json()

    await prisma.order.update({
      data: { paymentAuthority: body.transid },
      where: { id: order.id }
    })

    const url = `https://panel.aqayepardakht.ir/startpay/${
      appConfig.appTestMode ? "sandbox/" : ""
    }${body.transid}`

    return res.status(200).send(url)
  } else if (resPayment.status == 422) {
    const body: {
      status: string
      code: string
    } = await resPayment.json()

    console.error(
      `[/api/pay/start] status: ${body.status} - code: ${body.code}`
    )
    return res.status(500).send("pay portal error")
  }
}
