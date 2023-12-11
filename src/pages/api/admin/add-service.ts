import { handleWithAuth } from "@/lib/apiHandle"
import type { Service } from "@prisma/client"


export default handleWithAuth(async ({ req, res, prisma }) => {
  const body: Service = req.body

  const a = await prisma.service.create({
    data: { ...body }
  })

  res.status(200).send(a.id)
})
