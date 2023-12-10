import { handleWithAuth } from "@/lib/apiHandle"
import { orderStatusEnum, paymentStatusEnum, resSendMessage } from "@/lib/lib"
import { Service } from "@prisma/client"

export type OrderActionApi =
  | {
      type: "cancel" | "restore"
      orderId: number
    }
  | ({
      type: "edit"
    } & OrderEditPayload)

export type OrderEditPayload = {
  orderId: number
  groupName: string
  serviceIds: number[]
  dayId: number
  volume: number
  deleteDiscounts: boolean
}

export default handleWithAuth(async ({ req, res, prisma }) => {
  const body: OrderActionApi = req.body

  if (body.type == "cancel" || body.type == "restore" || body.type == "edit") {
    const order = await await prisma.order.findFirst({
      where: { id: body.orderId },
      select: {
        id: true,
        status: true,
        orderStatus: true,
        volume: true,
        Discount: true,
        Day: {
          include: {
            Order: {
              where: {
                orderStatus: orderStatusEnum.reserved
              }
            }
          }
        }
      }
    })

    if (!order) return resSendMessage(res, 404, "no such order")

    if (body.type == "cancel") {
      if (order.orderStatus == orderStatusEnum.canceled) {
        return resSendMessage(res, 409, "canceled before")
      }

      const a = await prisma.order.update({
        data: {
          orderStatus: orderStatusEnum.canceled
        },
        where: {
          id: body.orderId
        }
      })

      return resSendMessage(res, 200, "success")
    } else if (body.type == "restore") {
      if (order.orderStatus != orderStatusEnum.canceled) {
        return resSendMessage(res, 409, "not canceled")
      }

      const dayVolumeSum = order.Day.Order.reduce((sum, i) => sum + i.volume, 0)

      if (
        order.status != paymentStatusEnum.awaitPayment &&
        dayVolumeSum + order.volume > order.Day.maxVolume
      ) {
        return resSendMessage(res, 403, "day cap full")
      }

      const b = await prisma.order.update({
        data: {
          orderStatus:
            order.status == paymentStatusEnum.awaitPayment
              ? orderStatusEnum.notReserved
              : orderStatusEnum.reserved
        },
        where: {
          id: body.orderId
        }
      })

      return resSendMessage(res, 200, b.orderStatus)
    } else if (body.type == "edit") {
      const { dayId, groupName, orderId, serviceIds, volume, deleteDiscounts } =
        body

      const day = await prisma.day.findFirst({
        where: { id: dayId },
        include: {
          Order: {
            where: { orderStatus: orderStatusEnum.reserved },
            select: { volume: true }
          }
        }
      })

      if (!day) return resSendMessage(res, 404, "no such day")

      const reserved = day.Order.reduce((sum, i) => sum + i.volume, 0)
      const remained = day.maxVolume - reserved

      //: check if selected volume is more than day volume
      if (order.Day.id == dayId) {
        //: current day
        if (volume > remained + order.volume) {
          //: new volume is more day cap plus previous volume
          return resSendMessage(res, 403, "low day cap")
        }
      } else {
        if (volume > remained) {
          return resSendMessage(res, 403, "low day cap")
        }
      }

      //: remove all service orders of this order
      await prisma.orderService.deleteMany({
        where: { orderId }
      })

      //: load services with their ids
      const services = (
        await Promise.all(
          serviceIds.map((id) =>
            prisma.service.findFirst({
              where: { id }
            })
          )
        )
      ).filter((i) => i != null) as Service[]

      //: create new service orders
      await prisma.orderService.createMany({
        data: services.map(({ id, priceNormal, priceVip }) => ({
          orderId,
          serviceId: id,
          isVip: day.isVip,
          price: day.isVip ? priceNormal : priceVip ?? 0
        }))
      })

      //: calculate new price
      const price =
        services.reduce(
          (sum, i) => sum + (day.isVip ? i.priceVip ?? 0 : i.priceNormal),
          0
        ) * volume
      const discount = order.Discount.reduce((sum, i) => sum + i.value, 0)
      const calculatedAmount = deleteDiscounts
        ? price
        : price - (price * discount) / 100

      //: update day id, group name, volume of order
      await prisma.order.update({
        where: { id: orderId },
        data: {
          dayId,
          groupName,
          volume,
          calculatedAmount,
          Discount: deleteDiscounts ? { deleteMany: { orderId } } : undefined
        }
      })

      return res.status(200).json({
        calculatedAmount,
        serviceIds: services.map((i) => i.id)
      })
    }
  } else {
    return resSendMessage(res, 404, "type not found")
  }
})
