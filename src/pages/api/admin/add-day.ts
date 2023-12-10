import { handleWithAuth } from "@/lib/apiHandle"
import { timestampScnds2PerDate } from "@/lib/lib"

export type AddDayBody = {
  times: number[]
  isVip: boolean
  cap: number
  minVolume: number
  desc: string

  serviceIds: number[]
  groupIds: number[]
}

export type AddRes = {
  timestamp: number
} & ({ id: null; state: "duplicate" } | { id: number; state: "success" })

export default handleWithAuth(async ({ req, res, prisma }) => {
  const {
    times,
    desc,
    cap,
    isVip,
    groupIds,
    serviceIds,
    minVolume
  }: AddDayBody = req.body

  const trimDesc = desc.trim()

  /* try { */

  const ms = times.map<Promise<AddRes>>(async (i) => {
    const {
      day,
      month: { number: month },
      year
    } = timestampScnds2PerDate(i)

    //: check duplicate
    const before = await prisma.day.findFirst({
      where: {
        day,
        month,
        year,
        desc: trimDesc
      }
    })

    if (before != null) {
      return { timestamp: i, id: null, state: "duplicate" }
    }

    const newOne = await prisma.day.create({
      data: {
        day,
        month,
        year,
        desc: trimDesc,
        maxVolume: cap,
        isVip,
        minVolume,
        timestamp: i,
        GroupTypes: { connect: groupIds.map((id) => ({ id })) },
        services: { connect: serviceIds.map((id) => ({ id })) }
      }
    })

    return { timestamp: i, id: newOne.id, state: "success" }
  })

  const newMs = await Promise.all(ms)

  return res.status(200).json(newMs.sort((a, b) => b.timestamp - a.timestamp))
})
