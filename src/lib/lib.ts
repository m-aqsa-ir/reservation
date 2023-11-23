import type { Order, Transaction } from "@prisma/client";
import { NextApiResponse } from "next";
import { NextResponse } from "next/server";
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

export function perDigit2En(str: string | number) {
  const convertObj: { [key: string]: string } = {
    '۱': "1",
    '۲': "2",
    '۳': "3",
    '۴': "4",
    '۵': "5",
    '۶': "6",
    '۷': "7",
    '۸': "8",
    '۹': "9",
    '۰': "0",
  }

  const strStr = String(str);

  return strStr
    .split('')
    .map(char => convertObj[char] == undefined ? char : convertObj[char]).join('')
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

export function getPerDataObject(a: {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
  millisecond?: number;
  format?: string;
  ignoreList?: string[];
} | {
  date?: Date | number | string | DateObject;
  format?: string;
  ignoreList?: string[];
}) {
  return new DateObject({ locale: persian_fa_locale, calendar: persianCalendar, ...a })
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

export function enPaymentStatus2Per(status: string) {
  return status == 'await-payment' ? 'منتظر پرداخت' :
    status == 'paid' ? 'پرداخت شده' :
      status == 'pre-paid' ? 'پیش پرداخت' :
        status
}

export const paymentStatusEnum = {
  awaitPayment: 'await-payment',
  paid: 'paid',
  prePaid: 'pre-paid'
}

export function enOrderStatus2Per(status: string) {
  return status == 'reserved' ? 'رزرو شده' :
    status == 'not-reserved' ? 'رزرو نشده' :
      status == 'canceled' ? 'کنسل شده' :
        status
}

export const orderStatusEnum = {
  reserved: 'reserved',
  notReserved: 'not-reserved',
  canceled: 'canceled',
}


export function orderPaidSum(order: Order & { Transaction: Transaction[] }) {
  return order.Transaction.reduce((sum, i) => sum + i.valuePaid, 0)
}

export function numberTo3Dig(n: number) {
  return Intl.NumberFormat('per').format(n)
}

export function includesId(list: { id: number }[], id: number) {
  return (list.findIndex(i => i.id == id) != -1)
}

export function includesObj(list: { id: number }[], obj: { id: number }) {
  return (list.findIndex(i => i.id == obj.id) != -1)
}

export function resSendMessage(res: NextApiResponse, status: number, message: string) {
  return res.status(status).send(message)
}