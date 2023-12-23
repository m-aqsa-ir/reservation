import _ from "lodash"

export function checkNationalCode(nc: string) {
  if (/^[0-9]{10}$/.test(nc)) {
    if (
      nc == "1111111111" ||
      nc == "0000000000" ||
      nc == "2222222222" ||
      nc == "3333333333" ||
      nc == "4444444444" ||
      nc == "5555555555" ||
      nc == "6666666666" ||
      nc == "7777777777" ||
      nc == "8888888888" ||
      nc == "9999999999"
    ) {
      return false
    }

    const tenth = parseInt(nc.charAt(9))

    const digits = nc
      .split("")
      .slice(0, 9)
      .reverse()
      .map((v, i) => Number(v) * (i + 2))

    const digitsSum = digits.reduce((sum, i) => sum + i, 0)

    const reminder11 = digitsSum - Math.floor(digitsSum / 11) * 11

    if (reminder11 < 2) {
      return reminder11 == tenth
    } else {
      return tenth == 11 - reminder11
    }
  } else {
    return true
  }
}
