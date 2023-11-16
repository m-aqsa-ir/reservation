import type { Order, Transaction } from "@prisma/client";
import persianCalendar from "react-date-object/calendars/persian"
import persian_fa_locale from "react-date-object/locales/persian_fa"
import { DateObject } from "react-multi-date-picker";

export function day2Str(day: Day | null) {
  return `${day?.weekName} - ${day?.month}/${day?.day}`
}

export function enDigit2Per(str: string | number) {
  const convertObj: { [key: string]: string } = {
    "1": '۱',
    "2": '۲',
    "3": '۳',
    "4": '۴',
    "5": '۵',
    "6": '۶',
    "7": '۷',
    "8": '۸',
    "9": '۹',
    "0": '۰',
  }

  const strStr = String(str);

  return strStr
    .split('')
    .map(char => convertObj[char] == undefined ? char : convertObj[char]).join('')
}

export function groupPer(str: GroupTypes) {
  return str == 'family' ? 'خانوادگی' : str == 'men-group' ? 'گروهی آقایان' : 'گروهی خانم ها';
}

export const fetchPost = async (url: string, body: object) => {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  })
}

export function nowPersianDateObject() {
  return new DateObject({ locale: persian_fa_locale, calendar: persianCalendar })
}

export function timestampScnds2PerDate(timestampInSeconds: number) {
  const d = new DateObject({
    date: timestampInSeconds * 1000, //: to milliseconds
    calendar: persianCalendar,
    locale: persian_fa_locale
  })
  return d
}

export function backHome() {
  return {
    redirect: { destination: '/' },
    props: {}
  }
}

export function enOrderStatus2Per(status: string) {
  return status == 'await-payment' ?
    'منتظر پرداخت' :
    status == 'paid' ?
      'پرداخت شده' :
      status == 'pre-paid' ?
        'پیش پرداخت' : status
}

export function enGroupType2Per(groupType: string) {
  return groupType == 'family' ?
    'خانواده' : groupType == 'men-group' ?
      'گروه آقایان' : 'گروه بانوان'
}

export function orderPaidSum(order: Order & { Transaction: Transaction[] }) {
  return order.Transaction.reduce((sum, i) => sum + i.valuePaid, 0)
}

export function numberTo3Dig(n: number) {
  return Intl.NumberFormat('per').format(n)
}