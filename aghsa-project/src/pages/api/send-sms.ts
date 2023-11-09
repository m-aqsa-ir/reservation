import { NextApiRequest, NextApiResponse } from "next";


export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const body: { phoneNum: string } = req.body

  res.status(200).send("success")
}