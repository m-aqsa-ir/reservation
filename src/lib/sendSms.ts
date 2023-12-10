import { AppConfig } from "@prisma/client"
import { fetchPost } from "./lib"

export async function sendSms(
  phoneNum: string,
  data: object,
  patternCode: string
) {
  const body = {
    op: "pattern",
    user: process.env.SMS_PANEL_USERNAME!,
    pass: process.env.SMS_PANEL_PASSWORD!,
    fromNum: process.env.SMS_PANEL_PHONE!,
    toNum: phoneNum,
    patternCode: patternCode,
    inputData: [data]
  }

  return await fetchPost("http://ippanel.com/api/select", body)
}

export async function sendSmsToManager(
  appConfig: AppConfig,
  data: object,
  patternCode: string
) {
  if (appConfig && appConfig.doSendSmsToManager && appConfig.managerPhoneNum) {
    const phoneNumList = appConfig.managerPhoneNum.split(",")
    await Promise.all(
      phoneNumList.map(async (i) => {
        await sendSms(i, data, patternCode)
      })
    )
  }
}
