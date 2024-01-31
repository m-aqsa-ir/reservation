import { sendSms } from "@/lib/sendSms"
import { createMyHash } from "@/lib/verifyToken"
import { sign } from "jsonwebtoken"
import _ from "lodash"
import { NextApiRequest, NextApiResponse } from "next"

export type SendCodeApi = { phone: string }
export type SendCodePayload = SendCodeApi & {
  rHash: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { phone }: SendCodeApi = req.body

  //: generate random number
  const rand = _.random(10_000, 99_999)

  //: find sms pattern code
  const sendCodePattern = process.env.SMS_PATTERN_SEND_CODE
  if (!sendCodePattern) {
    return res.status(500).send("server err")
  }

  //: send code via sms
  const resSend = await sendSms(phone, { code: rand }, sendCodePattern)

  if (resSend.ok) {
    //: auth jwt key
    const authJwtKey = process.env.AUTH_JWT_KEY
    if (!authJwtKey) {
      return res.status(500).send("server err")
    }

    //: create hash
    const rHash = createMyHash(String(rand), authJwtKey)

    const data = {
      phone,
      rHash
    } satisfies SendCodePayload

    const token = sign(data, authJwtKey, {
      expiresIn: "10m"
    })

    if (process.env.NODE_ENV == "development") {
      console.log({ rand })
    }

    res.status(200).json({ token })
  } else {
    console.log(resSend.status)
    return res.status(500).send("server err")
  }
}
