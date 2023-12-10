import { handleWithAuth } from "@/lib/apiHandle"
import { resSendMessage } from "@/lib/lib"

export type CustomerApi = {
  reqType: "edit"
  body: { id: number; name: string; nationalCode: string }
}

export default handleWithAuth(async ({ req, res, prisma }) => {
  const { reqType, body: reqBody }: CustomerApi = req.body

  if (reqType == "edit") {
    const { id, name, nationalCode } = reqBody
    if (!(id && name && nationalCode)) {
      return resSendMessage(res, 400, "")
    }

    //: check duplicate national code
    const n = await prisma.customer.findFirst({
      where: { nationalCode }
    })

    if (n) {
      return resSendMessage(res, 409, "another with this national code")
    }

    const newC = await prisma.customer.update({
      data: {
        name,
        nationalCode
      },
      where: {
        id
      }
    })

    return resSendMessage(res, 200, "")
  } else {
    return resSendMessage(res, 404, "no method")
  }
})
