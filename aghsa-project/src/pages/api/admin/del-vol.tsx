import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

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