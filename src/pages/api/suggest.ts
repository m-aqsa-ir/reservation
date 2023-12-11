import { orderStatusEnum, timestampScnds2PerDate } from "@/lib/lib"
import { NextApiRequest, NextApiResponse } from "next"
import { DateObject } from "react-multi-date-picker"
import persianCalendar from "react-date-object/calendars/persian"
import persian_fa_locale from "react-date-object/locales/persian_fa"
import { NewDay } from ".."
import { max, min } from "lodash"
import { getPrisma4MainApi } from "@/lib/prismaGlobal"

type SuggestApiBody = {
  groupId: number
  chosenVolume: number
}

const prisma = getPrisma4MainApi()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const body: SuggestApiBody = req.body

  const appConfig = await prisma.appConfig.findFirst()

  if (appConfig == null) return res.status(500).send("server error")

  const nowCalculated = new DateObject({
    calendar: persianCalendar,
    locale: persian_fa_locale
  })
  //: find the start of now day
  nowCalculated.setHour(0)
  nowCalculated.setMinute(0)
  nowCalculated.setSecond(0)
  nowCalculated.setMillisecond(0)
  //: we can choose a day how many days before it at least
  nowCalculated.add(appConfig.daysBeforeDayToReserve, "day")

  const xs = await prisma.day.findMany({
    where: {
      GroupTypes: {
        some: { id: body.groupId }
      },
      timestamp: { gte: nowCalculated.toUnix() }
    },
    include: {
      services: true,
      Order: {
        where: { orderStatus: orderStatusEnum.reserved }
      }
    },
    orderBy: {
      timestamp: "asc"
    }
  })

  const volList = (await prisma.volumeList.findMany()).map((i) => i.volume)
  const vol = body.chosenVolume

  //: calc if remained volume is more than chosen volume
  const newO = xs.reduce<NewDay[]>((acc, i) => {
    const reservedVol = i.Order.reduce((acc, v) => acc + v.volume, 0)
    const rVol = i.maxVolume - reservedVol

    const minVol = i.minVolume == null ? 0 : i.minVolume

    const dayObj = timestampScnds2PerDate(i.timestamp)

    if (rVol < minVol) {
      return acc
    }

    if (vol >= minVol && vol <= rVol) {
      return [
        ...acc,
        {
          ...i,
          availableWith: null,
          weekName: dayObj.weekDay.name
        }
      ]
    }

    if (vol > rVol) {
      const ks = volList.filter((v) => v <= rVol && v >= minVol)
      if (ks.length != 0) {
        return [
          ...acc,
          {
            ...i,
            availableWith: max(ks)!,
            weekName: dayObj.weekDay.name
          }
        ]
      } else {
        return acc
      }
    }

    if (vol < minVol) {
      const ks = volList.filter((v) => v <= rVol && v >= minVol)
      if (ks.length != 0) {
        return [
          ...acc,
          {
            ...i,
            availableWith: min(ks)!,
            weekName: dayObj.weekDay.name
          }
        ]
      } else {
        return acc
      }
    }

    return acc
  }, [])

  return res.status(200).json(newO)
}
