export function checkNationalCode(nationalCode: string) {
  if (nationalCode.length == 10) {
    if (
      nationalCode == "1111111111" ||
      nationalCode == "0000000000" ||
      nationalCode == "2222222222" ||
      nationalCode == "3333333333" ||
      nationalCode == "4444444444" ||
      nationalCode == "5555555555" ||
      nationalCode == "6666666666" ||
      nationalCode == "7777777777" ||
      nationalCode == "8888888888" ||
      nationalCode == "9999999999"
    ) {
      return false
    }
    let ninthEl = parseInt(nationalCode.charAt(9))

    let digitsSum =
      parseInt(nationalCode.charAt(0)) * 10 +
      parseInt(nationalCode.charAt(1)) * 9 +
      parseInt(nationalCode.charAt(2)) * 8 +
      parseInt(nationalCode.charAt(3)) * 7 +
      parseInt(nationalCode.charAt(4)) * 6 +
      parseInt(nationalCode.charAt(5)) * 5 +
      parseInt(nationalCode.charAt(6)) * 4 +
      parseInt(nationalCode.charAt(7)) * 3 +
      parseInt(nationalCode.charAt(8)) * 2

    let r = digitsSum - Math.floor(digitsSum / 11) * 11

    if (
      (r == 0 && r == ninthEl) ||
      (r == 1 && ninthEl == 1) ||
      (r > 1 && ninthEl == 11 - r)
    ) {
      return true
    } else {
      return false
    }
  } else {
    return true
  }
}
