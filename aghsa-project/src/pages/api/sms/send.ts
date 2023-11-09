import { Prisma, PrismaClient } from "@prisma/client";
import _ from "lodash";
import { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { phoneNum }: { phoneNum: string } = req.body

  //: generate random number
  // TODO choose verify code based on process.env
  const r = _.random(10_000, 99_999)
  console.log(r)

  //: send code via sms TODO

  //: check previous TODO
  /* const a = await prisma.phoneSentCode.findFirst({
    where: {
      phone: { equals: phoneNum }
    },
    orderBy: {
      phone: 'desc'
    }
  })

  if (a != null) {
    if (a.exp < (Date.now() / 1000)) {

    }
  } */

  //: save in db
  const data: Prisma.PhoneSentCodeCreateInput = {
    phone: phoneNum,
    code: String(r),
    exp: Math.floor(new Date().getTime() / 1000 /* to seconds */) + 3 * 60
  }

  await prisma.phoneSentCode.create({ data })

  console.log(data)

  res.status(200).send("success")
}