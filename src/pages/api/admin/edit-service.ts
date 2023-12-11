import { handleWithAuth } from "@/lib/apiHandle"

export type EditService = {
  id: number
  name: string
  desc: string
  priceNormal: number
  priceVip: number
}

export default handleWithAuth(async ({ req, res, prisma }) => {
  const body: EditService = req.body

  const a = await prisma.service.update({
    where: {
      id: body.id
    },
    data: { ...body, id: undefined }
  })

  return res.status(200).send("")
})
