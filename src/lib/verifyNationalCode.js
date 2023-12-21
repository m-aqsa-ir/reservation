function checkMelliCode(nationalCode) {
  var meli_code
  meli_code = nationalCode.value
  if (meli_code.length == 10) {
    if (
      meli_code == "1111111111" ||
      meli_code == "0000000000" ||
      meli_code == "2222222222" ||
      meli_code == "3333333333" ||
      meli_code == "4444444444" ||
      meli_code == "5555555555" ||
      meli_code == "6666666666" ||
      meli_code == "7777777777" ||
      meli_code == "8888888888" ||
      meli_code == "9999999999"
    ) {
      alert("کد ملی صحیح نمی باشد")
      objcode.focus()
      return false
    }
    let ninthEl = parseInt(meli_code.charAt(9))

    let digitsSum =
      parseInt(meli_code.charAt(0)) * 10 +
      parseInt(meli_code.charAt(1)) * 9 +
      parseInt(meli_code.charAt(2)) * 8 +
      parseInt(meli_code.charAt(3)) * 7 +
      parseInt(meli_code.charAt(4)) * 6 +
      parseInt(meli_code.charAt(5)) * 5 +
      parseInt(meli_code.charAt(6)) * 4 +
      parseInt(meli_code.charAt(7)) * 3 +
      parseInt(meli_code.charAt(8)) * 2

    let r = digitsSum - parseInt(digitsSum / 11) * 11
    
    if ((r == 0 && r == ninthEl) || (r == 1 && ninthEl == 1) || (r > 1 && ninthEl == 11 - r)) {
      return true
    } else {
      alert("کد ملی صحیح نمی باشد")
      objcode.focus()
      return true
    }
  } else {
    return true
  }
}
