import { verifyTokenMain } from "@/lib/verifyToken"
import { NextApiRequest, NextApiResponse } from "next"

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
