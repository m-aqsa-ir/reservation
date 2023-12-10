import { handleWithAuth } from "@/lib/apiHandle"
import { orderStatusEnum, paymentStatusEnum, resSendMessage } from "@/lib/lib"

export type DelResource = {
  type: "transaction"
  id: number
}

export default handleWithAuth(async ({ req, res, prisma }) => {
  const body: DelResource = req.body

  if (body.type == "transaction") {
    const a = await prisma.transaction.findFirst({
      where: { id: body.id },
      include: { Order: true }
    })

    if (!a) {
      return res.status(404).send("not found")
    }

    if (a.payPortal != "cash") {
      return res.status(403).send("not cash payment")
    }

    const { orderId } = a

    const order = await prisma.order.findFirst({
      where: { id: orderId }
    })

    if (!order) return resSendMessage(res, 404, "no order")

    await prisma.transaction.delete({
      where: { id: body.id }
    })

    const sumAgg = await prisma.transaction.aggregate({
      _sum: { valuePaid: true },
      where: { orderId }
    })
    const sum = sumAgg._sum.valuePaid

    const newOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status:
          sum == null || sum == 0
            ? paymentStatusEnum.awaitPayment
            : paymentStatusEnum.prePaid,
        orderStatus:
          order.orderStatus == orderStatusEnum.canceled
            ? order.orderStatus
            : sum == null || sum == 0
            ? orderStatusEnum.notReserved
            : orderStatusEnum.reserved
      }
    })

    return res.status(200).json({
      status: newOrder.status,
      orderStatus: newOrder.orderStatus
    })
  } else {
    return res.status(400).send("no type")
  }
})
