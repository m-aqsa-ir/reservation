import { AppConfig } from "@prisma/client"

export async function sendSms(
  phoneNum: string,
  data: object,
  patternCode: string
) {
  const body = {
    sending_type: "pattern",
    from_number: process.env.SMS_PANEL_PHONE!,
    code: patternCode,
    recipients: [phoneNum],
    params: data
  }

  try {
    const response = await fetch("https://edge.ippanel.com/v1/api/send", {
      method: "POST",
      headers: {
        "Authorization": process.env.SMS_PANEL_TOKEN!,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    })

    await response.json()
    return { ok: true }
  } catch (error) {
    console.error(error)
    return { ok: false }
  }
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
  return { ok: true }
}