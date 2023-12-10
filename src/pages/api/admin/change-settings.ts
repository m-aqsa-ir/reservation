import { handleWithAuth } from "@/lib/apiHandle"
import { AppConfig } from "@prisma/client"

export default handleWithAuth(async ({ req, res, prisma }) => {
  const body: AppConfig = req.body

  const { id, ...withoutId } = body
  await prisma.appConfig.update({
    data: withoutId,
    where: { id }
  })

  return res.status(200).send("success")
})
