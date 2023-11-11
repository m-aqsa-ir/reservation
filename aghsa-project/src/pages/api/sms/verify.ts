import { PrismaClient } from "@prisma/client";
import _ from "lodash";
import { NextApiRequest, NextApiResponse } from "next";
import { sign } from 'jsonwebtoken'

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
    res.status(400).send("there is no code")
    return
  }

  if (a.exp < (Date.now() / 1000)) {
    res.status(401).send("expired")
    return
  }

  await prisma.phoneSentCode.deleteMany({
    where: { phone: { equals: a.phone } }
  })

  const jwtKey = process.env.AUTH_JWT_KEY

  if (!jwtKey) {
    return res.status(500).send("jwt key not found")
  }

  const token = sign({
    phone: a.phone
  }, jwtKey, {
    expiresIn: process.env.AUTH_JWT_EXPIRE_TIME ?? '10m'
  })

  res.status(200).send(token)

}