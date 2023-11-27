import { handleWithAuth } from "@/lib/apiHandle";
import { orderStatusEnum, paymentStatusEnum, resSendMessage } from "@/lib/lib";

export type OrderActionApi = {
  type: 'cancel' | 'restore'
  orderId: number
}

export default handleWithAuth(async ({ req, res, prisma }) => {
  const body: OrderActionApi = req.body

  if (body.type == 'cancel' || body.type == 'restore') {

    const order = await await prisma.order.findFirst({
      where: { id: body.orderId },
      select: {
        id: true, status: true, orderStatus: true, volume: true,
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

    if (body.type == 'cancel') {

      if (order.orderStatus == orderStatusEnum.canceled) {
        return resSendMessage(res, 409, 'canceled before')
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

    } else if (body.type == 'restore') {

      if (order.orderStatus != orderStatusEnum.canceled) {
        return resSendMessage(res, 409, 'not canceled')
      }

      const dayVolumeSum = order.Day.Order.reduce((sum, i) => sum + i.volume, 0)

      if (order.status != paymentStatusEnum.awaitPayment && (dayVolumeSum + order.volume > order.Day.maxVolume)) {
        return resSendMessage(res, 403, "day cap full")
      }

      const b = await prisma.order.update({
        data: {
          orderStatus: order.status == paymentStatusEnum.awaitPayment ?
            orderStatusEnum.notReserved : orderStatusEnum.reserved
        },
        where: {
          id: body.orderId
        }
      })

      return resSendMessage(res, 200, b.orderStatus)
    }
  } else {
    return resSendMessage(res, 404, "type not found")
  }
})