import { verifyTokenMain } from "@/lib/verifyToken"
import { PrismaClient } from "@prisma/client"
import { NextApiRequest, NextApiResponse } from "next"

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const body: { token: string } = req.body

  const verified = verifyTokenMain(body.token)

  return res.status(200).json({
    state: verified
  })
}
