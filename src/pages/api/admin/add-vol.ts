import { handleWithAuth } from "@/lib/apiHandle";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";


export default handleWithAuth(async ({ req, res, prisma }) => {

  const body: {
    volume: number,
    discount: number
  } = req.body

  try {
    const a = await prisma.volumeList.create({
      data: {
        volume: body.volume,
        discountPercent: body.discount,
      }
    })

    return res.status(200).send(a.id)
  } catch (error) {
    console.log(error)
    if (error instanceof PrismaClientKnownRequestError
      && error.code == 'P2002') {
      return res.status(403).send("another exist")
    } else {
      console.error(error)
    }
  }
})