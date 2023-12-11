import { Order, PrismaClient, Transaction } from "@prisma/client"
import { orderStatusEnum, paymentStatusEnum } from "./lib"

/**
 * This function introduces and enforces how the payment
 * and order state must be.
 */
export async function checkAndModifyOrderState(
  orderId: number,
  prisma: PrismaClient
) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId
    },
    select: {
      id: true,
      status: true,
      orderStatus: true,
      calculatedAmount: true,

      Transaction: {
        select: {
          id: true,
          valuePaid: true
        }
      }
    }
  })

  if (order == null) {
    throw new Error("")
  }

  let orderStatus = order.orderStatus
  let paymentStatus = order.status
  let paid = 0
  let remained = order.calculatedAmount

  //: not paid any money
  if (order.Transaction.length == 0) {
    //: payment state must be: 'await payment'
    if (order.status != paymentStatusEnum.awaitPayment) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: paymentStatusEnum.awaitPayment }
      })

      paymentStatus = paymentStatusEnum.awaitPayment
    }

    //: if not canceled, order state must be 'not reserved'
    if (
      order.orderStatus != orderStatusEnum.canceled &&
      order.orderStatus != orderStatusEnum.notReserved
    ) {
      await prisma.order.update({
        where: { id: order.id },
        data: { orderStatus: orderStatusEnum.notReserved }
      })

      orderStatus = orderStatusEnum.notReserved
    }
  }
  //: paid some money
  else {
    paid = order.Transaction.reduce((sum, i) => sum + i.valuePaid, 0)
    remained = order.calculatedAmount - paid
    //: order state must be reserved, if not canceled
    if (
      order.orderStatus != orderStatusEnum.canceled &&
      order.orderStatus != orderStatusEnum.reserved
    ) {
      await prisma.order.update({
        where: { id: order.id },
        data: { orderStatus: orderStatusEnum.reserved }
      })

      orderStatus = orderStatusEnum.reserved
    }

    //: if all money paid, payment state must be paid
    if (remained == 0 && order.status != paymentStatusEnum.paid) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: paymentStatusEnum.paid }
      })

      paymentStatus = paymentStatusEnum.paid
    }
    //: else, payment state must be PRE paid
    else if (order.status != paymentStatusEnum.prePaid) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: paymentStatusEnum.prePaid }
      })

      paymentStatus = paymentStatusEnum.prePaid
    }
  }

  return { orderStatus, paymentStatus, paid, remained }
}
