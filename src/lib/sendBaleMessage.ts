import { AppConfig } from "@prisma/client"
import { enDigit2Per, enNumberTo3DigPer, fetchPost } from "./lib"
import { TicketInfo } from "@/types"

export async function sendBaleMessage(appConfig: AppConfig, text: string) {
  if (appConfig.doSendMessageToManagerInBale && appConfig.mangerBaleId) {
    const baleIDs = appConfig.mangerBaleId.split(",")
    const url = `https://tapi.bale.ai/${process.env.BALE_BOT_TOKEN}/sendMessage`

    await Promise.all(
      baleIDs.map(async (i) => {
        const res = await fetchPost(url, { chat_id: i, text })
      })
    )
  }
}

export const baleCancelRequest = (
  customerName: string,
  phoneNum: string,
  orderID: number,
  reason: string
) => `
کاربر (${customerName}) به شماره (${phoneNum}) برای سفارش به شناسه (${orderID}) درخواست لغو ثبت کرد.
علت درخواست: ${reason}

#درخواست_لغو_سفارش
سامانه اقصی
`

export const baleOrderSuccess = (i: TicketInfo) => `
برای کاربر (${i.groupLeaderName}) به شماره (${i.phoneNum}) سفارش به شناسه (${
  i.id
}) ثبت شد.
نام گروه: ${i.groupName}
نوع گروه: ${i.groupType}
برای تاریخ: ${i.chosenDay}
تعداد نفرات: ${enDigit2Per(i.volume)}
خدمات انتخاب شده: ${i.services.map((j) => j.name).join(", ")}
هزینه پرداخت شده: ${enNumberTo3DigPer(i.prepaidValue)} تومان
هزینه باقی مانده: ${enNumberTo3DigPer(i.remainedValue)} تومان

#ثبت_سفارش
سامانه اقصی
`
