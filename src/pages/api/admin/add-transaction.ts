import { handleWithAuth } from "@/lib/apiHandle"
import { nowPersianDateObject } from "@/lib/lib"

export type AddTransaction = {
  orderId: number,
  maxAmount: number,
  amount: number,
  customerId: number,
}


export default handleWithAuth(async ({ req, res, prisma }) => {
  const { customerId, orderId, amount }: AddTransaction = req.body

  const order = await prisma.order.findFirst({
    where: { id: orderId },
    include: { Transaction: true }
  })

  if (!order) return res.status(404).send("no order")

  const now = nowPersianDateObject()

  const a = await prisma.transaction.create({
    data: {
      customerId,
      payDate: now.format("YYYY/MM/DD - HH:mm"),
      payDateTimestamp: now.toUnix(),
      payId: '---',
      payPortal: 'cash',
      valuePaid: amount,
      orderId
    }
  })

  const previousPaidAmount = order.Transaction.reduce((sum, j) => sum + j.valuePaid, 0)

  const newOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: order.calculatedAmount <= (previousPaidAmount + amount) ? 'paid' : 'pre-paid'
    }
  })


  return res.status(200).send(newOrder.status)
})

