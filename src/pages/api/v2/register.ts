import { getPrisma4MainApi } from "@/lib/prismaGlobal"
import { NextApiRequest, NextApiResponse } from "next"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { phone } = v

  const newUser = await getPrisma4MainApi().customer.create({
    data: {
      name,
      nationalCode: natCode,
      phone
    }
  })

  const data: TokenPayload = {
    name,
    natCode,
    phone,
    id: newUser.id
  }

  const token = sign(data, authJwtKey, {
    expiresIn: process.env.AUTH_JWT_EXPIRE_TIME ?? "10m"
  })

  res.status(200).json({ token })
}
