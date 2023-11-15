import { handleWithAuth } from "@/lib/apiHandle";

export type DelResource = {
  type: 'transaction',
  id: number
}

export default handleWithAuth(async ({ req, res, prisma }) => {
  const body: DelResource = req.body

  if (body.type == 'transaction') {
    const a = await prisma.transaction.findFirst({
      where: { id: body.id },
      include: { Order: true }
    })

    if (!a) {
      return res.status(404).send("not found")
    }

    if (a.payPortal != 'cash') {
      return res.status(403).send("not cash payment")
    }

    const { orderId } = a

    await prisma.transaction.delete({
      where: { id: body.id }
    })

    const sumAgg = await prisma.transaction.aggregate({
      _sum: { valuePaid: true },
      where: { orderId }

    })
    const sum = sumAgg._sum.valuePaid

    await prisma.order.update({
      where: { id: orderId },
      data: { status: sum == null || sum == 0 ? 'await-payment' : 'pre-paid' }
    })

    return res.status(200).send("success")
  } else {
    return res.status(400).send("no type")
  }
})