import { fetchPost } from "@/lib/lib";
import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import _ from "lodash";
import { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { phoneNum }: { phoneNum: string } = req.body

  //: generate random number
  const r = _.random(10_000, 99_999)

  //: send code via sms
  const body = {
    "op": "send",
    "uname": process.env.SMS_PANEL_USERNAME!,
    "pass": process.env.SMS_PANEL_PASSWORD!,
    "message": `کد شما برای ورود به سامانه اقصی: ${r}`,
    "from": process.env.SMS_PANEL_PHONE!,
    "to": [phoneNum],
  }

  const resSend = await fetchPost('http://ippanel.com/api/select', body)

  if (resSend.ok) {
    //: save in db
    const data: Prisma.PhoneSentCodeCreateInput = {
      phone: phoneNum,
      code: String(r),
      exp: Math.floor(new Date().getTime() / 1000 /* to seconds */) + 10 * 60
    }

    await prisma.phoneSentCode.create({ data })

    if (process.env.NODE_ENV == 'development') {
      console.log(data)
    }

    res.status(200).send("success")
  } else {
    console.log(resSend.status)
  }


}