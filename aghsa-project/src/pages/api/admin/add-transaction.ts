import { handle } from "@/lib/apiHandle"
import { nowPersianDateObject } from "@/lib/lib"

export type AddTransaction = {
  orderId: number,
  maxAmount: number,
  amount: number,
  customerId: number
}


export default handle(async ({ req, res, prisma }) => {
  const { customerId, orderId, amount }: AddTransaction = req.body

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

  return res.status(200).send("success")
})

