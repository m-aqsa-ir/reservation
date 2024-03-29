import { handleWithAuth } from "@/lib/apiHandle"
import {
  nowPersianDateObject,
  orderStatusEnum,
  paymentStatusEnum,
  resSendMessage
} from "@/lib/lib"

export type AddTransaction = {
  orderId: number
  maxAmount: number
  amount: string
  customerId: number
  desc: string
}

export default handleWithAuth(async ({ req, res, prisma }) => {
  const { customerId, orderId, amount, desc }: AddTransaction = req.body
  const nAmount = Number(amount)

  const order = await prisma.order.findFirst({
    where: { id: orderId },
    include: { Transaction: true }
  })

  if (!order) return res.status(404).send("no order")

  //: check if this amount plus previous transactions is more than order amount
  const sum = order.Transaction.reduce((sum, i) => sum + i.valuePaid, 0)

  if (sum + nAmount > order.calculatedAmount) {
    return resSendMessage(res, 405, "amount is more than needed")
  }

  const now = nowPersianDateObject()

  const a = await prisma.transaction.create({
    data: {
      customerId,
      payDate: now.format("YYYY/MM/DD - HH:mm"),
      payDateTimestamp: now.toUnix(),
      payId: "---",
      payPortal: "cash",
      desc,
      valuePaid: nAmount,
      orderId
    }
  })

  const previousPaidAmount = order.Transaction.reduce(
    (sum, j) => sum + j.valuePaid,
    0
  )

  const newOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status:
        order.calculatedAmount <= previousPaidAmount + nAmount
          ? paymentStatusEnum.paid
          : paymentStatusEnum.prePaid,
      orderStatus:
        order.orderStatus == orderStatusEnum.canceled
          ? order.orderStatus
          : orderStatusEnum.reserved
    }
  })

  return res.status(200).json({
    status: newOrder.status,
    orderStatus: newOrder.orderStatus,
    transaction: a
  })
})
