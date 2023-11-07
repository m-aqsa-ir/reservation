export function dayCapToStr(day: DayCap | null) {
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