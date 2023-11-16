import { handleWithAuth } from "@/lib/apiHandle";

type GroupApiType = {
  type: 'add',
  name: string
} | {
  type: 'edit',
  id: number,
  name: string
}

export default handleWithAuth(async ({ req, res, prisma }) => {
  const body: GroupApiType = req.body

  switch (body.type) {
    case 'add':

      const { id } = await prisma.groupType.create({
        data: { name: body.name, iconPath: '' }
      })

      return res.status(200).send(id)
    case 'edit':

      await prisma.groupType.update({
        data: { name: body.name },
        where: { id: body.id }
      })
      return res.status(200).send("success")
    default:
      return res.status(404).send("type not found")
  }
})