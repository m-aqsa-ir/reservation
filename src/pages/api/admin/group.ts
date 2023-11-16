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
} | {
  type: 'del',
  id: number
}

export default handleWithAuth(async ({ req, res, prisma }) => {
  const body: GroupApiType = req.body


  switch (body.type) {
    case 'add':
      const r = await prisma.groupType.create({
        data: { name: body.name, iconPath: body.iconPath }
      })
      return res.status(200).send(r.id)
    case 'edit':
      await prisma.groupType.update({
        data: { name: body.name, iconPath: body.iconPath },
        where: { id: req.body.id }
      })
      return res.status(200).send("success")
    case 'del':
      const g = await prisma.groupType.findFirst({
        where: { id: body.id },
        include: { Days: true }
      })

      if (g == null) {
        return res.status(404).send('not such groupType')
      } else if (g.Days.length != 0) {
        return res.status(403).send('days connected')
      } else {
        await prisma.groupType.delete({
          where: { id: body.id }
        })

        return res.status(200).send('success')
      }
    default:
      return res.status(404).send("type not found")
  }
})