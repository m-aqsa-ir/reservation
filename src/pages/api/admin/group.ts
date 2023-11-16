import { handleWithAuth } from "@/lib/apiHandle";

type GroupApiType = {
  type: 'add',
  name: string,
  iconPath: string
} | {
  type: 'edit',
  id: number,
  name: string,
  iconPath: string
}

export default handleWithAuth(async ({ req, res, prisma }) => {
  const { type, name, iconPath }: GroupApiType = req.body


  switch (type) {
    case 'add':
      const { id } = await prisma.groupType.create({
        data: { name, iconPath }
      })
      return res.status(200).send(id)
    case 'edit':
      await prisma.groupType.update({
        data: { name, iconPath },
        where: { id: req.body.id }
      })
      return res.status(200).send("success")
    default:
      return res.status(404).send("type not found")
  }
})