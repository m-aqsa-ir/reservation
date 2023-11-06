export function dayCapToStr(day: DayCap | null) {
  return `${day?.month}/${day?.day} - ${day?.weekName}`
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

  const strStr = typeof str == 'number' ? str.toString() : str;

  return strStr
    .split('')
    .map(char => convertObj[char] == undefined ? char : convertObj[char])
}