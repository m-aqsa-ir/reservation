import { PrismaClient } from "@prisma/client";
import _ from "lodash";
import { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient()

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { phoneNum }: { phoneNum: string } = req.body

  //: generate random number
  const r = _.random(10_000, 99_999)
  console.log(r)

  //: send code via sms
  // TODO

  //: save in db

  res.status(200).send("success")
}