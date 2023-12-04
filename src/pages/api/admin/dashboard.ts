import { handleWithAuth } from "@/lib/apiHandle";
import { nowPersianDateObject, orderStatusEnum, timestampScnds2PerDate } from "@/lib/lib";

export type DashboardApi = {
  week: {
    id: number;
    timestamp: number;
    desc: string;
    isVip: boolean;
    maxVolume: number;

    reserved: number;
    weekName: string;

    Order: {
      id: number;
      volume: number;
      groupType: string;
      groupName: string;
      Customer: {
        id: number;
        name: string;
        phone: string;
        nationalCode: string;
        desc: string | null;
      };
    }[];
  }[];

  page: {
    pageNumber: number;
    hasNextWeek: boolean;
  };
}


export default handleWithAuth(async ({ req, res, prisma }) => {

  //: return it to its place
  const now = nowPersianDateObject().setHour(0).setMinute(0).setMillisecond(0)

  const { page } = req.body


  const nowWeekDayNum = now.weekDay.index
  //:get first day of week
  now.subtract(nowWeekDayNum, 'day')

  //: find start bound
  now.add((page - 1) * 7, 'day')
  const startBound = now.toUnix()
  now.add(7, 'day')
  const endBound = now.toUnix()

  const week = await prisma.day.findMany({
    where: {
      timestamp: { lte: endBound, gte: startBound }
    },

    select: {
      id: true,
      isVip: true,
      timestamp: true,
      desc: true,
      maxVolume: true,

      Order: {
        where: {
          orderStatus: orderStatusEnum.reserved,
        },
        select: {
          groupName: true,
          groupType: true,
          volume: true,
          id: true,

          Customer: true,
        },
      },
    },
    orderBy: {
      timestamp: 'asc'
    }
  })

  //: find has next week
  now.add(7, 'day')
  const nextWeekEndBound = now.toUnix()

  const hasNextWeek = (await prisma.day.count({
    where: {
      timestamp: {
        gte: endBound,
        lte: nextWeekEndBound
      }
    }
  })) != 0

  return res.status(200).json({
    week: week.map(i => {
      const reserved = i.Order.reduce((sum, j) => sum + j.volume, 0)
      const weekName = timestampScnds2PerDate(i.timestamp).weekDay.name

      return { ...i, reserved, weekName }
    }),

    page: {
      pageNumber: page,
      hasNextWeek,
    }
  } satisfies DashboardApi)
})