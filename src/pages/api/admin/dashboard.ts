import { handleWithAuth } from "@/lib/apiHandle";
import { getPerDataObject, nowPersianDateObject } from "@/lib/lib";
import { DateObject } from "react-multi-date-picker";

export default handleWithAuth(async ({ res, req, prisma }) => {
  const data = await prisma.day.findMany({
    select: {
      day: true, month: true, year: true, desc: true,
      _count: {
        select: {
          Order: true
        }
      }
    },
    orderBy: {
      timestamp: 'asc'
    }
  })

  const today = nowPersianDateObject()
  const { year, month: { number: monthNumber }, day } = today

  const ordersForToday = await prisma.day.findMany({
    where: {
      day, month: monthNumber, year
    },
    select: {
      _count: {
        select: {
          Order: true
        }
      }
    }
  })

  const todayStart = getPerDataObject({ day, month: monthNumber, year })
  const startTodayTimestamp = todayStart.toUnix()
  const startTomorrowTimestamp = todayStart.add(1, 'day').toUnix()

  const ordersInToday = await prisma.order.count({
    where: {
      AND: [
        { timeRegistered: { lt: startTomorrowTimestamp } },
        { timeRegistered: { gt: startTodayTimestamp } }
      ]
    }
  })

  return res.status(200).json({
    chart: {
      label: data.map(({ year, month, day, desc }) => `${year}/${month}/${day}${desc == '' ? desc : '-' + desc}`),
      data: data.map(i => Number(i._count.Order))
    },
    ordersForToday: ordersForToday.length == 0 ? 0 : ordersForToday.reduce((sum, i) => sum + i._count.Order, 0), ordersInToday
  })
})