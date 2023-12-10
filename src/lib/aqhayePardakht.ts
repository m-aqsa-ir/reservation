import { fetchPost } from "./lib"

export async function apVerify(P: {
  transid: string
  amount: number
  pin: string
}) {
  const res = await fetchPost("https://panel.aqayepardakht.ir/api/v2/verify", P)

  const body: {
    status: "error" | "success"
    code: string
  } = await res.json()

  //: FIXME: check for code=2 > "transaction verified and paid before!"
  if (body.code == "1") {
    return "verified"
  } else {
    console.log(body)
    return body
  }
}
