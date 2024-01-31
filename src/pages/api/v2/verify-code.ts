import { getPrisma4AdminApi } from "@/lib/prismaGlobal"
import { createMyHash, verifyToken } from "@/lib/verifyToken"
import { NextApiRequest, NextApiResponse } from "next"
import { SendCodePayload } from "./send-code"

export type VerifyTokenApi = { rand: string; token: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const body: VerifyTokenApi = req.body

  //: jwt key
  const authJwtKey = process.env.AUTH_JWT_KEY
  if (!authJwtKey) {
    return res.status(500).send("server err")
  }

  //: verify token
  const v = verifyToken<SendCodePayload>(body.token, authJwtKey)

  if (v == "expired" || v == "invalid") {
    return res.status(403).send("no auth")
  }

  const rHash = createMyHash(body.rand, authJwtKey)
  //: verify rand
  if (rHash != v.rHash) {
    return res.status(400).send("wrong code")
  }

  const { phone } = v

  const customer = await getPrisma4AdminApi().customer.findFirst({
    where: {
      phone
    },
    select: {
      name: true,
      nationalCode: true
    }
  })

  if (customer == null)
    return res.status(200).json({ name: "", nationalCode: "" })

  const { name, nationalCode } = customer

  return res.status(200).json({ name, nationalCode })
}
