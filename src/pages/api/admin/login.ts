import { getPrisma4AdminApi } from "@/lib/prismaGlobal"
import { PrismaClient } from "@prisma/client"
import { createHash } from "crypto"
import { sign } from "jsonwebtoken"
import { NextApiRequest, NextApiResponse } from "next"

const prisma = getPrisma4AdminApi()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const body: {
    username: string
    password: string
  } = req.body

  const passHash = createHash("sha256").update(body.password).digest("base64")

  const user = await prisma.adminUser.findFirst({
    where: {
      username: { equals: body.username },
      password: { equals: passHash }
    }
  })

  if (user != null) {
    const jwtKey = sign(
      {
        username: body.username
      },
      process.env.AUTH_JWT_KEY_ADMIN!,
      {
        expiresIn: process.env.AUTH_JWT_EXPIRE_TIME_ADMIN ?? "20m"
      }
    )

    return res.status(200).send(jwtKey)
  } else {
    return res.status(401).send("not-logged-in")
  }
}
