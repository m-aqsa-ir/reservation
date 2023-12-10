import { verifyTokenAdmin } from "@/lib/verifyToken"
import { PrismaClient } from "@prisma/client"
import { NextApiRequest, NextApiResponse } from "next"

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.cookies["AUTH_ADMIN"] == undefined) {
    return res.status(401).send("")
  }
  const tokenVerify = verifyTokenAdmin(req.cookies["AUTH_ADMIN"])
  if (tokenVerify == "expired" || tokenVerify == "invalid") {
    return res.status(401).send("")
  }

  const body: {
    id: number
  } = req.body

  const a = await prisma.volumeList.delete({
    where: {
      id: body.id
    }
  })

  res.status(200).send("success")
}
