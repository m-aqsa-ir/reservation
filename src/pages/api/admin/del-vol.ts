import { handleWithAuth } from "@/lib/apiHandle"

export default handleWithAuth(async ({ req, res, prisma }) => {
  const body: {
    id: number
  } = req.body

  const a = await prisma.volumeList.delete({
    where: {
      id: body.id
    }
  })

  res.status(200).send("success")
})
