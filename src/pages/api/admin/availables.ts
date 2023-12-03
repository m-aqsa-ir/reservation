import { handleWithAuth } from "@/lib/apiHandle";
import { nowPersianDateObject, orderStatusEnum, resSendMessage } from "@/lib/lib";


export default handleWithAuth(async ({ req, res, prisma }) => {
  const body: {
    currentDayId: number,
  } = req.body

  const orderDay = await prisma.day.findFirst({
    where: { id: body.currentDayId },
    select: {
      Order: { where: { orderStatus: orderStatusEnum.reserved } },
      maxVolume: true
    }
  })

  if (!orderDay) return resSendMessage(res, 404, 'no such current day')

  const currentDayReserved = orderDay.Order.reduce((sum, i) => sum + i.volume, 0)
  const currentDayRemained = orderDay.maxVolume - currentDayReserved

  const now = nowPersianDateObject()

  const availableDays = (await prisma.day.findMany({
    where: {
      timestamp: { gte: now.toUnix() }
    },
    select: {
      id: true,
      timestamp: true,
      maxVolume: true,
      desc: true,
      isVip: true,
      Order: {
        select: { id: true, volume: true },
        where: { orderStatus: orderStatusEnum.reserved }
      }
    },
    orderBy: {
      timestamp: 'asc'
    }
  })).filter(i => i.id != body.currentDayId).map(i => {
    const { Order, ...without } = i

    const reserved = Order.reduce((sum, i) => sum + i.volume, 0)
    const remained = i.maxVolume - reserved

    return {
      ...without,
      reserved, remained
    }
  })

  const availableServices = await prisma.service.findMany()

  return res.status(200).json({
    currentDayReserved,  currentDayRemained,
    availableDays, availableServices
  })
})