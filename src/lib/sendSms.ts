import { fetchPost } from "./lib"


export async function sendSms(phoneNum: string, data: object, patternCode: string) {
  const body = {
    "op": "pattern",
    "user": process.env.SMS_PANEL_USERNAME!,
    "pass": process.env.SMS_PANEL_PASSWORD!,
    "fromNum": process.env.SMS_PANEL_PHONE!,
    "toNum": phoneNum,
    "patternCode": patternCode,
    "inputData": [
      data
    ]
  }

  return await fetchPost('http://ippanel.com/api/select', body)
}