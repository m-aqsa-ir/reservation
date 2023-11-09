import { Day, GroupTypes } from "@/types";
import persianCalendar from "react-date-object/calendars/persian"
import persian_fa_locale from "react-date-object/locales/persian_fa"
import { DateObject } from "react-multi-date-picker";

export function dayCapToStr(day: Day | null) {
  return `${day?.weekName} - ${day?.month}/${day?.day}`
}

export function enDigitToPer(str: string | number) {
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
    .map(char => convertObj[char] == undefined ? char : convertObj[char])
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

export function nowPerDateObject() {
  return new DateObject({ locale: persian_fa_locale, calendar: persianCalendar })
}