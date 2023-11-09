import { PrismaClient } from "@prisma/client";
import _ from "lodash";
import { NextApiRequest, NextApiResponse } from "next";
import { sign, verify } from 'jsonwebtoken'

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { code }: { code: string } = req.body

  //: check valid
  //: find code in db
  const a = await prisma.phoneSentCode.findFirst({
    where: {
      code: { equals: code }
    }
  })

  if (a == null) {
    res.status(401).send("there is no code")
    return
  }

  if (a.exp < (Date.now() / 1000)) {
    res.status(401).send("expired")
    return
  }

  const token = sign({
    phone: a.phone
  }, process.env.AUTH_JWT_KEY! /* TODO 500 error if undefined */, {
    expiresIn: '2m'
  })

  res.status(200).send(token)

}