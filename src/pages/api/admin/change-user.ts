import { handleWithAuth } from "@/lib/apiHandle"
import { createHashSHA256Base64, resSendMessage } from "@/lib/lib"
import { createHash } from "crypto"

export type ChangeUserApiBody =
  | {
      type: "username"
      username: string
    }
  | {
      type: "password"
      previousPassword: string
      newPassword: string
    }

export default handleWithAuth(async ({ req, res, prisma }) => {
  const body: ChangeUserApiBody = req.body

  if (body.type == "username") {
    const { username } = body

    const u = await prisma.adminUser.findFirst()
    if (!u) return resSendMessage(res, 500, "")

    await prisma.adminUser.update({
      where: { id: u.id },
      data: { username }
    })

    return resSendMessage(res, 200, "")
  } else if (body.type == "password") {
    const { newPassword, previousPassword } = body

    const u = await prisma.adminUser.findFirst()
    if (!u) return resSendMessage(res, 500, "")

    const prePassHash = createHashSHA256Base64(previousPassword)

    if (u.password != prePassHash) {
      return resSendMessage(res, 403, "")
    }

    const newPassHash = createHashSHA256Base64(newPassword)

    await prisma.adminUser.update({
      where: { id: u.id },

      data: {
        password: newPassHash
      }
    })

    return resSendMessage(res, 200, "")
  } else {
    resSendMessage(res, 404, "")
  }
})
