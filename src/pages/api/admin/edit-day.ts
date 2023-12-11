import { handleWithAuth } from "@/lib/apiHandle"
import { orderStatusEnum } from "@/lib/lib"

export type EditDayBody = {
  id: number
  cap: number
  minVolume: number
  isVip: boolean
  desc: string
  serviceIds: number[]
  groupIds: number[]
}

export default handleWithAuth(async ({ req, res, prisma }) => {
  const body: EditDayBody = req.body

  const m = await prisma.day.findFirst({
    where: { id: body.id },
    include: {
      Order: { where: { orderStatus: orderStatusEnum.reserved } },
      services: true,
      GroupTypes: true
    }
  })

  if (!m) {
    return res.status(404).send("no such day")
  }

  //: check if the capacity is lower than sum of paid orders volume
  const sum = m.Order.reduce((sum, i) => sum + i.volume, 0)

  if (body.cap < sum) {
    return res.status(403).send("chosen cap is lower than paid orders")
  }

  const disconnectServices = m.services
    .map((i) => i.id)
    .filter((i) => !body.serviceIds.includes(i))
    .map((id) => ({ id }))

  const disconnectGroups = m.GroupTypes.map((i) => i.id)
    .filter((i) => !body.groupIds.includes(i))
    .map((id) => ({ id }))

  const newM = await prisma.day.update({
    where: {
      id: body.id
    },
    data: {
      maxVolume: body.cap,
      isVip: body.isVip,
      desc: body.desc,
      minVolume: body.minVolume,
      services: {
        disconnect: disconnectServices,
        connect: body.serviceIds.map((id) => ({ id }))
      },
      GroupTypes: {
        disconnect: disconnectGroups,
        connect: body.groupIds.map((id) => ({ id }))
      }
    }
  })

  return res.status(200).send("success")
})
