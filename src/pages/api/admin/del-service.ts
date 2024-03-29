import { handleWithAuth } from "@/lib/apiHandle"

export default handleWithAuth(async ({ req, res, prisma }) => {
  const body: { id: number } = req.body

  const a = await prisma.service.findFirst({
    where: { id: body.id },
    include: {
      OrderService: true,
      day: true
    }
  })

  if (a == null) {
    return res.status(404).send("no such service")
  }

  if (a.OrderService.length != 0) {
    return res.status(403).send("order")
  }

  if (a.day.length != 0) {
    return res.status(403).send("day")
  }

  //: deleting
  await prisma.service.delete({
    where: { id: body.id }
  })

  return res.status(200).send("success")
})
