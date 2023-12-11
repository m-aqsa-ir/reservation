import { getPrisma4MainApi } from "@/lib/prismaGlobal"
import { sendSms } from "@/lib/sendSms"
import type { Prisma } from "@prisma/client"
import _ from "lodash"
import { NextApiRequest, NextApiResponse } from "next"

const prisma = getPrisma4MainApi()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { phoneNum }: { phoneNum: string } = req.body

  //: generate random number
  const r = _.random(10_000, 99_999)

  //: send code via sms
  const resSend = await sendSms(
    phoneNum,
    { "verification-code": r },
    process.env.SMS_PATTERN_SEND_CODE!
  )

  if (resSend.ok) {
    //: save in db
    const data: Prisma.PhoneSentCodeCreateInput = {
      phone: phoneNum,
      code: String(r),
      exp: Math.floor(new Date().getTime() / 1000 /* to seconds */) + 10 * 60
    }

    await prisma.phoneSentCode.create({ data })

    if (process.env.NODE_ENV == "development") {
      console.log(data)
    }

    res.status(200).send("success")
  } else {
    console.log(resSend.status)
  }
}
