import { Noto_Naskh_Arabic } from "next/font/google";
import Image from "next/image";
import { use, useRef, useState } from "react";
import { Button, Container, Form, Modal } from "react-bootstrap";
import VerificationInput from "react-verification-input";

const notoNaskhArabicFont = Noto_Naskh_Arabic({ subsets: ['latin', 'arabic'] })

function timeFormat(milliseconds: number) {
  const seconds = milliseconds / 1000

  const minute = Math.floor(seconds / 60)
  const second = seconds % 60

  return `${minute}:${second}`
}

const CODE_EXPIRE_TIME = 1 * 1000 /* second */ * 60 * 2

const handleSendCode = () => {
  // TODO
}

const handleVerifyCode = () => {
  // TODO
}

export default function PhoneRegister() {
  const [phoneNum, setPhoneNum] = useState('')
  const [phoneNumValid, setPhoneNumValid] = useState(true)
  const [clickSubmitOneTime, setClickSubmit] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [codeMode, setCodeMode] = useState(false)
  const [remainedTime, setRemainedTime] = useState(0)
  const [inputCode, setInputCode] = useState('')
  const [sendCodeAgain, setSendCodeAgain] = useState(false)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  function checkPhoneNumValid(clickSubmitOneTime: boolean, phoneNum: string) {
    if (!clickSubmitOneTime) {
      return true
    }
    return phoneNum != '' && phoneNum != null && /^09\d{9}$/.test(phoneNum)
  }

  function createInterval() {
    setRemainedTime(CODE_EXPIRE_TIME)
    const interval = setInterval(() => {
      setRemainedTime(rt => {
        const newVal = rt - 1000
        if (newVal == 0) {
          clearInterval(interval)
          setSendCodeAgain(true)
        }
        return newVal
      })
    }, 1000)

    intervalRef.current = interval
  }

  return (<Container className="mt-3 py-5 border rounded-3 d-flex flex-column align-items-center bg-white">
    <Image
      src="/images/verify-code.png"
      height={400}
      width={400}
      alt="verify code"
    />
    <Form.Group className="mt-3">
      {!codeMode && <Form.Label className="w-100 text-center fs-3">
        لطفا شماره خود را وارد نمایید.
      </Form.Label>}
      <Form.Control
        size="lg"
        className="text-center"
        type="number"
        value={phoneNum}
        disabled={codeMode}
        onChange={e => {
          setPhoneNum(e.target.value)
          setPhoneNumValid(
            checkPhoneNumValid(clickSubmitOneTime, e.target.value)
          )
        }}
        placeholder="09XXXXXXXXX"
        pattern=""
        required
      />
    </Form.Group>
    <p className={`text-danger ${phoneNumValid ? 'invisible' : 'visible'}`}>شماره صحیح نیست.</p>
    {!codeMode && <Button
      variant="primary"
      onClick={() => {
        setClickSubmit(true)
        const valid = checkPhoneNumValid(true, phoneNum)
        setPhoneNumValid(valid)
        if (valid) {
          setShowModal(true)
        }
      }}
    >ارسال کد</Button>}

    {codeMode && <>
      <Form.Group className="mt-3">
        <Form.Label className="w-100 text-center fs-3">
          لطفا کد تایید را وارد نمایید.
        </Form.Label>
        <VerificationInput
          length={4}
          validChars="0-9"
          value={inputCode}
          onChange={e => setInputCode(e)}
          classNames={{
            container: 'ltr rounded',
            character: 'rounded pt-1'
          }} />
      </Form.Group>

      <p className="mt-2">زمان باقی مانده: {timeFormat(remainedTime)}</p>

      {sendCodeAgain
        ? <Button
          variant="warning"
          onClick={e => {
            setSendCodeAgain(false)
            handleSendCode()
            createInterval()
          }}>ارسال دوباره کد</Button>
        : <Button
          variant="primary">
          تایید کد
        </Button>
      }



      <Button variant="link" onClick={() => {
        setCodeMode(false)
        clearInterval(intervalRef.current!)
        setInputCode('')
      }}>اصلاح شماره</Button>

    </>}


    <Modal show={showModal} onHide={() => setShowModal(false)} className={notoNaskhArabicFont.className}>
      <Modal.Body>
        آیا این شماره درست است: {phoneNum}؟
      </Modal.Body>
      <Modal.Footer>
        <Button variant="warning" onClick={() => setShowModal(false)}>
          خیر
        </Button>
        <Button variant="success" onClick={() => {
          setShowModal(false)
          handleSendCode()
          setCodeMode(true)

          createInterval()
        }}>
          بله - ارسال کد
        </Button>
      </Modal.Footer>
    </Modal>

  </Container>)
}