import { Prisma, PrismaClient } from "@prisma/client";
import _ from "lodash";
import { NextApiRequest, NextApiResponse } from "next";
import { parse } from 'cookie'
import { verifyToken } from "@/lib/verifyToken";

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { phoneNum }: { phoneNum: string } = req.body

  //: generate random number
  // TODO choose verify code based on process.env
  const r = _.random(10_000, 99_999)

  //: send code via sms TODO
  console.log(r)

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